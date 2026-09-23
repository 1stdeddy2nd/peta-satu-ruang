import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  LayerFeaturePayload,
  LayerMetaPayload,
  LayerWithFeaturesResponse,
  LayoutDocument,
} from "./project-types";

/** Seeded onto the admin account's one project at `db-seed` time — see prisma/seed.ts. */
export const DEFAULT_LAYOUT: LayoutDocument = {
  page: { size: "A4", orientation: "landscape", dpi: 96, marginMm: 10 },
  mapFrame: { x: 0, y: 0, width: 0, height: 0 },
  template: "blank",
  regions: [],
  elements: [],
  view: {
    displayProjection: "EPSG:4326",
    format: "DD",
    center: [107.6191, -6.9175],
    zoom: 12,
    scaleDenominator: 250000,
  },
  graticule: {
    enabled: false,
    intervalDeg: "auto",
    color: "#00000066",
    showLabels: true,
    labelFontSize: 10,
  },
  basemap: "osm",
  sentinel2Year: 2025,
};

/**
 * Every user has exactly one project today (MC-015 stage 2); named/multiple
 * projects are MC-015 stage 3. The seed creates it, so this never creates one
 * itself — a missing project means the seed hasn't run, which is worth
 * surfacing rather than papering over.
 */
export async function getUserProject(userId: string) {
  return prisma.project.findFirst({ where: { userId } });
}

export async function loadLayersWithFeatures(
  projectId: string
): Promise<LayerWithFeaturesResponse[]> {
  const layers = await prisma.layer.findMany({
    where: { projectId },
    orderBy: { sortOrder: "asc" },
  });

  const withFeatures = await Promise.all(
    layers.map(async (layer) => {
      const rows = await prisma.$queryRaw<{ properties: unknown; geometry: string }[]>`
        SELECT properties, ST_AsGeoJSON(geom) as geometry
        FROM "Feature"
        WHERE "layerId" = ${layer.id}
      `;
      const features: LayerFeaturePayload[] = rows.map((row) => ({
        properties: row.properties as Record<string, unknown>,
        geometry: JSON.parse(row.geometry),
      }));

      const meta: LayerWithFeaturesResponse = {
        id: layer.id,
        name: layer.name,
        color: layer.color,
        opacity: layer.opacity,
        visible: layer.visible,
        geometryType: layer.geometryType,
        attributes: layer.attributes as string[],
        styleMode: layer.styleMode as "single" | "categorised",
        categoryField: layer.categoryField,
        categories: layer.categories as { value: string; color: string }[],
        sortOrder: layer.sortOrder,
        features,
      };
      return meta;
    })
  );

  return withFeatures;
}

export async function saveLayout(projectId: string, layout: LayoutDocument) {
  await prisma.project.update({
    where: { id: projectId },
    data: { layout: layout as unknown as Prisma.InputJsonValue },
  });
}

/** Replaces every layer's metadata for the project. Never touches `Feature` rows. */
export async function saveLayerMetadata(projectId: string, layers: LayerMetaPayload[]) {
  await prisma.$transaction(
    layers.map((layer) =>
      prisma.layer.updateMany({
        where: { id: layer.id, projectId },
        data: {
          name: layer.name,
          color: layer.color,
          opacity: layer.opacity,
          visible: layer.visible,
          geometryType: layer.geometryType,
          attributes: layer.attributes,
          styleMode: layer.styleMode,
          categoryField: layer.categoryField,
          categories: layer.categories as unknown as Prisma.InputJsonValue,
          sortOrder: layer.sortOrder,
        },
      })
    )
  );
}

/** Creates a layer and its features in one go. Wrapped in a transaction so a
 * concurrent delete of the same layer blocks instead of racing the feature
 * inserts and hitting `Feature_layerId_fkey`. */
export async function createLayerWithFeatures(
  projectId: string,
  meta: LayerMetaPayload,
  features: LayerFeaturePayload[]
) {
  await prisma.$transaction(
    async (tx) => {
      await tx.layer.create({
        data: {
          id: meta.id,
          projectId,
          name: meta.name,
          color: meta.color,
          opacity: meta.opacity,
          visible: meta.visible,
          geometryType: meta.geometryType,
          attributes: meta.attributes,
          styleMode: meta.styleMode,
          categoryField: meta.categoryField,
          categories: meta.categories as unknown as Prisma.InputJsonValue,
          sortOrder: meta.sortOrder,
        },
      });

      for (const feature of features) {
        await tx.$executeRaw`
          -- Force2D: the column is 2D and KML routinely carries an altitude,
          -- which Postgres rejects outright rather than dropping.
          INSERT INTO "Feature" (id, "layerId", properties, geom)
          VALUES (
            gen_random_uuid()::text,
            ${meta.id},
            ${feature.properties}::jsonb,
            ST_Force2D(ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(feature.geometry)}), 3857))
          )
        `;
      }
    },
    { timeout: 60_000 } // Prisma's 5s default is too short for many features
  );
}

export async function deleteLayer(projectId: string, layerId: string) {
  await prisma.layer.deleteMany({ where: { id: layerId, projectId } });
}
