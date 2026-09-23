# MC-037 — Automated test suite

- **Status:** BACKLOG
- **Board:** backlog
- **Type:** chore
- **Milestone:** post-v1

## Why parked
There is no test framework yet, so `make test` is a placeholder. Adding one is
worthwhile, but it does not move a user closer to a finished map, and the code
is still churning enough that tests written now would mostly be rewritten.

## What is worth testing first
Not components — the pure logic where a silent regression is expensive:

- `contexts/map/map-utils.ts` — `resolutionToScale` / `scaleToResolution` must
  round-trip. A quiet error here makes every printed scale wrong.
- `contexts/print/print-utils.ts` — mm↔px and page geometry for A4/A3 in both
  orientations.
- `contexts/layout/layout-flow.ts` — `regionChildren` ordering, and hidden
  elements taking no space.
- `layout-templates.ts` — the info column fits every page format without
  overflowing. This was verified by hand in MC-016 and is easy to break.

## Suggested shape
Vitest for unit tests. Playwright only if a real end-to-end path earns it —
it was used ad hoc during v0 and removed again to keep the dependency list
light.

## Acceptance criteria
- [ ] `make test` runs a real suite.
- [ ] The scale round-trip and page geometry are covered.
- [ ] Runs in CI on pull request (MC-033).
