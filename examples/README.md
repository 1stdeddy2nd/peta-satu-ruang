# Sample data

Test fixtures for the upload path (MC-003). The same five simplified DKI
Jakarta kota polygons in each of the three supported formats, so loading all
three should produce three identical, perfectly overlapping layers.

| File | Format |
|---|---|
| `jakarta-admin.geojson` | GeoJSON |
| `jakarta-admin.kml` | KML |
| `jakarta-admin-shp.zip` | Shapefile — `.shp` / `.shx` / `.dbf` / `.prj`, zipped |

Each feature carries `kode`, `nama` and `provinsi`, which is what an attribute
table (MC-023) and styling by attribute (MC-024) will need.

All are EPSG:4326 and get reprojected to EPSG:3857 on read.

**These are coarse rectangles, not real boundaries.** They exist to exercise
the parsers, not to be accurate. Do not use them on an actual map.
