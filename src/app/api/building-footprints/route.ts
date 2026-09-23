import { auth } from "@/contexts/auth";
import { prisma } from "@/lib/prisma";
import { BUILDING_PCODE_COLUMN } from "@/lib/building-constants";

const BUILDINGS_ATTRIBUTION = "Building footprints — Microsoft (CDLA Permissive 2.0), as of ~2024";
const BOUNDARY_ATTRIBUTION =
  "Boundary — Badan Pusat Statistik via UN OCHA/HDX (CC BY-IGO), as of ~2020";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new Response(null, { status: 401 });

  const params = new URL(req.url).searchParams;
  const boundaryId = params.get("boundaryId");

  if (boundaryId) {
    const boundary = await prisma.adminBoundary.findUnique({ where: { id: boundaryId } });
    if (!boundary) return Response.json({ error: "Boundary not found" }, { status: 404 });

    const column = BUILDING_PCODE_COLUMN[boundary.level];
    if (!column || !boundary.pcode) {
      return Response.json({ error: "Boundary has no usable code" }, { status: 400 });
    }

    // The stamped pcode column, not ST_Intersects: a province polygon against
    // 64M rows is unusable.
    const rows = await prisma.$queryRawUnsafe<{ properties: unknown; geometry: string }[]>(
      `SELECT properties, ST_AsGeoJSON(geom) as geometry
       FROM "BuildingFootprint"
       WHERE "${column}" = $1`,
      boundary.pcode
    );

    return Response.json({
      features: rows.map((row) => ({
        properties: row.properties as Record<string, unknown>,
        geometry: JSON.parse(row.geometry),
      })),
      layerName: `Building footprints (${boundary.name})`,
      attribution: `${BUILDINGS_ATTRIBUTION} · ${BOUNDARY_ATTRIBUTION}`,
    });
  }

  const bbox = params.get("bbox");
  const parts = bbox?.split(",").map(Number) ?? [];
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) {
    return Response.json({ error: "Invalid bbox" }, { status: 400 });
  }

  const [minX, minY, maxX, maxY] = parts;

  const rows = await prisma.$queryRaw<{ properties: unknown; geometry: string }[]>`
    SELECT properties, ST_AsGeoJSON(geom) as geometry
    FROM "BuildingFootprint"
    WHERE geom && ST_MakeEnvelope(${minX}, ${minY}, ${maxX}, ${maxY}, 3857)
  `;

  return Response.json({
    features: rows.map((row) => ({
      properties: row.properties as Record<string, unknown>,
      geometry: JSON.parse(row.geometry),
    })),
    layerName: "Building footprints (Microsoft, ~2024)",
    attribution: BUILDINGS_ATTRIBUTION,
  });
}
