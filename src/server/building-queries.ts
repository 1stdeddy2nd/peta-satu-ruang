import { prisma } from "@/lib/prisma";
import { BUILDING_PCODE_COLUMN } from "@/lib/building-constants";

export async function buildingGeoJson(pcode: string): Promise<string | null> {
  const boundary = await prisma.adminBoundary.findFirst({
    where: { pcode },
    select: { level: true },
  });
  if (!boundary || boundary.level < 2) return null;

  const [row] = await prisma.$queryRawUnsafe<{ json: string | null }[]>(
    `SELECT '{"type":"FeatureCollection","features":['
            || string_agg('{"type":"Feature","geometry":' || ST_AsGeoJSON(geom, 1) || '}', ',')
            || ']}' AS json
     FROM "BuildingFootprint"
     WHERE "${BUILDING_PCODE_COLUMN[boundary.level]}" = $1`,
    pcode
  );
  return row?.json ?? '{"type":"FeatureCollection","features":[]}';
}
