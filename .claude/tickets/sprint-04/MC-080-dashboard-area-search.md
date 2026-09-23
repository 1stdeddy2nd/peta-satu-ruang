# MC-080 — Search an admin area and show its boundary

- **Status:** DONE
- **Board:** sprint-04
- **Type:** feature
- **Milestone:** MVP v1

## Why
The search box is the most prominent control on the dashboard (MC-078), and
naming a place is how most people find it. Someone who knows their kecamatan
or desa should be able to type it and see where it is and where it ends.

## Functionality
- Typing two or more letters searches every admin level: provinsi,
  kota/kabupaten, kecamatan and desa/kelurahan. Up to 8 results, larger
  areas first: provinsi, then kota/kabupaten, kecamatan, desa. Within a
  level, names starting with the typed text come first. "Surabaya" puts Kota
  Surabaya on top rather than the many villages named Surabaya.
- Each result shows its level and the areas it sits inside, e.g.
  "Kecamatan · Riau · Kota Pekanbaru".
- Picking a result (click, or Enter for the first) draws its boundary in blue
  and fits the map to it. Picking another replaces it.
- The × in the box clears the text and removes the boundary.
- The boundary is credited to BPS/HDX on the map while it is shown.

## Implementation
- Queries move to `src/server/admin-queries.ts`; `/api/admin-boundaries`
  validates its input with zod and still requires sign-in. Adds `zod`
  (MIT, server-only).
- The outline is simplified relative to the area's own size, so a small
  kecamatan keeps its shape and a province stays small enough to send.

## Non-goals
- The "Batas Wilayah" toggle in the layer dock stays inert.
- No buildings, fires or statistics for the picked area.

## Acceptance criteria
- [x] A province, a city, a kecamatan and a desa can each be found by name.
- [x] Larger areas rank first: "Surabaya" shows Kota Surabaya at the top.
- [x] Picking one draws its boundary and fits the map to it.
- [x] Clearing the search removes the boundary.
- [x] The editor's area picker still works.
