# MC-041 — Map attribution, on screen and in the export

- **Status:** DONE
- **Board:** sprint-01
- **Type:** feature
- **Milestone:** MVP v1

## Why
We are not compliant today. The map is built with `controls: []`, which drops
OpenLayers' attribution control, so **no attribution is rendered anywhere** — not
on screen and not in exported sheets.

OpenStreetMap data is ODbL: using it requires crediting "© OpenStreetMap
contributors". A printed map sheet carries the same obligation as the screen, and
an exported PDF is the artefact that actually leaves the building.

This is a legal blocker for MC-033, not a polish item.

## Functionality
- Restore an attribution control on the map view, styled to sit quietly.
- Put attribution **on the printable sheet**, so it survives export to PDF and
  PNG. It must not be something the user can accidentally delete — obligation,
  not decoration.
- Keep it legible at print size without dominating the sheet.

## How it works
Restored as OpenLayers' own `Attribution` control — the only control we keep —
set `collapsible: false`, because a hidden credit is not a credit. It renders
inside the map frame, which is standard cartographic practice and means it is
carried into the export for free: the frame is inside `#print-page`, so
html2canvas captures it.

Because it is a map control rather than a layout element, it does not appear in
the layers panel and cannot be deleted by ordinary editing.

**Decisions taken while building:**
- Uploaded data is **not** credited automatically. We cannot know its licence,
  and guessing would be worse than silent. The template's "Sumber" text block is
  where a user records their own sources.
- The inset map carries no separate credit. One credit per sheet is the norm,
  and a second line on a 100px overview would be clutter.

## Acceptance criteria
- [x] "© OpenStreetMap contributors" is visible on the map view.
- [x] Not collapsible.
- [x] The credit appears in the exported PDF — verified in the output pixels,
      not merely inferred from a successful download.
- [x] No layout element for it, so ordinary editing cannot remove it.
- [x] Walkthrough: `e2e/videos/MC-041-map-attribution.webm`.
