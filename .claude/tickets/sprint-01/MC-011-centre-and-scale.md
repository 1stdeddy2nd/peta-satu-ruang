# MC-011 — Centre on coordinate and exact scale

- **Status:** DONE
- **Board:** sprint-01
- **Type:** feature
- **Milestone:** v0

## Why
Printed maps are specified at an exact scale (1:25,000), not a slippy-map zoom
level.

## Functionality
- Longitude/latitude fields with "Center map here"; Enter also submits.
- Accepts a comma decimal separator; validates ranges (−180…180, −90…90).
- "Exact scale (1 : N)" field with Apply; never null, rejects non-positive
  input and restores the last good value.
- Shows the live current scale as a hint.
- Both actions **animate** the view (300ms) via `useMap()` actions.

## Notes
Writing to the store alone does not move the map — the view change must go
through the `useMap()` action.

## Acceptance criteria
- [x] Centring jumps to the typed coordinate.
- [x] Applying 1:50,000 makes the scale bar read 1 : 50,000.
