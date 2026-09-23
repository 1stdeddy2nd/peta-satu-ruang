import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import type { Feature } from "geojson";
import { geometryToWkt } from "../lib/mercator-wkt";
import { csvField, copyRows } from "../lib/pg-copy";

export const SOURCE = "ms-building-footprints";
const BATCH_SIZE = 200_000;

export interface ImportProgress {
  lineNo: number;
  imported: number;
  skipped: number;
  elapsedMin: number;
}

export interface ImportResult {
  imported: number;
  skipped: number;
}

/** @param filePath extracted .geojsonl, one Feature per line, EPSG:4326
 * @param opts.source scopes the source column and row id prefix per country,
 *   so a stale-rows delete for one country can't touch another's. */
export async function importBuildingFootprintsFile(
  filePath: string,
  opts: { skipLines?: number; source?: string; onProgress?: (info: ImportProgress) => void } = {}
): Promise<ImportResult> {
  const skipLines = opts.skipLines ?? 0;
  const source = opts.source ?? SOURCE;
  const rl = createInterface({
    input: createReadStream(filePath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  let lineNo = 0;
  let imported = 0;
  let skipped = 0;
  let idCounter = skipLines;
  let batch: string[] = [];
  const started = Date.now();

  for await (const line of rl) {
    lineNo += 1;
    if (lineNo <= skipLines) continue;
    if (!line.trim()) continue;

    let feature: Feature;
    try {
      feature = JSON.parse(line);
    } catch {
      continue;
    }

    const wkt = feature.geometry ? geometryToWkt(feature.geometry) : null;
    if (!wkt) {
      skipped += 1;
      continue;
    }

    idCounter += 1;
    const row = [
      csvField(`bf_${source}_${idCounter.toString(36)}`),
      csvField(source),
      csvField(JSON.stringify(feature.properties ?? {})),
      csvField(`SRID=3857;${wkt}`),
    ].join(",");
    batch.push(row);

    if (batch.length >= BATCH_SIZE) {
      await copyRows("BuildingFootprint", ["id", "source", "properties", "geom"], batch);
      imported += batch.length;
      opts.onProgress?.({
        lineNo,
        imported,
        skipped,
        elapsedMin: (Date.now() - started) / 60000,
      });
      batch = [];
    }
  }

  if (batch.length > 0) {
    await copyRows("BuildingFootprint", ["id", "source", "properties", "geom"], batch);
    imported += batch.length;
  }

  return { imported, skipped };
}
