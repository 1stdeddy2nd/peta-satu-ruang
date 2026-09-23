import GeoJSONFormat from "ol/format/GeoJSON";
import KML from "ol/format/KML";
import { fromLonLat, getPointResolution } from "ol/proj";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import type Geometry from "ol/geom/Geometry";
import type { FeatureCollection } from "geojson";
import { Fill, Stroke, Style } from "ol/style";
import type { FireConfidenceBand, HistoryPoint } from "@/lib/fire-types";
import { fireConfidenceBand } from "@/lib/fire-utils";
import { FIRE_BANDS, HISTORY_SATELLITES, HISTORY_SENSORS } from "@/lib/fire-constants";
import { QUAKE_BANDS, QUAKE_BAND_MIN_MAGNITUDE } from "@/lib/quake-constants";
import type { QuakeBand } from "@/lib/quake-types";
import { wibDayIso } from "@/lib/fire-utils";
import { FIRE_CONFIDENCE_COLOR } from "./map-constants";
import type {
  EventBucket,
  EventRange,
  EventTimeSettings,
  EventWindow,
  VolcanoFeatureProperties,
  VolcanoLevelKey,
} from "./map-types";
import type { PvmbgLevel } from "@/lib/volcano-types";

const MAP_PROJECTION = "EPSG:3857";
const DATA_PROJECTION = "EPSG:4326";

const INCHES_PER_METER = 39.37007874;

export function resolutionToScale(
  resolution: number,
  dpi: number,
  center: [number, number]
): number {
  const pointResolution = getPointResolution(MAP_PROJECTION, resolution, center);
  return pointResolution * INCHES_PER_METER * dpi;
}

export function scaleToResolution(
  scale: number,
  dpi: number,
  center: [number, number]
): number {
  const metersPerPixel = scale / (INCHES_PER_METER * dpi);
  const pointResolution = getPointResolution(MAP_PROJECTION, 1, center);
  return metersPerPixel / pointResolution;
}

export function parseLocaleNumber(raw: string): number {
  return parseFloat(raw.trim().replace(",", "."));
}

function toDms(value: number, axis: "lon" | "lat"): string {
  const hemisphere =
    axis === "lon" ? (value >= 0 ? "E" : "W") : value >= 0 ? "N" : "S";
  const abs = Math.abs(value);
  const deg = Math.floor(abs);
  const minFloat = (abs - deg) * 60;
  const min = Math.floor(minFloat);
  const sec = ((minFloat - min) * 60).toFixed(1);
  return `${deg}° ${min}' ${sec}" ${hemisphere}`;
}

export function formatCoordinate(
  value: number,
  axis: "lon" | "lat",
  format: "DD" | "DMS"
): string {
  return format === "DMS" ? toDms(value, axis) : value.toFixed(5);
}

type ParsedFeatures = Feature<Geometry>[];

async function parseShapefileZip(file: File): Promise<FeatureCollection> {
  const shp = (await import("shpjs")).default;
  const buffer = await file.arrayBuffer();
  const result = await shp(buffer);
  const collection = Array.isArray(result) ? result[0] : result;
  return collection as unknown as FeatureCollection;
}

export async function parseUploadedFile(file: File): Promise<ParsedFeatures> {
  const name = file.name.toLowerCase();
  const options = {
    dataProjection: DATA_PROJECTION,
    featureProjection: MAP_PROJECTION,
  };

  if (name.endsWith(".zip")) {
    const geojson = await parseShapefileZip(file);
    return new GeoJSONFormat().readFeatures(geojson, options) as ParsedFeatures;
  }

  if (name.endsWith(".kml")) {
    return new KML().readFeatures(await file.text(), options) as ParsedFeatures;
  }

  if (name.endsWith(".json") || name.endsWith(".geojson")) {
    return new GeoJSONFormat().readFeatures(await file.text(), options) as ParsedFeatures;
  }

  throw new Error(
    `Unsupported file type: ${file.name}. Use .geojson, .json, .kml, or a zipped .shp (.zip).`
  );
}

export function summariseGeometryType(features: ParsedFeatures): string {
  const first = features[0]?.getGeometry()?.getType();
  return first ? String(first) : "Unknown";
}

export function isUsableExtent(extent: number[] | null): extent is number[] {
  return !!extent && extent.every((v) => Number.isFinite(v));
}

const IGNORED_KEYS = new Set(["geometry", "styleUrl", "styleHash", "address", "description"]);

