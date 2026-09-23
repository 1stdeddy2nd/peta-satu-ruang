# MC-005 — Basemap picker

- **Status:** BACKLOG
- **Board:** backlog
- **Type:** feature
- **Milestone:** v0

## Removed from v0 on 2026-08-31
Shipped, then taken out by MC-040. Every source other than OpenStreetMap was
somebody else's terms to comply with, and "No basemap" went too — leaving one
option, which is not a choice worth a control.

Worth reviving only if we take on a commercial tile provider (MC-042), at which
point light/dark/satellite become real options again.

## Functionality (as built)
- Choose OpenStreetMap, Carto Light, Carto Dark, or no basemap.
- Source is swapped in place on the existing tile layer.
- All sources set `crossOrigin: "anonymous"` — without it the basemap comes out
  blank in PNG/PDF export.

## Acceptance criteria
- [~] Switching source repaints the map.
- [~] "No basemap" hides tiles but keeps vector layers.
- [x] Exported PDF still contains the basemap. (still true)
