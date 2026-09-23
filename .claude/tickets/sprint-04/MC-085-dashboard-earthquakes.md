# MC-085 — Show earthquakes on the dashboard

- **Status:** DONE
- **Board:** sprint-04
- **Type:** feature
- **Milestone:** MVP v1

## Why
Raised by the product owner while looking for volcano data at BMKG. BMKG has
no volcano data, but its earthquake feed is the cleanest hazard source this
dashboard has met: official, JSON, stated terms, and already written in plain
Indonesian. Indonesia is one of the most earthquake-exposed countries there
is, and "was that a quake, where, and is there a tsunami" is a question the
people this dashboard is for actually ask.

Its own ticket, not folded into MC-084: a different source and licence, a
different data shape (events with magnitude, depth and time, not a fixed
catalogue with a status) and a different map symbol. Same theme as Titik Api
and Gunung Api — one hazard, one dock button.

## Source and legality
BMKG open data, `data.bmkg.go.id/gempabumi/`. Checked against the page itself:

- **Terms**: "Wajib untuk mencantumkan BMKG (Badan Meteorologi, Klimatologi,
  dan Geofisika) sebagai sumber data." Attribution required, nothing else
  stated.
- **Rate limit**: 60 requests per minute per IP.
- **No robots.txt** on `data.bmkg.go.id` (404).
- **Feeds**, JSON and XML, updated on occurrence:
  - `DataMKG/TEWS/autogempa.json` — the latest earthquake, with felt
    intensity (MMI) and a shakemap image.
  - `DataMKG/TEWS/gempaterkini.json` — 15 latest at M5.0+.
  - `DataMKG/TEWS/gempadirasakan.json` — 15 latest felt ones.
- Each event carries `DateTime`, `Coordinates`, `Magnitude`, `Kedalaman`,
  `Wilayah` ("Pusat gempa berada di darat 14 km selatan Nabire") and
  `Potensi` ("Tidak berpotensi tsunami") — the last two are already the
  plain-language text a non-GIS reader needs, straight from BMKG.

## Functionality
- A "Gempa" row in the dock, no area needed.
- Each earthquake a circle sized by magnitude, fading with age.
- Popup leads with what matters: magnitude, how long ago, BMKG's own `Wilayah`
  and `Potensi` sentences, and felt intensity when BMKG gives one.
- A card with counts and BMKG credited as the source.
- One server-side cache shared by every viewer, as MC-052 does for FIRMS —
  well under the 60/min limit.

## Non-goals
- No tsunami modelling — only BMKG's own `Potensi` statement.
- No push alerts.

## Acceptance criteria
- [x] Gempa shows BMKG's recent earthquakes without picking an area, and hides them again.
- [x] Circle size follows magnitude; a newer event is visually distinct from an older one.
- [x] Clicking one shows magnitude, time, BMKG's location and tsunami-potential text.
- [x] BMKG is credited on screen whenever earthquakes are shown.
- [x] BMKG being unreachable fails visibly, not silently.
- [x] The card reads like Titik Api's and Gunung Api's: counts by class, a map legend, sources.
- [x] A 30-day timeline replays the earthquakes, and says which days are not collected yet.
- [x] Every earthquake names the catalogue it came from, and BMKG wins wherever both have it.

## Built and verified in a real browser

- All three feeds are read in one pass and merged by event time: each carries
  fields the others leave out — the tsunami line, the felt intensities, the
  shakemap — and the merge keeps whichever is present. 28 events on the day it
  was built, M2.2 to M6.2, spanning three weeks.
- Circles are sized by magnitude on a curve, not linearly: magnitude is a log
  scale, so a linear radius makes M6 look barely bigger than M3. They fade with
  age over 30 days, and the newest draws on top.
- Only the newest quake pulses, and only while it is less than 24 hours old,
  so the map does not blink everywhere at once. The pulse can be hidden, as on
  Titik Api and Gunung Api.
