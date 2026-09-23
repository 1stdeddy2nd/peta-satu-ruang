# MC-087 — One calm, on-brand dashboard for every hazard layer

- **Status:** DONE — confirmed by the product owner; the four sprint-04 walkthroughs were rewritten against this UI and recorded green
- **Board:** sprint-04
- **Type:** design
- **Milestone:** MVP v1

## Why

Raised by the product owner after Titik Api (MC-083, MC-070), Gunung Api
(MC-084) and Gempa (MC-085) landed one after another: with all three switched
on the dashboard is confusing, the pulses read as noise, and the three
"CONTOH" rows in the dock promise data that does not exist.

Measured at 1440×900 with all three hazard layers on:

- **11 floating panels** on screen at once.
- The three cards stack to ~1,350 px on a 900 px screen, so the **Gempa card
  starts at y=944 and cannot be seen or reached** at all.
- **Three timelines** stacked across the middle of the map, each with its own
  play button and span menu — covering the map they are meant to control.
- **Three "Sumber" blocks**, three ⓘ buttons, three pulse switches.
- **Red means four things**: a fire hotspot, an eruption pulse, Level IV Awas
  and the eruption row — so the eye cannot tell danger from a data point.
- Three layers animate independently and never stop: fire ripples, eruption
  triangles, the newest quake — all looping at once.
- **The dock is a ~900 px wide bar of 8 equal boxes**, half the width of a
  1440 px screen, and its collapse chevron (bottom right) is already in the
  markup but **wired to nothing** — clicking it does nothing today.

Each card was designed on its own and is reasonable alone. Together they fail
the person this product is for, and the whole thing reads like a government
data portal rather than a product someone would choose to open.

## Round two: engaging and on-brand, not administrative

First draft of this ticket leaned on how USGS, BMKG, MAGMA and NASA Worldview
draw their own maps — correct as far as *why the current screen is cluttered*
(too much simultaneous motion, no shared timeline, sources buried in every
card), but wrong as a *visual target*. The owner's correction: **do not copy
those conventions** — they read as old and boring. MapCanva already has a
visual identity (the gradient flame badge in the corner, `DashboardBrand.tsx`)
and the hazard layers should extend it: informative, engaging, and polished
like a well-made game HUD, while staying trustworthy for a disaster-information
product. Concretely:

- The **structural** fixes below (one summary panel, one timeline, one thing
  animating, sources into ⓘ) stand — they solve clutter and information
  overload, not a style preference.
- The **visual** direction changes: icons and motion should be drawn in our
  own voice, not borrowed outlines from a government icon set or a scientific
  portal's flat circles. Details revised below.

## Who we are designing for

Someone with no GIS training, on a slow machine, opening the dashboard because
something may be happening. The questions they bring, in order:

1. **Is anything dangerous happening right now?**
2. **Where — is it near me or near someone I know?**
3. **How bad is it, and what should I do?**
4. What happened over the last days?
5. Can I trust this — where does it come from?

Today the screen answers 4 and 5 first (counts, bands, sources) and makes the
reader dig for 1–3.

## What still holds from the research

- **Motion is the strongest attention signal, so it has to be rationed, not
  banned.** NN/g: movement "triggers a stimulus-driven shift in visual
  attention", and a *looping* animation goes from "nice the first time" to
  annoying — the fix is fewer, better animations, not a flat, static screen.
- **WCAG 2.2.2 / 2.3.3**: motion that starts by itself and runs over five
  seconds needs a pause/stop/hide control, and `prefers-reduced-motion` must
  be honoured — real people get dizzy and nauseated from unstoppable motion.
  This is a legal-risk and usability floor, not a style choice, and it is
  compatible with a lively, game-like feel: the motion just needs an off switch.
- **Pictures for a few named things, shapes for many measured things**
  (cartography: geometric symbols stay legible small and in crowds; pictorial
  symbols are recognised without a legend but lose magnitude and clutter when
  dense). 127 volcanoes (named, few) suit an icon; thousands of fire
  detections and hundreds of quakes (measured, many) suit simple shapes.
- **One clock for the whole map, summary first, detail on request** —
  structural patterns (seen in NASA Worldview's single timeline, and in
  progressive-disclosure UX generally), not aesthetic ones. Adopting "one
  timeline" does not mean adopting Worldview's look.
