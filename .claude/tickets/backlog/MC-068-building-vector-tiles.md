# MC-068 — Serve building footprints as vector tiles

- **Status:** TODO
- **Board:** backlog
- **Type:** feature
- **Milestone:** unscheduled

## Why parked
Raised while deciding what a province-level building import should do (MC-065).
The 20,000-feature cap means a city already truncates (Jakarta Pusat is 53,554)
and a province is hopeless (Jawa Barat is 9,536,136). Vector tiles — a PostGIS
`ST_AsMVT` endpoint and an OpenLayers `VectorTile` layer, no new dependency on
OL 10 — would remove the cap entirely: the browser fetches only the tiles on
screen, so the area picked stops mattering and the server does the clipping.

Parked because it is sprint-sized and because it answers the wrong question
first. Rendering 9.5M buildings is not what someone asks of a province; they
want to know which regency has the most. The product owner wants to think
about the shape before committing.

## What makes it expensive here
- **It is a second kind of layer, and the app only knows one.** Every layer is
  a `Layer` row that owns `Feature` rows — that is what makes a project save
  and restore (MC-015). A tile layer owns none, so the colour-by attribute
  list, `styleMode`/`categories` (MC-024), the legend auto-populate (MC-022)
  and the "N features" count all read from features that would not exist.
- **Export is WYSIWYG and non-negotiable.** Tiles load asynchronously, so a
  PDF/PNG capture has to wait for every tile in frame or it exports holes.
- **Low zoom still needs generalisation.** One province-zoom tile can cover
  hundreds of thousands of buildings, so features must be simplified or
  dropped per zoom level regardless.
- **Needs a tile cache**, or every pan re-runs `ST_AsMVT` against 64M rows.

## When to pick it up
When someone actually needs to *see* buildings across a whole province rather
than count them. If the need turns out to be counting, the per-sub-area
summary is the cheaper and better answer and this stays parked.
