# MC-007 — Auto-layout regions

- **Status:** DONE
- **Board:** sprint-01
- **Type:** feature
- **Milestone:** v0

## Why
With everything absolutely positioned, template elements overlapped each other
as soon as one changed size.

## Functionality
- A template declares `LayoutRegion`s (rect, direction, gap, padding).
- Elements with `placement: "flow"` are children of a region and are stacked by
  CSS flex — they **cannot overlap** and reflow when one is resized or hidden.
- A flow child carries only `flowSize` (its length along the stack axis); the
  cross axis is stretched by the region.
- Elements added by hand are `placement: "free"` — absolutely positioned and
  draggable. Free elements render above regions.
- Resize a flow child by dragging its edge on the canvas.

Key files: `contexts/layout/layout-flow.ts`, `layout-templates.ts`,
`organisms/canvas/FlowRegion.tsx`.

## Acceptance criteria
- [x] Peta Administrasi column shows 14 children with zero overlaps.
- [x] Resizing or hiding one child reflows the rest.
