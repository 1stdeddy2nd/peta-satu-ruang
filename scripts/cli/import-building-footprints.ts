#!/usr/bin/env -S npx tsx
/** Manual import of Microsoft's Building Footprints for Indonesia — pass
 * the extracted .geojsonl (not the .zip). Resume a crashed run with
 * SKIP_LINES=<n> from the last logged progress line. */
import { importBuildingFootprintsFile, SOURCE } from "../sources/building-footprints-import";

// tsx doesn't load .env the way next dev/prisma do.
try {
  process.loadEnvFile();
} catch {
  // no .env file — assume the environment already has what's needed
}

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: npx tsx scripts/cli/import-building-footprints.ts <path-to-geojsonl>");
  process.exit(1);
}

const skipLines = Number(process.env.SKIP_LINES ?? 0);

importBuildingFootprintsFile(filePath, {
  skipLines,
  source: `${SOURCE}:indonesia`, // matches the worker's per-country convention
  onProgress: ({ lineNo, imported, skipped, elapsedMin }) => {
    console.log(
      `[import] line ${lineNo}, imported ${imported} (skipped ${skipped} non-polygon), ${elapsedMin.toFixed(1)}min elapsed — resume with SKIP_LINES=${lineNo}`
    );
  },
})
  .then(({ imported, skipped }) => {
    console.log(`[import] done. ${imported} features imported, ${skipped} skipped.`);
  })
  .catch((err) => {
    console.error("[import] failed:", err);
    process.exit(1);
  });
