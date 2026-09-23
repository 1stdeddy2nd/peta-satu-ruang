import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { downloadFile, extractEntry } from "../lib/download";
import { importBuildingFootprintsFile, SOURCE } from "../sources/building-footprints-import";
import { importAdminBoundaryFile } from "../sources/admin-boundaries-import";
import { tagBuildingsByVillage } from "../sources/building-village-tag";
import { createMinioClient, archiveFile } from "../lib/minio-client";
import { execRaw } from "../lib/pg-copy";

export interface JobProgress {
  stage: string;
  [key: string]: unknown;
}

export interface JobResult {
  imported: number;
  skipped: number;
  archiveKey?: string;
}

export type JobRunner = (
  params: Record<string, unknown>,
  opts?: { onProgress?: (info: JobProgress) => void }
) => Promise<JobResult>;

// Only Indonesia has been run end to end; the other two are untested.
const BUILDING_FOOTPRINT_URLS: Record<string, string> = {
  indonesia:
    "https://minedbuildings.z5.web.core.windows.net/legacy/southeast-asia/indonesia.geojsonl.zip",
  malaysia:
    "https://minedbuildings.z5.web.core.windows.net/legacy/southeast-asia/malaysia.geojsonl.zip",
  philippines:
    "https://minedbuildings.z5.web.core.windows.net/legacy/southeast-asia/philippines.geojsonl.zip",
};

const ADMIN_BOUNDARIES_URL =
  "https://data.humdata.org/dataset/84a1d98a-790b-4d66-9d14-bbfa48500802/resource/e1421da4-8f48-47d2-ac49-79ff5bfa4d24/download/idn_admin_boundaries.geojson.zip";

async function withTempDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(path.join(tmpdir(), "mapcanva-import-"));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export const runBuildingFootprintsJob: JobRunner = async (params, { onProgress } = {}) => {
  const country = (params?.country as string) ?? "indonesia";
  const url = BUILDING_FOOTPRINT_URLS[country];
  if (!url) throw new Error(`Unknown country for building-footprints: ${country}`);

  return withTempDir(async (dir) => {
    const zipPath = path.join(dir, `${country}.geojsonl.zip`);
    const geojsonlPath = path.join(dir, `${country}.geojsonl`);

    onProgress?.({ stage: "downloading" });
    await downloadFile(url, zipPath, (p) => onProgress?.({ stage: "downloading", ...p }));

    // Archive before extract can fail, so recovery is a restore not a re-download.
    onProgress?.({ stage: "archiving" });
    const client = createMinioClient();
    const archiveKey = await archiveFile(
      client,
      zipPath,
      `building-footprints/${country}`,
      ".geojsonl.zip",
      { jobType: "building-footprints", sourceUrl: url }
    );

    onProgress?.({ stage: "extracting" });
    await extractEntry(zipPath, `${country}.geojsonl`, geojsonlPath);

    // Scoped per country, or refreshing one wipes every other country's rows.
    const source = `${SOURCE}:${country}`;

    onProgress?.({ stage: "clearing-stale-rows" });
    await execRaw('DELETE FROM "BuildingFootprint" WHERE source = $1', [source]);

    onProgress?.({ stage: "importing" });
    const result = await importBuildingFootprintsFile(geojsonlPath, {
      source,
      onProgress: (p) => onProgress?.({ stage: "importing", ...p }),
    });

    return { ...result, archiveKey };
  });
};

export const runAdminBoundariesJob: JobRunner = async (_params, { onProgress } = {}) => {
  return withTempDir(async (dir) => {
    const zipPath = path.join(dir, "idn_admin_boundaries.geojson.zip");

    onProgress?.({ stage: "downloading" });
    await downloadFile(ADMIN_BOUNDARIES_URL, zipPath, (p) =>
      onProgress?.({ stage: "downloading", ...p })
    );

    onProgress?.({ stage: "archiving" });
    const client = createMinioClient();
    const archiveKey = await archiveFile(
      client,
      zipPath,
      "admin-boundaries/indonesia",
      ".geojson.zip",
      { jobType: "admin-boundaries", sourceUrl: ADMIN_BOUNDARIES_URL }
    );

    let totalImported = 0;
    let totalSkipped = 0;
    for (const level of [1, 2, 3, 4]) {
      onProgress?.({ stage: "extracting", level });
      const geojsonPath = path.join(dir, `idn_admin${level}.geojson`);
      await extractEntry(zipPath, `idn_admin${level}.geojson`, geojsonPath);

      onProgress?.({ stage: "clearing-stale-rows", level });
      await execRaw('DELETE FROM "AdminBoundary" WHERE level = $1', [level]);

      onProgress?.({ stage: "importing", level });
      const result = await importAdminBoundaryFile(level, geojsonPath);
      totalImported += result.imported;
      totalSkipped += result.skipped;
    }

    return { imported: totalImported, skipped: totalSkipped, archiveKey };
  });
};

export const runBuildingVillageTagJob: JobRunner = async (params, { onProgress } = {}) => {
  const country = (params?.country as string) ?? "indonesia";
  const result = await tagBuildingsByVillage(`${SOURCE}:${country}`, onProgress);
  return { imported: result.tagged, skipped: 0 };
};

export const JOB_RUNNERS: Record<string, JobRunner> = {
  "building-footprints": runBuildingFootprintsJob,
  "admin-boundaries": runAdminBoundariesJob,
  "building-village-tag": runBuildingVillageTagJob,
};
