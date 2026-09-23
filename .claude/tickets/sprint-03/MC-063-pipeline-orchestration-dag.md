# MC-063 — Composite data pipelines with idempotent steps, visualized as a DAG

- **Status:** DONE
- **Board:** sprint-03
- **Type:** feature
- **Milestone:** MVP v1

## Why
Raised directly by the product owner, after first asking for a per-admin-level
"clip" pipeline (province → city → district → village) for Microsoft Building
Footprints. **That literal ask is rejected** — MC-059 already considered and
explicitly rejected pre-computing and storing a clipped building set per
boundary, in favor of `ST_Intersects` at request time (proven: a real village
query against 64M buildings, live, well under a second). Re-introducing
per-boundary storage would just re-open a decision already made, for a query
that isn't slow.

What's actually wanted, confirmed with the product owner across two follow-up
rounds: **visible, orchestrated, provenance-and-maintenance tooling** over the
gather steps MC-061 already built (Microsoft building footprints, HDX admin
boundaries), so it's obvious where our data comes from and how it was
generated — plus one real third step after both gathers finish: **for every
building, record which province/city/district/village it falls inside**, so
"buildings in this village" becomes an indexed column lookup instead of a live
`ST_Intersects`. Confirmed directly which shape that third step should take
(see Non-goals) — a materialized join, not duplicated geometry.

## What this is, concretely
- A **pipeline** is a named, ordered (or DAG-shaped, once a step has more than
  one dependency) sequence of steps. Each step wraps one of MC-061's existing
  job types (`building-footprints`, `admin-boundaries`) — no new import logic,
  this is orchestration over what already exists.
- **Idempotent by rule, not just for this pipeline**: before running a step,
  check whether its data already exists (same check `runBuildingFootprintsJob`
  /`runAdminBoundariesJob` already scope by `source`/country today) and skip
  it if so, rather than re-downloading and re-importing. Record this as a
  standing rule in `03-gotchas.md` — every pipeline job type gets an
  existence check before it runs, not just these two.
- A step that's skipped is still shown, not hidden — the point is provenance
  ("this data exists, here's how it was produced"), so a skipped step reads
  as **exists**, not as absent from the picture.

## UI: React Flow, and why it's justified here specifically
MC-061's dashboard already renders one job's linear progress as a step list
(Download → stages → Archive) — that's linear and single-job, a list is
enough. This is different: a **named pipeline made of multiple steps/sources**
where some may already be satisfied and others still need to run — a real
graph, not a single progress bar. That's the actual case for a node-graph
library. Scope it narrowly:
- Nodes = **one per process**, not one per step. The product owner asked for
  this directly: a step is a box grouping its own Download, Archive to MinIO,
  Unpack, Clear, Import nodes, each individually coloured, so it is visible
  where the data came from and where a run actually is. One box per step hid
  exactly the detail the view exists to show.
- Status vocabulary matches `ImportJob` (exists / pending / running / done /
  failed) plus **stalled**, for a `running` job whose worker died.
- Edges = process order inside a step, and declared dependency order between
  steps (last process of the dependency → first process of the dependent).
- Admin-only route (`/admin/import-jobs` or a new `/admin/pipelines`) —
  same gate as MC-061, not exposed to the general user.

## The third step: stamp a village pcode, not a clip
The product owner's second follow-up asked for a "clipping" step per admin
village. Nothing is clipped — no geometry is cut or copied. What was agreed,
and what this step does, is stamp each building with the pcode of the village
it falls inside, plus that village's parent district/regency/province pcodes.
The label on the board is **"Tag buildings by village"** so it can never be
read later as the per-boundary geometry duplication MC-059 rejected.

The product owner's own reasoning drove the algorithm: a village already sits
inside exactly one district, regency and province, so only **one** geometric
test is needed. HDX's COD-AB data carries all four levels' pcodes on every
village feature, so the three parents come straight off the village row with
no join at all.

## Pcodes, not AdminBoundary ids
The first cut stored four `AdminBoundary.id` foreign keys. The product owner
questioned the join, and he was right — worse than he knew: `runAdminBoundaries
Job` deletes and re-imports every level, regenerating every id, so those
columns would silently dangle on the next HDX refresh.

Stored instead: the source's own BPS pcode (`ID6411030009`), which is stable
across re-imports. Chosen against two alternatives — also storing the four
names (rejected: ~6.4GB on a 19GB table for a display value that can change
upstream) and storing only `villagePcode` and deriving parents by string prefix
(rejected: correct for Indonesian pcodes, but bakes Indonesia into every query,
against `01-product.md`).

`AdminBoundary` gained real `pcode`/`parentPcode` columns too, lifted out of the
`properties` JSON, so the relationship is an index lookup in **both**
directions.

## Judged on the read path, not just the import
The product owner asked, mid-work, that a pipeline change be judged by the query
it enables and not only by import speed. Against that test:

- "buildings in this village" → `WHERE "villagePcode" = 'ID6411030009'` —
  an indexed equality filter, no join, no `ST_Intersects`.
- "count buildings per district in this regency" → `GROUP BY "districtPcode"`
  under an indexed `regencyPcode` filter — the shape most analyses want.
- a boundary drill-down picker → `WHERE "parentPcode" = 'ID6411'` on 89k rows,
  instead of scanning a JSON blob.

## Why it was taking 13+ hours, and what fixed it
The join was driven from the **buildings**: batch 200k building ids, join out to
`AdminBoundary`. The planner read `AdminBoundary` as the cheap side (34
provinces) and re-scanned most of the 19GB building table once per boundary —
`docker stats` showed 698% CPU and 4.8TB of block I/O. Level 1 alone took ~13
hours; level 2 never finished. Forcing a `MATERIALIZED` CTE flipped the plan and
got it to ~200k rows/44s, projecting ~3.9h — still bad, and the run died at 4.6%
when the worker container stopped.

Now driven from the **villages**. Each village bbox-probes
`BuildingFootprint_geom_idx` and touches only its own rows. Measured on the
real 64M-row table: **200 villages, 162,719 buildings, 9.8s**. Progress is
reported in villages, a unit that means something, rather than a scanned-row
count.

### The pcode indexes had to be partial
That 9.8s measurement was taken *before* the `villagePcode` index existed, so
it measured a plan the real job never got. With a plain btree on the column,
the planner `BitmapAnd`s the step's own `villagePcode IS NULL` predicate — all
64M index entries — into the `UPDATE`, once per village. First batch: 10s.
Second batch with the index in place: still running after 20 minutes.

Fixed by making all four pcode indexes **partial** (`WHERE ... IS NOT NULL`).
Nothing queries these columns for NULL, so the partial index is smaller, faster
to build, and cannot be dragged into the backfill. Confirmed by `EXPLAIN`: the
plan is now a plain nested loop, village → `BuildingFootprint_geom_idx`, with
the pcode and source predicates as heap filters.

Prisma's DSL cannot express a partial index, so — like the GiST indexes — they
live in the migration as raw SQL and are absent from `schema.prisma`. That
means Prisma will try to `DROP INDEX` them on the next migration; the existing
gotcha about reading generated migrations for stray drops now covers six
indexes on this table, not two.

## Making it fast, and the bug that found
Asked to push the step further ("my pc is not that bad"), `docker stats` showed
Postgres at **82% of one core on a ten-core machine** with the worker idle, and
`shared_buffers` still at the stock **128MB** against a 19GB table — one run had
read 323GB of blocks. Three changes:

1. **Postgres tuning** (`docker-compose.yml`): `shared_buffers` 2GB,
   `effective_cache_size` 5GB, `work_mem` 64MB, `random_page_cost` 1.1 (the
   stock 4.0 assumes spinning disks and biases the planner off the index scans
   this step depends on), `max_wal_size` 8GB.
2. **Concurrent batches.** `UPDATE` cannot use Postgres parallel workers, so
   the only way to reach the other cores is more connections: six batches at a
   time off a `pg.Pool` (`TAG_CONCURRENCY`).
3. **Representative-point matching**, which the concurrency forced us to find.

The first parallel run **deadlocked three ways** and failed at 8,800 villages.
The assumption in the parallel code — villages are disjoint areas, so batches
won't touch the same row — was wrong, and measuring it showed why: **412 of
20,000 buildings (2.1%) intersect two or more villages**, roughly 1.3M
contested rows table-wide.

That was a correctness bug as much as a concurrency one. Under `ST_Intersects`
a border building went to whichever batch wrote first — arbitrary, and
different every run. Matching the building's representative point instead
(`bf.geom && v.geom AND ST_Contains(v.geom, ST_PointOnSurface(bf.geom))`) puts
each building in exactly one village: deterministic, and no two batches can
contend. Same speed — 113,712 buildings per 200 villages in 10.1s — so the
correctness came free. `&&` still does all the index work.

| | before | after |
|---|---|---|
| Postgres CPU | 82% (0.8 of 10 cores) | 495% (5 of 10) |
| throughput | 13.3 villages/s | 33.3 villages/s |
| full run | ~103 min | **~41 min** |

Against where this started — a building-driven join projecting 3.9h that died
at 4.6% — the step is now about 41 minutes.

### Still on the table: the database runs under emulation
`postgis/postgis:16-3.4` is amd64-only, so on an arm64 Mac the whole database
runs under QEMU. A meaningful share of that 495% is emulation overhead. An
arm64 image (`imresamu/postgis`) would likely be a further large win, but a
data directory initialised by an x86_64 build is not officially portable across
architectures, so it needs a `pg_dump`/restore into a fresh volume rather than
a tag swap. Not attempted against 64M rows of real data; worth its own ticket.

