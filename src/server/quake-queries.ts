import { prisma } from "@/lib/prisma";
import {
  QUAKE_HISTORY_DAYS,
  QUAKE_SAME_EVENT_KM,
  QUAKE_SAME_EVENT_SECONDS,
} from "@/lib/quake-constants";
import type { Earthquake, QuakeSource } from "@/lib/quake-types";
import { todayIso } from "@/lib/fire-utils";

const DAY_MS = 24 * 60 * 60 * 1000;

// The same 30 WIB days the timeline draws, so the card's total and the map
// never disagree with the API's list.
function windowStart() {
  return new Date(Date.parse(`${todayIso()}T00:00:00+07:00`) - (QUAKE_HISTORY_DAYS - 1) * DAY_MS);
}

function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const rad = Math.PI / 180;
  const h =
    Math.sin(((b.lat - a.lat) * rad) / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(((b.lon - a.lon) * rad) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

async function sameEvent(quake: Earthquake) {
  const near = await prisma.earthquakeEvent.findMany({
    where: {
      occurredAt: {
        gte: new Date(Date.parse(quake.occurredAt) - QUAKE_SAME_EVENT_SECONDS * 1000),
        lte: new Date(Date.parse(quake.occurredAt) + QUAKE_SAME_EVENT_SECONDS * 1000),
      },
    },
  });
  return near.filter((row) => distanceKm(row, quake) <= QUAKE_SAME_EVENT_KM);
}

// BMKG wins wherever both catalogues hold the same earthquake: it is the
// authority here, and only it carries the location sentence and the tsunami
// line. USGS rows exist to fill the days BMKG's short feeds never covered.
export async function storeQuakes(events: Earthquake[]) {
  for (const quake of events) {
    const existing = await sameEvent(quake);
    const beaten = existing.some((row) => row.source === "bmkg" && quake.source === "usgs");
    if (beaten) continue;

    if (quake.source === "bmkg") {
      const replaced = existing.filter((row) => row.source === "usgs").map((row) => row.id);
      if (replaced.length > 0) await prisma.earthquakeEvent.deleteMany({ where: { id: { in: replaced } } });
    } else if (existing.length > 0) {
      continue;
    }

    const data = { ...quake, occurredAt: new Date(quake.occurredAt) };
    await prisma.earthquakeEvent.upsert({ where: { id: quake.id }, create: data, update: data });
  }

  await prisma.earthquakeEvent.deleteMany({
    where: { occurredAt: { lt: windowStart() } },
  });
}

export async function quakeHistory(): Promise<Earthquake[]> {
  const rows = await prisma.earthquakeEvent.findMany({
    where: { occurredAt: { gte: windowStart() } },
    orderBy: { occurredAt: "desc" },
  });
  return rows.map((row) => ({
    ...row,
    source: row.source as QuakeSource,
    occurredAt: row.occurredAt.toISOString(),
  }));
}
