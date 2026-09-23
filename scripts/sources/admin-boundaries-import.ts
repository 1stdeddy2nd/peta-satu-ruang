import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import type { Feature } from "geojson";
import { geometryToWkt } from "../lib/mercator-wkt";
import { csvField, csvFieldOrNull, copyRows } from "../lib/pg-copy";

const BATCH_SIZE = 20_000;

const COLUMNS = ["id", "level", "name", "properties", "geom", "pcode", "parentPcode"];

export interface ImportResult {
  imported: number;
  skipped: number;
}

/** The .geojson files hold one Feature per line, not a single JSON blob. */
export async function importAdminBoundaryFile(
  level: number,
  filePath: string
): Promise<ImportResult> {
  const rl = createInterface({
    input: createReadStream(filePath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  let imported = 0;
  let skipped = 0;
  let idCounter = 0;
  let batch: string[] = [];
  const nameKey = `adm${level}_name`;
  const pcodeKey = `adm${level}_pcode`;
  const parentPcodeKey = level > 1 ? `adm${level - 1}_pcode` : null;

  for await (const line of rl) {
    const trimmed = line.trim().replace(/,$/, "");
    if (!trimmed.startsWith('{"type":"Feature"')) continue;

    let feature: Feature;
    try {
      feature = JSON.parse(trimmed);
    } catch {
      skipped += 1;
      continue;
    }

    const wkt = feature.geometry ? geometryToWkt(feature.geometry) : null;
    if (!wkt) {
      skipped += 1;
      continue;
    }

    idCounter += 1;
    const props = feature.properties as Record<string, unknown> | null;
    const name = props?.[nameKey] ?? "(unnamed)";
    const row = [
      csvField(`ab${level}_${idCounter.toString(36)}`),
      String(level),
      csvField(name),
      csvField(JSON.stringify(feature.properties ?? {})),
      csvField(`SRID=3857;${wkt}`),
      csvFieldOrNull(props?.[pcodeKey]),
      csvFieldOrNull(parentPcodeKey ? props?.[parentPcodeKey] : null),
    ].join(",");
    batch.push(row);

    if (batch.length >= BATCH_SIZE) {
      await copyRows("AdminBoundary", COLUMNS, batch);
      imported += batch.length;
      batch = [];
    }
  }

  if (batch.length > 0) {
    await copyRows("AdminBoundary", COLUMNS, batch);
    imported += batch.length;
  }

  return { imported, skipped };
}
