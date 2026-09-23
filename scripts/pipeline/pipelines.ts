import { execRaw } from "../lib/pg-copy";
import { SOURCE } from "../sources/building-footprints-import";

/** `id` must match the `stage` its job runner reports, or the DAG cannot tell
 * finished processes from pending ones. */
export interface PipelineProcessDef {
  id: string;
  label: string;
}

export interface PipelineStepDef {
  id: string;
  label: string;
  source?: string;
  jobType: string;
  params: Record<string, unknown>;
  dependsOn?: string[];
  processes: PipelineProcessDef[];
}

export interface PipelineDef {
  id: string;
  label: string;
  steps: PipelineStepDef[];
}

const DOWNLOAD_AND_IMPORT: PipelineProcessDef[] = [
  { id: "downloading", label: "Download" },
  { id: "archiving", label: "Archive to MinIO" },
  { id: "extracting", label: "Unpack" },
  { id: "clearing-stale-rows", label: "Clear previous rows" },
  { id: "importing", label: "Import to PostGIS" },
];

export const PIPELINES: PipelineDef[] = [
  {
    id: "indonesia-reference-data",
    label: "Indonesia reference data",
    steps: [
      {
        id: "hdx-admin-boundaries",
        label: "Admin boundaries",
        source: "HDX COD-AB (BPS)",
        jobType: "admin-boundaries",
        params: {},
        processes: DOWNLOAD_AND_IMPORT,
      },
      {
        id: "ms-building-footprints-indonesia",
        label: "Building footprints",
        source: "Microsoft ML Building Footprints",
        jobType: "building-footprints",
        params: { country: "indonesia" },
        processes: DOWNLOAD_AND_IMPORT,
      },
      {
        id: "tag-buildings-by-village-indonesia",
        label: "Tag buildings by village",
        source: "PostGIS — no download",
        jobType: "building-village-tag",
        params: { country: "indonesia" },
        dependsOn: ["hdx-admin-boundaries", "ms-building-footprints-indonesia"],
        processes: [{ id: "tagging", label: "Stamp village pcode per building" }],
      },
    ],
  },
];

export async function stepDataExists(step: PipelineStepDef): Promise<boolean> {
  if (step.jobType === "admin-boundaries") {
    const { rows } = await execRaw(
      `SELECT COUNT(DISTINCT level)::int AS levels FROM "AdminBoundary" WHERE level IN (1,2,3,4)`
    );
    return rows[0]?.levels === 4;
  }
  if (step.jobType === "building-footprints") {
    const country = (step.params.country as string) ?? "indonesia";
    const { rows } = await execRaw(`SELECT 1 FROM "BuildingFootprint" WHERE source = $1 LIMIT 1`, [
      `${SOURCE}:${country}`,
    ]);
    return rows.length > 0;
  }
  if (step.jobType === "building-village-tag") {
    const country = (step.params.country as string) ?? "indonesia";
    const source = `${SOURCE}:${country}`;
    // Never COUNT(*) here — this runs on every dashboard poll against 64M rows.
    const hasAny = await execRaw(`SELECT 1 FROM "BuildingFootprint" WHERE source = $1 LIMIT 1`, [
      source,
    ]);
    if (hasAny.rows.length === 0) return false;
    const hasUntagged = await execRaw(
      `SELECT 1 FROM "BuildingFootprint" WHERE source = $1 AND "villagePcode" IS NULL LIMIT 1`,
      [source]
    );
    return hasUntagged.rows.length === 0;
  }
  return false;
}
