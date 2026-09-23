# MC-050 — Sentinel-2 imagery as a selectable layer

- **Status:** DONE
- **Board:** sprint-03
- **Type:** feature
- **Milestone:** MVP v1

## Why
The user we build for has data, or needs a result from data, but no appetite
to go hunting across Sentinel Hub, Copernicus, and basemap providers to get
satellite imagery into their map. One place, a default that already works,
matching the product's "default first, vocabulary second" rule.

## Source and legality
[EOX](https://s2maps.eu) publishes a pre-made, cloud-free Sentinel-2 mosaic
as XYZ/WMTS tiles — the same "real pixels, no fabrication" compositing
discussed on this ticket's design thread, already done for us.

- **License is CC BY-NC-SA — non-commercial only on the free tier.** Resolved
  by MC-042: MapCanva itself now ships under PolyForm Noncommercial 1.0.0
  (`LICENSE`), so this matches by construction — there is no commercial tier
  to conflict with it.
- Attribution required on screen and in export, same pattern as OSM (MC-041):
  "Sentinel-2 cloudless — © EOX IT Services GmbH (Contains modified Copernicus
  Sentinel data)".

## Update cadence
The raw Sentinel-2 constellation revisits Indonesia (near-equatorial) roughly
every 5 days, but that is not what a user sees here — **EOX ships one new
global mosaic per year**, built from that year's cloud-free composite
([2022](https://eox.at/2023/10/sentinel-2-cloudless-2022/),
[2023](https://eox.at/2024/08/sentinel-2-cloudless-2023/),
[2024](https://eox.at/2025/03/sentinel-2-cloudless-2024/) are the most recent
releases). So this layer is "last year's Indonesia," refreshed annually, not a
live or even monthly view — set that expectation in the UI, not just here.

## Explicit non-goals
- **No generative AI.** Cloud removal here is real multi-date compositing
  done upstream by EOX, not pixel fabrication. Nothing in this ticket invents
  geography — see the sprint-03 design discussion for why that was rejected.
- **No auto-generated polygons.** This ticket only adds a raster reference
  layer to look at and trace over by hand. Polygon extraction is MC-051
  (building footprints) or a future analysis plugin (MC-029) — not here.
- **No date/time picker.** One current mosaic, not a time series.

## Functionality
- A "Basemap" dropdown in Analysis mode — OpenStreetMap or Sentinel-2
  cloudless, **mutually exclusive**, not a toggle stacked on top of OSM.
  Revised from the original toggle design: two attributions stacked at once
  made the bottom-right credit too long to read comfortably. One basemap
  visible at a time means one attribution at a time.
- Visible attribution for whichever basemap is selected, on screen and
  carried into PDF/PNG export (MC-041's attribution control already handles
  swapping sources).

## Acceptance criteria
- [x] MC-042 has signed off non-commercial usage, or a commercial licence is
      in place — before this ships to anyone but the seeded admin. Resolved:
      MapCanva ships under PolyForm Noncommercial 1.0.0.
- [x] The dropdown switches cleanly between OpenStreetMap and Sentinel-2
      cloudless over Indonesia, with no errors either direction.
- [x] Only the selected basemap's attribution is visible, never both at once.
- [x] The selection persists across a reload (MC-015).
