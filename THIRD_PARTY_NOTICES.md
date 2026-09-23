# Third-party data notices

MapCanva is licensed under [PolyForm Noncommercial 1.0.0](./LICENSE) —
noncommercial use only. This file exists because that alone doesn't clear
every data source MapCanva pulls in: each one carries its own terms, some
stricter, some looser, and all of them independent of MapCanva's own license.
Every entry below was checked directly against the source, not assumed.

## OpenStreetMap (basemap tiles)

- **Data license**: [ODbL](https://opendatacommons.org/licenses/odbl/) —
  allows commercial use; requires attribution and share-alike on *derivative
  databases* (not on rendered map images or exported sheets, which only need
  attribution).
- **Tile server usage policy**: separate from the data license — the
  [Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/)
  governs the free `tile.openstreetmap.org` infrastructure specifically. No
  bulk downloading, must cache locally 7+ days, distinct User-Agent required,
  "access may be blocked without notice" for heavy or commercial-looking
  traffic. This is a service-continuity risk, not a copyright one — fine at
  MVP traffic levels, worth revisiting (self-hosted tiles or a paid provider)
  before real growth.
- **Attribution shown**: "© OpenStreetMap contributors", on screen and in
  every export (MC-041).

## EOX Sentinel-2 cloudless mosaic (MC-050, MC-053)

- **License**: [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)
  for every annual mosaic from 2017 onward — **noncommercial only**, verified
  directly against `https://tiles.maps.eox.at/wmts/1.0.0/WMTSCapabilities.xml`
  for each year (2020–2025). The unsuffixed `s2cloudless` alias serves the
  2016 mosaic instead, under plain CC BY 4.0 (commercial-compatible) — not
  used here since the product needs a current, dated year.
- **Compatible with MapCanva's own noncommercial license by construction.**
- **Attribution shown**: "Sentinel-2 cloudless — © EOX IT Services GmbH
  (Contains modified Copernicus Sentinel data {year})", swapped per selected
  year.

## Google Open Buildings (documented, not imported — MC-051 used Microsoft instead)

- **License**: [CC BY 4.0](https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_Research_open-buildings_v3_polygons) —
  commercial use allowed, attribution required. More permissive than
  MapCanva's own license needs.
- Latest version is v3 (May 2023); no fixed update schedule since.

## Microsoft Global ML Building Footprints (MC-051 — self-hosted)

- **License**: [CDLA Permissive 2.0](https://cdla.dev/permissive-2-0/) —
  commercial use allowed. More permissive than MapCanva's own license needs.
- Neither Microsoft nor Google offers a query-by-area API — both only ship
  bulk per-country files — so MC-051 imports Microsoft's data once into our
  own PostGIS (`scripts/import-building-footprints.mjs`) rather than calling
  out to either source live. Attribution: "Building footprints — Microsoft
  (CDLA Permissive 2.0), as of ~2024", shown on the imported layer, and a
  "Microsoft" credit on the dashboard's building layer (MC-082).
- Indonesia is **not** in the actively-updated global repository — it lives
  in a separate `IdMyPhBuildingFootprints` repo whose last real data update
  was November 2024.

## Indonesia admin boundaries — HDX COD-AB (MC-059 — self-hosted)

- **License**: [CC BY-IGO](http://creativecommons.org/licenses/by/3.0/igo/legalcode) —
  commercial use allowed, attribution required. Verified directly against
  HDX's own API (`data.humdata.org/api/3/action/package_show?id=cod-ab-idn`),
  not a search result.
- **Source is Badan Pusat Statistik** (Indonesia's official statistics
  agency) — curated, QA'd, and published by UN OCHA. Worth being explicit
  that unlike NASA FIRMS (MC-052), this data *does* originate from Indonesian
  government statistics; administrative boundaries aren't in the same trust
  category as fire/hazard reporting (no political framing to worry about in
  "where is this village's line"), but it's a different situation from FIRMS
  and shouldn't be described as if it weren't.
- **Vintage**: boundaries created 2020, last reviewed for accuracy October
  2025. Same per-source distribution shape as MC-051 — no query-by-area API,
  bulk per-level files instead (~456MB zipped for all 4 levels) — imported
  once via `scripts/import-admin-boundaries.mjs`.
- **Attribution shown**: "Boundary — Badan Pusat Statistik via UN OCHA/HDX
  (CC BY-IGO), as of ~2020", alongside the building-footprint credit when a
  boundary-clipped layer is imported.

## NASA FIRMS fire/hotspot data (MC-052 live, MC-070 30-day history)

- **License**: NASA open-data policy — free, no commercial-use restriction
  found. Citation requested for scientific publication, not a legal
  requirement: "We acknowledge the use of imagery from the NASA LANCE FIRMS."
- **Access**: a free per-account `MAP_KEY` from
  `https://firms.modaps.eosdis.nasa.gov/api/map_key/`, kept server-side
  (`FIRMS_MAP_KEY`) and never sent to the browser.
- **Rate limit, from NASA's own key-request page**: 5,000 transactions per
  10-minute window per key. A larger single request (e.g. a 7-day range) can
  count as multiple transactions against that limit. Contact FIRMS directly
  for an increase if MapCanva's usage ever approaches it. MC-052's own poll
  interval (once per 10 minutes per active viewer) is deliberately far below
  this, but a future feature that queries per-user or per-district on demand
  should check this limit before assuming it's headroom-free.
- MC-070 keeps 30 days of detections in our own database, fetching from
  FIRMS only the days it lacks; NASA's open-data policy allows this. The map
  credits it as a "NASA FIRMS" link.
- If Global Forest Watch is ever added alongside it: re-check its live
  status first — some GFW datasets reportedly stopped updating around
  October 2025 due to funding disruption.
- **Not used for the volcano feature** (MC-084, removed after its first
  round): a satellite heat-pixel within a few km of a crater is usually an
  unrelated land fire during dry season, not eruption evidence, and adds
  noise without adding trust. Still the fire-hotspot layer's own primary
  source, unchanged.

## MAGMA Indonesia — volcano status, eruptions, recommendations (MC-084)

- **Source**: MAGMA Indonesia, run by PVMBG (Badan Geologi, Kementerian
  ESDM) — the authority that sets Indonesia's volcano alert levels.
- **Terms**: none published. "Copyright © MAGMA Indonesia", and
  **`robots.txt` is `User-agent: *` / `Disallow: /`** — the site asks every
  automated client to stay away. No API, no export.
- **We read it anyway, by the product owner's explicit decision** (13 Sep
  2026), after the risks were laid out: silently wrong status if the pages
  change, our IP being blocked, damage to any future request for official
  access, and legal exposure that is probably low but unreviewed. Mitigations
  in the code, and the terms of that decision:
  - The status pass reads three pages: the homepage's embedded volcano list,
    each erupting volcano's latest page of `informasi-letusan/{code}`, and
    `laporan-harian`.
  - **Eruption history** (added by the owner's decision, 13 Sep 2026): the
    all-volcano `informasi-letusan?page=N` list, back 30 days only, **30
    seconds between pages**. Backfilled once (~50 pages, ~25 minutes, resumable),
    then only the newest page(s) every 30 minutes until a stored notice is
    reached. Notices older than 30 days are deleted.
  - One pass at most every 30 minutes, requests one at a time two seconds
    apart, shared by every viewer, refreshed in the background, with a
    five-minute cooldown after a failure.
  - An identifying User-Agent pointing at this repository.
  - Facts are extracted (level, eruption time, ash height and direction). The
    reporting observer's name is never stored.
  - **PVMBG's recommendation text is shown verbatim**, attributed and linked.
    This deliberately departs from "facts only": the recommendations are
    sectoral (Semeru: 13 km south-east, lahar to 17 km, a 5 km radius for
    projectiles), so any paraphrase or single extracted radius under-warns.
  - A parse failure fails loudly — the card says the data is not current and
    how old it is — rather than serving numbers that look fine.
- **Before public launch**: this needs a real legal read (UU ITE on access,
  UU Hak Cipta on the recommendation text) and ideally a written OK from
  PVMBG. Tracked in MC-058.

## BMKG earthquakes (MC-085)

- **Source**: BMKG (Badan Meteorologi, Klimatologi, dan Geofisika), the agency
  that issues Indonesia's earthquake and tsunami information —
  [data.bmkg.go.id/gempabumi](https://data.bmkg.go.id/gempabumi/).
- **Terms**, quoted from that page: "Wajib untuk mencantumkan BMKG (Badan
  Meteorologi, Klimatologi, dan Geofisika) sebagai sumber data dan
  menampilkannya pada aplikasi/sistem Anda." Attribution is the only stated
  condition; no licence is named. `data.bmkg.go.id` serves no `robots.txt`.
- **Rate limit**: 60 requests per minute per IP. We read three feeds at most
  every two minutes, from one server-side cache shared by every viewer.
- **Feeds**: `DataMKG/TEWS/autogempa.json`, `gempaterkini.json` (15 latest at
  M5.0+) and `gempadirasakan.json` (15 latest felt). Merged and deduplicated
  by event time.
- **BMKG's own sentences are shown unchanged** — the `Wilayah` location line,
  the `Potensi` tsunami line and the felt MMI list. They are already the plain
  Indonesian a reader needs, and paraphrasing a tsunami statement would be
  both wrong and risky.
- The map credits BMKG whenever earthquakes are drawn, and the card links to
  the source.

## USGS earthquake catalogue (MC-085)

- **Source**: the USGS NEIC "us" catalogue (Preliminary Determination of
  Epicenters), queried through the FDSN event API at
  `earthquake.usgs.gov/fdsnws/event/1/query`. No key.
- **Terms**: "USGS-authored or produced data and information are considered to
  be in the U.S. Public Domain." USGS asks for credit in the form "Credit: U.S.
  Geological Survey"; the card and the popup name USGS as the source.
- **Used only to fill the past**, for the days BMKG's three "latest" feeds no
  longer cover. It is read at most hourly for a 30-day window over Indonesia's
  bounding box.
- **BMKG wins every shared event.** Where both catalogues hold the same
  earthquake — within 90 seconds and 200 km — the BMKG row is kept and the USGS
  one deleted, because BMKG is the authority here and carries the location and
  tsunami sentences. Every quake says which catalogue it came from.
- Measured against each other over one month: USGS held 85 events where BMKG's
  feeds held 28, but USGS reached only down to M4.0 while BMKG published from
  M2.2; magnitudes for shared events differed by −0.6 to +0.6.

## Badan Geologi active volcano list (MC-084)

- **Source**: the table of Indonesia's 127 active volcanoes (Type A 76, B 30,
  C 21) with coordinates, published on MAGMA's
  [Tipe Gunung Api di Indonesia](https://magma.esdm.go.id/v1/edukasi/tipe-gunung-api-di-indonesia-a-b-dan-c)
  page (updated 20 Sep 2021). Same site, terms and owner decision as the MAGMA
  section above.
- **Copied once into `src/lib/volcano-official-list.ts`** — never fetched at
  runtime. Only names, types and coordinates, which are facts. Credited on the
  card as Badan Geologi, linked to the page.
- Used for the volcanoes PVMBG does not monitor (grey, no status). A MAGMA
  volcano is matched to its entry by name, or within 1 km for spelling
  differences.
- **Replaced Wikidata** (CC0), which was used for one round: its "volcano"
  class gave 139 Indonesian items that included a mud volcano, sub-cones of
  monitored volcanoes and extinct peaks, and missed about 20 volcanoes on the
  official list.

## Badan Geologi KRB hazard zones (MC-084)

- **Source**: Badan Geologi, Kementerian ESDM (`geologi.esdm.go.id`) — official
  eruption-update reports, each with an attached KRB (Kawasan Rawan Bencana)
  map for that volcano. The site states "Hak Cipta © Badan Geologi" with no
  explicit reuse license. We do not reproduce their map image; we transcribe
  the published figures it shows (each zone's radius and hazard description)
  into our own georeferenced circles, crediting the source report by name and
  linking to it.
- **Not a live source**: no API or bulk download. `src/lib/volcano-krb.ts` is
  a hand-curated table keyed by MAGMA's volcano code, currently only Anak
  Krakatau (`KRA`) from the 7 September 2026 report. Each further volcano needs
  its own map sourced and checked.
- KRB zones are static and geology-based. They are separate from PVMBG's
  current recommendation distances, which change bulletin to bulletin and
  come from MAGMA.

## User-uploaded data

MapCanva cannot know the license of data a user uploads, and makes no claim
over it. The user is responsible for having the rights to the data they
upload and for how they use MapCanva's output — this belongs in the Terms of
Service (drafted alongside MC-033's deployment), not enforced in code.