## Non-goals
- **No duplicated or clipped geometry anywhere** — the step adds pcodes, not
  geometry. MC-059's live `ST_Intersects` boundary picker is untouched.
- **Not a general workflow engine.** Same call MC-061 made against Temporal:
  a small, hand-declared set of steps over existing job types.
- **Not real-time collaborative** — single admin, same as MC-061.

## Acceptance criteria
- [x] A pipeline definition chains `admin-boundaries`, `building-footprints`
      and the tagging step for a given country.
- [x] Re-running with data already imported re-downloads and re-imports
      nothing.
- [x] The DAG shows each step's real status, including **exists** for a step
      skipped because its data was already present.
- [x] **Each step is broken into its own process nodes** — Download, Archive
      to MinIO, Unpack, Clear previous rows, Import to PostGIS — each with its
      own status, rather than one opaque box per step.
- [x] A `running` job whose worker died shows as **stalled**, not as a
      spinner that never resolves.
- [x] The existence-check-before-run rule is recorded in `03-gotchas.md` as a
      standing rule for all pipeline job types.
- [x] Route stays admin-gated (`notFound()` for non-admin).
- [x] The tagging step run to completion against the real 64M-row table.

## Built
- `scripts/pipeline/pipelines.ts` — `PIPELINES` (one: "Indonesia reference
  data"), each step now declaring its `processes` (the exact `stage` strings
  its job runner reports), and `stepDataExists`.
- `scripts/sources/building-village-tag.ts` — replaces
  `admin-boundary-link.ts`. Village-driven, 200 villages per batch, each batch
  committing on its own; only touches rows whose `villagePcode` is NULL, so an
  interrupted run resumes rather than restarting.
- `scripts/sources/admin-boundaries-import.ts` — writes `pcode`/`parentPcode`
  on import, so a refresh keeps them correct without a backfill.
- `scripts/lib/pg-copy.ts` — added `csvFieldOrNull`; `csvField(null)` writes
  the literal text `"null"`, which would have poisoned the new columns.
- `prisma/migrations/20260907090000_add_building_footprint_admin_pcodes/` —
  replaces the uncommitted `..._admin_links` migration.
- `GET /api/admin/pipelines` — returns each step's processes, source label,
  live progress, and marks a `running` job untouched for 5 minutes as
  `stalled`.
- `POST /api/admin/pipelines/:id/run` — unchanged in behaviour.
- `PipelineGraph` — rewritten. Each step is a React Flow group box containing
  one node per process, chained left-to-right; dependency edges run from a
  step's last process to the dependent step's first. Process status is derived
  from where the job's reported stage sits in the declared order.
- `PipelineDashboard` / `/admin/pipelines` — unchanged apart from copy.

## Rules and hygiene
- `03-gotchas.md` rewritten: 273 → 155 lines. Every lesson kept, each
  compressed to symptom + fix; the MC-061/MC-063 narrative that had
  accumulated there moved into this ticket, where it belongs. Two entries the
  `docker-compose.yml` comments already referenced (`shm_size`, the worker's
  own `node_modules` volume) were never actually written down — added.
- New gotchas from this round: drive a spatial join from the small localised
  side; a generated id is not a storable key; a dead worker leaves a job
  `running` forever.

## Verified
`npx tsc --noEmit` and `eslint` clean.

Schema applied to the dev database: pcode columns on both tables, 89,537
boundaries backfilled with `pcode`/`parentPcode`, the four `*Id` columns
dropped, partial pcode indexes created. `prisma migrate status` now reports
"Database schema is up to date" — the stale `20260906045026` checksum that made
`migrate dev` demand a full reset was corrected at the same time.

Driven in a real browser signed in as the seeded admin, against the real
64M-row data. The DAG renders both gather steps as five violet "Already
imported" process nodes each, and the tagging step as "Not started". Clicking
**Run** queued exactly one job — the tagging step, the only one whose data was
missing — and the node went blue with a live caption reading
"200 / 81,912 villages · 55,698 tagged" while the worker ran it.

Two dead `admin-boundary-link` jobs (the removed job type) were retired so the
worker stops retrying a type that no longer has a runner.

The tagging run completed across all 81,912 villages: **62,933,658 of
63,947,880 buildings tagged (98.4%)**, in about 41 minutes. The 1,014,222 rows
left NULL are outside HDX's boundary coverage, not a matching failure — a
300-row sample of them touches no village polygon at all, not even by
`ST_Intersects`. `villagePcode` is only ever set from a real containment test,
so NULL correctly means "no boundary covers this building".

Read path on the finished data:

| query | plan | time |
|---|---|---|
| buildings in one village (8,917 rows) | index-only scan, no heap access | **8.9ms** |
| buildings per district within a regency | index scan + GROUP BY | 621ms |
