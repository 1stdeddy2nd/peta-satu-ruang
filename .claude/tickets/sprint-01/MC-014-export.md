# MC-014 — Export to PDF and PNG

- **Status:** DONE
- **Board:** sprint-01
- **Type:** feature
- **Milestone:** v0

## Why
The whole point: get a print-ready sheet out.

## Functionality
- PNG and "Export PDF" buttons in the header (Layout mode only).
- Captures `#print-page` with html2canvas-pro at 2× after removing the editor's
  zoom transform.
- PDF page size is the true mm size of the chosen page and orientation.
- In-flight spinner; success and failure toasts.

## Known limits
Rasterised — text is not selectable in the PDF (see MC-027).

## Acceptance criteria
- [x] PDF matches the on-screen sheet.
- [x] Output is full size even when the canvas is zoomed to 80%.
