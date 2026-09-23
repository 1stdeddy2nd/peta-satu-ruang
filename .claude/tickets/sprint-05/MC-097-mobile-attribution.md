# MC-097 — A tappable credits control instead of the clipped attribution strip

- **Status:** PROGRESS — fixed locally, awaiting the product owner's check
- **Board:** sprint-05
- **Type:** design
- **Milestone:** MVP v1

## Why

OpenLayers' own attribution strip along the bottom edge is a row of inline
links — on a narrow screen it wraps or clips, and the individual source links
are too small and close together to tap reliably.

## Functionality

- On narrow screens, the attribution strip is replaced by a single small
  "Sumber" control that opens a sheet/panel listing every active source
  (OpenStreetMap, MAGMA, BMKG, USGS, NASA FIRMS, SiPongi, BPS, Microsoft —
  whichever apply to what's currently on the map), each a real tappable row.
- Desktop keeps the current inline strip.

## Non-goals

- Not changing which sources are credited, only how they're presented on a
  narrow screen.

## Acceptance criteria

- [x] Below the tablet breakpoint, every source currently shown on the map is
      reachable from one control, each as its own tappable row.
- [x] Desktop is unchanged.
