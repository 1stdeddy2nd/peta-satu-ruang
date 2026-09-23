import type { AdminAreaOutline, AdminAreaResult } from "@/lib/admin-types";
import { HISTORY_PAYLOAD_VERSION } from "@/lib/fire-constants";
import { todayIso } from "@/lib/fire-utils";
import type { FireConfidenceBand, FireHistoryResponse } from "@/lib/fire-types";

export async function searchAdminAreas(
  q: string,
  signal?: AbortSignal
): Promise<AdminAreaResult[]> {
  const res = await fetch(`/api/admin-boundaries?q=${encodeURIComponent(q)}`, { signal });
  if (!res.ok) throw new Error("Search failed");
  const body = (await res.json()) as { results: AdminAreaResult[] };
  return body.results;
}

export async function fetchAdminAreaAt(lon: number, lat: number): Promise<AdminAreaResult | null> {
  const res = await fetch(`/api/admin-boundaries?lon=${lon}&lat=${lat}`);
  if (!res.ok) throw new Error("Could not look up that place");
  const body = (await res.json()) as { area: AdminAreaResult | null };
  return body.area;
}

export async function fetchAdminAreaOutline(pcode: string): Promise<AdminAreaOutline> {
  const res = await fetch(`/api/admin-boundaries?pcode=${encodeURIComponent(pcode)}`);
  if (!res.ok) throw new Error("Could not load that area");
  return (await res.json()) as AdminAreaOutline;
}

// Playback re-asks for days it has shown, faster than a round trip. Today is
// never cached: the 10-minute refresh keeps adding to it.
const dayCache = new Map<string, FireHistoryResponse>();
const DAY_CACHE_MAX = 40;

export async function fetchFireHistoryDay(
  day: string,
  bands: FireConfidenceBand[],
  span: number,
  window?: { from: number; to: number },
  withPoints = true,
  signal?: AbortSignal
): Promise<FireHistoryResponse> {
  const key = `${day}|${bands.join(",")}|${span}|${window?.from ?? ""}|${window?.to ?? ""}|${withPoints ? 1 : 0}|${HISTORY_PAYLOAD_VERSION}`;
  const cached = dayCache.get(key);
  if (cached) return cached;

  const query = new URLSearchParams({
    day,
    bands: bands.join(","),
    span: String(span),
    v: String(HISTORY_PAYLOAD_VERSION),
    ...(window ? { from: String(Math.round(window.from)), to: String(Math.round(window.to)) } : {}),
    ...(withPoints ? {} : { points: "0" }),
  });
  const res = await fetch(`/api/fire-hotspots/history?${query}`, { signal });
  if (!res.ok) throw new Error("Titik api tidak bisa dimuat");
  const body = (await res.json()) as FireHistoryResponse;

  if (day !== todayIso()) {
    if (dayCache.size >= DAY_CACHE_MAX) {
      const oldest = dayCache.keys().next().value;
      if (oldest) dayCache.delete(oldest);
    }
    dayCache.set(key, body);
  }
  return body;
}
