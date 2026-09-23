# MC-082 — Show the buildings of the picked area

- **Status:** DONE
- **Board:** sprint-04
- **Type:** feature
- **Milestone:** MVP v1

## Why
We hold 64M building footprints for Indonesia (MC-051), and the only way to
see them is to import a capped GeoJSON layer in the editor. On the dashboard,
someone who has picked their kota, kecamatan or desa should see all of its
buildings with one press. The "Bangunan" button is already in the dock, inert.

## Functionality
- Bangunan is a toggle. While it is on, every building inside the picked
  kota/kabupaten, kecamatan or desa is drawn, at every zoom — the whole city
  when it fits the screen, each house when zoomed in. Picking another area
  switches to that area's buildings; clearing the search removes them.
- Below map zoom 14 buildings are drawn without an outline; from 14 in, with
  one.
- "Memuat bangunan…" shows while a large area loads.
- With no area picked, pressing it says "Cari dan pilih wilayah di kotak
  pencarian.", with the cursor in the search box — it does not turn on,
  same as Batas Wilayah.
- Picking a province turns Bangunan off and disables the button, which reads
  "Pilih kota/desa". Picking a smaller area enables it again, still off.
- Microsoft is credited on the map while buildings are drawn.

## Implementation
- `/api/building-geojson?area=<pcode>` returns the area's buildings as one
  GeoJSON FeatureCollection in EPSG:3857, built in Postgres from the stamped
  pcode column, gzipped, cached by the browser for a day. Sign-in required.
- The client draws it with an OpenLayers `VectorImage` layer, which redraws
  after a pan rather than during it.

## Decided
The owner chose the look of full-precision GeoJSON after comparing it live
with vector tiles (a coverage grid, then a heat map, below zoom 14; then
footprints with sub-pixel buildings drawn as single pixels). Tiles quantise
shapes to their grid, which is what made zoomed-out buildings look blocky or
blended. MC-068 stays parked for the editor.

## Measured on the real data
| Whole city on screen | Download | Drawn after | Worst freeze, CPU ×4 | JS memory |
|---|---|---|---|---|
| Kota Bandung (210K buildings) | 8.2 MB | 5.2 s | 1.6 s | ~1.1 GB with Surabaya |
| Kota Surabaya (323K) | 11.6 MB | 6.2 s | 2.4 s | ~1.4 GB with Bandung |
| Kabupaten Bogor (1.07M) | 34.4 MB | 18.3 s (CPU ×1) | 2.3 s (CPU ×1) | ~3 GB |

A kecamatan is 0.75–3.5 MB.

## Open issue
Kabupaten Bogor takes 34 MB, 18 s and ~3 GB of browser memory even on an
M4. A 4–8 GB laptop on a slow connection will likely stall or crash on the
largest kabupaten. Needs a decision (cap, per-area limit, or tiles for those
areas) before a public launch.

## Non-goals
- No buildings for a whole province, no counts or statistics per area.

## Acceptance criteria
- [x] Picking a kota with Bangunan on shows all of its buildings without zooming in.
- [x] With a desa picked, its buildings are drawn, only inside it.
- [x] Picking another area switches the buildings; clearing the search removes them.
- [x] Picking a province turns buildings off and disables the button.
- [x] With nothing picked, pressing it points to the search box.
- [x] The Microsoft credit shows while buildings are drawn.

## Redesigned by MC-087

Buildings became context rather than a layer a reader turns on: the switch
under Administrasi in Katalog data is on by default, and what decides whether
they are drawn is the zoom. Below zoom 13 nothing is fetched — a building is a
few pixels there and a city reads as a smear — and the first time the reader
zooms past it the picked area's buildings load. A province still refuses to
draw, and the Microsoft credit still goes with them.