- The popup leads with magnitude and how long ago, then BMKG's own `Wilayah`
  and `Potensi` sentences. A `Potensi` line reads as a warning only when it is
  not "Tidak berpotensi tsunami". The MMI list is followed by one plain line
  on what those numbers mean.
- A fresh Prisma model needs `next dev` restarted before the route can see it
  (03-gotchas.md) — the first live call returned 500 until it was.
- Walkthrough recorded with `make verify T=MC-085`.

## Round two: the shared card pattern, and 30 days

The owner asked for the card to follow Titik Api's and Gunung Api's shape, and
for 30 days of history.

- Card: the newest quake highlighted, then counts by magnitude band (M5.0+,
  M3.0–4.9, below M3.0) the way Titik Api counts confidence and Gunung Api
  counts levels; the window total with how many were felt; the strongest one;
  a "Tanda di peta" legend; sources and the update time.
- Timeline under the map, like the other two: 1/3/7/30-day spans, play, a bar
  per WIB day, a slider. Picking a day leaves only that day's quakes on the
  map and in the card's counts. Default is the whole 30-day window.
- **BMKG's feeds only carry about 30 events**, roughly three weeks, so 30 days
  cannot be fetched — it accumulates. Every quake seen is stored in
  `EarthquakeEvent` (keyed by its UTC time, so re-reading never duplicates) and
  pruned past 30 days. Days older than the first quake we ever saw draw as
  dashed, not as "no earthquakes".
- A feed can add the tsunami line or the felt list to an event we already
  stored, so a stored row is updated with whichever fields arrive later.
- The cache row is now only a fetch marker; the earthquakes themselves are
  rows, so the same data is not held twice.

## Round three: BMKG and USGS together

The owner asked why MAGMA shows so many earthquakes while this layer shows few,
and whether 30 days is really impossible.

- **Different phenomena.** MAGMA counts volcanic seismicity per volcano —
  "14 kali gempa Guguran" at Merapi — recorded by that volcano's own
  seismometer. BMKG's open feeds publish tectonic earthquakes: 15 at M5.0+, 15
  felt, and the latest. Neither is a subset of the other.
- **BMKG has no dated archive**: only the three "latest" feeds. Its RepoGempa
  catalogue site stopped being updated after a 2023 redesign. MAGMA, by
  contrast, does serve `laporan-harian/<date>` — useful for volcanic
  seismicity later, and its own ticket.
- **USGS does have a 30-day catalogue**, so the two are now merged. Result on
  the day it was built: 301 earthquakes over the full 30 days, 28 from BMKG and
  273 from USGS, with no duplicate pair left.
- Where both hold the same event (90 s, 200 km) BMKG's row wins and the USGS
  row is deleted — BMKG is the authority, and only it carries the location
  sentence and the tsunami line. The popup names the catalogue for every quake,
  and a USGS quake says plainly that BMKG's tsunami line is not available.
- USGS reaches only to about M4.0 here, so BMKG's small local quakes (down to
  M2.2) are never replaced by it.

## Round four: constants grouped per source

- `QUAKE_BMKG` and `QUAKE_USGS` in `quake-constants.ts` each hold that
  catalogue's url, feed, attribution, cache id and read interval, instead of
  eight loose names sharing prefixes.
- Grouping them surfaced a real gap: the map credited BMKG even where USGS
  quakes were drawn. The layer now credits both, and only while USGS quakes
  are on screen — checked live: "BMKG USGS" with the layer on, gone with it off.

## Redesigned by MC-087

BMKG and USGS are read exactly as before. On screen: a quake is an earth-yellow
badge sized by magnitude, every one of them ringed by a shockwave that expands
to an *estimated* felt radius in kilometres — stated as an estimate in the card
and the help, since BMKG publishes intensity per place, never a radius. The
magnitude bands became switches with their own counts, and the standalone card
and per-layer timeline are gone.
