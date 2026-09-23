# MC-009 — Page elements and properties

- **Status:** DONE
- **Board:** sprint-01
- **Type:** feature
- **Milestone:** v0

## Functionality
Eight element kinds: title, text block, legend, north arrow, scale bar, logo,
inset map, divider. Each can be selected, resized, locked, hidden, duplicated
and deleted.

Contextual properties per kind, e.g.:
- Title/text: content, alignment, font size (dropdown), colour.
- Legend: heading, font size, entries (colour, label, symbol type).
- North arrow: three styles, rotation, colour.
- Scale bar: chequered/line, metric/imperial; renders live 1:N.
- Logo: image upload as data URI.
- Inset map: zoom offset; tracks the main map and outlines its extent.
- Divider: orientation, thickness, colour.

## Acceptance criteria
- [x] Every property updates the canvas immediately.
- [x] Scale bar reflects the true map scale.
