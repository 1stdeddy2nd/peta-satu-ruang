# MC-018 — Reorder elements inside a template region

- **Status:** BACKLOG
- **Board:** backlog
- **Type:** feature
- **Milestone:** post-v1

## Why parked
The template already ships the standard order, which is the point of a
standard. Built in v0 as drag-to-reorder, then **removed on 2026-08-29**: it
was broken in the common case and is not MVP.

## What went wrong last time
No auto-scroll while dragging. The Peta Administrasi column has 14 rows in a
panel showing about 6, so dragging from the bottom to the top was impossible.
It only worked when both rows happened to be on screen.

## Functionality if revived
- Reorder a region's children, reflowing the stack.
- Auto-scroll the panel while dragging near its edges.
- A drop indicator showing where the row will land.
- Pointer events, not HTML5 drag-and-drop (no touch support, cannot be confined
  to a handle, drags an unwanted ghost image).
- Consider simple up/down buttons instead — far cheaper and fully reliable.

## Acceptance criteria
- [ ] A row can be moved from the bottom of a long list to the top.
- [ ] Works with a trackpad and on touch.
