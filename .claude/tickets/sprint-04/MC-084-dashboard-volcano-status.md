# MC-084 — Show volcano status on the dashboard

- **Status:** DONE
- **Board:** sprint-04
- **Type:** feature
- **Milestone:** MVP v1

## Why
Raised directly by the product owner: not just *sebaran gunung api* (where the
volcanoes are) but *current level* — is one erupting right now, what is its
alert status — so someone looking at the dashboard is actually warned, not
just shown a marker. This is disaster information; stale or wrong data is
worse than none, so the source and its trust need settling before anything
is built, same standard MC-052 held fire data to.

## What it is now (round fourteen)

The design changed fourteen times; this section is the current state, and the
rounds below are how it got here.

**Sources**
- **MAGMA Indonesia (PVMBG)** — every monitored volcano (69) with its level,
  coordinates and eruption flag, from the homepage's embedded list; each
  erupting volcano's latest eruption notice; and PVMBG's recommendation for
  every Siaga/Awas volcano, from `laporan-harian`; and the last 30 days of
  eruption notices from the paginated `informasi-letusan` list, 30 s apart. Read politely despite
  `robots.txt` disallowing crawlers, by the owner's decision — see
  `THIRD_PARTY_NOTICES.md` for the terms of that decision and MC-058 for the
  launch review it needs.
- **GDACS** — only the VAAC ash-cloud extents and ash advisory text, when an
  Indonesian volcano has an event. Matched to MAGMA volcanoes by position.
- **Badan Geologi's list of 127 active volcanoes** (from MAGMA's "Tipe Gunung
  Api" page, copied into the repo once) — the 58 PVMBG does not monitor, with
  their type A/B/C.
- **Badan Geologi KRB maps** — hand-curated per volcano (Anak Krakatau only).

**Behaviour**
- Every monitored volcano is a triangle coloured by its PVMBG level; the rest
  are small grey triangles with no status.
- Drawn on top, in order: erupted in the last 24 hours, Awas, Siaga, Waspada,
  Normal, unmonitored.
- A volcano whose last eruption was within 24 hours ripples with a red
  triangle, at Titik Api's pace; the card's pulse button hides it.
- Popup: eruptions in the last 30 days — the count, a bar per day, and the
  last three with time, ash height and direction. Card: the volcano that
  erupted most in those 30 days.
- An eruption timeline under the map, built like Titik Api's: 1/3/7/30-day
  spans, play, a bar per day and a slider. Picking a day makes the volcanoes
  that erupted that day pulse and the card's eruption row name that day. By
  default it stays on the last 24 hours, not the calendar day.
- ⓘ explains each level in plain words and what to do at it.
- Card: how many erupted in the last 24 hours, the count at each of the four
  levels (zeros included), "127 gunung api aktif · 69 dipantau PVMBG · 58 tidak
  dipantau", a map legend, and sources.
  If MAGMA can't be refreshed, it says so and how old the data is.
- Popup: level and eruption badges; "Bahaya bisa mencapai N km dari puncak",
  where N is the furthest distance PVMBG's recommendation names; the last
  eruption in plain Indonesian; PVMBG's recommendation verbatim, folded to
  four lines; ash in plain Indonesian; KRB zones; links to MAGMA, Badan
  Geologi and GDACS.
- MAGMA is read at most every 30 minutes, one request at a time, in the
  background; the first ever load waits (~12 s), later loads never do.

## Acceptance criteria
- [x] Gunung Api shows every volcano PVMBG monitors, coloured by its current level.
- [x] The card counts each level and matches MAGMA's own board.
- [x] A volcano that erupted in the last 24 hours pulses; the others don't.
- [x] Clicking a Siaga/Awas volcano shows the furthest danger distance and PVMBG's recommendation.
- [x] Ash extents from GDACS draw when they exist, credited to GDACS.
- [x] A MAGMA failure is shown on the card with the data's age, never silently.
- [x] No generic, unsourced radius is drawn anywhere.
- [x] Volcanoes PVMBG doesn't monitor show in grey, never as "safe", and never duplicate a monitored one.
- [x] The total matches Badan Geologi's published 127 active volcanoes.
- [x] The pulse can be hidden from the card.
- [x] ⓘ explains what each of the four levels means.
- [x] A recently erupted volcano is never drawn under a quieter neighbour.
- [x] The popup shows each monitored volcano's eruptions over the last 30 days, and says so while that history is still being collected.
- [x] A timeline like Titik Api's replays the last 30 days of eruptions on the map.

## Built and verified in a real browser

Two things broke on first real run that the design work didn't catch, both
fixed and now confirmed live against real data:

