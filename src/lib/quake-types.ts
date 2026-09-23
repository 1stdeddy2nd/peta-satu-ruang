import type { QUAKE_BANDS } from "./quake-constants";

export type QuakeBand = (typeof QUAKE_BANDS)[number];

export type QuakeSource = "bmkg" | "usgs";

export interface Earthquake {
  // BMKG publishes no id; its UTC timestamp is unique per event.
  id: string;
  source: QuakeSource;
  occurredAt: string;
  lat: number;
  lon: number;
  magnitude: number;
  depthKm: number;
  // BMKG's own sentences, shown to the reader unchanged.
  area: string;
  potential: string | null;
  // MMI scale per place, e.g. "III Pangalengan, II Kertasari".
  felt: string | null;
  shakemapUrl: string | null;
}
