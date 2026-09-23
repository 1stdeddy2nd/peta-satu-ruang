# MC-056 — KML uploads with altitude (Z-dimension) crash persistence

- **Status:** DONE
- **Board:** sprint-03
- **Type:** bug
- **Milestone:** MVP v1

## Why
Found running the full e2e suite while implementing MC-055 (an unrelated file
rename) — not a regression from that change, a pre-existing bug in MC-015
that the full suite had apparently never been run against end to end before.

Uploading `examples/jakarta-admin.kml` (and presumably any KML with altitude
values, which is common — many KML exporters write `0` for every point rather
than omitting the third coordinate) fails to persist:

```
Raw query failed. Code: 22023. Message: ERROR: Geometry has Z dimension but column does not
    at async createLayerWithFeatures (src/contexts/project/project-utils.ts)
```

`Feature.geom` is declared `geometry(Geometry, 3857)` — 2D only. KML's parsed
geometry keeps whatever dimensionality the source file has; if it's XYZ,
`ST_GeomFromGeoJSON` produces a 3D geometry and the insert is rejected by
Postgres.

## Impact
- The layer's metadata row is still created (`prisma.layer.create` runs
  before the per-feature insert loop), but zero features persist — a user
  sees the layer appear to upload successfully in the UI (upload is
  fire-and-forget, MC-015's `createLayer` call isn't awaited by the upload
  flow) and only discovers data is missing after a reload.
- Silent data loss on a supported upload format (KML, MC-003) is worse than a
  visible error would be.

## Functionality
- Strip the Z dimension before insert — either `ST_Force2D(ST_GeomFromGeoJSON(...))`
  server-side, or drop the third coordinate client-side before sending the
  GeoJSON payload. Server-side is the safer fix: it protects every caller,
  not just the current upload path.
- Surface the failure to the user if a whole layer's persistence still fails
  for some other reason — silent fire-and-forget on `createLayer` (in
  `contexts/project/project-api.ts`) means today's upload UI can't tell.

## Acceptance criteria
- [x] Uploading a KML with Z-dimension coordinates persists every feature.
- [x] `e2e/MC-003-data-upload.spec.ts` and `e2e/MC-004-layer-manager.spec.ts`
      (both upload the KML fixture) pass without a server-side error in the
      log.
- [x] A persistence failure that isn't the Z-dimension case is at least
      visible somewhere (console, toast) rather than fully silent.

## Built
`ST_Force2D` around the insert in `createLayerWithFeatures` — server-side, so
it covers every caller. There is only one GeoJSON insert path in the codebase,
so nothing else was exposed.

`createLayer` now throws on a non-OK response, and both call sites route
through `saveLayerOrWarn`, which toasts that the layer could not be saved and
will be gone after a reload. It was `void`-ed before, so any failure was
completely silent.

`MC-003` now reloads and asserts all three uploads are still listed. It
previously checked only that they appeared, which is why the suite ran green
over known data loss for several sprints.

## Verified
Full suite: 28 passed in 6.1m, with zero Z-dimension, Prisma, auth or
connection errors in the log — the error count, not just pass/fail.
