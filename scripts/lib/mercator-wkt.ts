/**
 * Shared by the one-off bulk-import scripts (MC-051, MC-059): reprojects
 * GeoJSON lon/lat coordinates to EPSG:3857 using the same spherical Web
 * Mercator formula OpenLayers' fromLonLat uses, and writes WKT text for a
 * Postgres COPY. Kept import-script-only — the app itself never needs this,
 * since ST_Transform inside Postgres does the one-off staging done here.
 */
import type { Geometry } from "geojson";

const R = 6378137; // Earth radius used by EPSG:3857 (spherical Web Mercator)

export function toMercator([lon, lat]: [number, number]): [number, number] {
  const x = R * ((lon * Math.PI) / 180);
  const clampedLat = Math.max(Math.min(lat, 85.05112878), -85.05112878);
  const y = R * Math.log(Math.tan(Math.PI / 4 + (clampedLat * Math.PI) / 360));
  return [x, y];
}

function ringToWkt(ring: [number, number][]): string {
  return `(${ring.map((pt) => toMercator(pt).join(" ")).join(", ")})`;
}

function polygonToWkt(rings: [number, number][][]): string {
  return `(${rings.map(ringToWkt).join(", ")})`;
}

/** Polygon/MultiPolygon only; anything else (points, lines) returns null. */
export function geometryToWkt(geometry: Geometry): string | null {
  if (geometry.type === "Polygon") {
    return `POLYGON${polygonToWkt(geometry.coordinates as [number, number][][])}`;
  }
  if (geometry.type === "MultiPolygon") {
    return `MULTIPOLYGON(${(geometry.coordinates as [number, number][][][])
      .map(polygonToWkt)
      .join(", ")})`;
  }
  return null;
}

/** CSV field escaping: wrap in quotes, double up any embedded quotes. */
export function csvField(value: unknown): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}
