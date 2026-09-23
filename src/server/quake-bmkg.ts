import { QUAKE_BMKG, QUAKE_UPSTREAM_TIMEOUT_MS } from "@/lib/quake-constants";
import type { Earthquake } from "@/lib/quake-types";

interface BmkgQuake {
  DateTime?: string;
  Coordinates?: string;
  Magnitude?: string;
  Kedalaman?: string;
  Wilayah?: string;
  Potensi?: string;
  Dirasakan?: string;
  Shakemap?: string;
}

async function feed(name: string): Promise<BmkgQuake[]> {
  const res = await fetch(`${QUAKE_BMKG.feedUrl}/${name}.json`, {
    signal: AbortSignal.timeout(QUAKE_UPSTREAM_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`BMKG ${name} returned ${res.status}`);
  const body = await res.json();
  const gempa = body?.Infogempa?.gempa;
  if (!gempa) throw new Error(`BMKG ${name}: no Infogempa.gempa in the response`);
  return Array.isArray(gempa) ? gempa : [gempa];
}

function parse(raw: BmkgQuake): Earthquake | null {
  const [lat, lon] = (raw.Coordinates ?? "").split(",").map(Number);
  const occurredAt = raw.DateTime ? new Date(raw.DateTime) : null;
  const magnitude = Number(raw.Magnitude);
  if (!occurredAt || Number.isNaN(occurredAt.getTime())) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Number.isNaN(magnitude)) return null;

  return {
    id: occurredAt.toISOString(),
    source: "bmkg",
    occurredAt: occurredAt.toISOString(),
    lat,
    lon,
    magnitude,
    depthKm: Number.parseFloat(raw.Kedalaman ?? "") || 0,
    area: raw.Wilayah?.trim() ?? "",
    potential: raw.Potensi?.trim() || null,
    felt: raw.Dirasakan?.trim() || null,
    shakemapUrl: raw.Shakemap ? `${QUAKE_BMKG.feedUrl}/${raw.Shakemap}` : null,
  };
}

// The three feeds overlap and each carries fields the others leave out —
// "gempaterkini" has the tsunami line, "gempadirasakan" the felt intensities,
// "autogempa" both plus the shakemap. Merging keeps whichever is present.
export async function fetchBmkgQuakes(): Promise<Earthquake[]> {
  const [latest, strong, felt] = await Promise.all([
    feed("autogempa"),
    feed("gempaterkini"),
    feed("gempadirasakan"),
  ]);

  const byId = new Map<string, Earthquake>();
  for (const raw of [...strong, ...felt, ...latest]) {
    const quake = parse(raw);
    if (!quake) continue;
    const known = byId.get(quake.id);
    byId.set(quake.id, {
      ...known,
      ...quake,
      potential: quake.potential ?? known?.potential ?? null,
      felt: quake.felt ?? known?.felt ?? null,
      shakemapUrl: quake.shakemapUrl ?? known?.shakemapUrl ?? null,
    });
  }
  if (byId.size === 0) throw new Error("BMKG: no earthquake parsed from any feed");

  return [...byId.values()].sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
}
