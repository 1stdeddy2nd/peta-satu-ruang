# MC-060 — A "Data Library" for everything we've already gathered

- **Status:** DONE
- **Board:** sprint-03
- **Type:** feature
- **Milestone:** MVP v1

## Why
Raised directly, thinking as a user opening Analysis mode: right now the
integrated sources (Sentinel-2, building footprints, admin boundaries) are
scattered across separate, differently-shaped panel sections — a basemap
dropdown, a button, a search dialog. A user has no single place that says
"here is everything MapCanva already has, ready to add." That's exactly the
sprint's own stated goal (`sprint-03.md`: "one place... instead of five
platforms") not yet delivered at the UI level, even though the data behind
it is.

## Functionality
- A "Data Library" entry point in Analysis mode listing every integrated
  source as a card: name, one-line description, vintage/cadence, license,
  and a primary action to add it (current-view import, village picker, or
  basemap switch, whichever fits that source).
- **Each card also links to the original upstream source** — the same URL
  we used ourselves (HDX dataset page, Microsoft's GitHub repo, EOX's site)
  — so a user who wants the raw data directly, or wants to verify
  provenance themselves, doesn't have to ask us where it came from.
- Sources listed at launch: Sentinel-2 cloudless (MC-050/053), Microsoft
  Building Footprints (MC-051), HDX admin boundaries (MC-059). NASA FIRMS
  (MC-052) and any future source join the same list as they ship — this
  panel is the catalog, not a one-off page.

## Non-goals
- Not a redesign of how each source is actually added (the bbox-vs-boundary
  mechanics stay as built) — this is a consolidated entry point in front of
  them, not new fetch logic.
- Not the async job pipeline (MC-061) — this panel lists what's already
  queryable today. Triggering a new background import is MC-061's concern;
  this ticket can link to that UI once it exists, not build it.

## Built
Replaced the separate "Basemap" and "Reference data" sections with one
"Data library" section (`AnalysisPanel.tsx`) of three `DataSourceCard`s
(new reusable molecule) — Sentinel-2 cloudless, Building footprints, Admin
boundaries — each with its own description, license/vintage caption, and a
"View source" link to the actual upstream page (EOX, Microsoft's GitHub
repo, HDX's dataset page). Verified in a browser: all three cards render
with working actions, existing functionality (basemap switch, year picker,
current-view import, village search) unchanged underneath.

Re-ran MC-050, MC-051, MC-053, and MC-059's e2e specs against the new
layout — one button label changed ("Import building footprints (current
view)" → "Import for current view", now that the card title already says
"Building footprints") and needed its selector updated; all four pass clean
otherwise, confirming the consolidation didn't regress the underlying
mechanics.

## Moved into a dialog
The product owner, seeing it built: "data library is good, but would be better
if have button to show modal, or its better independent page."

A dialog, not a page. Splitting it to its own route was measured and rejected
for the same reason as Analysis/Layout (MC-069): the value of the library is
"put this on my map", and a route puts a navigation between choosing and seeing
the result — the opposite of what a slow connection needs. A dialog keeps the
map visible behind it.

It also fixes a real constraint: three source cards in a 336px sidebar were
cramped, and MC-065's four-level cascade made that worse. The dialog gives them
a three-column row.

The panel now carries a "Browse the data library" button and, separately,
"Go to my location" — the latter is map navigation rather than a data source,
so it stays one click away rather than being buried behind the dialog.

**This is the non-specialist's route to data, so it is deliberately prominent.**
Someone who already owns a shapefile uploads it; someone who does not know
spatial needs a curated list, which is `01-product.md`'s "a good default beats
a new control".

## Acceptance criteria
- [x] Opening Analysis mode shows one place listing every integrated source,
      not scattered sections.
- [x] Each source states its own vintage/cadence and license at a glance.
- [x] Each source links to the actual upstream page we sourced it from.
- [x] The library opens from a button, over the map, not squeezed in the panel.
- [x] Adding a new future source means adding one card, not new UI plumbing
      — `DataSourceCard` takes title/description/meta/sourceUrl + the
      source's own action as children, so NASA FIRMS (MC-052) or anything
      else slots in the same way.
