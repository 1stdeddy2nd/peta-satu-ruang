import { prisma } from "@/lib/prisma";
import { FIRE_BANDS, HISTORY_DAYS, HISTORY_SATELLITES, HISTORY_SENSORS } from "@/lib/fire-constants";
import type { FireConfidenceBand, FireHistoryDay, FireHistoryResponse, HistoryPoint } from "@/lib/fire-types";
import { ensureFireDay } from "./fire-ingest";

export async function fireHistorySummary(): Promise<FireHistoryDay[]> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - HISTORY_DAYS);

  const rows = await prisma.$queryRaw<
    { day: Date; total: bigint; high: bigint; medium: bigint; low: bigint }[]
  >`
    SELECT day,
           count(*) AS total,
           count(*) FILTER (WHERE band = 'high') AS high,
           count(*) FILTER (WHERE band = 'medium') AS medium,
           count(*) FILTER (WHERE band = 'low') AS low
    FROM "FireHotspot"
    WHERE day >= ${since} AND "villagePcode" IS NOT NULL
    GROUP BY day
    ORDER BY day ASC
  `;

  return rows.map((row) => ({
    day: row.day.toISOString().slice(0, 10),
    total: Number(row.total),
    high: Number(row.high),
    medium: Number(row.medium),
    low: Number(row.low),
  }));
}

export async function fireHistoryWindow(
  day: string,
  bands: FireConfidenceBand[],
  span: number,
  // The rolling window the dashboard actually shows, when it is narrower than
  // the days fetched.
  window?: { from: Date; to: Date },
  // False when the caller only wants the tally — every level is switched off.
  withPoints = true
): Promise<FireHistoryResponse> {
  const date = new Date(`${day}T00:00:00Z`);
  const from = new Date(date);
  from.setUTCDate(from.getUTCDate() - (span - 1));

  // NASA is only asked when the table hasn't got a day already.
  for (let at = new Date(from); at <= date; at.setUTCDate(at.getUTCDate() + 1)) {
    await ensureFireDay(at.toISOString().slice(0, 10));
  }

  const inWindow = window ? { detectedAt: { gte: window.from, lte: window.to } } : {};
  const rows = !withPoints ? [] : await prisma.fireHotspot.findMany({
    where: {
      day: span === 1 ? date : { gte: from, lte: date },
      band: { in: bands },
      villagePcode: { not: null },
      ...inWindow,
    },
    select: {
      lon: true,
      lat: true,
      band: true,
      detectedAt: true,
      sensor: true,
      brightnessK: true,
      frpMw: true,
      villagePcode: true,
      confidence: true,
      satellite: true,
    },
    orderBy: span === 1 ? { detectedAt: "asc" } : { frpMw: { sort: "desc", nulls: "last" } },
  });

  // Counted for every band, not only the ones drawn, so the dashboard can show
  // what turning a level back on would add.
  const byBand = await prisma.fireHotspot.groupBy({
    by: ["band"],
    where: {
      day: span === 1 ? date : { gte: from, lte: date },
      villagePcode: { not: null },
      ...inWindow,
    },
    _count: { _all: true },
  });
  const counts = { high: 0, medium: 0, low: 0, total: 0 };
  for (const row of byBand) {
    counts[row.band as FireConfidenceBand] = row._count._all;
    counts.total += row._count._all;
  }

  const points: HistoryPoint[] = rows.map((row) => {
    return [
      Number(row.lon.toFixed(4)),
      Number(row.lat.toFixed(4)),
      FIRE_BANDS.indexOf(row.band as FireConfidenceBand),
      Math.round(row.detectedAt.getTime() / 60_000),
      Math.max(0, HISTORY_SENSORS.indexOf(row.sensor as (typeof HISTORY_SENSORS)[number])),
      Math.round(row.brightnessK ?? 0),
      Number((row.frpMw ?? 0).toFixed(1)),
      row.villagePcode ?? "",
      /^\d+$/.test(row.confidence) ? Number(row.confidence) : -1,
      HISTORY_SATELLITES.indexOf(row.satellite as (typeof HISTORY_SATELLITES)[number]),
    ];
  });

  return {
    day,
    span,
    points,
    counts,
    latestAt:
      rows.reduce<Date | null>(
        (latest, row) => (!latest || row.detectedAt > latest ? row.detectedAt : latest),
        null
      )?.toISOString() ?? null,
  };
}

export async function recentFireFeatures() {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 2);

  const rows = await prisma.fireHotspot.findMany({
    where: { detectedAt: { gte: since }, villagePcode: { not: null } },
    select: {
      lon: true,
      lat: true,
      detectedAt: true,
      confidence: true,
      sensor: true,
      satellite: true,
      brightnessK: true,
      frpMw: true,
    },
  });

  return rows.map((row) => ({
    type: "Feature" as const,
    geometry: { type: "Point" as const, coordinates: [row.lon, row.lat] },
    properties: {
      detectedAt: row.detectedAt.toISOString(),
      confidence: row.confidence,
      sensor: row.sensor,
      satellite: row.satellite,
      brightnessK: row.brightnessK,
      frpMw: row.frpMw,
    },
  }));
}
