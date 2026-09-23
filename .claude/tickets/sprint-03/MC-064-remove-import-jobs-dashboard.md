# MC-064 — Remove the per-job import dashboard

- **Status:** DONE
- **Board:** sprint-03
- **Type:** removal
- **Milestone:** MVP v1

## Why
Raised by the product owner: `/admin/import-jobs` is redundant now that
`/admin/pipelines` exists. Agreed. MC-063's DAG shows the same jobs with more
context — which dataset a job belongs to, what it depends on, and which of its
processes is running — where this page showed a flat list of rows with no
sense of what the data was for.

Keeping both means two places to look at one queue, and they disagree: the
pipeline view knows a step whose data already exists needs no job at all,
while this page can only show jobs that were queued.

## What is removed
- `src/app/admin/import-jobs/` — the route.
- `src/app/api/admin/import-jobs/` — its API.
- `src/components/templates/ImportJobsDashboard.tsx`.
- `e2e/MC-061-async-import-pipeline.spec.ts` — the walkthrough drives deleted
  UI, and a spec outliving its feature is a mistake this project has already
  made twice (MC-005, MC-028).

**Nothing about the pipeline itself is removed.** MC-061's worker, Postgres
job queue, retry/backoff, MinIO archiving and `ImportJob` table all stay and
are what `/admin/pipelines` runs on. This removes a *view*, not the machinery.

## What is lost, and what was done about it
The dashboard showed three things the DAG did not:

1. **The MinIO archive key** for a completed job. This one matters — knowing
   which backup a step produced *is* provenance, which is the pipeline view's
   whole stated purpose. **Folded into the pipeline step header** rather than
   lost.
2. **Attempt count** for a job being retried. Also folded in, next to the
   status, so a step quietly burning retries is visible.
3. **An ad-hoc "queue a job for country X" control.** Deliberately not
   replaced. That control is exactly what caused the 63.9M-row data loss
   recorded in `03-gotchas.md` — a one-off Philippines job hit a delete scoped
   by a constant shared across every country. Queuing now happens only through
   a declared pipeline, which is a narrower and safer surface.

Jobs for a country with no declared pipeline are no longer visible anywhere.
Accepted: only Indonesia has ever been run end to end, and a second country
should arrive as a second pipeline definition, not as a free-text form.

## Acceptance criteria
- [x] `/admin/import-jobs` and its API return 404.
- [x] No dead references to the removed route or component anywhere in `src`.
- [x] The MC-061 walkthrough spec is deleted, not left driving missing UI.
- [x] Archive key and attempt count are visible on the pipeline step header,
      so removing the page loses no provenance.
- [x] `/admin/pipelines` still works and remains admin-gated.

## Verified
`tsc --noEmit`, `eslint` clean. In a real browser, `/admin/import-jobs`
returns 404 and `/admin/pipelines` still renders and runs. No references to
the removed route or component remain in `src` or `e2e`.

## Bringing it back
Restore the three deleted paths from git history (this ticket's commit) and
re-add the `/admin/import-jobs` link. The `ImportJob` table, its API shape and
the worker are unchanged, so nothing else would need rebuilding. The ad-hoc
queue control should **not** come back without per-country delete scoping,
which MC-061 fixed but which this form is what exposed.

## Related
The idea of a per-job operational view is parked on the backlog rather than
discarded, so it can return if the DAG turns out to be too coarse for
debugging a stuck import.
