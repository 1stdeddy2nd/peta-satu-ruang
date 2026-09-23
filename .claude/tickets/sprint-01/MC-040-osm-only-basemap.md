# MC-040 — Reduce basemaps to OpenStreetMap only

- **Status:** DONE
- **Board:** sprint-01
- **Type:** chore
- **Milestone:** MVP v1

## Why
Carto Light and Carto Dark are CARTO's service under CARTO's terms. The raster
endpoints we call happen to work without a key today, but shipping a commercial
product on someone else's tiles without an account is a licensing risk we do not
need to carry. Two fewer basemaps also means one attribution line instead of two.

## Functionality
- OpenStreetMap is the **only** basemap. Carto sources removed.
- "No basemap" removed too, on the owner's call.
- With one source there is nothing to choose, so the **basemap picker is gone**
  entirely rather than left as a one-item dropdown. MC-005 returns to the
  backlog; MC-028's follow-the-basemap effect goes with it, keeping only the
  shared source factory.

## Open question — this does not make us clear
OSM's public tile servers have their own **Tile Usage Policy**, which rules out
heavy or commercial use of `tile.openstreetmap.org`. So OSM-only fixes the CARTO
question but not the underlying one: a deployed product needs either its own
tile server or a commercial provider (MapTiler, Stadia, Protomaps).

That is a decision for before launch, not for this ticket. Worth its own ticket
once MC-033 makes deployment real.

## Acceptance criteria
- [x] OpenStreetMap is the only source, and the picker is gone.
- [x] No request reaches a CARTO endpoint — the walkthrough fails if one does.
- [x] The inset still follows the choice (MC-028).
- [x] Walkthrough: `e2e/videos/MC-040-osm-only-basemap.webm`.
