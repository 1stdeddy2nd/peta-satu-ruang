# MC-003 — Vector data upload

- **Status:** DONE
- **Board:** sprint-01
- **Type:** feature
- **Milestone:** v0

## Why
Nothing works until the user's own data is on the map.

## Functionality
- Drag-and-drop or file picker in the Analysis sidebar.
- Accepts `.geojson` / `.json`, `.kml`, and zipped Shapefile `.zip`.
- Each file becomes its own OpenLayers vector layer with a palette colour.
- Reprojects from EPSG:4326 to EPSG:3857 on read.
- Fits the view to the new layer's extent; toasts feature count.
- Unsupported extensions produce a clear error toast.

## Test data
`examples/` holds the same five Jakarta polygons in all three formats, so the
parsers can be compared against each other — see `examples/README.md`.

## Acceptance criteria
- [x] All three formats load and render.
- [x] Multiple files can be added and are listed separately.
- [x] The three sample files produce identical, overlapping geometry (5 polygon
      features each), confirming the parsers agree.
