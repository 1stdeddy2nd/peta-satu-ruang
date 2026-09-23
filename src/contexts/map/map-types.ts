import type { FireConfidenceBand } from "@/lib/fire-types";
import type { QuakeBand, QuakeSource } from "@/lib/quake-types";
import type {
  PvmbgLevel,
  VolcanoEruption,
  VolcanoEruptionHistory,
  VolcanoRecommendation,
  VolcanoType,
} from "@/lib/volcano-types";
import type { VolcanoKrbData } from "@/lib/volcano-krb";
export interface LayerCategory {
  value: string;
  color: string;
}

export type LayerStyleMode = "single" | "categorised";

export interface MapLayer {
  id: string;
  name: string;
  color: string;
  opacity: number; // 0..1
  visible: boolean;
  featureCount: number;
  geometryType: string;
  attributes: string[];
  styleMode: LayerStyleMode;
  categoryField: string | null;
  categories: LayerCategory[];
}

export interface GraticuleSettings {
  enabled: boolean;
  intervalDeg: number | "auto";
  color: string;
  showLabels: boolean;
  labelFontSize: number;
}

export type DisplayProjection = "EPSG:4326" | "EPSG:3857";
export type CoordinateFormat = "DD" | "DMS";

export interface MapViewSettings {
  displayProjection: DisplayProjection;
  format: CoordinateFormat;
  center: [number, number]; // EPSG:4326 lon/lat
  zoom: number;
  scaleDenominator: number; // desired 1:N, applied on demand
}

export type BasemapId = "osm" | "sentinel2";

/** EOX publishes one annual mosaic per year (MC-050); MC-053 lets a user pick among them. */
export const SENTINEL2_YEARS = [2020, 2021, 2022, 2023, 2024, 2025] as const;
export type Sentinel2Year = (typeof SENTINEL2_YEARS)[number];

export const OSM_ATTRIBUTION = "© OpenStreetMap contributors";

/** CC BY-NC-SA — non-commercial only until MC-042 settles a commercial license (MC-050). */
export function sentinel2Attribution(year: Sentinel2Year) {
  return `Sentinel-2 cloudless — © EOX IT Services GmbH (Contains modified Copernicus Sentinel data ${year})`;
}

export interface FireHotspotSettings {
  enabled: boolean;
  hiddenBands: FireConfidenceBand[];
}

export type EventRange = "1h" | "24h" | "7d" | "30d";

export type ReplaySpeed = 1 | 2 | 5;

export type EventKind = "fire" | "volcano" | "quake";

// Every mobile card shares this so opening one closes whatever else is open —
// they all render at the bottom of the screen and would otherwise stack. The
// timeline is in the list for the same reason, even though it is not a drawer.
export type MobileDrawerId = EventKind | "event-summary" | "sources" | "help" | "timeline";

export interface EventTimeSettings {
  range: EventRange;
  // Replay position inside the window; null shows the whole window.
  cursor: number | null;
  playing: boolean;
  speed: ReplaySpeed;
}

export interface EventWindow {
  start: number;
  end: number;
  // Events after this are not shown yet: the replay cursor, or the end.
  visibleEnd: number;
}

export interface EventBucket {
  from: number;
  to: number;
  fire: number;
  volcano: number;
  quake: number;
}

export interface AreaEventCounts {
  fire: number;
  quake: number;
  eruptions: number;
}

export type FireHotspotStatus = "idle" | "loading" | "error";

export type MapLocale = "en" | "id";

export interface FireHotspotCounts {
  // Drawn on the map, and following the replay cursor.
  all: Record<FireConfidenceBand, number>;
  // Everything in the window, including levels switched off — so the card can
  // say what turning one back on would add.
  inWindow: Record<FireConfidenceBand, number> | null;
}

export interface FireHotspotProperties {
  detectedAt: string;
  confidence: string;
  sensor: string;
  satellite: string;
}

export interface QuakeSettings {
  enabled: boolean;
  hiddenBands: QuakeBand[];
}

export type QuakeStatus = "idle" | "loading" | "error";

export interface QuakeFeatureProperties {
  id: string;
  source: QuakeSource;
  occurredAt: string;
  magnitude: number;
  depthKm: number;
  area: string;
  potential: string | null;
  felt: string | null;
  shakemapUrl: string | null;
}

export interface QuakeCounts {
  total: number;
  fromUsgs: number;
  byBand: Record<QuakeBand, number>;
  felt: number;
  newest: QuakeFeatureProperties | null;
  strongest: QuakeFeatureProperties | null;
}

export interface QuakeMeta {
  bmkgUrl: string;
  fetchedAt: string | null;
  historySince: string | null;
  stale: boolean;
}

// A volcano PVMBG does not monitor has no level, and one that is erupting is
// read as an eruption rather than as its level, so both filter on their own.
export type VolcanoLevelKey = PvmbgLevel | "unmonitored" | "erupting";

export interface VolcanoSettings {
  enabled: boolean;
  hiddenLevels: VolcanoLevelKey[];
}

export type VolcanoStatus = "idle" | "loading" | "error";

export interface VolcanoFeatureProperties {
  code: string;
  name: string;
  province: string | null;
  // null: on Badan Geologi's active list but not monitored by PVMBG, so no status.
  level: PvmbgLevel | null;
  volcanoType: VolcanoType | null;
  erupting: boolean;
  latestEruption: VolcanoEruption | null;
  recommendation: VolcanoRecommendation | null;
  eruptionHistory: VolcanoEruptionHistory | null;
  krb: VolcanoKrbData | null;
}

export interface VolcanoCounts {
  total: number;
  byLevel: Record<PvmbgLevel, number>;
  unmonitored: number;
  eruptedRecently: number;
  eruptionsInWindow: number;
  withZones: number;
  mostEruptions: { name: string; count: number } | null;
}

export interface VolcanoMeta {
  magmaUrl: string;
  magmaFetchedAt: string | null;
  magmaStale: boolean;
  eruptionHistorySince: string | null;
  eruptionHistoryComplete: boolean;
}
