import { prisma } from "@/lib/prisma";
import type { AdminAreaOutline, AdminAreaResult, AdminBoundaryOption } from "@/lib/admin-types";
import type { Geometry } from "geojson";

const SEARCH_LIMIT = 8;

interface BoundaryProperties {
  adm1_name?: string;
  adm2_name?: string;
  adm3_name?: string;
  adm4_name?: string;
}

function pathOf(level: number, props: BoundaryProperties): string {
  const names = [props.adm1_name, props.adm2_name, props.adm3_name, props.adm4_name];
  return names.slice(0, Math.max(level - 1, 0)).filter(Boolean).join(" · ");
}

export async function searchAdminAreas(q: string): Promise<AdminAreaResult[]> {
  const rows = await prisma.$queryRaw<
    { pcode: string; name: string; level: number; properties: BoundaryProperties }[]
  >`
    SELECT pcode, name, level, properties
    FROM "AdminBoundary"
    WHERE pcode IS NOT NULL AND name ILIKE ${`%${q}%`}
    ORDER BY level ASC, (name ILIKE ${`${q}%`}) DESC, name ASC
    LIMIT ${SEARCH_LIMIT}
  `;

  return rows.map((row) => ({
    pcode: row.pcode,
    name: row.name,
    level: row.level,
    path: pathOf(row.level, row.properties),
  }));
}

export async function adminAreaOutline(pcode: string): Promise<AdminAreaOutline | null> {
  const boundary = await prisma.adminBoundary.findFirst({
    where: { pcode },
    select: { name: true, level: true, properties: true },
  });
  if (!boundary) return null;

  // The tolerance must scale with the area's own extent: a fixed one collapses a
  // city district to a triangle while barely touching a province.
  const [row] = await prisma.$queryRaw<
    { geometry: string; minLon: number; minLat: number; maxLon: number; maxLat: number }[]
  >`
    WITH b AS (
      SELECT ST_Transform(geom, 4326) AS g
      FROM "AdminBoundary"
      WHERE pcode = ${pcode}
      LIMIT 1
    ),
    t AS (
      SELECT g,
             LEAST(
               GREATEST(
                 GREATEST(ST_XMax(g) - ST_XMin(g), ST_YMax(g) - ST_YMin(g)) / 800.0,
                 0.00002
               ),
               0.01
             ) AS tol
      FROM b
    )
    SELECT ST_AsGeoJSON(ST_SimplifyPreserveTopology(g, tol), 5) AS geometry,
           ST_XMin(g) AS "minLon", ST_YMin(g) AS "minLat",
           ST_XMax(g) AS "maxLon", ST_YMax(g) AS "maxLat"
    FROM t
  `;
  if (!row) return null;

  return {
    pcode,
    name: boundary.name,
    level: boundary.level,
    path: pathOf(boundary.level, boundary.properties as BoundaryProperties),
    bbox: [row.minLon, row.minLat, row.maxLon, row.maxLat],
    geometry: JSON.parse(row.geometry) as Geometry,
  };
}

export async function adminAreaAt(lon: number, lat: number): Promise<AdminAreaResult | null> {
  const [row] = await prisma.$queryRaw<
    { pcode: string; name: string; level: number; properties: BoundaryProperties }[]
  >`
    SELECT pcode, name, level, properties
    FROM "AdminBoundary"
    WHERE level = 4
      AND pcode IS NOT NULL
      AND ST_Contains(geom, ST_Transform(ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326), 3857))
    LIMIT 1
  `;
  if (!row) return null;
  return { pcode: row.pcode, name: row.name, level: row.level, path: pathOf(row.level, row.properties) };
}

export async function adminBoundaryOptions(
  level: number,
  parent?: string
): Promise<AdminBoundaryOption[]> {
  const rows = await prisma.adminBoundary.findMany({
    where: { level, ...(level > 1 ? { parentPcode: parent } : {}) },
    select: { id: true, pcode: true, name: true },
    orderBy: { name: "asc" },
  });

  return rows
    .filter((r): r is typeof r & { pcode: string } => r.pcode !== null)
    .map((r) => ({ id: r.id, pcode: r.pcode, name: r.name }));
}