export function collectAttributeKeys(features: ParsedFeatures): string[] {
  const keys = new Set<string>();
  for (const f of features.slice(0, 200)) {
    for (const k of Object.keys(f.getProperties())) {
      if (!IGNORED_KEYS.has(k)) keys.add(k);
    }
  }
  return [...keys].sort();
}

export function distinctValues(features: ParsedFeatures, field: string): string[] {
  const seen = new Set<string>();
  for (const f of features) {
    const v = f.get(field);
    if (v === undefined || v === null) continue;
    seen.add(String(v));
  }
  return [...seen];
}

export function symbolForGeometry(geometryType: string): "polygon" | "line" | "point" {
  if (/Point/i.test(geometryType)) return "point";
  if (/LineString/i.test(geometryType)) return "line";
  return "polygon";
}

export function categoryPalette(count: number): string[] {
  return Array.from({ length: count }, (_, i) => {
    const hue = Math.round((360 / Math.max(count, 1)) * i);
    return hslToHex(hue, 62, 62);
  });
}

function hslToHex(h: number, s: number, l: number): string {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const v = l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * v).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function fireConfidenceStyle(confidence: string): {
  band: FireConfidenceBand;
  label: string;
  color: string;
} {
  const band = fireConfidenceBand(confidence);
  const word = { high: "High", medium: "Nominal", low: "Low" }[band];
  const numeric = Number(confidence);
  return {
    band,
    label: Number.isNaN(numeric) ? word : `${word} (${numeric}%)`,
    color: FIRE_CONFIDENCE_COLOR[band],
  };
}

export function legendEntriesFromLayers(
  layers: {
    name: string;
    color: string;
    visible: boolean;
    geometryType: string;
    styleMode: "single" | "categorised";
    categories: { value: string; color: string }[];
  }[]
): { label: string; color: string; symbol: "polygon" | "line" | "point" }[] {
  const rows: { label: string; color: string; symbol: "polygon" | "line" | "point" }[] = [];
  for (const layer of layers) {
    if (!layer.visible) continue;
    const symbol = symbolForGeometry(layer.geometryType);
    if (layer.styleMode === "categorised" && layer.categories.length > 0) {
      for (const c of layer.categories) rows.push({ label: c.value, color: c.color, symbol });
    } else {
      rows.push({ label: layer.name.replace(/\.[^.]+$/, ""), color: layer.color, symbol });
    }
  }
  return rows;
}

const VIIRS_CONFIDENCE: Record<FireConfidenceBand, string> = { high: "h", medium: "n", low: "l" };

export function circlePolygonLonLat(lon: number, lat: number, radiusKm: number, steps = 64): [number, number][] {
  const kmPerDegLat = 111.19;
  const kmPerDegLon = 111.32 * Math.cos((lat * Math.PI) / 180);
  const ring: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    ring.push([lon + (Math.cos(angle) * radiusKm) / kmPerDegLon, lat + (Math.sin(angle) * radiusKm) / kmPerDegLat]);
  }
  return ring;
}

function hexWithAlphaPercent(hex: string, percent: number): string {
  const clamped = Math.max(0, Math.min(100, percent));
  return `${hex}${Math.round((clamped / 100) * 255).toString(16).padStart(2, "0")}`;
}

export function volcanoKrbZoneStyle(color: string): Style {
  return new Style({
    fill: new Fill({ color: hexWithAlphaPercent(color, 22) }),
    stroke: new Stroke({ color, width: 1.5 }),
  });
}

