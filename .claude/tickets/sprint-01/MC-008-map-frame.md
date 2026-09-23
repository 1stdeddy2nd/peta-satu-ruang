# MC-008 — Map frame

- **Status:** DONE
- **Board:** sprint-01
- **Type:** feature
- **Milestone:** v0

## Functionality
- The map is a movable, resizable window on the page, not the whole page.
- Dragging is confined to a ~10px rim so the interior still pans the map.
- Resizable from every edge and corner.
- Calls `updateSize()` whenever the frame box or canvas zoom changes, otherwise
  the OL canvas renders at a stale size.

## Acceptance criteria
- [x] Dragging the rim moves the frame; dragging the middle pans the map.
- [x] Resizing does not distort the map.
