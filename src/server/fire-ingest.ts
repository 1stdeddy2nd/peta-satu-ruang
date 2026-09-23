import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { FIRMS_ATTRIBUTION, HISTORY_DAYS, MAX_DAY_RANGE } from "@/lib/fire-constants";
import { todayIso } from "@/lib/fire-utils";
import { fetchFirmsWindow } from "./fire-firms";

const CACHE_ID = "IDN";
const RECENT_TTL_MS = 10 * 60 * 1000;

/** day_range=1 is reliably empty: that day's passes aren't processed yet. */
const RECENT_DAY_RANGE = 2;

/** An untagged row is outside Indonesia, so this doubles as the country filter.
 * Must be driven from the detections into the boundary GiST index; the other
 * way round makes the planner re-scan the detections once per polygon.
 * Pass `since`: rows outside Indonesia stay untagged for good, and re-testing
 * all 13,000 of them took 4s on every 10-minute refresh. */
export function tagFireHotspotVillages(since?: Date) {
  return prisma.$executeRaw`
    UPDATE "FireHotspot" f
    SET "villagePcode" = b.pcode
    FROM "AdminBoundary" b
    WHERE f."villagePcode" IS NULL
      ${since ? Prisma.sql`AND f."detectedAt" >= ${since}` : Prisma.empty}
      AND b.level = 4
      AND b.geom && ST_Transform(ST_SetSRID(ST_Point(f.lon, f.lat), 4326), 3857)
      AND ST_Contains(b.geom, ST_Transform(ST_SetSRID(ST_Point(f.lon, f.lat), 4326), 3857))
  `;
}

export async function ingestFirmsWindow(dayRange: number, startDate?: string) {
  const mapKey = process.env.FIRMS_MAP_KEY;
  if (!mapKey) throw new Error("Fire hotspots aren't configured (missing FIRMS_MAP_KEY).");

  const detections = await fetchFirmsWindow(mapKey, dayRange, startDate);
  const { count } = await prisma.fireHotspot.createMany({
    data: detections,
    skipDuplicates: true,
  });
  return { seen: detections.length, added: count };
}

export async function pruneFireHistory() {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - HISTORY_DAYS);
  const { count } = await prisma.fireHotspot.deleteMany({ where: { day: { lt: cutoff } } });
  return count;
}

export async function refreshRecentFires() {
  const marker = await prisma.fireHotspotCache.findUnique({ where: { id: CACHE_ID } });
  const fresh = marker && Date.now() - marker.fetchedAt.getTime() < RECENT_TTL_MS;
  if (fresh) return { fetched: false as const, fetchedAt: marker.fetchedAt };

  const fetchedAt = new Date();
  const since = new Date(fetchedAt);
  since.setUTCDate(since.getUTCDate() - (RECENT_DAY_RANGE + 1));
  await ingestFirmsWindow(RECENT_DAY_RANGE);
  await tagFireHotspotVillages(since);
  await prisma.fireHotspotCache.upsert({
    where: { id: CACHE_ID },
    create: { id: CACHE_ID, features: [], attribution: FIRMS_ATTRIBUTION, fetchedAt },
    update: { features: [], attribution: FIRMS_ATTRIBUTION, fetchedAt },
  });
  return { fetched: true as const, fetchedAt };
}

/** NASA is asked only for a day the table hasn't got. Today is the exception:
 * it keeps growing, so it refreshes on the TTL. */
export async function ensureFireDay(day: string) {
  if (day === todayIso()) {
    await refreshRecentFires().catch(() => {
      // A FIRMS outage must not empty a day we already hold.
    });
    return;
  }

  const existing = await prisma.fireHotspot.findFirst({
    where: { day: new Date(`${day}T00:00:00Z`) },
    select: { key: true },
  });
  if (existing) return;

  const oldest = new Date();
  oldest.setUTCDate(oldest.getUTCDate() - HISTORY_DAYS);
  if (new Date(`${day}T00:00:00Z`) < oldest) return;

  // A detection acquired late in the UTC day lands on the next WIB day, so the
  // window has to start a day early to fill the one being asked for.
  const from = new Date(`${day}T00:00:00Z`);
  from.setUTCDate(from.getUTCDate() - 1);
  await ingestFirmsWindow(Math.min(MAX_DAY_RANGE, 2), from.toISOString().slice(0, 10))
    .then(() => tagFireHotspotVillages(from))
    .catch(() => {});
}

/** Fills the rolling window a FIRMS request at a time. Only first install needs
 * it: the window can't be pulled by browsing, because a day with no rows has no
 * bar to click. Safe to re-run — windows overlap and the natural key dedupes. */
export async function backfillFireHistory(days = HISTORY_DAYS) {
  let added = 0;
  for (let start = days; start > 0; start -= MAX_DAY_RANGE) {
    const from = new Date();
    from.setUTCDate(from.getUTCDate() - start);
    const result = await ingestFirmsWindow(
      Math.min(MAX_DAY_RANGE, start),
      from.toISOString().slice(0, 10)
    );
    added += result.added;
  }
  const tagged = await tagFireHotspotVillages();
  const pruned = await pruneFireHistory();
  return { added, tagged, pruned };
}
