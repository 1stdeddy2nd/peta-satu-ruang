# MC-020 — Change z-order of free elements from the panel

- **Status:** BACKLOG
- **Board:** backlog
- **Type:** feature
- **Milestone:** post-v1

## Why parked
Dragging an element on the canvas already brings it to the front, which covers
the common case for v1.

## Functionality if revived
- Reorder the "Free elements" list to set stacking order (top = front).
- Free elements render at `zIndex + 10` so they stay above regions (z-index 1)
  and the map frame (z-index 0) — preserve that offset.

## Acceptance criteria
- [ ] Reordering visibly changes which element overlaps which.
