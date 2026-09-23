import { prisma } from "@/lib/prisma";
import {
  ERUPTION_HISTORY_DAYS,
  ERUPTION_HISTORY_STATE_ID,
  MAGMA_CACHE_ID,
} from "@/lib/volcano-constants";
import { VOLCANO_KRB, type VolcanoKrbData } from "@/lib/volcano-krb";
import { OFFICIAL_VOLCANOES } from "@/lib/volcano-official-list";
import type {
  MagmaVolcano,
  PvmbgLevel,
  VolcanoEruptionHistory,
  VolcanoType,
} from "@/lib/volcano-types";

interface VolcanoFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: {
    code: string;
    name: string;
    province: string | null;
    level: PvmbgLevel | null;
    volcanoType: VolcanoType | null;
    erupting: boolean;
    latestEruption: MagmaVolcano["latestEruption"];
    recommendation: MagmaVolcano["recommendation"];
    eruptionHistory: VolcanoEruptionHistory | null;
    krb: VolcanoKrbData | null;
  };
}

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const rad = Math.PI / 180;
  const a =
    Math.sin(((lat2 - lat1) * rad) / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

// "Rinjani/Barujari" and "Hobal (BL)" in the official list are "Rinjani" and
// "Hobal" in MAGMA's.
function nameVariants(name: string) {
  return name
    .toLowerCase()
    .replace(/\(bl\)/g, "")
    .split("/")
    .map((part) => part.replace(/[^a-z0-9]/g, ""));
}

export async function volcanoFeatures() {
  const historyCutoff = new Date(Date.now() - ERUPTION_HISTORY_DAYS * 24 * 60 * 60 * 1000);
  const [magmaRow, historyRow, notices] = await Promise.all([
    prisma.volcanoCatalogCache.findUnique({ where: { id: MAGMA_CACHE_ID } }),
    prisma.volcanoEventCache.findUnique({ where: { id: ERUPTION_HISTORY_STATE_ID } }),
    prisma.volcanoEruptionNotice.findMany({
      where: { eruptedAt: { gte: historyCutoff } },
      orderBy: { eruptedAt: "desc" },
    }),
  ]);
  const monitored = (magmaRow?.volcanoes ?? []) as unknown as MagmaVolcano[];
  const historyComplete = Boolean((historyRow?.events as { backfillDone?: boolean } | undefined)?.backfillDone);
  const noticesByName = new Map<string, typeof notices>();
  for (const notice of notices) {
    noticesByName.set(notice.volcanoName, [...(noticesByName.get(notice.volcanoName) ?? []), notice]);
  }
  const features: VolcanoFeature[] = monitored.map((volcano) => {
    return {
      type: "Feature",
      geometry: { type: "Point", coordinates: [volcano.lon, volcano.lat] },
      properties: {
        code: volcano.code,
        name: volcano.name,
        province: volcano.province,
        level: volcano.level,
        volcanoType: null,
        erupting: volcano.erupting,
        latestEruption: volcano.latestEruption,
        recommendation: volcano.recommendation,
        eruptionHistory: {
          times: (noticesByName.get(volcano.name) ?? []).map((n) => n.eruptedAt.toISOString()),
          recent: (noticesByName.get(volcano.name) ?? []).slice(0, 3).map((n) => ({
            eruptedAt: n.eruptedAt.toISOString(),
            ashColumnM: n.ashColumnM,
            ashDirection: n.ashDirection,
          })),
        },
        krb: VOLCANO_KRB[volcano.code] ?? null,
      },
    };
  });

  // Without MAGMA's list there is nothing to subtract, and Merapi would be drawn
  // as "not monitored". Show no unmonitored volcanoes rather than wrong ones.
  if (monitored.length > 0) {
    const claimed = new Set<number>();
    for (const volcano of monitored) {
      const near = OFFICIAL_VOLCANOES.map((entry, index) => ({
        index,
        km: distanceKm(volcano.lat, volcano.lon, entry.lat, entry.lon),
        sameName: nameVariants(entry.name).includes(nameVariants(volcano.name).join("")),
      }))
        .filter((c) => !claimed.has(c.index))
        .sort((a, b) => a.km - b.km);
      // Name first: position alone takes a neighbour (Burni Geureudong sits
      // 2.7 km from Bur Ni Telong). The 1 km fallback only covers spelling
      // (MAGMA's "Ile Werung" is the list's "Ili Werung").
      const match = near.find((c) => c.sameName && c.km <= 10) ?? near.find((c) => c.km <= 1);
      if (match) claimed.add(match.index);
    }

    OFFICIAL_VOLCANOES.forEach((entry, index) => {
      if (claimed.has(index)) return;
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [entry.lon, entry.lat] },
        properties: {
          code: `official-${index}`,
          name: entry.name.replace(/\s*\(BL\)$/, " (bawah laut)"),
          province: null,
          level: null,
          volcanoType: entry.type,
          erupting: false,
          latestEruption: null,
          recommendation: null,
          eruptionHistory: null,
          krb: null,
        },
      });
    });
  }

  return {
    features,
    // Until the backfill reaches the full window, history covers only back to
    // the oldest notice read so far — the popup must say so, not show "0".
    eruptionHistorySince: historyComplete ? historyCutoff.toISOString() : (notices.at(-1)?.eruptedAt.toISOString() ?? null),
    eruptionHistoryComplete: historyComplete,
    magmaFetchedAt: magmaRow?.fetchedAt ?? null,
  };
}
