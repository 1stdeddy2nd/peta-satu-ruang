# MC-051 — Import open building-footprint polygons

- **Status:** DONE
- **Board:** sprint-03
- **Type:** feature
- **Milestone:** MVP v1

## Why
This is the real answer to "auto-generate a polygon" without the risk
discussed on the sprint-03 design thread: Google (Open Buildings) and
Microsoft (Global ML Building Footprints) have already run segmentation
models over satellite imagery worldwide, including Indonesia, and published
the resulting polygons as open data. Importing them costs no AI compute, no
GPU, and — critically — no hallucination risk, since the polygons were
generated once, offline, against real imagery, not invented per-request
against whatever a user happens to be looking at.

## Source and legality
- **Google Open Buildings** — building polygons + confidence score, global
  coverage including Indonesia.
- **Microsoft Global ML Building Footprints** — same idea, different model,
  published under ODbL (same license family as OpenStreetMap).
- **Verify the exact current license of each before shipping** — both have
  been generous (attribution-only or share-alike, commercial use allowed) but
  terms move; treat this as part of MC-042's legal review, not an assumption
  baked into the code.

## Update cadence — Indonesia specifically is the weaker of the two
- **Google Open Buildings** is a static, versioned release, not a live feed:
  [v1 (2021) → v2 (2022) → v3 (May 2023)](https://sites.research.google/gr/open-buildings/),
  each an improvement pass, then nothing since v3. Worse, the release date
  isn't the imagery date — Google's own FAQ says the *source* imagery behind
  any given building "in some cases... was several years old," so a v3
  polygon could reflect imagery well older than 2023.
- **Microsoft Global ML Building Footprints** looks actively maintained —
  the [main repo](https://github.com/microsoft/GlobalMLBuildingFootprints) has
  shipped monthly refreshes through 2026 (July, August 2026 updates
  confirmed). **But Indonesia is not in that repo.** Indonesia, Malaysia and
  the Philippines live in a separate, dedicated repo,
  [IdMyPhBuildingFootprints](https://github.com/microsoft/IdMyPhBuildingFootprints),
  whose last real content change was **November 2024** — everything since is
  just a storage-link fix, not a data refresh. So Microsoft's fast monthly
  cadence does not apply to the country we actually care about.
- **Bottom line for this ticket**: whichever source we pick, Indonesia's
  footprints are a snapshot from 2023–2024 at best, not current — the UI
  should say so plainly (a visible "as of ~2023–24" note on the layer), not
  imply live or recent data.

## Built: self-hosted, not a live query — neither source has a bbox API
Turned out to be the real design decision, not a footnote: **neither Google
nor Microsoft offers "give me a bbox, get buildings."** Both only distribute
bulk per-country files — Microsoft's entire Indonesia dataset is one 4.4GB
zip, Google's is tiled by S2 cell but individual tiles can hit 7.8GB. There
is no lightweight way to query either live.

Decided (with the product owner) to **self-host**: import Microsoft's data
once into our own `BuildingFootprint` table (real PostGIS geometry, GiST
index — mandatory at this scale, or a bbox query is a full sequential scan
over millions of rows), then `GET /api/building-footprints?bbox=...` is a
normal fast query against our own data. No microservice, no separate
database — same Postgres, same app, one new table and one new route; the
only thing that needed separating out was the *import itself*, which is a
standalone script (`scripts/import-building-footprints.mjs`), never part of
a web request or of `db-seed` — it runs once, taking hours for the full
country (measured: ~40min download alone at typical bandwidth, tens of
millions of rows to parse and COPY, plus building the spatial index after).

- **Dev/CI never runs the real import.** `prisma/seed.ts` seeds 5 sample
  buildings from `examples/sample-building-footprints.geojsonl` instead, so
  the feature is always testable without an hours-long dependency.
- **Verified the transform is correct**, not just "looks plausible": diffed
  imported geometry against the source coordinates through the same
  spherical Web Mercator formula OpenLayers' `fromLonLat` uses, confirmed
  `ST_SRID` reads back 3857 correctly.

## Functionality
- A "Reference data" section in Analysis mode with an "Import building
  footprints (current view)" action — fetches for the current map extent and
  adds a normal vector layer, same shape as an uploaded GeoJSON layer
  (MC-003), just server-sourced.
- Layer is named and coloured distinctly ("Building footprints (Microsoft,
  ~2024)", a dedicated orange) so it reads as reference data, not the user's
  own upload.
- A 25 km² area cap, checked client-side (immediate, no network round trip)
  and re-checked server-side (defense in depth) — a network bbox query
  against millions of dense-urban polygons is a real cost and latency risk
  the same way an unbounded file upload would be (MC-015's caps, same
  spirit).

## Non-goals
- No custom-trained segmentation model, no running AI over raw imagery here —
  that is a much bigger bet, and belongs with the analysis-plugin system
  (MC-029) if it happens at all.
- Not a replacement for real survey data — this is reference/starting
  geometry the user edits, not authoritative ground truth. The UI should say
  so.

## Acceptance criteria
- [x] Fetching footprints for a small Indonesian area returns real polygons,
      added as a normal, editable layer.
- [x] Attribution matches whichever source(s) are enabled. **Correction while
      building MC-059**: this box was checked based on the panel copy and
      layer name alone — the API's `attribution` field was never actually
      attached to the `VectorSource`, so the on-screen `.ol-attribution`
      credit silently never appeared for this layer at all. Fixed in
      `map-provider.tsx` (pass `attributions` when constructing the source,
      same as the tile layers already do); verified on screen now, not just
      via panel copy.
- [x] A too-large area is rejected with a clear message before the fetch, not
      after a slow timeout — verified client-side (no network call fires)
      and the server independently re-rejects too.
- [x] Legal terms for each source are logged in MC-042 —
      `THIRD_PARTY_NOTICES.md`: Microsoft is CDLA Permissive 2.0, Google Open
      Buildings CC BY 4.0 (not imported yet — Microsoft alone answers this
      ticket; Google stays a documented option, not built).
- [x] The imported layer visibly states how old the underlying imagery is —
      "as of ~2024" in both the layer name and the panel's helper text.
- [x] **The real Indonesia-wide import has actually been run**, against
      local dev Postgres: **63,947,880 buildings imported** (download 40min +
      unzip + import ~26min — faster than estimated), table size 19GB as
      predicted, GiST index confirmed doing its job (a real bbox query
      against all 64M rows: 0.24s). Not yet run against production, since
      there is no production deployment yet (MC-033) — re-run
      `scripts/import-building-footprints.mjs` there once it exists.

## Later: the area cap was removed
The product owner asked to drop the 25 km² cap outright, accepting the risk
directly ("if it crash i will tell you in the future") — see MC-065's own
"Later" note, which drops the matching feature-count cap on the same route
at the same time. "Import for current view" now issues an unbounded
`geom &&` bbox query with no `LIMIT`; zoomed out far enough, that is a scan
against all 64M rows returned as one response, a materially bigger risk than
the per-boundary case MC-065 covers. The acceptance criterion above describes
what was built and verified in sprint 03; this is what changed after.
