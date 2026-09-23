import type { Geometry } from "geojson";

export interface AdminBoundaryOption {
  id: string;
  pcode: string;
  name: string;
}

export interface AdminAreaResult {
  pcode: string;
  name: string;
  level: number;
  path: string;
}

export interface AdminAreaOutline extends AdminAreaResult {
  bbox: [minLon: number, minLat: number, maxLon: number, maxLat: number];
  geometry: Geometry;
}
