# MC-019 — Detach an element from auto-layout

- **Status:** BACKLOG
- **Board:** backlog
- **Type:** feature
- **Milestone:** post-v1

## Why parked
Existed only to escape the auto-layout stack. Adds a second positioning mode to
reason about for little MVP value. Built and **removed on 2026-08-29**.

## Functionality if revived
- Per-element toggle between `flow` and `free` placement.
- Detaching must freeze the element at the rect the flow engine currently gives
  it, so it never visually jumps. The previous implementation did this with
  `computeFlowRects`, which had to stay in sync with what CSS flex actually
  rendered — a standing source of drift.
- Re-attaching appends it to the end of the region stack.

## Acceptance criteria
- [ ] Detaching causes no visual jump.
- [ ] The rest of the stack closes the gap.
