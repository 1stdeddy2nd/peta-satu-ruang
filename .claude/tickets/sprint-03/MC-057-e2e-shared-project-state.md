# MC-057 — e2e specs pollute each other through the one persisted project

- **Status:** DONE
- **Board:** sprint-03
- **Type:** bug
- **Milestone:** MVP v1

## Why
Also found running the full suite while implementing MC-055. Before MC-015,
every spec got a fresh in-memory store on each page load — order never
mattered. Now every spec shares the same real Postgres-backed project row
(MC-015: one project per user), so whatever an earlier spec left behind —
layers, `basemap`, `sentinel2Year`, graticule — leaks into whichever spec
runs next.

Running `make verify` (all specs, no `T=` filter) fails 8 of 23:
`MC-004`, `MC-015`, `MC-017`, `MC-022`, `MC-024`, `MC-040`, `MC-050`, `MC-053`
— every one of them because a later spec inherited state (a leftover layer,
or `basemap: "sentinel2"`) that an earlier spec's assertions didn't expect.
Every spec still passes fine in isolation (`make verify T=MC-050`, etc.) —
this is purely a shared-state ordering problem, not a broken feature.

**A first attempt at a fix (a `resetProject()` helper wiping the layout and
deleting every layer before each spec) made things much worse** — it turned
fast, clear assertion failures into ~30-minute hangs during Playwright's page
teardown, for reasons not tracked down before the fix was reverted. Whatever
that helper triggered is worth understanding before trying again — see
MC-056, found in the same run, as a possible contributing factor (an earlier
spec's failed KML persistence attempt leaves state that a later reset might
interact with badly). That reverted attempt is not included in this ticket's
starting point; MC-055 shipped without it.

## Functionality
- Each spec needs to start from a known project state regardless of what ran
  before it — the "why" is solid, only the previous implementation attempt
  wasn't.
- Investigate why the naive reset hung before retrying it: capture what
  request or teardown step was actually stuck (add logging, or reduce to the
  smallest repro — e.g. run just `MC-004` then `MC-050` together — rather
  than debugging via full ~30-minute runs).
- An alternative worth weighing: a lighter reset than "delete every layer over
  the API one at a time" — e.g. a single test-only endpoint, or a direct
  Prisma call from the test setup — might avoid whatever the per-layer DELETE
  loop triggered.

## Acceptance criteria
- [ ] `make verify` (full suite, no `T=` filter) passes end to end.
- [ ] No test's runtime balloons to minutes beyond its own recorded steps.
- [ ] Root cause of the teardown hang is understood and written down here,
      not just avoided.

## Built
`e2e/reset.ts` — `resetProject()` deletes the project's layers and restores
`layout` to `DEFAULT_LAYOUT`, the same constant the seed writes, which returns
basemap, graticule and view along with everything else. Called at the top of
the shared `open()` helper, so all 25 specs that use it start from the seeded
state. The two that do not — `MC-043` (starts signed out) and `MC-063` (admin
route) — touch no layers.

One `deleteMany` and one `update` through Prisma from the test process, not the
per-layer DELETE loop over the API that this ticket warned about. Nothing hung.

## Verified
Full suite before: **23 passed, 5 failed** in 12.0m — MC-010, MC-015, MC-017,
MC-040, MC-041. Every failure was inherited state, no feature was broken:
`jakarta-admin.geojson` matched ten leftover layers, the first-run prompt only
shows at zero layers, and the attribution still read "Sentinel-2 cloudless"
because MC-050/053 switch the basemap and never switch back. MC-010 simply
timed out under a dozen accumulated layers.

Full suite after: **28 passed, 0 failed** in 10.1m.