- **Wikidata blocked the very first server-side calls with 403.** Its own
  User-Agent policy rejects Node's default fetch UA the same way it rejects
  an unidentified curl — I'd tested the query with `curl -A "..."` during
  design but the actual server code sent no UA at all. Fixed in
  `volcano-wikidata.ts` with a descriptive `User-Agent` header; confirmed
  with an isolated call (139 volcanoes back) before touching the UI again.
- **The name-matching problem flagged as an open question was real on the
  first live event.** GDACS's `Krakatau` didn't match Wikidata's `Pulau
  Krakatau` — normalising only stripped `mount`/`gunung` prefixes, not
  `pulau` ("island"). Added it to the strip list in `volcano-match.ts`
  (`OVERRIDES` table still there for anything that still won't match).

Verified end-to-end with Playwright against the real dev DB and live sources
(no mocks): 139 volcanoes load from Wikidata, GDACS returns Krakatau at
Oranye (confirmed by direct DB inspection of the cached event), the card
correctly counts 1 active/0 red/1 orange/0 green and 9 FIRMS thermal
cross-check hits, clicking the Krakatau point pins a popup reading "Pulau
Krakatau · Status GDACS: Oranye · 7 hari lalu" with working links to the
GDACS report and to MAGMA Indonesia, and the browser console showed no
errors throughout. Screenshots taken during this pass, not attached to the
repo.

Not yet exercised: a real stale/unreachable-source path (both sources were
reachable throughout testing) — the code mirrors MC-052's `stale` handling
exactly, but that specific failure mode wasn't forced and watched.

## Round two: triangle icon, buffer zone, pulse

The product owner asked for a mountain-shaped (triangle) marker instead of a
circle, and a buffer zone per alert level with a pulse — but pushed back
correctly when I raised that GDACS's 3 tiers don't map cleanly onto PVMBG's
4-level siaga scale (Normal/Waspada/Siaga/Awas has no GDACS equivalent for
Waspada, and forcing a 3-to-4 mapping either invents an equivalence GDACS
never made or drops Awas — the worst case — entirely). **Decision: keep
labelling this as GDACS's own status, not PVMBG's siaga terms** — the
Merah/Oranye/Hijau labels already in the UI are a direct translation of
GDACS's own `alertlevel` field, not appropriated PVMBG vocabulary, so no
label change was needed there, only the icon and the buffer.

For the buffer radius, asked to find a real source rather than invent
numbers. Found one: GDACS's own `getgeometry` endpoint for an event
(`gdacsapi/api/polygons/getgeometry?eventtype=VO&eventid=&episodeid=`)
returns several polygons — a `Poly_Circle` (confirmed by measuring three
different Indonesian events: Krakatau/Orange, Semeru/Red and Ibu/Orange all
came back at ~30km, so **the radius does not scale with alert level** — it's
GDACS's own fixed population-exposure estimate, not a level-scaled hazard
zone) — plus VAAC ash-cloud forecast cones, which are out of scope (this
ticket already excludes an aviation-ash layer). Used the circle only, and
because it doesn't vary by level, the UI says so explicitly rather than
implying a scaled zone that doesn't exist: "~30 km — perkiraan populasi
terdampak GDACS, bukan zona bahaya resmi PVMBG" in both the popup and the
card's info panel.

- **Icon**: `RegularShape({ points: 3 })` instead of `Circle`, coloured the
  same as before (`map-utils.ts: volcanoStyle`).
- **Buffer**: a second `VectorLayer` (zIndex 18, under the point layer at 19),
  built from the same `/api/volcanoes` response — `VolcanoEvent` now carries
  `bufferRingLonLat` (fetched alongside the event, one extra GDACS call per
  active event, cheap since there are usually 0–2), passed through
  `volcanoFeatures()` onto the matched volcano's properties.
- **Pulse**: only when a Red-level buffer exists, mirroring the fire layer's
  "only the urgent case animates" precedent — a breathing fill/stroke
  opacity via `performance.now()`-driven phase in `volcanoBufferStyle`,
  redrawn 15×/second by `layer.changed()` on an interval that starts/stops
  based on whether any Red buffer is present. Verified live: Krakatau
  (Orange) renders a static dashed ~30km circle; no Red event was live during
  testing, so the pulse path is covered by code review and the same pattern
  already proven in `FireHotspotCard`'s pulse, not a live screenshot of it
  animating.
- Added two footguns to `03-gotchas.md`: Wikidata's SPARQL endpoint 403s a
  request with no identifying User-Agent (my earlier `curl` test used one,
  the real server code didn't — first found this at runtime after building),
  and GDACS's `SEARCH` endpoint silently ignores an unrecognised `eventtypes`
  param instead of erroring (`eventlist` is correct).

Verified live again with Playwright: the API response carries a real 182-point
`bufferRingLonLat` ring for Krakatau, and a zoomed screenshot shows the actual
dashed orange circle rendering around it with the triangle marker inside.

## Round three: real KRB zones, and a more informative card

The product owner found and shared Badan Geologi's own KRB (Kawasan Rawan
Bencana) map for Anak Krakatau — a real, volcano-specific, geology-based
hazard classification (KRB III/II/I, radii 2/5/8km, each with its own hazard
description), asking to use it instead of an abstract colour legend, and to
make the card more informative generally.

- **`src/lib/volcano-krb.ts`**: a hand-curated table, keyed by Wikidata QID,
  holding each verified volcano's KRB zones (level, radius, colour,
  description) plus the source report it came from. No API for this exists —
  each volcano's KRB map is its own document. Seeded with Pulau Krakatau from
  the report the product owner linked. **Scaling this to more volcanoes is
  its own piece of work** (source-and-verify one report at a time) — worth a
  follow-up ticket once this one is confirmed, prioritising whichever
  volcanoes actually show a live GDACS event.
- When a volcano has curated KRB data, it draws all three real zones
  (concentric, largest-first so the smaller/more severe ones paint on top)
  instead of GDACS's generic ~30km circle — verified live, screenshot shows
  three correctly-coloured concentric rings around Anak Krakatau. Only the
  level-III (innermost, most severe) ring pulses, and only when that
  volcano's GDACS status is Red.
- Volcanoes without curated KRB data keep the GDACS fallback circle from
  round two, honestly labelled as GDACS's own estimate.
- **Card redesign**: removed the Merah/Oranye/Hijau count-grid entirely.
  Since there are rarely more than 1–2 active events, naming them directly is
  more informative than a bucketed count — the card now lists each active
  volcano by name, GDACS status and how long ago, and whether it has a real
  KRB zone.
- **Answered directly in the product now, not just in chat**: the product
  owner asked what "15 terdeteksi panas oleh satelit" meant. It's raw FIRMS
  hot-pixel detections within 5km of *any* volcano in the last 24 hours —
  during dry season, most are ordinary land fires, not volcanic activity.
  The card and popup now say this explicitly ("sebagian besar biasanya
  kebakaran lahan biasa, bukan tanda letusan") instead of leaving a bare,
  alarming-looking number.
- Popup now shows the full KRB breakdown (each zone, radius, hazard
  description) with a link to the source report, when a volcano has one.

Verified live end-to-end with Playwright: `/api/volcanoes` returns Krakatau's
three real KRB zones; a zoomed screenshot shows the three concentric rings
correctly coloured and ordered; clicking the point shows a popup with the
full KRB III/II/I breakdown, radii, descriptions and the Badan Geologi source
link; the card shows "Pulau Krakatau — Oranye (GDACS) · 7 hari lalu · zona
resmi KRB tersedia" instead of a bare count.

## Round four: drop FIRMS, use real VAA ash data, show PVMBG's own level

The product owner made three corrections: FIRMS's thermal cross-check is a
weak signal for a feature about eruptions specifically (a satellite heat
pixel near a crater is usually an unrelated land fire, not proof of
volcanism) and should go; GDACS's own volcano data traces back to VAAC
Volcanic Ash Advisories, so the real ash extent should be shown instead of
FIRMS; and the card should show PVMBG's own familiar level wording, falling
back to GDACS's only if that's not achievable.

**Investigated `geteventdata` (an endpoint not used in earlier rounds) and
found more than expected.** `additionalinfos.weeklydescription` carries
Smithsonian GVP's Weekly Volcanic Activity Report text verbatim — and that
report quotes PVMBG directly, level and stay-away distance included: *"The
Alert Level remained at 3 (on a scale of 1-4) and the public was advised to
stay 3 km away from summit."* Checked across five different events
(Krakatau, Semeru, Ibu, Dukono, Lewotobi) and the phrasing is consistent
enough to regex, though it does vary ("remained at 3" vs "remained at Level
2") — `parsePvmbgLevel`/`parsePvmbgRadiusKm` in `volcano-gdacs.ts` match
loosely for exactly this reason. This is a real, sourced path to PVMBG's own
scale — not the "invent an equivalence between GDACS's 3 tiers and PVMBG's 4"
problem flagged in round one, since we're reading PVMBG's own stated number,
not deriving one.

The same endpoint's `additionalinfos.eruptiondetails` and the geometry
endpoint's `Poly_Cones_*` features are the real VAA: ash-cloud flight-level
text and the actual observed-plus-forecast (6/12/18h) extent polygons from
Darwin VAAC. Used both, dropped `Poly_Circle` (GDACS's own non-official
~30km estimate) entirely per the product owner's "remove the buffer unless
it's from an official government source or paper" — the ash cones qualify
(a real national aviation-meteorological authority), the generic circle
never did.

- **Removed**: all FIRMS thermal-cross-check code (`volcano-queries.ts`'s
  haversine/prisma.fireHotspot query, `thermalDetectedAt` everywhere,
  `VOLCANO_THERMAL_RADIUS_KM`, the card's thermal count line, NASA FIRMS from
  the source list). The fire-hotspot feature itself (MC-052/070/083) is
  untouched — this only removed the cross-reference from the volcano side.
- **Buffer priority is now**: curated KRB zone (official, per-volcano) → real
  VAA ash-cloud extent (official, via VAAC) → PVMBG's own stated radius
  (official, parsed from GVP text) → nothing. No more generic non-official
  fallback circle.
- **Marker colour priority**: PVMBG's own level (`PVMBG_LEVEL_COLOR`,
  matching magma.esdm.go.id's own scheme) when GVP's text stated one, else
  GDACS's Green/Orange/Red as before.
- **Card and popup redesigned again**: PVMBG's level (e.g. "Level III ·
  Siaga") shown first and labelled as sourced from GVP's weekly report; GDACS
  status kept as a secondary citation; the raw ash-cloud advisory text shown
  verbatim; KRB zones unchanged; a note for whichever buffer tier is actually
  showing (KRB / ash-cloud count / PVMBG radius) instead of a generic line.
- **Popup grew enough to clip off-screen** near a viewport edge with all this
  content — fixed with a capped, internally-scrollable content area plus a
  `ResizeObserver` that re-triggers OL's `autoPan` once the real (post-render)
  height is known, since `autoPan` otherwise fires against the container's
  stale size from before React painted the new content into it.
- Added a gotcha: `weeklydescription` is freeform prose, not structured data
  — a future wording change in GVP's bulletins could silently stop matching
  rather than erroring.

Verified live end-to-end again: Krakatau now returns `pvmbgLevel: 3`,
`pvmbgRadiusKm: 3`, a real `ashSummary` string, and four real `ashClouds`
polygons (OBS + 6/12/18h forecasts) alongside its existing KRB zones. Card
shows "Pulau Krakatau — Level III · Siaga · 7 hari lalu · zona KRB resmi".
Popup shows Status PVMBG, the GDACS report link, the ash advisory text, and
the full KRB breakdown, all in one place, no longer clipped. Zero console
errors throughout. `make typecheck` and `make lint` clean.

**Ash-cloud buffer tier, now confirmed live too.** Krakatau's KRB data wins
the priority order, so it never exercises the ash-cloud branch — needed a
volcano with ash data and no KRB entry. Temporarily widened
`VOLCANO_EVENT_RECENT_DAYS` to pull in older events (Semeru, Lewotobi,
Dukono all still had live GDACS events, just outside the normal 30-day
window), cleared the event cache, and verified live: Semeru (Level II ·
Waspada, no KRB) renders the real fading ash-cloud polygons as its buffer —
screenshot shows the grey wedge shape extending from the marker — and its
popup reads "Sebaran abu di peta — 4 area — teramati dan perkiraan, dari
VAAC (via GDACS)". Reverted the window back to 30 and cleared the cache
again afterward; nothing about this test is left in the committed code.

## Round five: a recorded walkthrough, and counts by level on the card

The product owner couldn't see the buffer/ash rings on their own machine —
at the whole-Indonesia zoom level they're only a few pixels wide, easy to
miss without knowing to zoom in — and asked for a recorded walkthrough to
confirm the feature is real, not just my own screenshots. Recorded one with
Playwright (`recordVideo`), same sign-in-and-click path a real user would
take: sign in, enable Gunung Api, zoom to Krakatau (KRB zones + popup), zoom
out, zoom to Semeru (ash-cloud extent + popup). Used the same temporarily
widened window as the ash-cloud check above so both real volcanoes with
different buffer types show up in one recording; reverted immediately after
and confirmed back to normal (`VOLCANO_EVENT_RECENT_DAYS = 30`,
`make typecheck`/`make lint` clean) before handing it over.

Also asked to replace the flat per-volcano list on the card with a count per
level. Implemented as grouped-by-level rows — "Level III · Siaga — 2" with a
count badge, the actual volcano names still listed underneath each group
(dropping names entirely seemed like a regression given the whole point is
knowing *which* volcano, so kept both: a count to scan quickly, names for
the detail). Screenshot with real data shows "Level III · Siaga — 1 / Pulau
Krakatau · 7 hari lalu · zona KRB resmi"; the recorded video's widened
window shows it with two groups (Siaga ×2, Waspada ×2) to demonstrate the
grouping actually groups.

## Round six: the video didn't show the polygon, and the card still named names

Feedback on round five's own video, three things:

1. **The video only showed text — no visible polygon.** The e2e spec never
   zoomed in on the marker before clicking; at the whole-Indonesia zoom it
   opens at, a KRB/ash zone is a few pixels wide and effectively invisible on
   screen and in the recording, even though it renders correctly (round
   three/four already confirmed that with manual zoomed screenshots — the
   *spec* just never did the same zoom).
2. **The card still listed "Pulau Krakatau" under its level group.** Round
   five's "keep both a count and the names" compromise wasn't what was
   asked — the instruction was counts only.
3. **"Where are the 4 mountains you mentioned?"** — real production data
   (the shipped 30-day window) only has one active volcano right now; the
   four-volcano scenario was round five's temporarily-widened test window,
   reverted before the recording reached the user. Fair confusion — a demo
   built on a setting that gets undone before anyone sees it doesn't prove
   anything.

Fixes:

- **Card**: dropped the nested per-volcano list entirely — each level group
  is now just a colour dot, the label, and a count. Nothing else.
- **Spec**: added an actual zoom-in step (mouse move + wheel) before the
  click, with a caption pause long enough to see the polygon on the
  recording.
- **A real bug surfaced by adding that zoom step**: the pixel-scanner
  (`findActiveVolcano`) picked the *first* pixel matching one of the four
  status colours — fine at the start, since a KRB/ash zone is invisible at
  that zoom, but once zoomed in the zone's boundary (a thin stroke, same
  opaque colour palette as the marker's fill) can out-number the marker's
  own pixels, and the scan started landing on the zone's outline instead —
  clicking there hits nothing (the click-handler only hit-tests the point
  layer), so the popup never opened and the "official" 30-day recording
  outright failed on first attempt. Tried constraining the post-zoom search
  to near the marker's pre-zoom screen position, assuming OL's
  zoom-to-cursor keeps it fixed — measured that it doesn't, drifting ~150px
  over six wheel steps in testing. Fixed properly: pick whichever matching
  pixel has the most *other* matching pixels within a 12px radius — the
  marker is always a dense filled blob (dozens of neighbours), a stroke
  never is (a handful at most, spread along a curve). Verified against the
  dev server before spending another full `make verify` build-and-record
  cycle on it.

Re-recorded both: the real 30-day video now shows the zoom-in and the KRB
polygon on screen, one level group with count 1, and passed cleanly first
try after the fix. Also re-ran the widened-window demo with the same fixed
spec so the user could actually see the 4-volcano/2-group scenario this
time, rather than have it described after the fact.

## Round seven: readable for a non-GIS person

The product owner's verdict on the popup: "too hard to read or warn people
that are non GIS person", quoting back the exact offenders — `Volcanic ash to
flight level 500 (15000m) move w`, "via laporan mingguan Smithsonian GVP",
and PVMBG's full official hazard sentence. Plus: ash still wasn't visible
even in the video, and the card should count *all* levels.

- **Ash and hazard rings now both draw.** They were priority-chained (KRB
  won, so ash never rendered for Krakatau — which is why no video ever showed
  it). They answer different questions — where lava and pyroclastic flows
  reach (static, geological) versus where ash is drifting right now (current,
  meteorological) — so both belong on screen. Only the *ring* still falls
  back: KRB, else PVMBG's stated distance, else nothing.
- **Ash opacity cut** from 12–30% to 4–10% per polygon: the observed extent
  plus three forecast horizons overlap heavily, so alpha compounded into a
  slab dark enough to hide the coastline. Outlines carry the extent instead.
- **Card counts every level, always** — Awas / Siaga / Waspada / Normal, with
  zeros shown greyed rather than omitted, because "nothing at Awas" is itself
  the answer someone opened this to get. GDACS-only rows (PVMBG level didn't
  parse) append below, non-zero only. A muted line accounts for the rest:
  "138 gunung lain: tidak ada laporan aktif".
- **Popup rewritten to lead with the action.** Name + a coloured status badge
  ("SIAGA"), then the one thing to do — "Jangan berada dalam radius 3 km dari
  puncak" — then ash, then the zones, then provenance small and last.
- **`ashSummaryToPlainId`** (`map-utils.ts`) parses the VAA for the two facts
  a non-pilot can act on and says them in Indonesian: "Abu sampai ketinggian
  sekitar 15 km, terbawa angin ke arah barat, selatan dan timur-tenggara."
  Returns null if neither altitude nor drift parses, so the caller falls back
  rather than inventing a summary. Checked against all five real VAA strings
  seen across Krakatau, Semeru, Ibu, Dukono and Lewotobi.
- **KRB zones get a `plain` field** alongside Badan Geologi's `description` —
  short plain wording leads, the official sentence stays as the `title`
  tooltip, so nothing sourced is lost.
- Dropped `hasKrb`/`hasAsh`/`eventDate`/`id`/`name` from `VolcanoActiveEntry`:
  once the card stopped listing volcanoes individually they were set and never
  read.
- Spec assertions updated to match (the old ones checked for "Status PVMBG"
  and "Cek di MAGMA Indonesia (PVMBG)", both gone), and now also assert the
  popup does **not** contain "flight level" — the regression that matters.

## Round eight: the count was wrong, and MAGMA has the real board

The product owner asked whether I was really sure only one volcano is active
in Indonesia right now. Checked MAGMA's own `tingkat-aktivitas` page: **0 at
Awas, 5 at Siaga, 22 at Waspada, 42 at Normal** — the five at Siaga being
Anak Krakatau, Lewotobi Laki-laki, Merapi, Semeru and Sinabung. The dashboard
was showing **1**.

That is not a display bug, it's the data source's shape: GDACS only carries a
volcano once it has a VAAC ash advisory or a GVP "new activity" bulletin, so
every volcano that is merely *sitting* at Siaga or Waspada without fresh
ash/news is absent entirely. Worse, the card rendered those as `0`, which
reads as "no volcano is at this level" — false reassurance, in a feature
whose entire justification is warning people. Fixed immediately:

- Unknown levels now render `–`, never `0`.
- An amber caveat states plainly that only N of 139 volcanoes have a report in
  our sources and that the numbers are **not** the real per-level totals,
  with a link to PVMBG's complete list.
- Added the on-map legend the owner asked for ("Tanda di peta"): coloured
  rings = hazard zones, grey area = ash spread, each shown only when that
  symbol is actually on screen (`VolcanoCounts.withZones` / `.withAsh`).

**MAGMA turns out to publish everything this feature actually needs**, across
three pages the owner pointed at:

- `/v1/gunung-api/tingkat-aktivitas` — every monitored volcano grouped by
  level. This is the fix for the undercount.
- `/v1/gunung-api/laporan-harian` — daily detail for Level III+: visual
  observation, seismicity, and PVMBG's **own recommendations in Indonesian**,
  which would replace both the regex-parsed GVP text and my own translated
  warning line with the authority's actual words.
- `/v1/gunung-api/laporan` — per-observation VAR reports, paginated.

All three are HTML, no API, no export, "Copyright © MAGMA Indonesia" with no
stated terms — the same blocker that demoted MAGMA in round one. Using them
means scraping, which is a decision for the owner (see `00-workflow.md` on
licensing), so it is **parked pending that call**, not built. GDACS would stay
on for the ash-cloud geometry, which MAGMA does not publish as polygons.

**Correction, round nine: MAGMA does state terms — in `robots.txt`.**
`magma.esdm.go.id/robots.txt` is `User-agent: *` / `Disallow: /`: every
automated client is asked to stay off every page, the level board and the
report tables included. Eight rounds described MAGMA as "no stated terms, a
grey area" without ever checking it — the owner's own call that scraping is
unethical was right, and this is the site saying so explicitly. The owner
then proposed scraping MAGMA's tables and dropping GDACS; both are on hold
pending the discussion this raises:

- A MAGMA scraper would run against an explicit refusal.
- Dropping GDACS removes the only licensed source of the ash-cloud polygons
  asked for in round four (CC BY 4.0).
- BMKG, checked as an alternative, has **no volcano data** — earthquakes,
  weather forecasts and weather warnings only. Its earthquake feed became
  MC-085.

**Decided:** GDACS stays, at least for the ash-cloud polygons. Whether to
scrape MAGMA despite `robots.txt` is still open.

The level board, table structure and province-per-volcano were read once
from two manually downloaded pages for this assessment; no further requests
were sent to MAGMA after `robots.txt` was read. The level board has name,
province and PVMBG's own Indonesian level definitions, but no coordinates.

Hit `03-gotchas.md`'s own "nor a second `next dev`" entry while verifying:
started a dev server without checking the port, it landed on :3001, shared
`.next`, and left :3000 serving stale chunks whose sign-in form silently did
nothing. The gotcha file already warned about exactly this; I just didn't run
`lsof` first. Fixed with kill both → `rm -rf .next` → one clean dev server.

## Round ten: MAGMA as the source, a pulse for eruptions

The owner decided to read MAGMA politely despite its `robots.txt`, keep GDACS
for ash only, pulse on eruptions, and park gerakan tanah (MC-086).

- MAGMA's homepage turned out to embed `markersGunungApi` — JSON for all 69
  volcanoes with code, coordinates, level and eruption flag — so no HTML table
  had to be parsed for status, and Wikidata and name matching went away.
- Eruption notices carry time with WIB, WITA or WIT (Ibu reports in WIT);
  converted per zone and checked against WIT and WITA fixtures.
- **A single radius would have under-warned.** Only Anak Krakatau and
  Lewotobi state one; Semeru names 13 km south-east and lahar to 17 km while
  its "radius 5 km" covers only flying rock. The popup shows the furthest
  distance named plus PVMBG's own text, and the single-radius circle was
  removed from the map for the same reason.
- "Erupting" means an eruption notice within 24 hours. MAGMA's own eruption
  flag stayed on Anak Krakatau three days after its last notice.
- The first live load took 12 s (six spaced requests), so a due refresh now
  runs in the background against the snapshot already held; tested by
  back-dating the cache — served in ~0.5 s, refreshed 15 s later, no second
  pass started.
- New cache ids (`IDN-magma-v1`, `IDN-ash-v1`): the old rows held the previous
  shape and would have looked fresh to the TTL check on the Railway database.
- Removed: `volcano-wikidata.ts`, `volcano-match.ts`, the GVP text parsing,
  GDACS alert levels, the PVMBG-radius circle, and a Wikidata User-Agent that
  pointed at an invented GitHub URL.
- Walkthrough re-recorded with `make verify T=MC-084` and passing. The first
  attempt hung clicking "Selengkapnya": the spec zoomed into Sinabung at the
  top-left, where the popup opened under the floating card. The spec now
  drags the volcano to open map first. The same overlap can happen to a real
  user with a volcano near the left edge — not fixed here, and it affects
  the fire popup the same way.

## Round eleven: unmonitored volcanoes, a pulse switch, level meanings

The owner asked for the volcanoes MAGMA doesn't list, a button to hide the
pulse like Titik Api's, an explanation of each level, and eruptions drawn on
top.

- Wikidata came back, for the unmonitored ones only. Its 139 Indonesian
  volcanoes against MAGMA's 69: a plain 3 km match missed spelling variants
  further apart, and a 10 km match swallowed Merbabu into Merapi (9.7 km).
  Final rule: same volcano within 3 km, or within 10 km with overlapping
  names. Checked by hand: Merapi, Ceremai, Sindara and Krakatau hidden as
  monitored; Merbabu and Geureudong shown; Kawi, Butak and Kawi-Butak
  collapsed to one. Unlabelled items (`Q12345`) are skipped. 69 unmonitored
  remain.
- If MAGMA's list is missing, no grey volcano is shown — otherwise every
  monitored volcano would be drawn as "not monitored".
- Grey popups say PVMBG publishes no status and that this does not mean safe,
  and link to Wikidata instead of MAGMA.
- Pulse switch on the card; with it off the map renders one frame (checked by
  hashing the canvas), and the card's red dot stops pinging too.
- Draw order via style `zIndex`: erupted 10, then level 4→1, unmonitored 0.
- Walkthrough extended with the pulse switch, ⓘ level meanings and a grey
  volcano's popup. Getting it to record took several fixes to the spec: the
  pixel finder compared every match with every other and froze the page, a
  fast scripted drag let OpenLayers' kinetic pan fling the map out to sea, and
  the grey volcano is now found from the overview before zooming anywhere.
- **Real bug found along the way:** MAGMA, GDACS and Wikidata calls had no
  timeout, so one stalled connection held `/api/volcanoes` open for minutes.
  Every upstream call now aborts after 20 s.

## Round twelve: the official 127, not Wikidata's 138

The owner noticed the card said 69 + 69 = 138 volcanoes, while Indonesia is
known to have around 129. Badan Geologi's published figure is 127 active
volcanoes (A 76, B 30, C 21), 69 of them monitored — so 58 unmonitored.

- Wikidata was the wrong catalog, not a dedupe problem: 34 of its grey entries
  are not on the official list (Bledug Kuwu is a mud volcano; Barujari and
  Samalas are part of Rinjani; Toba, Muria, Penanggungan and more are not
  counted as active), and it missed Lawu, Jaboi, Lahendong, Banua Wuhu and
  others.
- MAGMA publishes the full official table with coordinates on its "Tipe Gunung
  Api di Indonesia" page. Copied once into `volcano-official-list.ts`, so no
  extra runtime requests; Wikidata's fetch, cache row and matching removed.
- Matching MAGMA's 69 to the list needs names: position alone would subtract
  Burni Geureudong (2.7 km from Bur Ni Telong). Two exceptions found — the
  list has two Sumbing (Central Java and Jambi), resolved by also requiring
  10 km; and MAGMA's "Ile Werung" is the list's "Ili Werung", covered by a 1 km
  position fallback. Result: 69 matched, 58 grey.
- Grey popups show the volcano's type in plain words (Tipe B — letusan
  terakhirnya tercatat sebelum tahun 1600) and link to the official list.
  Undersea entries read "(bawah laut)" instead of "(BL)".

## Round thirteen: a triangle pulse, and 30 days of eruptions

The owner asked for the pulse to be a triangle like the marker and paced like
Titik Api's, and for 30 days of eruption history — kept in this ticket, with 30
seconds between MAGMA history pages.

- Pulse: one expanding red triangle every 2 s (Titik Api's timing and fade),
  replacing the two circular rings. The card legend shows a triangle too.
- History source: MAGMA's all-volcano `informasi-letusan` list — 15 notices a
  page, newest first, each with its own UUID. One sequence covers every
  volcano, so 30 days is ~50 pages rather than dozens per volcano.
- Stored in a new `VolcanoEruptionNotice` table keyed by MAGMA's UUID, so
  re-reading a page never duplicates. The backfill saves its page after every
  read and resumes after a restart; once complete, each 30-minute run reads
  only until it meets a stored notice. It runs in the background and never
  holds up `/api/volcanoes`.
- The notice parser is the one the status pass already used (WIB/WITA/WIT,
  "1.500 m"), now shared; checked against a saved page: 06:20 WIB → 23:20
  UTC, Ibu's 05:27 WIT → 20:27 UTC. Notice names match MAGMA's volcano names
  (Semeru, Ibu, Ili Lewotolok).
- Popup: "N kali erupsi", a 30-bar daily chart (hover a day for its count),
  the last three eruptions. While the backfill is running it says "Riwayat
  masih dikumpulkan — baru tercatat sejak …" and leaves uncollected days
  blank rather than showing them as zero.

**Incident during this round.** Checking the new migration with `prisma migrate
diff`, the real `DATABASE_URL` was passed as the shadow database, and Prisma
emptied the local database — every table. Nothing was deployed, and MinIO
still held both import archives. Recovery: the migrations were marked applied
(the tables had been recreated by the same command), the seed re-run, admin
boundaries and building footprints re-imported from MinIO with the pipeline's
own import functions, buildings re-tagged by village, and 30 days of FIRMS
fire history backfilled. The re-import exposed a latent bug: `copyRows` did
not quote column names, so `parentPcode` became `parentpcode` and the admin
boundary import failed on any fresh database — fixed in `pg-copy.ts`. Saved
projects and uploaded layers in the local database were lost.

## Round fourteen: an eruption timeline like Titik Api's

The owner asked for the eruption history to have a card like Titik Api's
timeline, not only the per-volcano chart in the popup.

- `VolcanoTimeline` mirrors `FireTimeline`: span menu (1/3/7/30 days), play,
  one bar per WIB day across all volcanoes, a slider, and the eruption count
  for the chosen window. Days the backfill has not reached draw as dashed.
- The chosen window drives the map: a volcano pulses, and draws on top, when
  it erupted inside the window. Both the stored history and MAGMA's latest
  eruption count, so an eruption newer than the last 30-minute history
  refresh still pulses.
- Default is the last 24 hours rather than today's calendar day, so an
  eruption at 23:00 does not stop pulsing at midnight. Play steps one day
  every 0.9 s — slower than Titik Api's 0.45 s so each day shows a pulse — and
  returns to the live view at the end.
- Checked in the browser: live 17 eruptions / 3 volcanoes; Fri 4 Sep 39 / 4;
  7 days 145; play advances by day; no console errors.

## Redesigned by MC-087

MAGMA and the status logic are unchanged. On screen: a volcano is a mountain
badge in its PVMBG colour, an erupting one is a red badge with heat and rising
ash, and the levels became switches in the card behind the 🌋 counter — with
eruptions, Awas and Siaga on by default and the quieter levels a choice. The
KRB rings stayed; the ash-cloud polygons were removed by MC-092. Nothing on
this layer pulses any more.
