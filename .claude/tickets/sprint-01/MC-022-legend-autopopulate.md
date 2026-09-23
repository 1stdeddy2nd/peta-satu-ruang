# MC-022 — Legend auto-populated from layers

- **Status:** DONE
- **Board:** sprint-01
- **Type:** feature
- **Milestone:** MVP v1

## Why now
The manual legend works, so it is not a blocker — but this is the most obvious
papercut in the current flow and the strongest candidate for the first
post-MVP feature.

## Functionality
- Offer to fill legend entries from the uploaded layers: name, colour and a
  symbol matching the geometry type.
- Keep entry colours in sync when a layer's colour changes.
- Users must still be able to rename, reorder and remove entries by hand.

## How it works
"Fill from layers" on a legend replaces its entries with what is actually drawn:
one row per layer when it has a flat colour, one row per class when it is
categorised. Hidden layers are skipped — the legend should match the sheet. File
extensions are stripped, since nobody wants ".geojson" in print.

It replaces rather than merges, and entries stay editable afterwards, so it is a
starting point rather than a binding.

## Acceptance criteria
- [x] One click fills the template legend from the layers.
- [x] A categorised layer contributes one row per class, in its map colour.
- [x] Entries remain editable after filling.
- [x] Walkthrough: `e2e/videos/MC-022-legend-autopopulate.webm`.
