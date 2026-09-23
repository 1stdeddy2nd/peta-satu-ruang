# MC-052 — Near-real-time fire/hotspot layer (NASA FIRMS)

- **Status:** DONE
- **Board:** sprint-03
- **Type:** feature
- **Milestone:** MVP v1

## Why
Raised directly by the product owner: for *kahutla* (forest and land fire)
monitoring, Indonesia's own SIPONGI (KLHK) is not a trusted source, but a
government-independent, near-real-time option would be genuinely useful and
is a real differentiator from MC-050/MC-051's annual/static data.

**NASA FIRMS is that option, and it isn't a coincidence that it fits** —
SIPONGI itself is built on the same underlying MODIS/VIIRS satellite
detections, just re-published through KLHK's own pipeline. Going to FIRMS
directly gets the same physical fire detections without going through the
Indonesian government's framing of them.

## Source and legality
[NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/) — Fire Information for
Resource Management System, part of NASA Earthdata / LANCE.

- **Free, open, no commercial-use restriction** — NASA's open-data policy,
  unlike MC-050's EOX non-commercial gate. Citation requested, not a legal
  requirement: "We acknowledge the use of imagery from the NASA LANCE FIRMS."
- Access via a free `MAP_KEY`, area/country-bounded CSV or KML queries.
- **Global Forest Watch** (WRI, an independent NGO) republishes the same fire
  data plus deforestation alerts, daily — worth it as a secondary, richer
  view, but **do not depend on it alone**: some GFW datasets were reported
  to have stopped updating from ~October 2025 due to US federal funding
  disruption. Verify current status before building against it; FIRMS direct
  is the primary source either way.

## Update cadence — the one genuinely real-time source in this sprint
- **NRT**: within 3 hours of satellite pass (MODIS/VIIRS, polar-orbiting).
- **RT**: within 30 minutes.
- **URT**: within 5 minutes, where available.
- **Geostationary (Himawari)**: Indonesia sits in continuous view of Japan's
  Himawari satellite, refreshing roughly every 10 minutes — this is the
  standout option for Indonesia specifically, since polar orbiters only pass
  a couple of times a day.

This is a different data shape from MC-050 (annual raster mosaic) and MC-051
(static vector snapshot) — points in time, not a basemap. Treat it as its own
toggleable layer, not folded into either.

## Functionality
- A "Fire hotspots" toggle in Analysis mode, server-proxied (API key stays
  server-side, per the product's "push heavy work to server" rule) — fetch
  active-fire points for the current view/date range and render as a point
  layer.
- Each point carries at least: detection time, confidence, and source sensor
  (MODIS/VIIRS/Himawari), so a user can judge freshness at a glance.
- Attribution: "NASA FIRMS / LANCE, part of NASA Earth Science Data and
  Information System (ESDIS)."

## Non-goals
- Not a replacement for MC-051's building footprints or MC-050's imagery —
  hotspots are event points, not area polygons or a basemap.
- No historical fire-scar polygon generation here — that would be a
  Sentinel-2-based burned-area analysis, a separate and bigger ticket if it
  happens at all.
- No SIPONGI/BMKG integration — deliberately independent of Indonesian
  government sources, per the reason this ticket exists.

## Verification so far
Built as a live proxy (like the Sentinel-2/OSM basemap tiles) — not persisted,
not routed through the MC-061/063 import pipeline; a history feature is
tracked separately as MC-070. Type-checks, lints, and confirmed in a real
browser with a real `FIRMS_MAP_KEY` (e2e/MC-052-fire-hotspot-layer.spec.ts):
toggling on loads real points and shows the FIRMS attribution, click-to-inspect
is wired up, toggling off removes the layer. The missing-key failure path was
also confirmed separately before the key was added.

**Corrected after first hand-over**: initially capped the query to the current
map view (borrowed from MC-051's bbox pattern) and rejected a large/zoomed-out
view. Wrong for this dataset — karhutla monitoring needs the whole country,
and FIRMS's area API has no size cap (up to the full globe, per its own docs;
the "10° max" I'd assumed doesn't exist). Now always queries Indonesia's full
bounding box regardless of the current view.

**Two more corrections from real testing**:
- `day_range=1` (just the latest day) reliably returned zero rows across every
  sensor — NRT processing lag, not a bug. `day_range=2` is where real,
  substantial detections show up (6,718 points on a live check during
  September 2026's dry season).
- Added a `FireHotspotCache` table (Postgres, one row keyed `"IDN"`) so every
  viewer's 10-minute poll hits our own DB first, not FIRMS directly — FIRMS's
  own limit is 5,000 transactions/10min per key, and one shared fetch now
  serves everyone. On a FIRMS outage it falls back to the last cached
  snapshot but marks the response `stale: true`, which the client surfaces as
  a warning toast with the snapshot's age — the earlier corrected "fails
  visibly, not silently" criterion still holds, staleness just isn't
  indistinguishable from a hard failure anymore.
- Generating this migration re-triggered the GiST-index-drift gotcha
  (03-gotchas.md) — `migrate dev` silently dropped both `AdminBoundary_geom_idx`
  and `BuildingFootprint_geom_idx` before I caught it. Recreated both indexes
  live and rewrote the migration file to re-assert them, so a fresh
  `migrate deploy` doesn't lose them again.

## Acceptance criteria
- [x] Fire hotspots for Indonesia load and refresh without exposing the
      `MAP_KEY` to the browser.
- [x] Each point shows its detection time and confidence on inspection.
- [x] Attribution is visible on screen and in export.
- [x] A stale/no-data state (e.g. API down) fails visibly, not silently.

Confirmed by the product owner.
