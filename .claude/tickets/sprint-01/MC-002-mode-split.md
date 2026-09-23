# MC-002 — Analysis / Layout mode split

- **Status:** DONE
- **Board:** sprint-01
- **Type:** feature
- **Milestone:** v0

## Why
Mirrors how desktop GIS separates a live map view from a print composer, and
keeps the layout surface clean as analysis tools arrive.

## Functionality
- Segmented switch in the header toggles **Analysis** and **Layout**.
- Analysis mode: map fills the viewport, sidebar is about the data.
- Layout mode: printable sheet, sidebar is about the page.
- **One** OpenLayers instance is shared and moved between modes with
  `setTarget()`, so centre, zoom and layers survive the switch.

## Acceptance criteria
- [x] Switching modes preserves uploaded layers and map position.
- [x] No control is duplicated across both modes.
