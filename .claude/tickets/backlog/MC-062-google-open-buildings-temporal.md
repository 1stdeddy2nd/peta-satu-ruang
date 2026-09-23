# MC-062 — Google Open Buildings 2.5D Temporal dataset

- **Status:** TODO
- **Board:** backlog
- **Type:** feature
- **Milestone:** post-MVP

## Why parked
Raised directly, from <https://sites.research.google/gr/open-buildings/temporal>.
Checked it against the source rather than assuming: it's genuinely valuable,
but it is not the same kind of thing as anything built so far, and doesn't
slot into the existing pipeline.

**What it actually is**: raster grids, not vector polygons — three channels
(building presence, height, fractional count) per pixel, ~4m effective
resolution, one layer per year for **2016–2023**, derived from stacks of
Sentinel-2 imagery. Answers "how did this area's built-up density and height
change year over year" — a genuinely compelling question for planning use
cases — but a different question than "what is the shape of this building,"
which MC-051/MC-059 already answer well.

**License**: dual CC BY-4.0 / ODbL — commercial use allowed, no legal
blocker. Not the issue; the issue is everything downstream of "we only have
vector infrastructure today."

## Why this is a real, separate undertaking, not an extension of MC-051
- Requires raster storage/serving — nothing in the current stack (Postgres
  tables of PostGIS geometry) reads or serves raster tiles as data (as
  opposed to Sentinel-2's case, MC-050, which is a display-only image tile
  layer we don't ourselves store or analyze — this dataset would need to be
  *queried*, e.g. "average building height in this village," not just drawn).
- 8 years × global coverage is a very different scale question than one
  country's vector footprints — needs its own sizing/feasibility pass before
  any import commitment, the same way MC-051's bbox-API assumption got
  checked before design, not after.
- Distribution is via Earth Engine or a Colab-driven GCS download, not a
  plain per-country file — closer to MC-054's "real new infrastructure"
  situation than MC-051's "download one zip."

## Functionality (sketch, not committed)
- Server-side: fetch/store per-year raster summaries for a requested area
  (likely via Earth Engine's API rather than downloading raw global rasters).
- Client-side: a year slider showing building presence/height change over
  time for a selected boundary — genuinely new UI, not a reuse of the
  existing basemap/footprint patterns.

## Acceptance criteria
- [ ] A feasibility spike confirms the actual access path (Earth Engine API
      vs. bulk GCS) and its cost/complexity before this is scheduled into a
      sprint.
- [ ] A decision on whether this becomes its own analysis-plugin-style
      feature (MC-029) rather than a basic import, given it's fundamentally
      about change-over-time analysis, not reference geometry.
