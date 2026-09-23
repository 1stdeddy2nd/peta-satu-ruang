# MC-061 — Async, retryable pipeline for on-demand dataset imports

- **Status:** DONE
- **Board:** sprint-03
- **Type:** feature
- **Milestone:** MVP v1

## Why
Raised directly: right now, getting a new dataset into MapCanva (a new
Sentinel-2 year, a newer Google/Microsoft building release, a different
country) means someone running a script by hand from a terminal. The ask is
to make that a click: trigger an import from the UI, have it run in the
background on the server, retry on failure until it actually finishes, and
tell the user when it's done — without that work depending on a laptop
staying open.

**This is an admin tool, not a user feature.** Importing datasets is an
operational/data-management task, not something the general MapCanva user
ever sees or triggers — gated on `Role.admin` (the same role the schema
already carries and MC-029 already assumes means something), with its own
dashboard-style UI to trigger imports and see every job's status, not a
button buried in the Analysis panel a regular user could stumble into.

## Argued down from the literal ask: no Temporal
Temporal Workflow was suggested by name. Pushing back on that specifically:
Temporal is a full distributed-workflow platform — its own server cluster,
or a paid Temporal Cloud subscription. That's real infrastructure and
recurring cost for what today is a handful of long-running batch imports,
not a multi-step business process needing sagas, compensation, or
cross-service coordination. It's the wrong tool size for the actual job.

**What "always retry until done" actually needs**: a status, a retry count,
and a next-attempt time — three columns. Postgres, which this app already
runs, holds that fine. A small worker process polls for due jobs, runs them,
and updates status. No new infrastructure, no new vendor, no recurring cost.
Revisit Temporal specifically if this ever needs to coordinate many
different *services*, not just retry a batch script — it doesn't yet.

## Design
- **`ImportJob` table** (Postgres): `id`, `type` (e.g.
  `"admin-boundaries"`, `"building-footprints"`), `params` (JSON — country,
  year, whatever the job type needs), `status`
  (`pending`/`running`/`done`/`failed`), `attempts`, `lastError`,
  `createdAt`, `updatedAt`. A queue, not a workflow engine.
- **A worker process** (`scripts/worker.mjs` or similar): polls for
  `pending` jobs (or `failed` ones due for retry, exponential backoff),
  marks one `running`, executes the corresponding import script's logic
  in-process (refactor the existing import scripts into callable functions
  the worker imports, rather than only being invokable as CLI scripts),
  marks `done` or `failed` (+ increments `attempts`, records `lastError`).
- **Runs in Docker**, addressing the actual concern raised — a background
  job shouldn't die because a laptop's terminal closed. Add a `worker`
  service to `docker-compose.yml` alongside the existing `db` service, so
  `docker compose up -d` keeps it running independent of any local shell.
- **Notification**: polling, not a message queue. The UI polls
  `GET /api/import-jobs/:id` (or the list) every few seconds while a job is
  active and shows a toast/badge on completion. No Redis, no pub/sub —
  Postgres row state is enough at this volume (a handful of jobs, not
  thousands per second).
- **First real job types**: re-running the *already-proven* import scripts
  as async jobs — Microsoft building footprints and HDX admin boundaries,
  parameterized by country/level. This is the safe, understood case to
  prove the pipeline shape before adding new, unproven data sources to it.
- **An admin dashboard**, not just an API: a page listing every `ImportJob`
  (type, params, status, attempts, timestamps) with a way to trigger a new
  one and watch it progress — this is the "manage the pipeline" surface,
  separate from anything a regular user interacts with.

## Storage: archive the raw download instead of deleting it
The current scripts delete the downloaded zip/extracted file once the
import finishes (`MC-051` reclaimed ~25GB this way). Revised: **archive it
to MinIO instead**, as a backup/re-import source that doesn't depend on the
upstream URL still working or the file still being at the same address
months later. This does reopen a service MC-015 explicitly deferred
("Files: MinIO on Railway for uploaded originals — deferred") — worth being
honest that it's a real reintroduction, not a non-decision. It's a
narrower, safer case than MC-015's original one, though: this is an
admin-only, self-hosted, open-source object store (a `docker-compose`
service exactly like `db` and the new `worker`, no vendor, no cost)
archiving a handful of large source files the pipeline itself produced —
not a general upload store for every user's data. Add a `minio` service to
`docker-compose.yml`; the worker uploads the raw file there right after a
successful import, before deleting its local temp copy.