// Shapes a history point like a live FIRMS feature, so one popup reads both.
export function fireFeaturesFromPoints(points: HistoryPoint[]): Feature<Geometry>[] {
  return points.map(([lon, lat, bandIndex, epochMinutes, sensorIndex, , , , confidencePct, satelliteIndex]) => {
    const band = FIRE_BANDS[bandIndex];
    return new Feature({
      geometry: new Point(fromLonLat([lon, lat])),
      detectedAt: new Date(epochMinutes * 60_000).toISOString(),
      confidence: confidencePct >= 0 ? String(confidencePct) : VIIRS_CONFIDENCE[band],
      sensor: HISTORY_SENSORS[sensorIndex] ?? "",
      satellite: HISTORY_SATELLITES[satelliteIndex] ?? "",
      t: epochMinutes * 60_000,
    }) as Feature<Geometry>;
  });
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export const EVENT_RANGES: EventRange[] = ["1h", "24h", "7d", "30d"];

export const EVENT_RANGE_LABEL: Record<EventRange, string> = {
  "1h": "1 jam",
  "24h": "24 jam",
  "7d": "7 hari",
  "30d": "30 hari",
};

const EVENT_RANGE_BUCKETS: Record<EventRange, number> = { "1h": 12, "24h": 24, "7d": 28, "30d": 30 };

// 1 and 24 hours roll back from now; 7 and 30 days start at midnight WIB, so
// "7 hari" means the seven dates a reader would name, today included.
export function eventWindow(time: EventTimeSettings, now = Date.now()): EventWindow {
  const end = now;
  let start = end - HOUR_MS;
  if (time.range === "24h") start = end - DAY_MS;
  if (time.range === "7d" || time.range === "30d") {
    const days = time.range === "7d" ? 7 : 30;
    start = Date.parse(`${wibDayIso(end)}T00:00:00+07:00`) - (days - 1) * DAY_MS;
  }
  const visibleEnd = time.cursor === null ? end : Math.min(Math.max(time.cursor, start), end);
  return { start, end, visibleEnd };
}

// The fire history API serves whole WIB days; this is the smallest span it
// accepts that still covers the window.
export function fireSpanForRange(range: EventRange): number {
  return range === "30d" ? 30 : range === "7d" ? 7 : 3;
}

export function emptyEventBuckets(time: EventTimeSettings, window: EventWindow): EventBucket[] {
  const count = EVENT_RANGE_BUCKETS[time.range];
  const width = (window.end - window.start) / count;
  return Array.from({ length: count }, (_, i) => ({
    from: window.start + i * width,
    to: window.start + (i + 1) * width,
    fire: 0,
    volcano: 0,
    quake: 0,
  }));
}

export function bucketIndex(buckets: EventBucket[], t: number): number {
  if (buckets.length === 0 || t < buckets[0].from || t > buckets[buckets.length - 1].to) return -1;
  const width = buckets[0].to - buckets[0].from;
  return Math.min(buckets.length - 1, Math.floor((t - buckets[0].from) / width));
}

// `Overlay.panIntoView` only ever nudges the map far enough to clear one
// overflowing edge (it checks left, then only checks right if left already
// fit). Once the popup plus twice the margin exceeds the viewport, no pan
// satisfies both edges and one stays clipped — so the margin has to shrink
// with the viewport, capped at the desktop clearance this was tuned for.
export function popupAutoPanMargin(viewportWidth: number, elementWidth: number) {
  const DESKTOP_MARGIN = 96;
  const fits = (viewportWidth - elementWidth) / 2 - 4;
  return Math.max(8, Math.min(DESKTOP_MARGIN, fits));
}

export function eventTimeLabel(t: number, withTime: boolean) {
  return new Date(t).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Asia/Jakarta",
  });
}

export function relativeTimeLabel(iso: string) {
  const minutes = Math.floor((Date.now() - Date.parse(iso)) / 60_000);
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)} jam lalu`;
  return `${Math.floor(minutes / (24 * 60))} hari lalu`;
}

// The status pass can know of an eruption before the history refresh has
// stored it, so the latest eruption counts on its own too.
export function eruptionTimes(props: VolcanoFeatureProperties): number[] {
  const times = (props.eruptionHistory?.times ?? []).map((iso) => Date.parse(iso));
  if (props.latestEruption) {
    const latest = Date.parse(props.latestEruption.eruptedAt);
    if (!times.includes(latest)) times.push(latest);
  }
  return times;
}

// Pixels within which events merge into one cluster, by zoom: a country view
// reads as a handful of regions, a city view as individual events. Fire is the
// densest, so it merges most aggressively.
export function clusterDistance(kind: "fire" | "quake", zoom: number) {
  if (kind === "quake") return zoom < 6 ? 56 : zoom < 9 ? 44 : 32;
  return zoom < 6 ? 96 : zoom < 8 ? 72 : zoom < 11 ? 56 : 40;
}

export function volcanoLevelKey(level: PvmbgLevel | null, erupting: boolean): VolcanoLevelKey {
  if (erupting) return "erupting";
  return level ?? "unmonitored";
}

export function zoomForResolution(resolution: number) {
  return Math.log2(156543.03392804097 / resolution);
}

export function quakeBand(magnitude: number): QuakeBand {
  return QUAKE_BANDS.find((band) => magnitude >= QUAKE_BAND_MIN_MAGNITUDE[band]) ?? "light";
}
