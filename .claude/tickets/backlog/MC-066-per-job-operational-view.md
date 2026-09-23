# MC-066 — A per-job operational view for debugging imports

- **Status:** TODO
- **Board:** backlog
- **Type:** feature
- **Milestone:** unscheduled

## Why parked
This is the idea behind `/admin/import-jobs`, which MC-064 removed as
redundant against MC-063's pipeline DAG. The DAG is the better *default* view —
it shows what data exists, where it came from and what depends on what — but
it is deliberately coarse: one node per declared step, showing only the latest
job for that step.

If a stuck or flapping import ever proves hard to debug from the DAG alone,
the thing that is genuinely missing is job *history*: previous attempts, the
error each one failed with, how long each took, and jobs that belong to no
declared pipeline.

Parked rather than rebuilt because none of that has actually been needed yet.
MC-064 already folded the two details worth keeping — MinIO archive key and
attempt count — into the pipeline step header, which may well be enough
forever.

## If it comes back
Build it as **history under a pipeline step** (click a node, see that step's
past runs), not as a second flat list of every job in the queue. The flat list
is what made the original page redundant.

Do **not** restore the ad-hoc "queue a job for an arbitrary country" form —
see MC-064 and the data-loss entry in `03-gotchas.md`.
