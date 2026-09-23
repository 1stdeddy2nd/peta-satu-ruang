import { prisma } from "@/lib/prisma";
import { QUAKE_BMKG, QUAKE_USGS } from "@/lib/quake-constants";
import { fetchBmkgQuakes } from "./quake-bmkg";
import { fetchUsgsQuakes } from "./quake-usgs";
import { storeQuakes } from "./quake-queries";

const RETRY_AFTER_FAILURE_MS = 60 * 1000;

// Every viewer's poll lands here. Without the shared in-flight promise,
// simultaneous polls each start their own BMKG pass.
let inFlight: Promise<{ fetchedAt: Date }> | null = null;
let failedAt = 0;

export async function refreshQuakes() {
  const marker = await prisma.earthquakeCache.findUnique({ where: { id: QUAKE_BMKG.cacheId } });
  const due = !marker || Date.now() - marker.fetchedAt.getTime() >= QUAKE_BMKG.ttlMs;
  const coolingDown = Date.now() - failedAt < RETRY_AFTER_FAILURE_MS;
  if (!due) return { fetchedAt: marker.fetchedAt };
  if (coolingDown) {
    if (marker) return { fetchedAt: marker.fetchedAt };
    throw new Error("No BMKG snapshot yet and the last attempt failed");
  }

  if (!inFlight) {
    inFlight = (async () => {
      try {
        await storeQuakes(await fetchBmkgQuakes());
        const fetchedAt = new Date();
        await prisma.earthquakeCache.upsert({
          where: { id: QUAKE_BMKG.cacheId },
          create: { id: QUAKE_BMKG.cacheId, fetchedAt },
          update: { fetchedAt },
        });
        return { fetchedAt };
      } catch (err) {
        failedAt = Date.now();
        console.error("BMKG refresh failed:", err instanceof Error ? err.message : err);
        throw err;
      } finally {
        inFlight = null;
      }
    })();
  }

  // A pass is three small JSON reads, so the viewer waits for it rather than
  // being served a snapshot that a quake may already have outdated.
  return inFlight;
}

export async function quakeFetchedAt(): Promise<Date | null> {
  const marker = await prisma.earthquakeCache.findUnique({ where: { id: QUAKE_BMKG.cacheId } });
  return marker?.fetchedAt ?? null;
}

// USGS is read hourly, not every two minutes: it is the backfill for days
// BMKG's short feeds never covered, not the live source.
export async function refreshUsgs() {
  const marker = await prisma.earthquakeCache.findUnique({ where: { id: QUAKE_USGS.cacheId } });
  if (marker && Date.now() - marker.fetchedAt.getTime() < QUAKE_USGS.ttlMs) return;

  try {
    await storeQuakes(await fetchUsgsQuakes());
    const fetchedAt = new Date();
    await prisma.earthquakeCache.upsert({
      where: { id: QUAKE_USGS.cacheId },
      create: { id: QUAKE_USGS.cacheId, fetchedAt },
      update: { fetchedAt },
    });
  } catch (err) {
    console.error("USGS refresh failed:", err instanceof Error ? err.message : err);
  }
}

