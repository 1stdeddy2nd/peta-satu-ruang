import { QUAKE_HISTORY_DAYS, QUAKE_UPSTREAM_TIMEOUT_MS, QUAKE_USGS } from "@/lib/quake-constants";
import type { Earthquake } from "@/lib/quake-types";

interface UsgsFeature {
  id: string;
  properties: { mag: number | null; time: number; place: string | null };
  geometry: { coordinates: [number, number, number] };
}

// The catalogue reaches back a full month from the first call, which BMKG's
// three "latest" feeds cannot. Indonesia's bounding box, not a country filter:
// FDSN has no country parameter.
export async function fetchUsgsQuakes(): Promise<Earthquake[]> {
  const url = new URL(QUAKE_USGS.eventUrl);
  url.searchParams.set("format", "geojson");
  url.searchParams.set("starttime", new Date(Date.now() - QUAKE_HISTORY_DAYS * 24 * 60 * 60 * 1000).toISOString());
  url.searchParams.set("minlatitude", "-11");
  url.searchParams.set("maxlatitude", "6");
  url.searchParams.set("minlongitude", "94");
  url.searchParams.set("maxlongitude", "142");
  url.searchParams.set("orderby", "time");

  const res = await fetch(url, { signal: AbortSignal.timeout(QUAKE_UPSTREAM_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`USGS request failed: ${res.status}`);
  const body = await res.json();
  const features = (body.features ?? []) as UsgsFeature[];
  if (features.length === 0) throw new Error("USGS: no earthquake in the response");

  return features
    .filter((f) => f.properties.mag !== null)
    .map((f) => ({
      id: `usgs:${f.id}`,
      source: "usgs" as const,
      occurredAt: new Date(f.properties.time).toISOString(),
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
      magnitude: Number(f.properties.mag),
      depthKm: Math.round(f.geometry.coordinates[2]),
      area: f.properties.place ?? "",
      potential: null,
      felt: null,
      shakemapUrl: null,
    }));
}