- **Sources can move into ⓘ**; only the map's own corner attribution has to
  stay always visible (OpenStreetMap's own attribution guideline allows this),
  and BMKG/GDACS/USGS's credit requirements are satisfied by that corner line
  plus the per-layer ⓘ.

## Proposal

### A. Dock: smaller, and it actually collapses

- **Remove Banjir, Penduduk and Lahan.** They are MC-078 placeholders marked
  CONTOH, with no data and no tickets of their own.
- Group what remains into two clusters — **Bencana** (Titik Api, Gunung Api,
  Gempa) and **Wilayah** (Batas Wilayah, Bangunan) — five rows instead of
  eight, so the bar itself shrinks by roughly a third before anything else
  changes.
- **Wire the collapse button that already exists in the markup.** Collapsed,
  the dock shrinks to a single pill showing a small colour-coded dot per
  *active* layer (not every layer) plus a count, e.g. a red dot and a violet
  dot for "Gunung Api + Gempa on"; tapping the pill re-expands it. This keeps
  the idea the owner likes (a dock) while giving the map its width back once
  someone has made their choice.
- The dock does not auto-collapse on its own — a bar that vanishes right after
  you touch it feels broken. Collapse is a deliberate tap, expand is a
  deliberate tap.

### B. One "Situasi" panel instead of a card per layer

- One panel on the left, one line per active layer, each line a plain
  Indonesian headline that answers question 1:
  - "Gunung Ibu erupsi 2 jam lalu · 3 gunung erupsi hari ini"
  - "Gempa M 5,6 di laut selatan Banten, kemarin · tidak berpotensi tsunami"
  - "48 titik api hari ini, terbanyak di Kalimantan Barat"
- Tapping a line opens that layer's detail (levels or bands, the legend) in
  place; **only one open at a time**.
- The panel never grows past the screen: it scrolls inside itself.
- Each layer keeps one ⓘ, holding what it means **and** its sources. The map's
  corner credit line stays visible, as today.
- Visual treatment matches the brand badge already in `DashboardBrand.tsx` —
  a soft gradient chip per hazard (flame gradient for fire, PVMBG-coloured
  gradient for volcanoes, violet gradient for quakes) instead of a flat grey
  card, so the panel feels like part of the same product as the logo mark.

### C. One timeline

- One timeline under the map for every active hazard layer: one span menu
  (1/3/7/30 days), one play button, one slider.
- Each day's bar is stacked by layer colour, so a busy day for one hazard is
  still visible.
- Default stays "now" (last 24 hours for eruptions, today for fires, the
  30-day window for quakes collapses to the same "now").

### D. Symbols — our own marks, not a borrowed outline set

- Draw a small **custom icon set** in MapCanva's own style — rounded, filled,
  soft-shadowed like the flame badge — rather than dropping in Material
  Symbols or OCHA's outlines as-is. A generic government-icon-set look is
  exactly the "old man" feel the owner wants gone. (Material Symbols'
  `volcano`/`local_fire_department` silhouettes and OCHA's humanitarian set
  are fine as *construction references* for the shapes — both are openly
  licensed, Apache 2.0 and public domain respectively — but the shipped mark
  should be redrawn to match our palette and corner radius, not used verbatim.)
- **Volcano:** a cone badge in the PVMBG level colour. An **erupting**
  volcano gets a distinct "erupting" version of the same badge (glow + a
  short, one-shot burst animation when it *starts* erupting, then settles
  into a static hot-badge state with a small ember accent) instead of an
  endless pulsing ripple. Unmonitored volcanoes stay a small, muted grey cone.
- **Fire:** small dots in an orange–amber gradient family (distinct from the
  volcano/eruption red), sized by confidence. Detections from the last 6 hours
  get a bright rim instead of a pulse — motion is spent on the one newest
  detection only, not thousands of points at once.
- **Earthquake:** circles sized by magnitude, violet, fading with age; the
  **newest** quake and whichever quake is clicked get a small badge accent at
  the epicentre (not a plain BMKG-style star — a mark drawn in the same
  rounded, filled language as the rest of the set).
- **One motion budget for the whole map.** Only the single most urgent current
  event gets the "just happened" treatment (the one-shot burst, or a soft
  glowing badge) — never more than one thing animating at a time. A single
  **"Animasi"** switch replaces today's three separate pulse buttons, and
  `prefers-reduced-motion` turns it off automatically.

### E. Colour

- **Red means danger now, and only that:** Level IV Awas and an eruption's
  hot-badge state.
- Fire moves to its own orange–amber family; earthquakes stay violet; the
  PVMBG level colours do not change (people already read them from the news).
- One legend per layer, inside its opened section, never repeated three times.

## Round three: built, and what's still open

The owner said "implement it," picking the recommended option on decisions
4, 5 and 6 below (and 3, which the app already did). Built and driven in a
real browser at 1440×900 with Titik Api, Gunung Api and Gempa all on:

- **Dock**: Banjir, Penduduk and Lahan are gone (parked as MC-088/089/090, so
  the ideas aren't lost); the rest is grouped Bencana | Wilayah with a
  divider; the collapse chevron (previously in the markup but wired to
  nothing) now actually collapses the dock to a small pill showing one
  coloured dot per active layer.
- **Situasi panel** (`SituasiPanel.tsx`) replaces the three stacked cards —
  `FireHotspotCard`, `VolcanoCard`, `QuakeCard` are deleted. One always-visible
  headline line per active layer (the existing "N titik api / N gunung erupsi
  / gempa terbaru" stat each card already led with); tapping a line expands
  that layer's counts and legend, one section open at a time. Each layer's
  own ⓘ now also holds its "Sumber" links, which used to sit in the always-
  visible body.
- **One shared timeline** (`SharedTimeline.tsx`) replaces `FireTimeline`,
  `VolcanoTimeline` and `QuakeTimeline`. One span menu, one play button, one
  slider; each day's bar is stacked by layer colour (fire red, volcano orange,
  quake violet); the right-hand summary reads e.g. "48 titik api · 3 erupsi ·
  12 gempa". Feasible because all three already used the same span options
  (1/3/7/30) and the same WIB day keys — confirmed by reading their source
  before merging, not assumed.
- **One "Animasi" switch** (`SituasiPanel`'s header) replaces the three
  separate pulse buttons. It is one field in the store (`animationsEnabled`)
  read everywhere a layer previously read its own `pulseHidden`; the field
  itself was removed from `FireHotspotSettings`, `VolcanoSettings` and
  `QuakeSettings`, not just superseded, so there is exactly one source of
  truth. `prefers-reduced-motion` is honoured underneath the switch — both in
  CSS (`motion-reduce:hidden` on every `animate-ping`) and in the OpenLayers
  pulse intervals — so a reader with a vestibular disorder never gets motion
  the switch alone left on.

**Not done in this round**, left for a follow-up once the above is reviewed
on screen — these are visual/motion redesign calls better iterated with
screenshots in hand than guessed once, blind:

- **Decision 1 (eruption motion)**: still the original continuous ping while
  erupting, not a one-shot burst settling into a static badge. It is now
  switchable and reduced-motion-safe, which was the urgent part; the
  choreography change is separate work.
- **Decision 2 (fire motion)**: unchanged — still pulses on recent/very-high
  detections, not reduced to "newest only." Same reasoning as above.
- **Decision 7 (custom icon set)**: markers are visually unchanged (the same
  triangle, circle and mountain-label icons) — no gradient badges or redrawn
  pictograms were built. This is real design work, not a quick pass, and
  deserves the owner looking at concrete options rather than one guess.

**Mobile**: split into its own ticket, MC-091 — the dashboard's `SmallScreenGate`
threshold and the dock/timeline's mobile layout are a real product-scope
decision and real design work respectively, not something to fold into this
ticket's structural cleanup. New components got `max-w-[calc(100vw-2rem)]`
and `overflow-x-auto` safety nets so they at least don't overflow while that
decision is pending, but the dashboard route is still gated at 1024px today.

## Round four: icon markers, no pulse, and a HUD instead of a panel

The owner tried Round three on screen and pushed back on two fronts: the
pulse animation itself (not just a switch for it), and the Situasi panel's
"card" feel versus something that reads as engaging rather than
administrative — closing decisions 1, 2 and 7 above, and reopening the
Situasi panel's shape. Built and driven in a browser with Titik Api, Gunung
Api and Gempa all on:

- **Pulse removed outright**, not just switched off. Every `setInterval`
  animation loop for fire, volcano and quake markers, the volcano KRB zone's
  "breathing" ring, and every `animate-ping` dot in the section headlines and
  the volcano popup are gone from the code, not merely hidden. The global
  `animationsEnabled` store field, its `setAnimationsEnabled` action, the
  Animasi switch, and `src/lib/motion.ts` (`prefersReducedMotion`) are all
  deleted — there is no motion left for `prefers-reduced-motion` to guard
  against. A volcano that erupted recently is now a static red badge instead
  of a red badge plus a growing/fading triangle ring underneath it.
- **Circle-and-icon markers** (`hazardBadgeStyle` in `map-utils.ts`) replace
  the bare shapes for all three hazards: a filled `CircleStyle` badge (colour
  still carries confidence/PVMBG level/magnitude-age exactly as before) with
  a small white icon layered on top via `ol/style/Icon`, fed an inline SVG
  data URI built from the same lucide path data the rest of the app already
  renders (Flame, Mountain, Activity) — so the map reads as the same icon
  language as the dock, not a new one. No new dependency and nothing to add
  to `THIRD_PARTY_NOTICES.md`: lucide-react was already in the app.
- **`SituasiPanel` is no longer rendered** on the dashboard (the component
  and its three Section children still exist, unused, since the owner said
  "still thinking" about how the detail view should look — deleting it now
  would lose working accordion logic that the next pass will likely reuse
  rather than redesign from zero).
- **`HazardHud`** (new) replaces it in the same top-left slot: one small
  white pill, gradient circular icon badges matching the new map-marker
  language, one number per active hazard (titik api / erupsi / gempa) and
  nothing else — a glance instead of a panel to open.
- Copy that described the removed pulse ("Data berdenyut…", "Denyut merah",
  "Denyut ungu") was reworded or removed from each layer's ⓘ popover and
  "Tanda di peta" legend, since it no longer matches what the map does.

**Not done in this round, still open:**

- **The detail view.** With the card hidden, there is currently no way to
  open a layer's confidence bands, PVMBG level list, or quake bands from the
  dashboard — only the count in the HUD. The owner is still deciding the
  shape of this before it gets built.
- **Clustering.** Showing many nearby events as one circle with a count
  ("gempa terbaru di satu titik" style aggregation) was requested but not
  scoped or built — needs a decision on which hazards it applies to and at
  what zoom/distance threshold before implementation.
- **e2e specs are now stale.** MC-070, MC-083, MC-084 and MC-085's specs
  assert the pulse buttons ("Sembunyikan/Tampilkan animasi"), the Situasi
  panel's "Situasi" text, and section-specific expand buttons that are no
  longer rendered. Left unrun rather than rewritten against a UI that is
  still visibly moving — worth a full pass once the detail view and
  clustering land, not before.

## Round five: the map is the interface

The owner set a new model after round four: search → where, map → what,
timeline → when, click → details. Events (fire, quakes, eruptions) are the
map; boundaries and buildings are context; time is replayed, not a separate
"historical" layer; the map is calm when nothing happens and alive when
something does. This round rebuilds the dashboard's interaction on that model.
Data APIs, fetchers and popups are unchanged.

Built and driven in a headless browser at 1440×900, 820×1180 and 390×844
(and with `prefers-reduced-motion`):

- **Clustering** (`ol/source/Cluster`) for fire and quakes, filtered by the
  time window through the cluster's `geometryFunction`. The merge distance
  shrinks with zoom, so the country view is a handful of regions and a city
  view is individual events. Clusters of 2–4 are a stacked badge with no
  number; 5 and up carry a count (`1,2rb`). Clicking a cluster fits its
  children with a short animation; a single event opens its existing popup.
- **Markers are drawn on canvas** (`map-markers.ts`): a gradient badge with
  a white glyph, cached by appearance. Fire and quake glyphs are lucide's
  Flame and Activity; volcano glyphs (mountain, erupting mountain with smoke)
  are drawn in-house. Events fade and shrink with age inside the window; the
  oldest become a dot.
- **Earthquake pulse** by magnitude: below M3 never; M3–4.9 a faint ring a
  few times as it appears; M5+ a strong ring, repeating while it is from the
  last 24 hours. At most five pulse together. Reduced motion gets a static
  ring for strong quakes only. The timer only runs while something pulses.
- **Fire** never pulses; density is the cluster size and count.
- **Volcano status**: an erupting volcano (erupted inside the window) is a
  red smoke badge that fades with the eruption's age; otherwise the PVMBG
  level colour. At country zoom Normal and Waspada step back to small dots.
  The summary counts "gunung erupsi", not volcano locations.
- **One time model** replaces the three per-layer day timelines:
  `eventTime { range, end, cursor, playing, speed }`. Presets 1 jam / 24 jam
  / 7 hari / 30 hari, a date-time picker for a custom end, replay at 1×/2×/5×
  (a whole window takes 30 s at 1×), scrubbing by dragging the bars, and a
  "back to now" button. Events only appear once the cursor passes their
  timestamp. Bars are bucketed per window (5 min, 1 h, 6 h, 1 day), each kind
  scaled to its own peak so quakes aren't flattened by fire.
- **Summary** (`EventSummary`): 🔥 / 🌋 / 〽 counts for the window. Pressing
  one dims the other kinds on the map; pressing a layer that's off turns it
  on. Counts are no longer repeated in the timeline.
- **Selected place** (`SelectedPlaceCard`): appears only while an area is
  picked — level, name, parents, fire/quake/eruption counts inside the
  boundary for the window, and boundary/buildings toggles. The map dims
  everything outside the boundary and the outline breathes three times, then
  holds. Desktop: under the search box. Phone: a sheet above the timeline.
- **Buildings by zoom**: on by default, fetched and drawn only from zoom 13
  and only for a city, district or village — no manual toggle needed.
- **Layers** (`LayersControl`): one quiet button beside the map controls,
  with Peristiwa (fire + confidence, quakes, volcanoes) and Peta (boundary,
  buildings). The bottom dock is gone. Zoom buttons now actually zoom (they
  had no handlers).
- **Responsive**: the dashboard route no longer uses `SmallScreenGate`; the
  editor still does. On a phone the brand collapses to its badge, the summary
  sits under search, controls move to the top right, and the attribution is
  one scrollable line that the timeline never covers.
- Layers turn on when the dashboard opens; `MapProvider`'s `fireHistory` prop
  is now `eventMode`. The editor keeps the live, unclustered fire feed (checked
  in the browser).

Removed as superseded: `SituasiPanel` and its three sections, `SharedTimeline`,
`LayerDock`, `LayerToggleRow`, `HazardHud`, the per-layer timeline state and
the day-summary fetch on the client.

**Not done in this round:**

- **e2e walkthroughs are stale.** MC-070, MC-083, MC-084 and MC-085 script
  the dock, Situasi panel and day timeline, which no longer exist. They need
  rewriting against this UI, then `make verify` recordings, before this goes
  to a PR.
- **Surrounding boundaries** aren't drawn subtly around the selected one:
  there's no layer of neighbouring areas to draw from yet.
- Cluster split is a zoom animation; clusters don't animate apart.

## Round six: levels in the card, one fixed window

Three corrections from the owner on round five:

- **"Lihat sampai" is gone.** We only hold the last 30 days, so a custom end
  date promised data that does not exist. `EventTimeSettings.end` is removed
  with it; the window always ends now, and the replay cursor is the only way
  to look back inside it.
- **Ash removed** — see MC-092, with the idea parked as MC-093.
- **The summary counters open a card instead of dimming the map.** Pressing
  a counter no longer fades the other kinds (the owner did not want opacity as
  the answer). It opens a small card under the pill with that hazard's own
  levels, each one a row with its count that can be switched off on the map:
  - Titik api: keyakinan tinggi / sedang / rendah (hidden levels are never
    fetched, so they show "–" rather than a misleading 0).
  - Gempa: M5+, M3,0–4,9, below M3,0 — every band in the window is counted, so
    a hidden one still shows its number; only shown bands add to the total.
  - Gunung api: Awas / Siaga / Waspada / Normal / tidak dipantau. Hiding a
    level also takes its eruptions out of the count.
  The card also holds that layer's on/off switch, so the Lapisan control is
  now only Batas wilayah and Bangunan — each control appears once.
  New state: `quake.hiddenBands` and `volcano.hiddenLevels`; `eventFocus` is
  gone.

An eleventh pass — the quake ring means something now:

- The shockwave used to expand by a number of *screen pixels* set by
  magnitude, so it said nothing about the ground and changed meaning with
  every zoom. It now stops at an estimated **felt radius in kilometres**
  (`quakeFeltRadiusKm`: ~100 km at M5, doubling per magnitude, clamped to
  8–800 km), converted to pixels per frame from the view's resolution and
  corrected for Web Mercator's latitude stretch. Zoom in and the ring grows
  with the map, because it is a distance on the ground.
- Said plainly where it could mislead: the quake card's ⓘ and the help dialog
  both call it an estimate from magnitude, not a BMKG measurement — BMKG
  publishes felt intensity per place, never a radius.

A tenth pass:

- **MAGMA is read once every half hour and no more.** It already was —
  `refreshMagma` has a TTL and a failure cooldown — but a failed attempt made
  it *throw*, so the route flagged the layer stale and every poll popped
  "Data MAGMA tidak bisa diperbarui" over perfectly good stored status. It now
  serves the stored snapshot and the route decides staleness from that
  snapshot's own age (`MAGMA_STALE_AFTER_MS`, 90 minutes).
- **Clustering starts off**, and the eruption badge has no caption at all.
- **Katalog data** replaces "Lapisan peta", with an Administrasi group
  ("Pilih wilayah dulu") over Batas wilayah and Bangunan, and descriptions
  that say what each layer *is* rather than what to do next.
- **Defaults**: every quake band on, fire at high confidence only, volcanoes
  showing eruptions, Awas and Siaga — Waspada, Normal and unmonitored are a
  deliberate choice now.
- **"Only 5 earthquakes?"** — checked against the catalogues rather than
  assumed. In that 24 hours BMKG's three feeds carried 4 events and the USGS
  FDSN count for the Indonesia box was 3, one of which was the same quake. We
  hold 195 over 30 days (42 BMKG, 153 USGS). BMKG publishes only M5+, felt,
  and the latest event; USGS's global catalogue thins out below M4.5 outside
  the US. The number is the catalogues' coverage, not a bug in the read.

A ninth pass — colours checked against the agencies, not from memory:

- **Gunung api already matched PVMBG**: Normal green, Waspada yellow, Siaga
  orange, Awas red, as MAGMA publishes them. Left alone.
- **Titik api did not match SiPongi+** and now does: high (≥80%) red, medium
  (30–79%) yellow, low (<30%) green — ours had medium orange and low yellow.
  Our band thresholds were already SiPongi's 80/30. A single hotspot is drawn
  in its band's colour; a cluster keeps the fire gradient, since it mixes
  bands.
- **Gempa stays yellow**, the owner's pick. BMKG's own earthquake map legend
  could not be read from the source — the page renders its map in the browser
  — so nothing was changed on the strength of a guess. Worth noting for later:
  seismic maps conventionally colour by *depth* (shallow red, intermediate
  orange, deep green), which would collide with both scales above on a map
  that shows all three hazards at once.
- **With motion off, the eruption badge drops its "Erupsi" caption** too:
  switching animation off is meant to leave a quiet map, and the red badge
  with its mountain-and-fire glyph already says what it is.

An eighth pass — three controls the reader was missing:

- **Clustering can be switched off** ("Gabungkan yang menumpuk", in the map
  layers card). Off, every event is drawn where it happened, however dense;
  the row says which rule is in force.
- **One motion switch, not three.** Clustering and animation sit together
  under a "Pengaturan" heading at the foot of the map layers card; the event
  cards went back to levels only. A per-hazard switch was built first and the
  owner cut it: one place to calm the map is enough. The ticker stops dead
  when it is off, and `prefers-reduced-motion` still overrides it.
- **A "?" button** beside the map controls opens a tutorial: search → time →
  click → layers, then what each marker means and where the data comes from,
  with the line that this is what has already happened, not a forecast.

A seventh pass — one effect per hazard, to the owner's brief:

- **Titik api** keeps its badge — the owner tried the rotated thermal tile and
  wanted the old icon and colour back, with only the heat on it. So the flame
  badge is unchanged and a warm halo breathes around it instead. Six frames
  are pre-rendered and cached, and each hotspot takes its offset from its own
  detection time, so a thousand of them burn out of step at one cached image
  each. The flicker runs at ~9fps off the shared ticker, not 30.
- **Gempa** rings are a shockwave now: out fast, sharp, thinning and fading as
  they go, continuously — 1.3s instead of 2.2s, reach and weight still set by
  magnitude.
- **Gunung api** keeps the heat aura and ash plumes and gets its small "Erupsi"
  badge back beneath the icon. The embers are gone: asked whether the eruption
  was overdone, three motions on one marker — each on its own clock — read as
  panic rather than urgency, and the embers cost the most (a blurred glow per
  particle at 30fps) while saying the least. The aura now breathes on the same
  slow beat as the hotspots' heat, the ash rises slower, and the effect layer
  redraws every other frame.

A sixth pass:

- **No loading toasts.** "Memuat titik api / gunung api / bangunan" are gone;
  loading shows where the thing lives — a spinner in place of the counter's
  chevron, "memuat…" in the card's subtitle, and a spinner on the Bangunan
  row (`buildingsStatus`). Failures still toast, because a failure needs to
  interrupt.
- **An eruption is drawn, not labelled.** The ERUPSI pill is replaced by a
  canvas effect around the badge: a magma heat aura breathing under it, two
  soft ash plumes rising and spreading, and seven embers thrown up and fading
  out, each volcano on its own offset. It rides the same 30fps ticker as the
  quake rings, which stops when nothing is moving; `prefers-reduced-motion`
  gets the aura and one still plume, no embers.

A fifth pass:

- **Pressing play left rings floating over nothing.** A live pulse never
  expires by design, and the cleanup that drops a ring whose marker is gone
  was skipped while replaying — so every ring from the live view stayed put
  while the replay rewound to the start of the window, hanging over events
  that had not happened yet. Starting, restarting or rewinding a replay now
  clears every ring, and a ring is dropped as soon as its marker stops being
  drawn.

- **Clusters start at ten.** Anything smaller is drawn as its own marker, on
  its own spot: two quakes a few hundred kilometres apart off south Java were
  being merged into a pair, which also meant neither pulsed. A cluster source
  cannot emit singles, so each clustered layer now has a companion layer fed
  from the clusters below the threshold, and the pulse follows those markers.
- **An Erupsi row** sits above Level IV in the volcano card, with its own
  count and switch. An erupting volcano is counted as an eruption and not a
  second time under its level, so the level rows read as "quiet volcanoes at
  this level".
- **The Lapisan button is gone.** Batas wilayah and Bangunan moved into a
  fourth chip beside the three event counters, so every panel on this screen
  opens from the same row, in the same stacking context — which is what kept
  putting the catalogue over the card.

A fourth pass, on the same screen:

- **Earthquakes are yellow** (`#fbbf24` to `#a16207`), not brown. Worth
  watching: PVMBG's own Waspada colour is yellow too, so a quiet Waspada dot
  and a quake badge share a hue at country zoom — the glyph and size still
  separate them, but if it reads badly, the quake pair is the one to move.
- **Volcanoes no longer pulse.** An eruption is a red badge with a mountain
  and a flame, and the word **ERUPSI** on a pill beneath it. Motion was
  carrying the urgency; a word carries it without moving, and the map is
  calmer for it. `badgeStyle` grew a `caption` for that.
- My location and zoom are a vertical stack again, under the search box.
- The summary and its card moved into the left column, above the search
  column, so an open card is never covered.
- **Every level can now be switched off**, including Keyakinan tinggi, which
  could not be clicked: a rule kept one level on at all times. With all of
  them off the layer simply draws nothing, and the card still shows what each
  level holds — the fire request takes `points=0` and returns the tally alone.

Then a third pass, on the chrome and the stacking:

- **Brand**: MapCanva on the dashboard is now **Peta Satu Ruang**, with a map
  pin mark instead of the flame and a live line — a pulsing green dot,
  "Langsung · 18.27 WIB" — that turns amber and reads "Putar ulang" while the
  replay cursor is set. Lapisan moved into the brand pill, where the editor
  link used to be; my location and zoom moved under the search box.
- **Card header**: the ⓘ sits next to the title and the layer's switch at the
  far right of the same row.
- **A switched-off layer keeps loading.** Turning one off now only hides its
  map layer (`setVisible`), so its counts and levels stay readable in the
  summary instead of collapsing to "–".
- **Stacking by urgency** (`EVENT_Z`): KRB zones, fire, quiet volcanoes,
  pulses, earthquakes, erupting volcanoes. An M5 could sit behind a volcano
  that was doing nothing, because the whole volcano layer was above the whole
  quake layer; erupting volcanoes are now their own layer over one shared
  source, so they lead and the quiet ones drop below the quakes.
- **One popup per click.** Each popup used to hit-test its own layer, so two
  overlapping markers opened two popups. There is now a single `eventAt` pick
  — OpenLayers returns the topmost feature — and each popup only answers when
  the winner is its kind. Verified by clicking 14 markers: never more than one
  open.
- **An eruption pulses like an earthquake**, in red, with the same cadence and
  a bigger badge, because it is the same kind of news. The pulse layer takes a
  colour and a strength per feature rather than being quake-only.
- **Earthquakes are earth-brown** (`#8a5a2b`, sand to brown), not violet —
  the colour a seismograph is drawn in, and nothing else on the map is brown.

Then a second pass over the same card:

- The layer's on/off switch is out of the card header and back in Lapisan, so
  the card is about levels and the ⓘ sits alone at the top right.
- **A switched-off level keeps its number.** For quakes and volcanoes every
  level in the window was already counted. Fire only fetches the levels it
  draws, so `/api/fire-hotspots/history` now also returns a per-band tally for
  the window (one `groupBy`, no extra points on the wire) and the card reads
  the hidden levels from it. The request carries the rolling window's `from`
  and `to`, so the tally matches what the map shows instead of whole days.
- One switch colour everywhere, shorter level captions, and every card's
  subtitle reads "24 jam · diperbarui N menit lalu" — fire included, which
  needed the fetch time to be kept.
- **No more age fading on the map.** Markers are solid; recency is the
  timeline's job, not the icon's.
- **Every quake drawn as itself pulses**, with the ring's reach and strength
  scaled continuously by magnitude, and it keeps pulsing rather than stopping
  after a few cycles. A quake merged into a cluster does not pulse: 245 rings
  at country zoom turned the map into a violet haze, and the cluster is not
  where any of them happened. Zooming in splits the cluster and the rings
  appear. Reduced motion gets a still ring, sized the same way.

Fixed in the first pass, from the same review: the open counter turned solid
black, which read as a dead blob rather than a pressed button, and the card's
on/off switch was built from an absolutely positioned knob that rendered
outside its track. Counters are now bordered white chips with a chevron that
flips, tinted in their own hazard colour when open; every switch is a flex
track whose knob cannot escape it; each level row carries its own switch in
that level's colour; and the card has an ⓘ that swaps the level list for the
layer's explanation and source links (the copy the deleted cards used to
hold), with "diperbarui N menit lalu" in the header.

## Decisions for the owner

1. Should the dashboard open with all three event kinds on (built), or with
   only fire?
2. Is the 30-second full-window replay the right pace at 1×?

## Sources

Kept for the *structural* findings (motion budget, accessibility floor,
symbol density, single timeline, attribution placement) — not as the visual
target; see "Round two" above.

- NN/g — [Animation for attention and comprehension](https://www.nngroup.com/articles/animation-usability/)
- NN/g — [Progressive disclosure](https://www.nngroup.com/videos/progressive-disclosure/)
- W3C — [Understanding SC 2.2.2 Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)
- W3C — [Understanding SC 2.3.3 Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)
- Penn State GEOG 486 — [Choosing symbols for maps](https://courses.ems.psu.edu/geog486/node/893)
- Making Effective Maps — [Thematic symbols](https://colorado.pressbooks.pub/makingmaps/chapter/chapter-5-thematic-symbols/)
- NASA Earthdata — [Worldview](https://www.earthdata.nasa.gov/data/tools/worldview) (single-timeline pattern only)
- OSMF — [Attribution guidelines](https://osmfoundation.org/wiki/Licence/Attribution_Guidelines)
- Google — [Material Symbols](https://github.com/google/material-design-icons) (Apache 2.0 — construction reference only)
- Font Awesome × OCHA — [Humanitarian icons](https://blog.fontawesome.com/humanitarian-icons/) (public domain — construction reference only)
