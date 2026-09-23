# MC-059 — Import Indonesia admin boundaries, clip buildings to one on request

- **Status:** DONE
- **Board:** sprint-03
- **Type:** feature
- **Milestone:** MVP v1

## Why
Raised directly, as a better unit than an arbitrary bbox for MC-051's
building-footprint import: instead of "whatever rectangle the current view
happens to be," let a user pick a real administrative boundary — down to
village level — and get the buildings inside it. Matches the product's own
beachhead (Indonesian admin-boundary maps) far better than a free-form
rectangle does.

## Source and legality — verified against HDX's own API, not a search result
- **[HDX COD-AB Indonesia](https://data.humdata.org/dataset/cod-ab-idn)** —
  Admin 1 (34 provinces) → Admin 2 (522 kota/kabupaten) → Admin 3 (7,069
  kecamatan) → **Admin 4 (81,912 desa/kelurahan)**.
- **License: CC BY-IGO** — commercial use allowed, attribution required.
- **Source is Badan Pusat Statistik** (Indonesia's official statistics
  agency), curated and published by UN OCHA — worth being upfront that this
  is government-*sourced* data, unlike MC-052's FIRMS. Administrative
  boundaries aren't in the same trust category as fire/hazard reporting
  (there's no framing to spin in "where is this village's line"), but it's a
  different situation from FIRMS and shouldn't be described as if it weren't.
- **Vintage**: boundaries created 2020, last reviewed for accuracy October
  2025 — state "boundaries as of ~2020" on screen, same pattern as MC-050's
  and MC-051's own vintage notices.
- GeoJSON format, ~456MB zipped — a fraction of MC-051's 4.4GB, importable in
  minutes rather than hours.

## Design: query on request, never pre-clip and store
The instinct to pre-compute and store a clipped building set for every one
of 81,912 villages was considered and rejected — that's a huge one-time job
and a lot of duplicated storage for something PostGIS already does live and
fast. Instead:

- Import all 4 levels once into a new `AdminBoundary` table (id, level,
  name, parent references, real PostGIS geometry + GiST index — same
  pattern as `BuildingFootprint`).
- "Buildings in this village" is a normal query at request time:
  `ST_Intersects(BuildingFootprint.geom, AdminBoundary.geom)`, index-assisted
  on both sides. No separate clipping step, no stored-per-boundary results.
- A boundary picker (search by name, or click on the map) replaces MC-051's
  bbox-based "current view" trigger for this path — MC-051's original
  free-form-area import stays available alongside it, not replaced.

## Built
All 4 levels imported from the real HDX file (not a fixture — small enough
to import directly, ~37s total for all 89,537 boundaries: 34 provinces, 522
regencies, 7,069 districts, 81,912 villages — every count matched the
dataset's own stated totals exactly). Table size: 570MB. A `GET
/api/admin-boundaries?level=4&q=...` search endpoint backs a "Find a
village…" picker (debounced search-as-you-type, disambiguates same-named
villages by showing their full parent hierarchy — there are five "Ancol"s
across different provinces). Selecting one calls the same
`/api/building-footprints` route MC-051 uses, now accepting either `bbox` or
`boundaryId` — the boundary path does `ST_Intersects(BuildingFootprint.geom,
AdminBoundary.geom)` at request time, no pre-clipping, no area cap (a
boundary is never arbitrarily large the way a free-form view can be).

Verified against a real village end to end: buildings clip to Ancol's actual
irregular coastline-and-street boundary shape (screenshot-checked, not just
a count), the layer auto-zooms to it, and the count (3,359) matches a raw
`ST_Intersects` query run directly against the database beforehand.

**Found and fixed a real bug while verifying attribution**: the API returned
an `attribution` string but the client never actually attached it to the
vector source, so it silently never appeared on screen at all — neither
MC-051's nor MC-059's credit was showing, despite the acceptance criteria
elsewhere in this file assuming it did. Fixed by passing `attributions` when
constructing the `VectorSource`, the same way OL's tile sources already do
it for OSM/Sentinel-2. Confirmed on screen: both the Microsoft and the
BPS/UN OCHA credits now show together, exactly as required.

## Non-goals
- Not replacing MC-051's free-form bbox import — this is an additional,
  more meaningful selection unit, not a removal.
- Not attempting to detect or reconcile boundary changes since 2020 (new
  villages formed by splits, renames, etc.) — out of scope; state the
  vintage and move on.

## Acceptance criteria
- [x] All 4 admin levels imported with real PostGIS geometry and a GiST
      index, license and vintage logged in `THIRD_PARTY_NOTICES.md`.
- [x] A user can select a village (or any level) and get exactly the
      buildings inside it, with no bbox/area-cap dance — verified against a
      real village, not a synthetic fixture.
- [x] Attribution states BPS as source and UN OCHA/HDX as publisher, plus the
      ~2020 vintage — verified actually visible on screen, not just returned
      by the API (see the attribution bug above).
- [x] No pre-computed per-boundary storage exists anywhere — the query runs
      live every time (`ST_Intersects` at request time in
      `src/app/api/building-footprints/route.ts`), confirmed by reading the
      implementation.
