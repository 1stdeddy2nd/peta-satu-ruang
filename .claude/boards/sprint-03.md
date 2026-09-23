# Sprint 03 — bring the data to the user

- **Status:** Closed
- **Milestone:** MVP v1
- **Goal:** one place to get satellite imagery and reference geometry, instead
  of five platforms the user would otherwise need GIS training to navigate.
- MC-054 (fresher Sentinel-2 compositing) was written up during planning but
  never scheduled into this sprint's work; moved to the backlog on close
  rather than left stranded here — see `../tickets/backlog/MC-054-fresher-cloud-free-sentinel2.md`.

## Design decisions from planning this sprint
- **No generative AI as a geometry source.** A generative model (e.g. Gemini's
  image-editing model) doesn't reconstruct what's under a cloud — it invents
  something plausible. For a product whose users trace real administrative
  boundaries, silently fabricated pixels under a traced polygon is a trust and
  legal problem, not a technical nicety. Where imagery needs to look clean,
  the standard is cloud-masking + multi-date compositing over real pixels
  (what MC-050's source already does upstream) — never pixel invention.
- **"Auto-generate a polygon" is answered by importing existing open
  segmentation output** (MC-051: Google Open Buildings, Microsoft Building
  Footprints), not by running our own AI over raw imagery. Same result the
  user wanted, at a fraction of the cost and risk. Running our own model is
  the much bigger analysis-plugin bet (MC-029) — not this sprint.
- **Commercial licensing is a real gate, not a footnote.** MC-050's imagery
  source is non-commercial-only on its free tier; both tickets here lean on
  MC-042 (legal review, already backlogged) to confirm what's actually safe
  to ship, rather than assuming.
- **Government sources are a trust problem, not just a data problem.** For
  fire/hazard data specifically, Indonesia's own SIPONGI isn't trusted by the
  product owner. NASA FIRMS carries the same underlying MODIS/VIIRS
  detections SIPONGI is itself built from, without going through KLHK's
  pipeline — same physical facts, independent source (MC-052).

- **Basemap, not overlay.** MC-050 shipped as a mutually-exclusive OSM ↔
  Sentinel-2 dropdown, not a toggle stacked on top of OSM — two attributions
  at once made the bottom-right credit too long to read. One basemap
  visible, one credit visible.
- **Free over paid for MVP, even when paid is much less work.** MC-054 could
  buy exactly what it needs from Sentinel Hub for ~€25–83/month; decided
  against it — a pre-revenue product has no revenue to pay a subscription
  from. Building the same thing ourselves on AWS's free, open Sentinel-2
  archive is the only acceptable path, which is also why MC-054 stays
  ticketed rather than scheduled: that free path is real new infrastructure,
  not a quick add.
- **MC-051 turned out to need the exact same self-host-or-nothing shape as
  MC-054, for the same underlying reason:** neither Google's nor Microsoft's
  building-footprint data has a query-by-area API, only bulk per-country
  files (Microsoft's Indonesia file is one 4.4GB zip). Unlike MC-054 though,
  this one got built rather than just ticketed — importing once into our own
  PostGIS is real one-time work (hours, not minutes), but the resulting
  feature (a fast bbox query) is small, ordinary, and cheap to run forever
  after. Dev/CI use a 5-building fixture seeded by `prisma/seed.ts`; the real
  Indonesia-wide import is a separate one-off script
  (`scripts/import-building-footprints.mjs`), not something CI ever runs.
- **Never pre-compute what a database can answer live.** MC-059's first
  instinct — clip and store building footprints for every one of 81,912
  villages ahead of time — was rejected in favor of one `ST_Intersects` join
  at request time, index-assisted on both tables. Proved fast in practice: a
  real village query against 64M buildings and 82K boundaries, live, in well
  under a second.
- **Per-admin-level pre-clipped storage came up again for MC-063 and was
  rejected again, same reasoning as MC-059.** What was actually wanted instead
  is orchestration/provenance over the existing gather steps (MC-061), with an
  idempotent skip-if-exists rule and a DAG view — not new stored geometry.
- **A returned API field isn't "done" until it's actually rendered.** Both
  MC-051 and MC-059's attribution strings were faithfully returned by the
  API and typed all the way through the client — and silently never reached
  the screen, because nothing attached them to the `VectorSource`. Caught
  while verifying MC-059's own attribution requirement, which forced
  actually looking at `.ol-attribution` instead of trusting the panel copy.
  Fixed for both at once; worth remembering that "the data got there" and
  "the user can see it" are different claims needing different checks.

## Data freshness at a glance
| Ticket | Source | Cadence |
|---|---|---|
| MC-050 | Sentinel-2 (EOX cloudless mosaic, 2025) | Annual |
| MC-053 | Sentinel-2 (EOX, 2020–2025 picker) | Annual, historical |
| MC-054 | Sentinel-2 (our own recent composite, free path only) | Weeks–months, not annual — ticketed, not scheduled |
| MC-051 | Google Open Buildings / MS Building Footprints | Static, ~2023–24 vintage for Indonesia |
| MC-059 | HDX admin boundaries (BPS via UN OCHA) | Static, boundaries as of ~2020 |
| MC-052 | NASA FIRMS fire hotspots | Minutes (Himawari) to 3 hours (MODIS/VIIRS) |

| Ticket | Title | Status |
|---|---|---|
| [MC-050](../tickets/sprint-03/MC-050-sentinel2-imagery-layer.md) | Sentinel-2 imagery as a selectable layer | DONE |
| [MC-053](../tickets/sprint-03/MC-053-sentinel2-year-picker.md) | Sentinel-2 historical year picker (2020–2025) | DONE |
| [MC-051](../tickets/sprint-03/MC-051-building-footprint-import.md) | Import open building-footprint polygons | DONE |
| [MC-059](../tickets/sprint-03/MC-059-admin-boundary-import.md) | Import Indonesia admin boundaries, clip buildings on request | DONE |
| [MC-052](../tickets/sprint-03/MC-052-fire-hotspot-layer.md) | Near-real-time fire/hotspot layer (NASA FIRMS) | DONE |
| [MC-055](../tickets/sprint-03/MC-055-contexts-naming-consistency.md) | Make `contexts/*` file naming and structure consistent | DONE |
| [MC-060](../tickets/sprint-03/MC-060-data-library-panel.md) | A "Data Library" for everything we've already gathered | DONE |
| [MC-061](../tickets/sprint-03/MC-061-async-import-pipeline.md) | Async, retryable pipeline for on-demand dataset imports | DONE |
| [MC-063](../tickets/sprint-03/MC-063-pipeline-orchestration-dag.md) | Composite data pipelines with idempotent steps, visualized as a DAG | DONE |
| [MC-064](../tickets/sprint-03/MC-064-remove-import-jobs-dashboard.md) | Remove the per-job import dashboard | DONE |
| [MC-065](../tickets/sprint-03/MC-065-buildings-by-any-admin-level.md) | Get buildings by province, city or district, not only village | DONE |
| [MC-067](../tickets/sprint-03/MC-067-go-to-my-location.md) | "Go to my location" button | DONE |
| [MC-069](../tickets/sprint-03/MC-069-lazy-load-pdf-encoder.md) | Load the PDF encoder only when someone exports | DONE |
| [MC-057](../tickets/sprint-03/MC-057-e2e-shared-project-state.md) | e2e specs pollute each other through the one persisted project | DONE |
| [MC-056](../tickets/sprint-03/MC-056-kml-z-dimension-crash.md) | KML uploads with altitude (Z-dimension) crash persistence | DONE |
