# MC-028 — Inset map follows the main basemap

- **Status:** DONE
- **Board:** sprint-01
- **Type:** bug
- **Milestone:** MVP v1

## Why now
Cosmetic and small.

## Functionality
The inset map is hardcoded to OSM (`organisms/canvas/InsetMap.tsx`). It should
use whatever basemap the main map is set to, including "none".

## How it works
`createBasemapSource` is now shared between the main map and the inset, so there
is one definition of what each basemap is. The inset swaps source in place and
hides its tiles for "No basemap", exactly as the main map does.

## Superseded in part by MC-040
With OpenStreetMap the only basemap, there is no longer a choice for the inset to
follow, and that effect was removed. What survives is the useful half: one shared
`createBasemapSource`, so the inset and the main map cannot drift apart.

## Acceptance criteria
- [x] Choosing Carto Dark or Carto Light restyles the inset too.
- [x] "No basemap" clears the inset's tiles but keeps the extent box.
- [~] Walkthrough removed with MC-040: it drove the basemap picker, which no
      longer exists.
