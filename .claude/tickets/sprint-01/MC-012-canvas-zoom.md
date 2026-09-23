# MC-012 — Canvas zoom and fit-to-screen

- **Status:** DONE
- **Board:** sprint-01
- **Type:** feature
- **Milestone:** v0

## Why
An A4 sheet at 96dpi is 1123px tall — taller than most laptop viewports, so the
page was being clipped.

## Functionality
- Floating zoom bar: −, percentage (click to reset to 100%), +, fit.
- Range 25–200%.
- Auto-fit recomputes on viewport resize via `ResizeObserver` until the user
  zooms manually.
- The sheet is CSS-scaled; every `Rnd` receives `scale={canvasZoom}` so drags
  stay 1:1 with the cursor.
- Export strips the transform, so zoom never affects output.

## Acceptance criteria
- [x] Whole page visible on a 1000px-tall viewport.
- [x] Export is full size regardless of zoom.
