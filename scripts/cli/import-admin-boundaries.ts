#!/usr/bin/env -S npx tsx
/** Manual import of Indonesia's admin boundaries — for a manual run against
 * an already-downloaded file; the worker calls the source function directly. */
import { importAdminBoundaryFile } from "../sources/admin-boundaries-import";

try {
  process.loadEnvFile();
} catch {
  // no .env file — assume the environment already has what's needed
}

const level = Number(process.argv[2]);
const filePath = process.argv[3];
if (!level || !filePath) {
  console.error("Usage: npx tsx scripts/cli/import-admin-boundaries.ts <level 1-4> <path-to-geojson>");
  process.exit(1);
}

const started = Date.now();
importAdminBoundaryFile(level, filePath)
  .then(({ imported, skipped }) => {
    const elapsedSec = ((Date.now() - started) / 1000).toFixed(1);
    console.log(
      `[import] level ${level}: ${imported} boundaries imported, ${skipped} skipped, ${elapsedSec}s`
    );
  })
  .catch((err) => {
    console.error("[import] failed:", err);
    process.exit(1);
  });
