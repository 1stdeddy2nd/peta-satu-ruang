# MC-004 — Layer manager

- **Status:** DONE
- **Board:** sprint-01
- **Type:** feature
- **Milestone:** v0

## Functionality
Per uploaded layer, in the Analysis sidebar:
- Colour swatch (restyles fill and stroke live).
- Opacity slider, 0–100%.
- Show / hide toggle.
- Zoom to that layer's extent.
- Remove the layer (drops the OL layer too, not just the row).
- "Zoom all" fits every loaded layer.

Shows geometry type and feature count per layer.

## Acceptance criteria
- [x] Every control updates the map immediately.
- [x] Removing a layer leaves no orphaned OL layer behind.
