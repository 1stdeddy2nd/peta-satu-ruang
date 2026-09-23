# MC-065 — Get buildings by province, city or district, not only village

- **Status:** DONE
- **Board:** sprint-03
- **Type:** feature
- **Milestone:** MVP v1

## Why
Raised by the product owner. `AdminBoundaryPicker` is hardcoded to
`level=4` — a user can pull the buildings in a village and nothing else. A
planner working on a kecamatan or a kabupaten has to pick villages one at a
time, which is exactly the "make the user do the GIS" failure `01-product.md`
is written against.

This is also the payoff MC-063 was built for and has not yet collected. The
tagging step stamped `provincePcode` / `regencyPcode` / `districtPcode` /
`villagePcode` onto 62.9M buildings and indexed all four, but
`/api/building-footprints` still ignores them and does a live `ST_Intersects`
against the boundary polygon. That works at village scale and would be
punishing at province scale — a province polygon against 64M rows is the shape
of query MC-063's own link step spent 13 hours failing to run.

## What this is
1. The picker offers all four levels (Provinsi / Kota-Kabupaten / Kecamatan /
   Desa-Kelurahan) instead of only the last.
2. `/api/building-footprints?boundaryId=` resolves the boundary's `level` and
   `pcode` and filters on the matching indexed column, instead of
   `ST_Intersects` against its geometry.

Same endpoint, same request shape. The bbox path (MC-051) is untouched.

## Why the pcode column and not the polygon
Measured on the real 64M-row table after MC-063 finished:

| query | plan | time |
|---|---|---|
| `WHERE "villagePcode" = ...` | index-only scan | 8.9ms |
| `ST_Intersects` against a village polygon | GiST + exact test | ~500ms |

The gap widens with the boundary's size, and a province is four orders of
magnitude larger in area than a village.

One behavioural difference, accepted: a building whose pcode is NULL is no
longer returned. Those are the 1,014,222 buildings (1.6%) that fall outside
HDX's boundary coverage entirely — a sample of 300 touches no village polygon
even by `ST_Intersects`, so they were never legitimately "inside" the boundary
being asked for.

## The picker is a nested dropdown, not a search modal
First cut put a level selector and a name search inside a dialog. The product
owner rejected it: "that location chooser seems not common use like everyone
use, it usually nested dropdown for province, city, district, village... And
dont modal like that, user will confuse, just use what everyone use."

Correct, and the reasoning is `01-product.md`'s: this is the shape of every
Indonesian address form, so it needs no learning. The modal was worse than
unfamiliar — it hid the map behind the thing you were choosing a place on, and
made picking an area feel like a separate task rather than part of preparing
the data.

Rebuilt as four cascading selects inline in the panel: province → city/regency
→ district → village, each loading its children when its parent is chosen, each
disabled until then. **Any level can be imported** — the button reads "Import
buildings in Gambir" and does not require drilling to a village.

Search is not offered. Once a parent is chosen each list is short (34
provinces, then roughly 10-20 per level), so a plain select is enough and a
combobox would be a primitive to build and a control to explain.

`AdminBoundary.parentPcode` (added by MC-063) is what makes the cascade a plain
indexed lookup rather than a scan through the properties JSON.

## Importing is offered at district and village only
Measured across the tagged data:

| level | areas | avg | over the 20,000 cap |
|---|---|---|---|
| village | 77,474 | 812 | 1 |
| district | 6,722 | 9,362 | 740 (11%) |
| city/regency | 506 | 124,375 | 446 (88%) |
| province | 34 | 1,850,990 | 34 (100%) |

Province and city are navigation: you pick them to drill down, but the import
button stays disabled and reads "Choose a district or village". Offering a
control that fails for 88% of cities and every province is worse than not
offering it.

The level gate is not sufficient on its own — 740 districts are still over the
cap — so the API refuses any area above it by name rather than returning a
partial layer. The check probes `OFFSET 20000 LIMIT 1` (20ms) rather than
`COUNT(*)`, which takes 8s on a province.

The bbox path keeps its truncation warning: it is capped by area, not by
feature count, so it can legitimately fill up.

## Non-goals
- **No new export or analysis feature.** This widens an existing selection
  control; it does not add a way to *do* anything new with the result.
- **No raising of `MAX_FEATURES`.** A province holds millions of buildings and
  the 20,000-feature cap stays. The response now says when it truncated so the
  UI can tell the user plainly rather than silently returning a partial layer.
- **No free-text search.** Superseded by the cascade above; the lists are
  short enough that it would earn nothing.

## Acceptance criteria
- [x] The picker offers province, city/regency, district and village.
- [x] Selecting a boundary at any level returns that area's buildings.
- [x] The query filters on the indexed pcode column, not `ST_Intersects` —
      confirmed by `EXPLAIN` showing an index scan.
- [x] A truncated result is reported as truncated, not returned silently.
- [x] The layer name says which area it came from.

## Built
- `AdminBoundaryPicker` — rewritten as four inline cascading selects (see
  above). Choosing a level clears every level below it, so you cannot end up
  with a district that does not belong to the chosen city.
- `/api/admin-boundaries` — now returns the children of a parent pcode at a
  level, replacing name search. Level 1 needs no parent; the others require
  one, since "every district in Indonesia" is 7,069 rows and not a list to
  hand anyone.
- `SelectField` gained `disabled` and `aria-label`, so the cascade could go
  through the shared atom rather than around it (`03-gotchas.md` requires it).
- `/api/building-footprints?boundaryId=` — resolves the boundary's level to
  one of four pcode columns and filters on it. The column comes from a fixed
  lookup keyed by level, never from the request, since it is interpolated into
  the SQL.
- The response now carries `truncated`, and the client raises a toast naming
  the number returned instead of handing back a partial layer silently.
- `AnalysisPanel` copy no longer says "find a village".

## Verified
`tsc --noEmit`, `eslint` clean. `EXPLAIN ANALYZE` on the real table:
province (`ID31`) and district (`ID3171010`) both index-scan and return 20,000
features in ~125ms — where the same request against a province *polygon* was
the query shape that made MC-063's tagging step unusable.

Driven in a real browser: picked District → "Gambir" → the whole kecamatan
arrived as one layer, "Building footprints (Gambir)", **6,097 features**,
exactly matching `SELECT count(*) ... WHERE "districtPcode" = 'ID3173080'`.

Found while testing: `next dev` was still holding the Prisma Client from
before `pcode` was generated, so `boundary.pcode` read `undefined` and every
request 400'd. Already a known gotcha; restarting dev fixed it.

## Later: both caps removed
The product owner asked to drop `MAX_AREA_M2` and `MAX_FEATURES` outright,
accepting the risk directly ("if it crash i will tell you in the future").
`/api/building-footprints` no longer refuses an over-cap boundary or caps a
bbox query — both now return everything they match. The Non-goal and the
"reported as truncated, not returned silently" criterion above describe what
was built and verified in sprint 03; this is what changed after. A province
(avg 1.85M buildings from the table above) or a wide bbox view can now return
a payload heavier than MC-082's own Bogor case, which was already flagged as
risky at 1.07M buildings (34MB, ~18s, ~3GB browser memory).
