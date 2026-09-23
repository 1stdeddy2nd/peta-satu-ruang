# MC-034 — Remove element reordering and placement override

- **Status:** DONE
- **Board:** sprint-01
- **Type:** removal
- **Milestone:** v0

## Why
Cut as non-MVP rather than debugged. The templates already ship the standard
element order, so reordering was polish — and the implementation was broken in
the common case.

The ideas are preserved as MC-018 and MC-019 on the backlog. This ticket is the
other half: what was actually taken out.

## What went wrong
Drag-to-reorder had **no auto-scroll while dragging**. The admin-map info column
has 14 rows in a panel showing about 6, so dragging from the bottom to the top
was impossible. It only worked when both rows happened to be on screen at once,
which is also why it passed a first test and failed in real use.

## What was removed
- `components/molecules/SortableList.tsx` — deleted entirely.
- `ElementCard` — drag handle, `dragging` / `handle` props, placement toggle.
- `ElementsPanel` — per-group drag state and reorder handlers.
- `layout-store` — `reorderFlowElements`, `reorderFreeElements`, `setPlacement`.
- `layout-flow` — `computeFlowRects`, `regionInnerRect` (only used by the
  placement override).

## What was kept, deliberately
Auto-layout regions (MC-007). They are what stops elements overlapping, they are
declarative with no interaction to break, and removing them would reintroduce
the original bug.

## To bring it back
Restore the store actions first, then a reorder UI. Do not reuse HTML5
drag-and-drop — see `rules/03-gotchas.md`. Auto-scroll and a
drop indicator are required, or consider up/down buttons instead.

## Acceptance criteria
- [x] No dead references remain (`SortableList`, `setPlacement`, `computeFlowRects`).
- [x] Auto-layout still reflows with no overlaps.
- [x] Type-check, lint and build clean.