## Explicitly not solved by this ticket yet: Google Open Buildings as a job
The product owner specifically wants Google's 2023 (and future 2025/2026)
polygon releases pullable the same way. Checked before committing to it as a
launch job type: **there is no ready-made shortcut the way HDX gave us for
admin boundaries.** HDX's Google-Open-Buildings organization curates
per-country packages for many countries, but **not Indonesia** (checked
directly — `buildings-google-idn` does not exist there). The real source is
Google's own S2-cell-tiled Cloud Storage bucket, documented via a Colab
notebook, not a plain per-country file — exact bucket paths and how many S2
cells cover Indonesia (and their total size) were not confirmed by direct
request in this pass. **Needs its own short research spike** before it's
added as a job type; the pipeline itself should be built generic enough
that adding it later is "write one more job handler," not a redesign.

## Non-goals
- Not building a general-purpose workflow engine — job types are specific,
  known functions, not arbitrary user-defined pipelines.
- Not adding a message broker (Redis/RabbitMQ/SQS) — Postgres + polling is
  enough at this scale; revisit only if job volume or fan-out actually
  demands it.
- Not dockerizing the main Next.js dev server — scoped to the background
  worker specifically, which is the part that actually needs to survive
  independent of a local terminal.

## Acceptance criteria
- [x] An admin (only) can trigger a re-import (e.g. "refresh Jakarta's
      building footprints") from a dedicated dashboard and see it complete
      without touching a terminal — a non-admin session cannot reach it.
- [x] The dashboard lists every job's status, not just the one just
      triggered — a real "manage the pipeline" view.
- [x] Killing the worker mid-job and restarting it resumes/retries rather
      than losing the job silently.
- [x] The worker runs as its own `docker-compose` service, verified to keep
      running after the local dev server and shell are both closed.
- [x] A failed job retries automatically (backoff, capped attempts) rather
      than requiring a person to notice and re-trigger it by hand.
- [x] A successful import's raw downloaded file ends up in MinIO, not
      deleted — verified by actually finding it there, not just that the
      upload call didn't error.

## Built
Matches the design above, with one addition found while checking the acceptance
criteria rather than assumed up front:

- `ImportJob` model + migration (`status`/`attempts`/`lastError`/
  `nextAttemptAt`/`archiveKey`), `@@index([status, nextAttemptAt])` for the
  worker's claim query.
- `scripts/pipeline/worker.ts` — polls every 5s, claims one due job at a time via
  `SELECT ... FOR UPDATE SKIP LOCKED` (safe even if a second instance is ever
  run), exponential backoff (1/2/4/8min, capped at 5 attempts).
- **Orphan reclaim, added after finding the gap by testing the "kill and
  restart" criterion directly**: a job stuck in `running` when the worker
  process dies would never be picked up again — the claim query only looks at
  `pending`/`failed` rows. Fixed with a one-time `UPDATE "ImportJob" SET
  status = 'pending' WHERE status = 'running'` on worker startup (valid under
  the single-worker assumption this ticket scopes to). Verified by hand:
  inserted a `running` row, restarted the worker container, confirmed the log
  line and that the job was reprocessed.
- Shared job-runner logic (`scripts/pipeline/job-runners.ts`) reuses the same
  import functions the manual CLI scripts call — one implementation, not a
  duplicate async path. A "refresh" deletes existing rows for that
  source/level only after a successful download+extract, then re-imports —
  clean replace, not duplicate-colliding on deterministic ids.
- Download progress (`scripts/lib/download.ts`) reports
  `{ bytesDownloaded, totalBytes, percent }` at most once a second, logged by
  the worker — added because there was previously no way to tell "still
  downloading" from "stuck," and the ~450MB HDX file's download time varies a
  lot with network conditions (60s to 7min, both observed while testing).
- `minio` + `worker` services in `docker-compose.yml`; worker archives the raw
  zip after a successful import (`archiveKey` stored on the job), verified via
  `mc ls` inside the MinIO container.
- `/admin/import-jobs` — `notFound()` for non-admin sessions (not a redirect,
  so the route's existence isn't revealed), polls the job list every 3s, form
  to queue `building-footprints` (country) or `admin-boundaries`.
- All scripts written as `.ts` (converted from an earlier `.mjs` pass per
  request), run via `tsx`, typechecked by the normal `tsc --noEmit`.
- `scripts/` split by responsibility rather than one flat `lib/` bucket:
  `cli/` (thin entrypoints), `pipeline/` (worker + job-runners — the queue
  itself), `sources/` (per-dataset import logic), `lib/` (generic low-level
  I/O: download, MinIO, pg-copy, mercator projection) — each reusable
  independent of the async pipeline, so it stays clear which files a new
  data source (Google Open Buildings, eventually) would actually touch.
- **Dashboard progress, added after the product owner asked for something
  closer to GitHub Actions/Dagster instead of a bare status word.** The
  `onProgress` payload used to only reach `docker logs`; `ImportJob` gained a
  `progress Json?` column the worker writes to on every callback, and the
  dashboard renders it as a per-job step list (Download → per-stage or
  per-level steps → Archive) with a live percentage bar during download and
  a spinner on whichever step is current — the same shape as a CI run's job
  view, not just "running"/"done" text.
- **Explicitly did not add a websocket for this.** Raised directly, argued
  down: this is a single-admin tool with at most one job running at a time:
  the existing 3s poll against an indexed `ImportJob` query is already ~15ms
  and costs nothing at this scale. A websocket would need either a custom
  Node server (Next.js route handlers don't hold long-lived connections) or
  a separate pub/sub service — real infrastructure for an improvement no one
  would notice, and the same "no message broker" call this ticket already
  made for the original done/failed notification.
- **Archive keys are now content-hashed, not timestamped, after the product
  owner spotted the bucket filling with near-identical files.** Testing
  produced nine ~435MB copies of the same unchanged HDX file, each under its
  own timestamp key with no metadata explaining what it was —
  `archiveFile()` now hashes the local file (sha256, first 12 hex chars in
  the key) and skips the upload entirely if that key already exists, so a
  retry or a re-triggered refresh against unchanged upstream data doesn't
  re-upload it. Real S3 object metadata (`job-type`, `source-url`,
  `archived-at`, `sha256`) is attached so a listing in MinIO's own console
  explains itself without cross-referencing the `ImportJob` table. Verified
  by queueing the same admin-boundaries job twice: both runs produced the
  identical object key and the bucket stayed at one object, confirming the
  second run actually skipped the re-upload rather than coincidentally
  matching a name.

Verified manually end to end for both job types (admin-boundaries: 89,537
boundaries imported and archived, matching HDX's own stated total; a
deliberately-invalid `building-footprints` job to exercise the retry path:
failed, `attempts` incremented, `lastError` recorded, `nextAttemptAt` set per
the backoff formula) and via `e2e/MC-061-async-import-pipeline.spec.ts`, plus
`make check`. The spec only asserts the job reaches `running` — waiting on
full completion in an automated test would make the test as unreliable as the
download's own network variance; full completion was checked by hand instead.

One unrelated thing found while re-verifying `MC-059` alongside this: the
suite isn't built to run as one back-to-back batch (see the new "E2E tests"
entry in `03-gotchas.md`) — not a regression from this ticket, just something
that surfaced while checking for one.

## Bug found and fixed during verification: "clear before refresh" wasn't scoped per country
`runBuildingFootprintsJob`'s stale-row delete used `WHERE source =
'ms-building-footprints'` — one constant shared by every country the job
type supports. Queueing a one-off Philippines job to check the new
download-progress UI reached that delete and wiped all 63.9M real Indonesia
rows before its own import could finish (interrupted by an unrelated worker
restart), leaving `BuildingFootprint` empty. This is what actually broke
`MC-059`'s spec afterward, not the `Feature_layerId_fkey` fix below.

Fixed by scoping both the delete and the row id prefix per country
(`ms-building-footprints:indonesia`, `:philippines`, etc.) so refreshing one
country's data can never delete another's, and two countries' imports can't
collide on id either. Recorded in `03-gotchas.md`. Indonesia's real data is
being re-imported through the fixed pipeline as the verification itself
(a multi-hour job, per MC-051) rather than restored some other way, so this
also re-proves the pipeline at full scale, not just against test fixtures.

## Also fixed during verification: a `Feature_layerId_fkey` race unrelated to this ticket
Surfaced in the server log while re-running `MC-059`: `createLayerWithFeatures`
created the `Layer` row then inserted its `Feature` rows one at a time,
unwrapped — if the layer was deleted by anything else while that loop was
still running (a fast double-fire from the client, a user removing it mid-
upload), the next feature insert failed on the foreign key. Fixed by wrapping
the whole operation in one `$transaction`: Postgres now holds a lock on the
referenced layer row for the transaction's duration, so a concurrent delete
blocks until it commits instead of racing it, and `Feature`'s existing `ON
DELETE CASCADE` still cleans up correctly once it does. Given the loop can
run many sequential inserts, the transaction's timeout was raised from
Prisma's 5s default to 60s rather than tuned to any specific fixture size.
This lives in `src/contexts/project/project-utils.ts`, not anything MC-061
added — it's part of the persistence layer MC-015 built and every layer
upload since has used.
