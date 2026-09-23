# MC-083 — Show fire hotspots on the dashboard

- **Status:** DONE
- **Board:** sprint-04
- **Type:** feature
- **Milestone:** MVP v1

## Why
Fire is what the dashboard is about — its mark is a flame — and "Titik Api"
is the first button in the dock, still inert. The data is already there:
MC-052 fetches NASA FIRMS detections for all of Indonesia and caches them,
but only the editor's data library can switch them on.

## Functionality
- Titik Api shows or hides the hotspots of the last two days across all of
  Indonesia, refreshed every 10 minutes. It does not need a picked area.
- Points are coloured by confidence: red high (MODIS ≥80% or VIIRS "h"),
  orange nominal, yellow low. **Only high confidence is shown by default.**
- What pulses: high-confidence detections from the last 6 hours, and — on a
  one-day view, today or any past day — every detection above 90% (VIIRS
  gives no percentage, so its "h" class counts). A window longer than a day
  pulses only the last 6 hours.
- High confidence is drawn on top of medium, medium on top of low.
- A button in the card turns the pulse off and on, for anyone who finds the
  movement distracting or wants a still screenshot.
- A card under the brand counts the hotspots shown, with a pulsing-dot line
  for each reason something pulses. Its three confidence chips — Tinggi ≥80%,
  Sedang 30–79%, Rendah <30% — are both the colour legend and a filter, and
  the counts follow. An ⓘ at its top right opens the product owner's
  explanation — satellites, confidence ranges, the pulse, the data — inside
  the card.
- The card lists its sources under "Sumber", each linking out with ↗: NASA
  FIRMS and SiPongi (Kementerian Kehutanan). The points themselves all come
  from NASA FIRMS, which is what each point's popup names.
- Clicking a point pins a popup to it: when it was detected (and how long
  ago), where (desa, kecamatan, kabupaten, provinsi — or outside Indonesia),
  confidence, and source — the instrument (MODIS or VIIRS) and the satellite
  carrying it (Aqua, Terra, Suomi NPP, NOAA-20/21). It closes when the day,
  window or filter changes.
- "Memuat titik api…" shows at the top on the first load, like Bangunan. If
  FIRMS cannot be reached, an Indonesian message says so, and whether older
  data is shown instead.
- NASA FIRMS is credited on the map while the points are shown.

## Implementation
- Reuses MC-052's route and cache. `MapProvider` takes a `locale`; the
  dashboard passes `"id"`, the editor keeps English and its click toast.
- The points are a `VectorImage` layer, drawn once as an image. The rings
  of recent high-confidence points are a separate small `VectorLayer` marked
  changed 15 times a second, and exist only when `MapProvider` is given
  `pulseRecentHotspots` — the dashboard does, the editor must not, because it
  exports what is on the map. A `postrender` hook on the image layer looked
  right but never animated (see 03-gotchas).
- The ring eases out as it grows and fades on a curve, redrawn 30 times a
  second. Pulse cost at the Indonesia view (10,908 points): pulsing every
  point on the old layer ran at 20 fps (M4) and 5 fps with the CPU ×4; this
  version holds 60 fps at both, with the canvas confirmed to change each frame.
- With MC-070 the card counts whichever day or window the timeline shows.
- The popup is an OpenLayers `Overlay`. Its place comes from
  `/api/admin-boundaries?lon=&lat=`, the village whose polygon contains the
  point (~80 ms, GiST).

## Decided: the pulse is not a 40 m zone
Proposed: size the pulse to the 40 m buffer from Gibbons et al. (2012),
*PLoS ONE* 7(1): e29212. The paper checks out — in the February 2009
Victoria fires, cutting remnant vegetation within 40 m of houses from 90% to
5% cover reduced the likelihood of house loss by 43% — but it is about
vegetation around houses, not an area around a fire. A 40 m ring on a
375 m–1 km satellite pixel would also claim a precision the detection does
not have, and is invisible below street zoom. The pulse stays a fixed
on-screen cue. The paper belongs to houses near a fire (MC-072).

## Non-goals
- No history, date selector or playback — that is MC-070. No real-time
  Himawari feed (MC-075), no alerts near a place (MC-072).
- No filtering to the picked area.

## Acceptance criteria
- [x] Titik Api shows Indonesia's hotspots without picking an area, and hides them again.
- [x] Only high confidence shows by default; each chip hides and shows its level, and the card counts follow.
- [x] Recent high-confidence detections pulse without slowing the map; on a one-day view, >90% ones pulse too.
- [x] The card's pulse button stops the animation and starts it again.
- [x] The card's ⓘ explains confidence, the pulse and the data.
- [x] Clicking a hotspot pins a popup with its time, place, confidence and satellite.
- [x] The card lists NASA FIRMS and SiPongi as sources, each linking out.
- [x] The NASA FIRMS credit shows only while the hotspots do.
- [x] The editor's fire hotspot toggle still works, in English.

## Redesigned by MC-087

The data path is unchanged; the screen around it is not. Hotspots are no longer
a layer a reader switches on: fire is on when the dashboard opens, drawn as a
badge whose heat breathes slowly, and crowded ones merge into a counted circle.
The card behind the 🔥 counter replaced the standalone Situasi section — the
confidence levels became switches with their own counts (SiPongi+'s colours:
red, yellow, green), and the sources moved into its ⓘ. The popup is as it was.
