# MC-053 — Sentinel-2 historical year picker (2020–2025)

- **Status:** DONE
- **Board:** sprint-03
- **Type:** feature
- **Milestone:** MVP v1

## Why
MC-050 ships one fixed year (2025). EOX's WMTS capabilities already expose a
full run of annual mosaics — `s2cloudless-2020_3857` through
`s2cloudless-2025_3857` (checked directly against
`https://tiles.maps.eox.at/wmts/1.0.0/WMTSCapabilities.xml`) — so comparing
Indonesia across years (e.g. watching a coastline or forest edge change) costs
nothing extra to fetch, only a UI to pick the year.

## Functionality
- When "Sentinel-2 cloudless" is selected as the basemap, show a year select
  (2020–2025) alongside it.
- Swap the `XYZ` source URL's year segment
  (`s2cloudless-{year}_3857/default/g/{z}/{y}/{x}.jpg`) — no new source type,
  same pattern as `createSentinel2Source` in `map-provider.tsx`.
- Persist the chosen year the same way `basemap` is persisted (MC-015).

## Non-goals
- No sub-annual granularity — EOX only publishes one mosaic per year. Getting
  closer to "current" is MC-054, a different and much bigger undertaking.
- No slider/animation between years for v1 — a plain select is enough to prove
  the idea is useful before investing in a fancier control.

## Acceptance criteria
- [x] Selecting a year swaps the visible mosaic with no reload.
- [x] The chosen year persists across a reload (MC-015).
- [x] Attribution reflects the selected year
      ("Contains modified Copernicus Sentinel data {year}") — verified for
      all six years (2020-2025) by diffing raw tile bytes and checksums, not
      just trusting the label.
- [x] Defaults to 2025 when Sentinel-2 is first selected.
