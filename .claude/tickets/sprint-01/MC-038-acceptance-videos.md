# MC-038 — Recorded acceptance walkthroughs

- **Status:** DONE
- **Board:** sprint-01
- **Type:** chore
- **Milestone:** v0

## Why
Thirteen v0 tickets are stuck in PROGRESS because confirming each one means
driving the app by hand. One recording per ticket, walking its acceptance
criteria, turns an hour of manual clicking into a few minutes of watching — and
it is repeatable after every change instead of one-off.

## Functionality
- One Playwright spec per ticket, named for it, exercising that ticket's
  acceptance criteria and nothing else.
- Video per spec, collected as `e2e/videos/MC-0NN-*.webm`.
- An on-screen caption during the run naming the ticket and the current step,
  so a silent video is followable without reading the spec.
- `make verify` runs them all; `make verify T=MC-003` runs one.
- Runs against the sample data in `examples/`.

## What this is not
Evidence that a feature **works**, not that it **feels** right. A recording of a
happy path hides how fiddly an interaction is. Interaction-heavy tickets —
MC-008 (drag the map frame by its edge), MC-011 and MC-012 — still want a human
hand on them before being confirmed.

These are walkthroughs, not assertions. Real regression tests are MC-037.

## How it runs
Recording happens against a **production build on port 3100**, in its own
`.next-verify` directory (`NEXT_DIST_DIR`). Two reasons:

- A dev server recompiles on demand, which stalled runs badly enough that specs
  passing alone would time out in sequence.
- It means `make verify` can run while `make dev` is up, instead of clobbering
  the `.next` the dev server is serving from.

Steps are captioned on screen and echoed to stdout, so a hung run names the
step it died on.

## Acceptance criteria
- [x] One video per ticket under test — 14 in `e2e/videos/`.
- [x] Each video is captioned with the ticket and current step.
- [x] `make verify` produces the full set; `make verify T=MC-003` runs one.
- [x] Runs without disturbing a dev server on port 3000.
- [x] Videos, Playwright output and `.next-verify` are gitignored.
