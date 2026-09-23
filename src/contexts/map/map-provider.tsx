"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import OlMap from "ol/Map";
import type MapBrowserEvent from "ol/MapBrowserEvent";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Cluster from "ol/source/Cluster";
import { boundingExtent, containsCoordinate, getCenter, getHeight, getWidth } from "ol/extent";
import VectorImageLayer from "ol/layer/VectorImage";
import OSM from "ol/source/OSM";
import XYZ from "ol/source/XYZ";
import Graticule from "ol/layer/Graticule";
import Attribution from "ol/control/Attribution";
import { Circle, Fill, Stroke, Style, Text } from "ol/style";
import { fromLonLat, toLonLat, transformExtent } from "ol/proj";
import { v4 as uuid } from "uuid";
import { toast } from "sonner";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import type Geometry from "ol/geom/Geometry";
import "ol/ol.css";

import { useMapSettings } from "./map-store";
import { fetchAdminAreaOutline, fetchFireHistoryDay } from "./map-api";
import {
  BOUNDARY_ATTRIBUTION,
  BUILDINGS_ATTRIBUTION,
  BUILDINGS_MIN_ZOOM,
  EVENT_Z,
  FIRE_CONFIDENCE_COLOR,
  REPLAY_DURATION_MS,
  REPLAY_TICK_MS,
} from "./map-constants";
import {
  PULSE_PERIOD_MS,
  QUAKE_PULSE_RGB,
  FIRE_HEAT_FRAMES,
  FIRE_HEAT_FRAME_MS,
  MIN_CLUSTER_SIZE,
  clusterStyle,
  eruptionEffectStyle,
  eventMarkerStyle,
  eventPulseStyle,
  quakeFeltRadiusKm,
  quakePulseStrength,
  selectionSpotlightStyle,
  volcanoStatusStyle,
} from "./map-markers";
import { OSM_ATTRIBUTION, sentinel2Attribution } from "./map-types";
import type {
  AreaEventCounts,
  EventKind,
  EventBucket,
  EventWindow,
  FireHotspotCounts,
  FireHotspotProperties,
  FireHotspotStatus,
  GraticuleSettings,
  MapLayer,
  MapLocale,
  MapViewSettings,
  Sentinel2Year,
  QuakeCounts,
  QuakeFeatureProperties,
  QuakeMeta,
  QuakeStatus,
  VolcanoCounts,
  VolcanoFeatureProperties,
  VolcanoMeta,
  VolcanoStatus,
} from "./map-types";
import type { FeatureLike } from "ol/Feature";
import {
  categoryPalette,
  fireFeaturesFromPoints,
  collectAttributeKeys,
  distinctValues,
  fireConfidenceStyle,
  isUsableExtent,
  parseUploadedFile,
  scaleToResolution,
  summariseGeometryType,
  circlePolygonLonLat,
  bucketIndex,
  clusterDistance,
  emptyEventBuckets,
  eruptionTimes,
  eventWindow,
  volcanoLevelKey,
  fireSpanForRange,
  quakeBand,
  volcanoKrbZoneStyle,
  zoomForResolution,
} from "./map-utils";
import Polygon from "ol/geom/Polygon";
import GeoJSONFormat from "ol/format/GeoJSON";
import { FIRE_BANDS, FIRMS_ATTRIBUTION } from "@/lib/fire-constants";
import { fireConfidenceBand, wibDayIso } from "@/lib/fire-utils";
import type { FireConfidenceBand } from "@/lib/fire-types";
import { MAGMA_ATTRIBUTION } from "@/lib/volcano-constants";
import { QUAKE_BMKG, QUAKE_USGS } from "@/lib/quake-constants";
import type { Earthquake } from "@/lib/quake-types";
import { QUAKE_BANDS } from "@/lib/quake-constants";
import { createLayer, deleteLayer } from "@/contexts/project/project-api";
import type { LayerFeaturePayload, LayerWithFeaturesResponse } from "@/contexts/project/project-types";

/** 25MB per file, 200MB per project (MC-015) — most admin-boundary data sits far below this. */
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_PROJECT_BYTES = 200 * 1024 * 1024;

const LAYER_PALETTE = [
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#db2777",
];

interface MapContextValue {
  map: OlMap | null;
  attach: (element: HTMLElement | null) => void;
  resolution: number | null;
  addFiles: (files: FileList | File[]) => Promise<void>;
  importBuildingFootprints: () => Promise<void>;
  importBuildingFootprintsForBoundary: (boundaryId: string) => Promise<void>;
  removeLayer: (id: string) => void;
  zoomToLayer: (id: string) => void;
  zoomToAll: () => void;
  setLayerCategoryField: (id: string, field: string | null) => void;
  centerOn: (lon: number, lat: number) => void;
  markMyLocation: (lon: number, lat: number) => void;
  setMyLocationVisible: (visible: boolean) => void;
  focusAdminArea: (pcode: string) => Promise<void>;
  clearAdminArea: () => void;
  applyScale: (denominator: number, dpi: number) => void;
  loadProject: (layers: LayerWithFeaturesResponse[], view: MapViewSettings | null) => void;
  isLoading: boolean;
  fireHotspotsStatus: FireHotspotStatus;
  fireHotspotCounts: FireHotspotCounts | null;
  fireFetchedAt: string | null;
  fireHotspotAt: (pixel: number[]) => { coordinate: number[]; properties: FireHotspotProperties } | null;
  volcanoStatus: VolcanoStatus;
  volcanoMeta: VolcanoMeta | null;
  volcanoAt: (pixel: number[]) => { coordinate: number[]; properties: VolcanoFeatureProperties } | null;
  volcanoCounts: VolcanoCounts | null;
  quakeStatus: QuakeStatus;
  quakeMeta: QuakeMeta | null;
  quakeCounts: QuakeCounts | null;
  eventBuckets: EventBucket[];
  buildingsStatus: FireHotspotStatus;
  adminAreaCounts: AreaEventCounts | null;
  zoomBy: (delta: number) => void;
  quakeAt: (pixel: number[]) => { coordinate: number[]; properties: QuakeFeatureProperties } | null;
}

const MapContext = createContext<MapContextValue | null>(null);

export function createBasemapSource() {
  return new OSM({ crossOrigin: "anonymous", attributions: OSM_ATTRIBUTION });
}

/**
 * EOX's pre-made cloud-free Sentinel-2 mosaic (MC-050) — real multi-date
 * compositing done upstream, not a live feed; refreshed annually. The "g"
 * tile matrix set is Web Mercator/GoogleMapsCompatible, same z/x/y scheme as
 * the OSM basemap, so a plain XYZ source is enough.
 */
export function createSentinel2Source(year: Sentinel2Year) {
  return new XYZ({
    url: `https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-${year}_3857/default/g/{z}/{y}/{x}.jpg`,
    crossOrigin: "anonymous",
    attributions: sentinel2Attribution(year),
    maxZoom: 16,
  });
}

function buildGraticule(settings: GraticuleSettings): Graticule {
  const labelStyle = new Text({
    font: `${settings.labelFontSize}px sans-serif`,
    fill: new Fill({ color: settings.color.slice(0, 7) }),
    stroke: new Stroke({ color: "#ffffff", width: 3 }),
  });

  return new Graticule({
    strokeStyle: new Stroke({ color: settings.color, width: 1, lineDash: [2, 4] }),
    showLabels: settings.showLabels,
    lonLabelStyle: labelStyle,
    latLabelStyle: labelStyle.clone(),
    wrapX: false,
    intervals: settings.intervalDeg === "auto" ? undefined : [settings.intervalDeg],
  });
}

const styleCache = new Map<string, Style>();

function layerStyle(color: string) {
  let style = styleCache.get(color);
  if (!style) {
    style = new Style({
      fill: new Fill({ color: `${color}26` }),
      stroke: new Stroke({ color, width: 2 }),
    });
    styleCache.set(color, style);
  }
  return style;
}

const myLocationStyle = new Style({
  image: new Circle({
    radius: 8,
    fill: new Fill({ color: "#2563eb" }),
    stroke: new Stroke({ color: "#ffffff", width: 3 }),
  }),
});

const buildingStyle = new Style({
  fill: new Fill({ color: "#d97706" }),
  stroke: new Stroke({ color: "#92400e", width: 0.5 }),
});

const buildingFlatStyle = new Style({
  fill: new Fill({ color: "#d97706" }),
});

const fireHotspotStyles = Object.fromEntries(
  FIRE_BANDS.map((band) => [
    band,
    new Style({
      image: new Circle({
        radius: 5,
        fill: new Fill({ color: FIRE_CONFIDENCE_COLOR[band] }),
        stroke: new Stroke({ color: "#ffffff", width: 1 }),
      }),
      // High on top, then medium, then low.
      zIndex: FIRE_BANDS.length - FIRE_BANDS.indexOf(band),
    }),
  ])
) as Record<FireConfidenceBand, Style>;

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function clusterChild(feature: FeatureLike | undefined) {
  if (!feature) return null;
  const children = feature.get("features") as Feature<Geometry>[] | undefined;
  if (!children) return feature;
  return children.length === 1 ? children[0] : null;
}

const SELECTION_BREATHS = 3;
const SELECTION_BREATH_MS = 1600;

function styleForLayer(meta: MapLayer) {
  if (meta.styleMode === "single" || !meta.categoryField) {
    return layerStyle(meta.color);
  }
  const byValue = new Map(meta.categories.map((c) => [c.value, c.color]));
  const field = meta.categoryField;
  return (feature: FeatureLike) =>
    layerStyle(byValue.get(String(feature.get(field) ?? "")) ?? meta.color);
}

export function MapProvider({
  children,
  locale = "en",
  eventMode = false,
}: {
  children: ReactNode;
  locale?: MapLocale;
  // The dashboard's event map: fire from the 30-day history, and fire, quakes
  // and eruptions clustered and filtered by the shared time window. The
  // editor keeps the live two-day fire feed, unclustered, because it prints.
  eventMode?: boolean;
}) {
  const mapRef = useRef<OlMap | null>(null);
  const osmLayerRef = useRef<TileLayer | null>(null);
  const sentinel2LayerRef = useRef<TileLayer | null>(null);
  const graticuleRef = useRef<Graticule | null>(null);
  const vectorLayersRef = useRef(new Map<string, VectorLayer<VectorSource<Feature<Geometry>>>>());
  const layerByteSizeRef = useRef(new Map<string, number>());
  const totalBytesRef = useRef(0);
  const fireSourceRef = useRef(new VectorSource<Feature<Geometry>>());
  const fireLayerRef = useRef<
    VectorLayer<VectorSource<Feature<Geometry>>> | VectorImageLayer<VectorSource<Feature<Geometry>>> | null
  >(null);
  const fireClusterRef = useRef<Cluster<Feature<Geometry>> | null>(null);
  // Everything sitting in a cluster too small to be worth drawing as a circle.
  const fireSinglesRef = useRef(new VectorSource<Feature<Geometry>>());
  const quakeSinglesRef = useRef(new VectorSource<Feature<Geometry>>());
  const fireSinglesLayerRef = useRef<VectorLayer<VectorSource<Feature<Geometry>>> | null>(null);
  const quakeSinglesLayerRef = useRef<VectorLayer<VectorSource<Feature<Geometry>>> | null>(null);
  const fireHotspotsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const volcanoLayerRef = useRef<VectorLayer<VectorSource<Feature<Geometry>>> | null>(null);
  const volcanoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const volcanoZoneLayerRef = useRef<VectorLayer<VectorSource<Feature<Geometry>>> | null>(null);
  const volcanoEruptingLayerRef = useRef<VectorLayer<VectorSource<Feature<Geometry>>> | null>(null);
  const eruptionEffectSourceRef = useRef(new VectorSource<Feature<Geometry>>());
  const eruptionEffectLayerRef = useRef<VectorLayer<VectorSource<Feature<Geometry>>> | null>(null);
  const volcanoFeaturesRef = useRef<Feature<Geometry>[]>([]);
  const quakeLayerRef = useRef<VectorLayer<VectorSource<Feature<Geometry>>> | null>(null);
  const quakeSourceRef = useRef(new VectorSource<Feature<Geometry>>());
  const quakeClusterRef = useRef<Cluster<Feature<Geometry>> | null>(null);
  const quakePulseLayerRef = useRef<VectorLayer<VectorSource<Feature<Geometry>>> | null>(null);
  const quakePulseSourceRef = useRef(new VectorSource<Feature<Geometry>>());
  const pulseEntriesRef = useRef(new Map<string, Feature<Geometry>>());
  const pulseDoneRef = useRef(new Set<string>());
  const pulseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fireFrameRef = useRef(0);
  const quakePulsesRef = useRef<Earthquake[]>([]);
  const windowRef = useRef<EventWindow>(eventWindow(useMapSettings.getState().eventTime));
  const lastReplayingRef = useRef(false);
  const lastCursorRef = useRef<number | null>(null);
  const quakeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const quakeEventsRef = useRef<Earthquake[]>([]);
  const myLocationLayerRef = useRef<VectorLayer<VectorSource<Feature<Geometry>>> | null>(null);
  const adminAreaLayerRef = useRef<VectorLayer<VectorSource<Feature<Geometry>>> | null>(null);
  const adminAreaRequestRef = useRef(0);
  const adminAreaFeatureRef = useRef<Feature<Geometry> | null>(null);
  const breatheRef = useRef(0);
  const selectionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [map, setMap] = useState<OlMap | null>(null);
  const [resolution, setResolution] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fireHotspotsStatus, setFireHotspotsStatus] = useState<FireHotspotStatus>("idle");
  const [fireHotspotCounts, setFireHotspotCounts] = useState<FireHotspotCounts | null>(null);
  const [fireRefresh, setFireRefresh] = useState(0);
  const [fireFetchedAt, setFireFetchedAt] = useState<string | null>(null);
  const [volcanoStatus, setVolcanoStatus] = useState<VolcanoStatus>("idle");
  const [volcanoMeta, setVolcanoMeta] = useState<VolcanoMeta | null>(null);
  const [volcanoCounts, setVolcanoCounts] = useState<VolcanoCounts | null>(null);
  const [quakeStatus, setQuakeStatus] = useState<QuakeStatus>("idle");
  const [quakeMeta, setQuakeMeta] = useState<QuakeMeta | null>(null);
  const [quakeCounts, setQuakeCounts] = useState<QuakeCounts | null>(null);
  const [eventBuckets, setEventBuckets] = useState<EventBucket[]>([]);
  const [adminAreaCounts, setAdminAreaCounts] = useState<AreaEventCounts | null>(null);
  const [buildingsStatus, setBuildingsStatus] = useState<FireHotspotStatus>("idle");

  const graticule = useMapSettings((s) => s.graticule);
  const layers = useMapSettings((s) => s.layers);
  const basemap = useMapSettings((s) => s.basemap);
  const sentinel2Year = useMapSettings((s) => s.sentinel2Year);
  const fireHotspots = useMapSettings((s) => s.fireHotspots);
  const volcano = useMapSettings((s) => s.volcano);
  const quake = useMapSettings((s) => s.quake);
  const clusterEnabled = useMapSettings((s) => s.clusterEnabled);
  const animationsEnabled = useMapSettings((s) => s.animationsEnabled);
  const eventRange = useMapSettings((s) => s.eventTime.range);
  const eventPlaying = useMapSettings((s) => s.eventTime.playing);
  const setEventTime = useMapSettings((s) => s.setEventTime);
  const adminBoundaryVisible = useMapSettings((s) => s.adminBoundaryVisible);
  const adminArea = useMapSettings((s) => s.adminArea);
  const buildingsVisible = useMapSettings((s) => s.buildingsVisible);
  const setView = useMapSettings((s) => s.setView);
  const addLayerMeta = useMapSettings((s) => s.addLayer);
  const removeLayerMeta = useMapSettings((s) => s.removeLayer);

  if (mapRef.current === null && typeof window !== "undefined") {
    const initialView = useMapSettings.getState().view;
    const initialBasemap = useMapSettings.getState().basemap;
    const initialYear = useMapSettings.getState().sentinel2Year;
    osmLayerRef.current = new TileLayer({
      source: createBasemapSource(),
      visible: initialBasemap === "osm",
    });
    sentinel2LayerRef.current = new TileLayer({
      source: createSentinel2Source(initialYear),
      visible: initialBasemap === "sentinel2",
    });
    adminAreaLayerRef.current = new VectorLayer({
      source: new VectorSource<Feature<Geometry>>({ attributions: BOUNDARY_ATTRIBUTION }),
      style: () => selectionSpotlightStyle(breatheRef.current),
      visible: false,
      zIndex: 15,
    });
    mapRef.current = new OlMap({
      layers: [osmLayerRef.current, sentinel2LayerRef.current, adminAreaLayerRef.current],
      view: new View({
        center: fromLonLat(initialView.center),
        zoom: initialView.zoom,
      }),
      // Attribution is the one control we keep, and it is not optional: OSM data
      // is ODbL, so the credit has to be visible on screen and on the printed
      // sheet (MC-041). Not collapsible — a hidden credit is not a credit.
      controls: [new Attribution({ collapsible: false })],
    });
  }

  const attach = useCallback((element: HTMLElement | null) => {
    const instance = mapRef.current;
    if (!instance) return;
    instance.setTarget(element ?? undefined);
    if (element) {
      requestAnimationFrame(() => instance.updateSize());
    }
  }, []);

  useEffect(() => {
    const instance = mapRef.current;
    if (!instance) return;
    setMap(instance);

    const view = instance.getView();
    setResolution(view.getResolution() ?? null);

    const handleMoveEnd = () => {
      const center = view.getCenter();
      const zoom = view.getZoom();
      if (!center || zoom === undefined) return;
      const [lon, lat] = toLonLat(center);
      setView({ center: [lon, lat], zoom });
    };
    const handleResolution = () => setResolution(view.getResolution() ?? null);

    instance.on("moveend", handleMoveEnd);
    view.on("change:resolution", handleResolution);
    return () => {
      instance.un("moveend", handleMoveEnd);
      view.un("change:resolution", handleResolution);
    };
  }, [setView]);

  useEffect(() => {
    const instance = mapRef.current;
    if (!instance) return;

    graticuleRef.current?.setMap(null);
    graticuleRef.current = null;

    if (graticule.enabled) {
      const layer = buildGraticule(graticule);
      layer.setMap(instance);
      graticuleRef.current = layer;
    }
  }, [graticule]);

  useEffect(() => {
    osmLayerRef.current?.setVisible(basemap === "osm");
    sentinel2LayerRef.current?.setVisible(basemap === "sentinel2");
  }, [basemap]);

  // A handful of events stay themselves; only a real crowd becomes a circle,
  // so two quakes near each other keep their own marker and their own pulse.
  const syncSingles = useCallback(
    (cluster: Cluster<Feature<Geometry>> | null, singles: VectorSource<Feature<Geometry>>) => {
      if (!cluster) return;
      const loose: Feature<Geometry>[] = [];
      for (const group of cluster.getFeatures()) {
        const children = group.get("features") as Feature<Geometry>[];
        if (!useMapSettings.getState().clusterEnabled || children.length < MIN_CLUSTER_SIZE) {
          loose.push(...children);
        }
      }
      singles.clear(true);
      singles.addFeatures(loose);
    },
    []
  );

  const still = useCallback(() => prefersReducedMotion() || !useMapSettings.getState().animationsEnabled, []);

  const inWindow = useCallback((t: number) => {
    const w = windowRef.current;
    return t >= w.start && t <= w.visibleEnd;
  }, []);

  const computeBuckets = useCallback(() => {
    if (!eventMode) return;
    const time = useMapSettings.getState().eventTime;
    const buckets = emptyEventBuckets(time, eventWindow({ ...time, cursor: null }));
    if (fireLayerRef.current) {
      for (const feature of fireSourceRef.current.getFeatures()) {
        const at = bucketIndex(buckets, feature.get("t"));
        if (at >= 0) buckets[at].fire++;
      }
    }
    if (quakeLayerRef.current) {
      for (const event of quakeEventsRef.current) {
        const at = bucketIndex(buckets, Date.parse(event.occurredAt));
        if (at >= 0) buckets[at].quake++;
      }
    }
    if (volcanoLayerRef.current) {
      for (const feature of volcanoFeaturesRef.current) {
        for (const t of eruptionTimes(feature.getProperties() as VolcanoFeatureProperties)) {
          const at = bucketIndex(buckets, t);
          if (at >= 0) buckets[at].volcano++;
        }
      }
    }
    setEventBuckets(buckets);
  }, [eventMode]);

  const updatePulses = useCallback((shown: Earthquake[], replaying: boolean, reset: boolean) => {
    const source = quakePulseSourceRef.current;
    const entries = pulseEntriesRef.current;
    const done = pulseDoneRef.current;
    const now = performance.now();
    const settings = useMapSettings.getState();

    // Starting, restarting or rewinding a replay drops every ring: a live one
    // never expires, and left alone it would hang over a spot whose event has
    // not been reached yet.
    if (reset) {
      source.clear(true);
      entries.clear();
      done.clear();
    }

    // Every quake drawn as itself pulses, and keeps pulsing: the ring's reach
    // and strength are its magnitude, so a small one is barely a flicker. A
    // quake merged into a cluster does not — hundreds of overlapping rings
    // say nothing, and the cluster is not where any of them happened.
    const wanted = new Map<string, { at: number[]; rgb: string; km: number; strength: number }>();
    if (settings.quake.enabled && !still()) {
      const byId = new Map(shown.map((event) => [event.id, event]));
      for (const feature of quakeSinglesRef.current.getFeatures()) {
        const event = byId.get(feature.get("id") as string);
        if (!event) continue;
        wanted.set(event.id, {
          at: fromLonLat([event.lon, event.lat]),
          rgb: QUAKE_PULSE_RGB,
          km: quakeFeltRadiusKm(event.magnitude),
          strength: quakePulseStrength(event.magnitude),
        });
      }
    }

    // A ring only ever sits on a marker that is drawn: during a replay events
    // arrive as the cursor passes them and never leave the window again.
    for (const [id, entry] of entries) {
      if (wanted.has(id)) continue;
      source.removeFeature(entry);
      entries.delete(id);
    }
    for (const [id, pulse] of wanted) {
      if (entries.has(id) || done.has(id)) continue;
      const feature = new Feature({
        geometry: new Point(pulse.at),
        rgb: pulse.rgb,
        km: pulse.km,
        strength: pulse.strength,
        bornAt: now,
        // A replayed event rings a few times as the cursor passes it; a live
        // one keeps its pulse for as long as it is inside the window.
        cycles: replaying ? 3 : Infinity,
      }) as Feature<Geometry>;
      entries.set(id, feature);
      source.addFeature(feature);
    }

    // One ticker for everything that moves: quake rings, and the ash, heat
    // and embers over an erupting volcano. It stops as soon as the map is
    // still again, so an idle screen costs nothing.
    const moving = () =>
      !still() &&
      (entries.size > 0 ||
        eruptionEffectSourceRef.current.getFeatures().length > 0 ||
        (fireSinglesLayerRef.current?.getVisible() === true && fireSinglesRef.current.getFeatures().length > 0));
    if (!moving() || prefersReducedMotion() || pulseTimerRef.current) return;
    pulseTimerRef.current = setInterval(() => {
      const tick = performance.now();
      const frame = Math.floor(tick / FIRE_HEAT_FRAME_MS) % FIRE_HEAT_FRAMES;
      if (frame !== fireFrameRef.current && !still()) {
        fireFrameRef.current = frame;
        fireSinglesLayerRef.current?.changed();
      }
      for (const [id, entry] of entries) {
        if (tick - entry.get("bornAt") > entry.get("cycles") * PULSE_PERIOD_MS) {
          source.removeFeature(entry);
          entries.delete(id);
          done.add(id);
        }
      }
      quakePulseLayerRef.current?.changed();
      eruptionEffectLayerRef.current?.changed();
      if (!moving() && pulseTimerRef.current) {
        clearInterval(pulseTimerRef.current);
        pulseTimerRef.current = null;
      }
    }, 1000 / 30);
  }, [still]);

  const refreshEvents = useCallback(() => {
    if (!eventMode) return;
    const time = useMapSettings.getState().eventTime;
    const w = eventWindow(time);
    windowRef.current = w;
    const replaying = time.cursor !== null;
    const pulseReset =
      replaying !== lastReplayingRef.current || (time.cursor ?? 0) < (lastCursorRef.current ?? 0);
    lastReplayingRef.current = replaying;
    lastCursorRef.current = time.cursor;

    const areaGeometry = adminAreaFeatureRef.current?.getGeometry();
    const areaExtent = areaGeometry?.getExtent();
    const inArea = (coordinate: number[]) =>
      Boolean(areaGeometry && areaExtent && containsCoordinate(areaExtent, coordinate) && areaGeometry.intersectsCoordinate(coordinate));
    const area: AreaEventCounts = { fire: 0, quake: 0, eruptions: 0 };

    if (fireLayerRef.current) {
      fireClusterRef.current?.refresh();
      const all = { high: 0, medium: 0, low: 0 };
      for (const feature of fireSourceRef.current.getFeatures()) {
        if (!inWindow(feature.get("t"))) continue;
        all[feature.get("band") as FireConfidenceBand]++;
        if (areaGeometry && inArea((feature.getGeometry() as Point).getCoordinates())) area.fire++;
      }
      setFireHotspotCounts((prev) =>
        prev && FIRE_BANDS.every((band) => prev.all[band] === all[band])
          ? prev
          : { all, inWindow: prev?.inWindow ?? null }
      );
    }

    if (quakeLayerRef.current) {
      quakeClusterRef.current?.refresh();
      const hiddenBands = useMapSettings.getState().quake.hiddenBands;
      const inRange = quakeEventsRef.current.filter((event) => inWindow(Date.parse(event.occurredAt)));
      // Every band in the window is counted, so a hidden one still shows its
      // number in the card; only the shown ones add up to the total.
      const counts: QuakeCounts = {
        total: 0,
        fromUsgs: 0,
        byBand: { strong: 0, moderate: 0, light: 0 },
        felt: 0,
        newest: null,
        strongest: null,
      };
      const shown: Earthquake[] = [];
      for (const event of inRange) {
        counts.byBand[quakeBand(event.magnitude)]++;
        if (hiddenBands.includes(quakeBand(event.magnitude))) continue;
        shown.push(event);
        counts.total++;
        if (event.source === "usgs") counts.fromUsgs++;
        if (event.felt) counts.felt++;
        if (!counts.newest) counts.newest = event;
        if (!counts.strongest || event.magnitude > counts.strongest.magnitude) counts.strongest = event;
        if (areaGeometry && inArea(fromLonLat([event.lon, event.lat]))) area.quake++;
      }
      setQuakeCounts((prev) =>
        prev &&
        prev.total === counts.total &&
        prev.newest?.id === counts.newest?.id &&
        QUAKE_BANDS.every((band) => prev.byBand[band] === counts.byBand[band])
          ? prev
          : counts
      );
      // USGS asks to be credited wherever its data is shown, and only then.
      quakeClusterRef.current?.setAttributions(
        counts.fromUsgs > 0 ? [QUAKE_BMKG.attribution, QUAKE_USGS.attribution] : QUAKE_BMKG.attribution
      );
      quakePulsesRef.current = shown;
    }

    if (volcanoLayerRef.current) {
      const counts: VolcanoCounts = {
        total: 0,
        byLevel: { 1: 0, 2: 0, 3: 0, 4: 0 },
        unmonitored: 0,
        eruptedRecently: 0,
        eruptionsInWindow: 0,
        withZones: 0,
        mostEruptions: null,
      };
      const hiddenLevels = useMapSettings.getState().volcano.hiddenLevels;
      const erupting: Feature<Geometry>[] = [];
      for (const feature of volcanoFeaturesRef.current) {
        const props = feature.getProperties() as VolcanoFeatureProperties;
        const times = eruptionTimes(props).filter(inWindow);
        feature.set("eruptedRecently", times.length > 0, true);
        if (props.level === null) counts.unmonitored++;
        else counts.total++;
        // An erupting volcano is counted as an eruption, not once more under
        // the level it happens to be on.
        if (props.level !== null && times.length === 0) counts.byLevel[props.level]++;
        if (props.krb) counts.withZones++;
        const hidden = hiddenLevels.includes(volcanoLevelKey(props.level, times.length > 0));
        const monthEruptions = props.eruptionHistory?.times.length ?? 0;
        if (monthEruptions > (counts.mostEruptions?.count ?? 0)) {
          counts.mostEruptions = { name: props.name, count: monthEruptions };
        }
        if (hidden) continue;
        counts.eruptionsInWindow += times.length;
        if (times.length > 0) {
          counts.eruptedRecently++;
          erupting.push(feature);
          if (areaGeometry && inArea((feature.getGeometry() as Point).getCoordinates())) area.eruptions += times.length;
        }
      }
      volcanoLayerRef.current.changed();
      volcanoEruptingLayerRef.current?.changed();
      const effects = eruptionEffectSourceRef.current;
      effects.clear(true);
      effects.addFeatures(
        erupting.map((feature, i) => {
          const at = (feature.getGeometry() as Point).getCoordinates();
          // Each volcano's embers and ash run on their own offset.
          return new Feature({ geometry: new Point(at), seed: i + 1 }) as Feature<Geometry>;
        })
      );
      setVolcanoCounts((prev) =>
        prev &&
        prev.total === counts.total &&
        prev.eruptedRecently === counts.eruptedRecently &&
        prev.eruptionsInWindow === counts.eruptionsInWindow
          ? prev
          : counts
      );
    }

    setAdminAreaCounts((prev) => {
      if (!areaGeometry) return null;
      return prev && prev.fire === area.fire && prev.quake === area.quake && prev.eruptions === area.eruptions
        ? prev
        : area;
    });
    updatePulses(quakePulsesRef.current, replaying, pulseReset);
  }, [eventMode, inWindow, updatePulses]);

  const showFireHotspots = useCallback(
    (features: Feature<Geometry>[]) => {
      const source = fireSourceRef.current;
      for (const feature of features) {
        feature.set("band", fireConfidenceBand(String(feature.get("confidence") ?? "")), true);
      }
      source.clear(true);
      source.addFeatures(features);

      if (eventMode) {
        refreshEvents();
        computeBuckets();
        return;
      }
      const all = { high: 0, medium: 0, low: 0 };
      for (const feature of features) all[feature.get("band") as FireConfidenceBand]++;
      setFireHotspotCounts({ all, inWindow: null });
    },
    [eventMode, refreshEvents, computeBuckets]
  );

  const fetchFireHotspots = useCallback(async () => {
    const layer = fireLayerRef.current;
    if (!layer) return;

    setFireHotspotsStatus("loading");
    try {
      // Indonesia-wide, not view-bound (see the route) — panning or zooming
      // doesn't need a refetch, only the 10-minute interval does.
      const res = await fetch("/api/fire-hotspots");
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to fetch fire hotspots");

      const geoJson = new GeoJSONFormat();
      const features = (body.features as { geometry: Geometry; properties: FireHotspotProperties }[]).map(
        (f) =>
          geoJson.readFeature(
            { type: "Feature", properties: f.properties, geometry: f.geometry },
            { dataProjection: "EPSG:4326", featureProjection: "EPSG:3857" }
          ) as Feature<Geometry>
      );

      showFireHotspots(features);

      if (body.stale) {
        setFireHotspotsStatus("error");
        if (locale === "id") {
          toast.warning("NASA FIRMS tidak bisa dihubungi — menampilkan titik api terakhir yang tersimpan.", {
            position: "top-center",
          });
        } else {
          toast.warning("NASA FIRMS is unreachable — showing the last hotspots we have.");
        }
      } else {
        setFireHotspotsStatus("idle");
      }
    } catch (err) {
      setFireHotspotsStatus("error");
      if (locale === "id") toast.error("Titik api tidak bisa dimuat.", { position: "top-center" });
      else toast.error(err instanceof Error ? err.message : "Failed to fetch fire hotspots");
    }
  }, [locale, showFireHotspots]);

  useEffect(() => {
    const instance = mapRef.current;
    if (!instance) return;

    if (!eventMode && !fireHotspots.enabled) {
      if (fireHotspotsIntervalRef.current) clearInterval(fireHotspotsIntervalRef.current);
      fireHotspotsIntervalRef.current = null;
      if (fireLayerRef.current) instance.removeLayer(fireLayerRef.current);
      fireLayerRef.current = null;
      fireSourceRef.current.clear();
      setFireHotspotsStatus("idle");
      setFireHotspotCounts(null);
      return;
    }

    let layer: VectorLayer<VectorSource<Feature<Geometry>>> | VectorImageLayer<VectorSource<Feature<Geometry>>>;
    if (eventMode) {
      const cluster = new Cluster({
        source: fireSourceRef.current,
        distance: clusterDistance("fire", instance.getView().getZoom() ?? 5),
        minDistance: 6,
        attributions: FIRMS_ATTRIBUTION,
        geometryFunction: (feature) => (inWindow(feature.get("t")) ? (feature.getGeometry() as Point) : null),
      });
      fireClusterRef.current = cluster;
      cluster.on("change", () => syncSingles(cluster, fireSinglesRef.current));
      layer = new VectorLayer({
        source: cluster,
        style: (feature) => (useMapSettings.getState().clusterEnabled ? clusterStyle("fire", feature) : undefined),
        zIndex: EVENT_Z.fire,
        visible: useMapSettings.getState().fireHotspots.enabled,
      });
      const singlesLayer = new VectorLayer({
        source: fireSinglesRef.current,
        style: (feature) => eventMarkerStyle("fire", feature, still() ? 0 : fireFrameRef.current),
        zIndex: EVENT_Z.fire,
        visible: useMapSettings.getState().fireHotspots.enabled,
      });
      instance.addLayer(singlesLayer);
      fireSinglesLayerRef.current = singlesLayer;
    } else {
      fireSourceRef.current.setAttributions(FIRMS_ATTRIBUTION);
      layer = new VectorImageLayer({
        source: fireSourceRef.current,
        style: (feature) => {
          const band = feature.get("band") as FireConfidenceBand;
          if (useMapSettings.getState().fireHotspots.hiddenBands.includes(band)) return undefined;
          return fireHotspotStyles[band];
        },
        zIndex: EVENT_Z.fire,
      });
    }
    instance.addLayer(layer);
    fireLayerRef.current = layer;

    if (!eventMode) {
      void fetchFireHotspots();
      // FIRMS's own NRT cadence — polling more often re-asks for data that
      // hasn't changed yet.
      fireHotspotsIntervalRef.current = setInterval(fetchFireHotspots, 10 * 60 * 1000);
    }

    return () => {
      if (fireHotspotsIntervalRef.current) clearInterval(fireHotspotsIntervalRef.current);
      fireHotspotsIntervalRef.current = null;
      instance.removeLayer(layer);
      if (fireSinglesLayerRef.current) instance.removeLayer(fireSinglesLayerRef.current);
      fireSinglesLayerRef.current = null;
      if (fireLayerRef.current === layer) fireLayerRef.current = null;
    };
  }, [fireHotspots.enabled, fetchFireHotspots, eventMode, inWindow, syncSingles, still]);

  const fireDay = wibDayIso(Date.now());
  const fireBandsKey = FIRE_BANDS.filter((band) => !fireHotspots.hiddenBands.includes(band)).join(",");

  useEffect(() => {
    if (!eventMode) return;
    const timer = setInterval(() => setFireRefresh((n) => n + 1), 10 * 60 * 1000);
    return () => clearInterval(timer);
  }, [eventMode]);

  useEffect(() => {
    if (!eventMode) return;
    // With every level switched off there is nothing to draw, but the card
    // still shows what each level holds, so the tally is fetched on its own.
    const shownBands = fireBandsKey ? (fireBandsKey.split(",") as FireConfidenceBand[]) : [];
    const withPoints = shownBands.length > 0;
    const bands = withPoints ? shownBands : FIRE_BANDS;

    const controller = new AbortController();
    setFireHotspotsStatus("loading");
    const { start, end } = eventWindow({ ...useMapSettings.getState().eventTime, cursor: null });
    fetchFireHistoryDay(fireDay, bands, fireSpanForRange(eventRange), { from: start, to: end }, withPoints, controller.signal)
      .then((body) => {
        showFireHotspots(fireFeaturesFromPoints(body.points));
        setFireHotspotCounts((prev) => (prev ? { ...prev, inWindow: body.counts } : prev));
        setFireFetchedAt(new Date().toISOString());
        setFireHotspotsStatus("idle");
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setFireHotspotsStatus("error");
        toast.error("Titik api tidak bisa dimuat.", { position: "top-center" });
      });
    return () => controller.abort();
  }, [eventMode, fireDay, eventRange, fireBandsKey, fireRefresh, showFireHotspots]);

  useEffect(() => {
    fireLayerRef.current?.changed();
  }, [fireHotspots.hiddenBands]);

  useEffect(() => {
    volcanoLayerRef.current?.changed();
    volcanoEruptingLayerRef.current?.changed();
    refreshEvents();
  }, [volcano.hiddenLevels, quake.hiddenBands, refreshEvents]);

  useEffect(() => {
    if (!eventMode) return;
    fireClusterRef.current?.refresh();
    quakeClusterRef.current?.refresh();
    fireSinglesLayerRef.current?.changed();
    volcanoEruptingLayerRef.current?.changed();
    eruptionEffectLayerRef.current?.setVisible(useMapSettings.getState().volcano.enabled && !still());
    refreshEvents();
  }, [eventMode, clusterEnabled, animationsEnabled, refreshEvents, still]);

  // Switching a layer off only hides it: its data keeps loading, so the
  // summary can still say how much is out there.
  useEffect(() => {
    if (!eventMode) return;
    fireLayerRef.current?.setVisible(fireHotspots.enabled);
    fireSinglesLayerRef.current?.setVisible(fireHotspots.enabled);
    quakeLayerRef.current?.setVisible(quake.enabled);
    quakeSinglesLayerRef.current?.setVisible(quake.enabled);
    volcanoLayerRef.current?.setVisible(volcano.enabled);
    volcanoEruptingLayerRef.current?.setVisible(volcano.enabled);
    eruptionEffectLayerRef.current?.setVisible(volcano.enabled && !still());
    volcanoZoneLayerRef.current?.setVisible(volcano.enabled);
    quakePulseLayerRef.current?.setVisible(quake.enabled);
    refreshEvents();
  }, [eventMode, fireHotspots.enabled, quake.enabled, volcano.enabled, refreshEvents, still]);

  // One hit test for every event layer: OpenLayers hands back the topmost
  // feature first, so two markers on the same spot can never open two popups.
  const eventAt = useCallback((pixel: number[]) => {
    const instance = mapRef.current;
    if (!instance) return null;
    const layers = [
      fireLayerRef.current,
      fireSinglesLayerRef.current,
      quakeLayerRef.current,
      quakeSinglesLayerRef.current,
      volcanoLayerRef.current,
      volcanoEruptingLayerRef.current,
    ];
    const hit = instance.forEachFeatureAtPixel(
      pixel,
      (feature, layer) => ({ feature, layer }),
      { layerFilter: (l) => layers.includes(l as never) && l.getVisible(), hitTolerance: 5 }
    );
    if (!hit) return null;
    const kind: EventKind =
      hit.layer === fireLayerRef.current || hit.layer === fireSinglesLayerRef.current
        ? "fire"
        : hit.layer === quakeLayerRef.current || hit.layer === quakeSinglesLayerRef.current
          ? "quake"
          : "volcano";
    const feature = kind === "volcano" ? hit.feature : clusterChild(hit.feature);
    if (!feature) return { kind, coordinate: null, properties: null };
    return {
      kind,
      coordinate: (feature.getGeometry() as Point).getCoordinates(),
      properties: feature.getProperties(),
    };
  }, []);

  const fireHotspotAt = useCallback(
    (pixel: number[]) => {
      const hit = eventAt(pixel);
      if (!hit || hit.kind !== "fire" || !hit.coordinate) return null;
      return { coordinate: hit.coordinate, properties: hit.properties as FireHotspotProperties };
    },
    [eventAt]
  );

  useEffect(() => {
    const instance = mapRef.current;
    // The dashboard pins its own popup to the point instead.
    if (!instance || locale === "id") return;

    const handleClick: Parameters<OlMap["on"]>[1] = (evt) => {
      const hit = fireHotspotAt((evt as MapBrowserEvent<PointerEvent>).pixel);
      if (!hit) return;
      const props = hit.properties;
      const { label } = fireConfidenceStyle(props.confidence);
      toast.info(
        `${props.sensor} (${props.satellite}) — detected ${new Date(props.detectedAt).toLocaleString()}`,
        { description: `Confidence: ${label}` }
      );
    };

    instance.on("singleclick", handleClick);
    return () => instance.un("singleclick", handleClick);
  }, [locale, fireHotspotAt]);

  const showVolcanoes = useCallback(
    (features: Feature<Geometry>[]) => {
      const source = volcanoLayerRef.current?.getSource();
      const zoneSource = volcanoZoneLayerRef.current?.getSource();
      if (!source || !zoneSource) return;
      volcanoFeaturesRef.current = features;
      source.clear(true);
      source.addFeatures(features);

      const zoneFeatures: Feature<Geometry>[] = [];
      for (const feature of features) {
        const props = feature.getProperties() as VolcanoFeatureProperties;
        const [lon, lat] = toLonLat((feature.getGeometry() as Point).getCoordinates());

        if (props.krb) {
          // Largest ring first, so the smaller, more dangerous ones paint on top.
          for (const zone of [...props.krb.zones].reverse()) {
            zoneFeatures.push(
              new Feature({
                geometry: new Polygon([circlePolygonLonLat(lon, lat, zone.radiusKm).map((c) => fromLonLat(c))]),
                kind: "krb",
                color: zone.color,
              }) as Feature<Geometry>
            );
          }
        }

      }

      zoneSource.clear();
      zoneSource.addFeatures(zoneFeatures);
      refreshEvents();
      computeBuckets();
    },
    [refreshEvents, computeBuckets]
  );

  const fetchVolcanoes = useCallback(async () => {
    const layer = volcanoLayerRef.current;
    if (!layer) return;

    setVolcanoStatus("loading");
    try {
      const res = await fetch("/api/volcanoes");
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to fetch volcanoes");

      const geoJson = new GeoJSONFormat();
      const features = (body.features as { geometry: Geometry; properties: VolcanoFeatureProperties }[]).map(
        (f) =>
          geoJson.readFeature(
            { type: "Feature", properties: f.properties, geometry: f.geometry },
            { dataProjection: "EPSG:4326", featureProjection: "EPSG:3857" }
          ) as Feature<Geometry>
      );

      showVolcanoes(features);
      setVolcanoMeta({
        magmaUrl: body.magmaUrl,
        magmaFetchedAt: body.magmaFetchedAt,
        magmaStale: body.magmaStale,
        eruptionHistorySince: body.eruptionHistorySince,
        eruptionHistoryComplete: body.eruptionHistoryComplete,
      });
      setVolcanoStatus(body.magmaStale ? "error" : "idle");
      if (body.magmaStale) {
        if (locale === "id") {
          toast.warning("Data MAGMA tidak bisa diperbarui — menampilkan status terakhir yang tersimpan.", {
            position: "top-center",
          });
        } else {
          toast.warning("MAGMA is unreachable — showing the last saved volcano status.");
        }
      }
    } catch (err) {
      setVolcanoStatus("error");
      if (locale === "id") toast.error("Data gunung api tidak bisa dimuat.", { position: "top-center" });
      else toast.error(err instanceof Error ? err.message : "Failed to fetch volcanoes");
    }
  }, [locale, showVolcanoes]);

  useEffect(() => {
    const instance = mapRef.current;
    if (!instance) return;

    const visible = useMapSettings.getState().volcano.enabled;
    const zoneLayer = new VectorLayer({
      source: new VectorSource<Feature<Geometry>>(),
      style: (feature) => volcanoKrbZoneStyle(feature.get("color")),
      zIndex: EVENT_Z.volcanoZone,
      visible,
    });

    const source = new VectorSource<Feature<Geometry>>({ attributions: MAGMA_ATTRIBUTION });
    const hidden = (feature: FeatureLike) =>
      useMapSettings
        .getState()
        .volcano.hiddenLevels.includes(volcanoLevelKey(feature.get("level"), Boolean(feature.get("eruptedRecently"))));

    // Two layers over one source: an erupting volcano has to sit above every
    // other marker, a quiet one below the earthquakes.
    const layer = new VectorLayer({
      source,
      style: (feature, resolution) =>
        hidden(feature) || feature.get("eruptedRecently")
          ? undefined
          : volcanoStatusStyle(feature.get("level"), false, zoomForResolution(resolution)),
      zIndex: EVENT_Z.volcano,
      visible,
    });
    const eruptingLayer = new VectorLayer({
      source,
      style: (feature, resolution) =>
        hidden(feature) || !feature.get("eruptedRecently")
          ? undefined
          : volcanoStatusStyle(feature.get("level"), true, zoomForResolution(resolution)),
      zIndex: EVENT_Z.erupting,
      visible,
    });

    const effectSource = eruptionEffectSourceRef.current;
    const effectLayer = new VectorLayer({
      source: effectSource,
      style: () => eruptionEffectStyle(performance.now(), prefersReducedMotion()),
      updateWhileAnimating: true,
      updateWhileInteracting: true,
      zIndex: EVENT_Z.eruptionEffect,
      visible,
    });

    instance.addLayer(zoneLayer);
    instance.addLayer(layer);
    instance.addLayer(effectLayer);
    instance.addLayer(eruptingLayer);
    eruptionEffectLayerRef.current = effectLayer;
    volcanoZoneLayerRef.current = zoneLayer;
    volcanoLayerRef.current = layer;
    volcanoEruptingLayerRef.current = eruptingLayer;

    void fetchVolcanoes();
    // Our own cache, not MAGMA: the server only goes to MAGMA every half hour.
    volcanoIntervalRef.current = setInterval(fetchVolcanoes, 10 * 60 * 1000);

    return () => {
      if (volcanoIntervalRef.current) clearInterval(volcanoIntervalRef.current);
      volcanoIntervalRef.current = null;
      instance.removeLayer(zoneLayer);
      instance.removeLayer(layer);
      instance.removeLayer(effectLayer);
      instance.removeLayer(eruptingLayer);
      effectSource.clear();
      eruptionEffectLayerRef.current = null;
      volcanoZoneLayerRef.current = null;
      volcanoLayerRef.current = null;
      volcanoEruptingLayerRef.current = null;
    };
  }, [fetchVolcanoes, still]);

  const fetchQuakes = useCallback(async () => {
    if (!quakeLayerRef.current) return;

    setQuakeStatus("loading");
    try {
      const res = await fetch("/api/earthquakes");
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to fetch earthquakes");

      quakeEventsRef.current = body.events as Earthquake[];
      const source = quakeSourceRef.current;
      source.clear(true);
      source.addFeatures(
        quakeEventsRef.current.map(
          (event) =>
            new Feature({
              geometry: new Point(fromLonLat([event.lon, event.lat])),
              ...event,
              t: Date.parse(event.occurredAt),
            }) as Feature<Geometry>
        )
      );
      refreshEvents();
      computeBuckets();

      setQuakeMeta({
        bmkgUrl: body.bmkgUrl,
        fetchedAt: body.fetchedAt,
        historySince: body.historySince,
        stale: body.stale,
      });
      setQuakeStatus(body.stale ? "error" : "idle");

      if (body.stale) {
        if (locale === "id") {
          toast.warning("Data BMKG tidak bisa diperbarui — menampilkan gempa terakhir yang tersimpan.", {
            position: "top-center",
          });
        } else {
          toast.warning("BMKG is unreachable — showing the last saved earthquakes.");
        }
      }
    } catch (err) {
      setQuakeStatus("error");
      if (locale === "id") toast.error("Data gempa tidak bisa dimuat.", { position: "top-center" });
      else toast.error(err instanceof Error ? err.message : "Failed to fetch earthquakes");
    }
  }, [locale, refreshEvents, computeBuckets]);

  useEffect(() => {
    const instance = mapRef.current;
    if (!instance) return;

    const cluster = new Cluster({
      source: quakeSourceRef.current,
      distance: clusterDistance("quake", instance.getView().getZoom() ?? 5),
      minDistance: 4,
      attributions: QUAKE_BMKG.attribution,
      geometryFunction: (feature) =>
        inWindow(feature.get("t")) &&
        !useMapSettings.getState().quake.hiddenBands.includes(quakeBand(feature.get("magnitude")))
          ? (feature.getGeometry() as Point)
          : null,
    });
    cluster.on("change", () => syncSingles(cluster, quakeSinglesRef.current));
    const layer = new VectorLayer({
      source: cluster,
      style: (feature) => (useMapSettings.getState().clusterEnabled ? clusterStyle("quake", feature) : undefined),
      zIndex: EVENT_Z.quake,
      visible: useMapSettings.getState().quake.enabled,
    });
    const singlesLayer = new VectorLayer({
      source: quakeSinglesRef.current,
      style: (feature) => eventMarkerStyle("quake", feature, 0),
      zIndex: EVENT_Z.quake,
      visible: useMapSettings.getState().quake.enabled,
    });
    const pulseSource = quakePulseSourceRef.current;
    const pulseEntries = pulseEntriesRef.current;
    const pulseLayer = new VectorLayer({
      source: pulseSource,
      style: (feature, resolution) => {
        const phase = ((performance.now() - feature.get("bornAt")) % PULSE_PERIOD_MS) / PULSE_PERIOD_MS;
        // Web Mercator's metres per pixel overstate ground distance away from
        // the equator; the cosine puts the ring back on the ground.
        const lat = toLonLat((feature.getGeometry() as Point).getCoordinates())[1];
        const metresPerPixel = resolution * Math.cos((lat * Math.PI) / 180);
        const reach = Math.min(4000, ((feature.get("km") as number) * 1000) / metresPerPixel);
        return eventPulseStyle(feature.get("rgb"), reach, feature.get("strength"), phase, prefersReducedMotion());
      },
      updateWhileAnimating: true,
      updateWhileInteracting: true,
      zIndex: EVENT_Z.pulse,
    });

    instance.addLayer(pulseLayer);
    instance.addLayer(layer);
    instance.addLayer(singlesLayer);
    quakeSinglesLayerRef.current = singlesLayer;
    quakeClusterRef.current = cluster;
    quakePulseLayerRef.current = pulseLayer;
    quakeLayerRef.current = layer;

    void fetchQuakes();
    // Our own cache, not BMKG: the server reads BMKG at most every two minutes.
    quakeIntervalRef.current = setInterval(fetchQuakes, 2 * 60 * 1000);

    return () => {
      if (quakeIntervalRef.current) clearInterval(quakeIntervalRef.current);
      quakeIntervalRef.current = null;
      if (pulseTimerRef.current) clearInterval(pulseTimerRef.current);
      pulseTimerRef.current = null;
      pulseEntries.clear();
      pulseSource.clear();
      instance.removeLayer(pulseLayer);
      instance.removeLayer(layer);
      instance.removeLayer(singlesLayer);
      quakeSinglesLayerRef.current = null;
      quakeClusterRef.current = null;
      quakePulseLayerRef.current = null;
      quakeLayerRef.current = null;
    };
  }, [fetchQuakes, inWindow, syncSingles]);

  useEffect(() => {
    if (!eventMode) return;
    const unsubscribe = useMapSettings.subscribe((state, prev) => {
      if (state.eventTime !== prev.eventTime) {
        refreshEvents();
        if (state.eventTime.range !== prev.eventTime.range) computeBuckets();
      }
    });
    // Following now: the window's edges move on their own, so re-derive it.
    const minute = setInterval(() => {
      if (useMapSettings.getState().eventTime.cursor !== null) return;
      refreshEvents();
      computeBuckets();
    }, 60 * 1000);
    return () => {
      unsubscribe();
      clearInterval(minute);
    };
  }, [eventMode, refreshEvents, computeBuckets]);

  useEffect(() => {
    if (!eventMode || !eventPlaying) return;
    const timer = setInterval(() => {
      const time = useMapSettings.getState().eventTime;
      const w = eventWindow({ ...time, cursor: null });
      const cursor = time.cursor ?? w.start;
      const next = cursor + ((w.end - w.start) / (REPLAY_DURATION_MS / time.speed)) * REPLAY_TICK_MS;
      if (next >= w.end) setEventTime({ cursor: null, playing: false });
      else setEventTime({ cursor: next });
    }, REPLAY_TICK_MS);
    return () => clearInterval(timer);
  }, [eventMode, eventPlaying, setEventTime]);

  useEffect(() => {
    const instance = mapRef.current;
    if (!instance || !eventMode) return;

    const eventLayers = () => [fireLayerRef.current, quakeLayerRef.current, volcanoLayerRef.current];

    const onClick = (evt: MapBrowserEvent) => {
      const children = instance.forEachFeatureAtPixel(
        evt.pixel,
        (feature, layer) =>
          (layer === fireLayerRef.current || layer === quakeLayerRef.current) && layer.getVisible()
            ? (feature.get("features") as Feature<Geometry>[] | undefined)
            : undefined,
        { hitTolerance: 5 }
      );
      if (!children || children.length < 2) return;

      const view = instance.getView();
      const zoom = view.getZoom() ?? 5;
      const extent = boundingExtent(children.map((child) => (child.getGeometry() as Point).getCoordinates()));
      const resolution = view.getResolution() ?? 1;
      // Children stacked on (almost) one spot would fit at street level in one
      // jump; step in a couple of levels instead so the split is followable.
      if (Math.max(getWidth(extent), getHeight(extent)) < resolution * 24) {
        view.animate({ center: getCenter(extent), zoom: Math.min(zoom + 2, 17), duration: 450 });
        return;
      }
      view.fit(extent, {
        padding: [120, 120, 200, 120],
        duration: 550,
        maxZoom: Math.min(zoom + 4, 16),
      });
    };

    const onMove = (evt: MapBrowserEvent) => {
      if (evt.dragging) return;
      const layers = eventLayers();
      const hit = instance.hasFeatureAtPixel(evt.pixel, {
        layerFilter: (l) => layers.includes(l as never),
        hitTolerance: 4,
      });
      const target = instance.getTargetElement();
      if (target) target.style.cursor = hit ? "pointer" : "";
    };

    const onMoveEnd = () => {
      quakePulseLayerRef.current?.changed();
      const zoom = instance.getView().getZoom() ?? 5;
      fireClusterRef.current?.setDistance(clusterDistance("fire", zoom));
      quakeClusterRef.current?.setDistance(clusterDistance("quake", zoom));
      // Zooming splits clusters, which changes which quakes are drawn alone.
      refreshEvents();
    };

    instance.on("singleclick", onClick);
    instance.on("pointermove", onMove);
    instance.on("moveend", onMoveEnd);
    return () => {
      instance.un("singleclick", onClick);
      instance.un("pointermove", onMove);
      instance.un("moveend", onMoveEnd);
    };
  }, [eventMode, refreshEvents]);

  const quakeAt = useCallback(
    (pixel: number[]) => {
      const hit = eventAt(pixel);
      if (!hit || hit.kind !== "quake" || !hit.coordinate) return null;
      return { coordinate: hit.coordinate, properties: hit.properties as QuakeFeatureProperties };
    },
    [eventAt]
  );

  const volcanoAt = useCallback(
    (pixel: number[]) => {
      const hit = eventAt(pixel);
      if (!hit || hit.kind !== "volcano" || !hit.coordinate) return null;
      return { coordinate: hit.coordinate, properties: hit.properties as VolcanoFeatureProperties };
    },
    [eventAt]
  );

  useEffect(() => {
    const source = sentinel2LayerRef.current?.getSource() as XYZ | undefined;
    source?.setUrl(
      `https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-${sentinel2Year}_3857/default/g/{z}/{y}/{x}.jpg`
    );
    source?.setAttributions(sentinel2Attribution(sentinel2Year));
  }, [sentinel2Year]);

  useEffect(() => {
    layers.forEach((meta, index) => {
      const olLayer = vectorLayersRef.current.get(meta.id);
      if (!olLayer) return;
      olLayer.setVisible(meta.visible);
      olLayer.setOpacity(meta.opacity);
      olLayer.setZIndex(index + 1);
      olLayer.setStyle(styleForLayer(meta));
    });
  }, [layers]);

  const zoomToExtentOf = useCallback((source: VectorSource<Feature<Geometry>>) => {
    const instance = mapRef.current;
    if (!instance) return;
    const extent = source.getExtent();
    if (!isUsableExtent(extent)) return;
    instance.getView().fit(extent, {
      padding: [48, 48, 48, 48],
      maxZoom: 18,
      duration: 300,
    });
  }, []);

  const saveLayerOrWarn = useCallback(
    async (meta: Parameters<typeof createLayer>[0], features: Parameters<typeof createLayer>[1]) => {
      try {
        await createLayer(meta, features);
      } catch {
        toast.error(`"${meta.name}" could not be saved — it will be gone after a reload.`);
      }
    },
    []
  );

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const instance = mapRef.current;
      if (!instance) return;

      setIsLoading(true);
      try {
        for (const file of Array.from(files)) {
          if (file.size > MAX_FILE_BYTES) {
            toast.error(`${file.name} is over the 25MB per-file limit`);
            continue;
          }
          if (totalBytesRef.current + file.size > MAX_PROJECT_BYTES) {
            toast.error(`Adding ${file.name} would put this project over the 200MB limit`);
            continue;
          }

          const features = await parseUploadedFile(file);
          if (features.length === 0) {
            toast.warning(`${file.name} contained no features`);
            continue;
          }

          const id = uuid();
          const sortOrder = useMapSettings.getState().layers.length;
          const color = LAYER_PALETTE[sortOrder % LAYER_PALETTE.length];

          const source = new VectorSource<Feature<Geometry>>({ features });
          const olLayer = new VectorLayer({ source, style: layerStyle(color) });
          instance.addLayer(olLayer);
          vectorLayersRef.current.set(id, olLayer);

          const meta: MapLayer = {
            id,
            name: file.name,
            color,
            opacity: 1,
            visible: true,
            featureCount: features.length,
            geometryType: summariseGeometryType(features),
            attributes: collectAttributeKeys(features),
            styleMode: "single",
            categoryField: null,
            categories: [],
          };
          addLayerMeta(meta);

          layerByteSizeRef.current.set(id, file.size);
          totalBytesRef.current += file.size;

          const geoJson = new GeoJSONFormat();
          void saveLayerOrWarn(
            { ...meta, sortOrder },
            features.map((feature) => {
              const obj = geoJson.writeFeatureObject(feature);
              return { properties: obj.properties ?? {}, geometry: obj.geometry };
            })
          );

          zoomToExtentOf(source);
          toast.success(`Loaded ${features.length} feature(s) from ${file.name}`);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to parse file");
      } finally {
        setIsLoading(false);
      }
    },
    [addLayerMeta, zoomToExtentOf, saveLayerOrWarn]
  );

  const FOOTPRINT_COLOR = "#f97316";

  const fetchAndAddFootprintLayer = useCallback(
    async (query: string) => {
      const instance = mapRef.current;
      if (!instance) return;

      setIsLoading(true);
      try {
        const res = await fetch(`/api/building-footprints?${query}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          toast.error(body.error ?? "Failed to fetch building footprints");
          return;
        }
        const data = (await res.json()) as {
          features: LayerFeaturePayload[];
          layerName: string;
          attribution: string;
        };
        if (data.features.length === 0) {
          toast.warning("No building footprints found there");
          return;
        }

        const geoJson = new GeoJSONFormat();
        const features = data.features.map(
          (f) =>
            geoJson.readFeature(
              { type: "Feature", properties: f.properties, geometry: f.geometry },
              { dataProjection: "EPSG:3857", featureProjection: "EPSG:3857" }
            ) as Feature<Geometry>
        );

        const id = uuid();
        const sortOrder = useMapSettings.getState().layers.length;
        const source = new VectorSource<Feature<Geometry>>({
          features,
          attributions: data.attribution,
        });
        const olLayer = new VectorLayer({ source, style: layerStyle(FOOTPRINT_COLOR) });
        instance.addLayer(olLayer);
        vectorLayersRef.current.set(id, olLayer);

        const meta: MapLayer = {
          id,
          name: data.layerName,
          color: FOOTPRINT_COLOR,
          opacity: 1,
          visible: true,
          featureCount: features.length,
          geometryType: summariseGeometryType(features),
          attributes: collectAttributeKeys(features),
          styleMode: "single",
          categoryField: null,
          categories: [],
        };
        addLayerMeta(meta);

        const bytes = features.reduce(
          (sum, f) => sum + JSON.stringify(f.getProperties()).length,
          0
        );
        layerByteSizeRef.current.set(id, bytes);
        totalBytesRef.current += bytes;

        void saveLayerOrWarn({ ...meta, sortOrder }, data.features);
        zoomToExtentOf(source);

        toast.success(`Imported ${features.length} building footprint(s)`);
      } catch {
        toast.error("Failed to fetch building footprints");
      } finally {
        setIsLoading(false);
      }
    },
    [addLayerMeta, zoomToExtentOf, saveLayerOrWarn]
  );

  const importBuildingFootprints = useCallback(async () => {
    const instance = mapRef.current;
    if (!instance) return;

    const size = instance.getSize();
    if (!size) return;
    const extent = instance.getView().calculateExtent(size);

    await fetchAndAddFootprintLayer(`bbox=${extent.join(",")}`);
  }, [fetchAndAddFootprintLayer]);

  const importBuildingFootprintsForBoundary = useCallback(
    async (boundaryId: string) => {
      await fetchAndAddFootprintLayer(`boundaryId=${encodeURIComponent(boundaryId)}`);
    },
    [fetchAndAddFootprintLayer]
  );

  const removeLayer = useCallback(
    (id: string) => {
      const instance = mapRef.current;
      const olLayer = vectorLayersRef.current.get(id);
      if (instance && olLayer) {
        instance.removeLayer(olLayer);
        vectorLayersRef.current.delete(id);
      }
      totalBytesRef.current -= layerByteSizeRef.current.get(id) ?? 0;
      layerByteSizeRef.current.delete(id);
      removeLayerMeta(id);
      void deleteLayer(id);
    },
    [removeLayerMeta]
  );

  const zoomToLayer = useCallback(
    (id: string) => {
      const olLayer = vectorLayersRef.current.get(id);
      const source = olLayer?.getSource();
      if (source) zoomToExtentOf(source);
    },
    [zoomToExtentOf]
  );

  const zoomToAll = useCallback(() => {
    const instance = mapRef.current;
    if (!instance) return;
    const combined = new VectorSource<Feature<Geometry>>();
    vectorLayersRef.current.forEach((olLayer) => {
      const features = olLayer.getSource()?.getFeatures();
      if (features?.length) combined.addFeatures(features);
    });
    if (combined.getFeatures().length > 0) zoomToExtentOf(combined);
  }, [zoomToExtentOf]);

  const setLayerCategoryField = useCallback(
    (id: string, field: string | null) => {
      const update = useMapSettings.getState().updateLayer;
      if (!field) {
        update(id, { styleMode: "single", categoryField: null, categories: [] });
        return;
      }
      const features = vectorLayersRef.current.get(id)?.getSource()?.getFeatures() ?? [];
      const values = distinctValues(features, field);
      const palette = categoryPalette(values.length);
      update(id, {
        styleMode: "categorised",
        categoryField: field,
        categories: values.map((value, i) => ({ value, color: palette[i] })),
      });
    },
    []
  );

  const centerOn = useCallback((lon: number, lat: number) => {
    const instance = mapRef.current;
    if (!instance) return;
    instance.getView().animate({ center: fromLonLat([lon, lat]), duration: 300 });
  }, []);

  const markMyLocation = useCallback((lon: number, lat: number) => {
    const instance = mapRef.current;
    if (!instance) return;

    if (!myLocationLayerRef.current) {
      myLocationLayerRef.current = new VectorLayer({
        source: new VectorSource<Feature<Geometry>>(),
        style: myLocationStyle,
        zIndex: 30,
      });
      instance.addLayer(myLocationLayerRef.current);
    }
    const source = myLocationLayerRef.current.getSource();
    source?.clear();
    source?.addFeature(new Feature(new Point(fromLonLat([lon, lat]))));
    myLocationLayerRef.current.setVisible(true);

    const view = instance.getView();
    view.animate({
      center: fromLonLat([lon, lat]),
      zoom: Math.max(view.getZoom() ?? 0, 14),
      duration: 400,
    });
  }, []);

  const setMyLocationVisible = useCallback((visible: boolean) => {
    myLocationLayerRef.current?.setVisible(visible);
  }, []);

  const focusAdminArea = useCallback(
    async (pcode: string) => {
      const instance = mapRef.current;
      const layer = adminAreaLayerRef.current;
      if (!instance || !layer) return;

      const request = ++adminAreaRequestRef.current;
      const outline = await fetchAdminAreaOutline(pcode);
      // A later pick, or a clear, may have happened while this one was loading.
      if (request !== adminAreaRequestRef.current) return;

      const feature = new GeoJSONFormat().readFeature(
        { type: "Feature", properties: { name: outline.name }, geometry: outline.geometry },
        { dataProjection: "EPSG:4326", featureProjection: "EPSG:3857" }
      ) as Feature<Geometry>;
      adminAreaFeatureRef.current = feature;
      const source = layer.getSource();
      source?.clear();
      source?.addFeature(feature);
      layer.setVisible(useMapSettings.getState().adminBoundaryVisible);
      refreshEvents();

      const narrow = window.innerWidth < 640;
      instance.getView().fit(transformExtent(outline.bbox, "EPSG:4326", "EPSG:3857"), {
        padding: narrow ? [150, 24, 300, 24] : [110, 420, 200, 110],
        maxZoom: 16,
        duration: 600,
      });

      if (selectionTimerRef.current) clearInterval(selectionTimerRef.current);
      selectionTimerRef.current = null;
      breatheRef.current = 0;
      if (prefersReducedMotion()) return;
      const startedAt = performance.now();
      // Three slow breaths to say "here", then it holds still.
      selectionTimerRef.current = setInterval(() => {
        const elapsed = performance.now() - startedAt;
        if (elapsed > SELECTION_BREATHS * SELECTION_BREATH_MS) {
          breatheRef.current = 0;
          if (selectionTimerRef.current) clearInterval(selectionTimerRef.current);
          selectionTimerRef.current = null;
        } else {
          breatheRef.current = 0.5 - 0.5 * Math.cos((elapsed / SELECTION_BREATH_MS) * Math.PI * 2);
        }
        layer.changed();
      }, 1000 / 30);
    },
    [refreshEvents]
  );

  const clearAdminArea = useCallback(() => {
    adminAreaRequestRef.current++;
    adminAreaFeatureRef.current = null;
    if (selectionTimerRef.current) clearInterval(selectionTimerRef.current);
    selectionTimerRef.current = null;
    adminAreaLayerRef.current?.getSource()?.clear();
    adminAreaLayerRef.current?.setVisible(false);
    setAdminAreaCounts(null);
  }, []);

  const zoomBy = useCallback((delta: number) => {
    const view = mapRef.current?.getView();
    if (!view) return;
    view.animate({ zoom: (view.getZoom() ?? 5) + delta, duration: 250 });
  }, []);

  useEffect(() => {
    const layer = adminAreaLayerRef.current;
    if (!layer) return;
    // An empty but visible source still shows its credit.
    layer.setVisible(adminBoundaryVisible && (layer.getSource()?.getFeatures().length ?? 0) > 0);
  }, [adminBoundaryVisible]);

  useEffect(() => {
    const instance = mapRef.current;
    // A province holds millions of buildings; it is never loaded whole.
    if (!instance || !buildingsVisible || !adminArea || adminArea.level < 2) return;

    const source = new VectorSource<Feature<Geometry>>({ attributions: BUILDINGS_ATTRIBUTION });
    const layer = new VectorImageLayer({
      source,
      minZoom: BUILDINGS_MIN_ZOOM,
      // Below zoom 14 a building is a few pixels at most, and an outline on each
      // turns a dense city into a dark smear.
      style: (_feature, resolution) => (resolution > 9.6 ? buildingFlatStyle : buildingStyle),
      zIndex: 14,
    });
    instance.addLayer(layer);

    const controller = new AbortController();
    let started = false;
    // Fetched the first time the reader zooms in far enough to see them, not
    // when the area is picked.
    const load = () => {
      if (started || (instance.getView().getZoom() ?? 0) < BUILDINGS_MIN_ZOOM) return;
      started = true;
      setBuildingsStatus("loading");
      fetch(`/api/building-geojson?area=${encodeURIComponent(adminArea.pcode)}`, { signal: controller.signal })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Buildings failed"))))
        .then((geojson) => {
          source.addFeatures(new GeoJSONFormat().readFeatures(geojson) as Feature<Geometry>[]);
          setBuildingsStatus("idle");
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setBuildingsStatus("error");
          toast.error("Bangunan tidak bisa dimuat.", { position: "top-center" });
        });
    };
    load();
    instance.on("moveend", load);

    return () => {
      instance.un("moveend", load);
      controller.abort();
      setBuildingsStatus("idle");
      instance.removeLayer(layer);
    };
  }, [adminArea, buildingsVisible]);

  const applyScale = useCallback((denominator: number, dpi: number) => {
    const instance = mapRef.current;
    if (!instance) return;
    const view = instance.getView();
    const center = view.getCenter();
    if (!center) return;
    const [lon, lat] = toLonLat(center);
    view.animate({
      resolution: scaleToResolution(denominator, dpi, [lon, lat]),
      duration: 300,
    });
  }, []);

  const loadProject = useCallback(
    (restoredLayers: LayerWithFeaturesResponse[], view: MapViewSettings | null) => {
      const instance = mapRef.current;
      if (!instance) return;

      const geoJson = new GeoJSONFormat();
      restoredLayers.forEach((layer) => {
        const features = layer.features.map(
          (f) =>
            geoJson.readFeature(
              { type: "Feature", properties: f.properties, geometry: f.geometry },
              { dataProjection: "EPSG:3857", featureProjection: "EPSG:3857" }
            ) as Feature<Geometry>
        );

        const source = new VectorSource<Feature<Geometry>>({ features });
        const olLayer = new VectorLayer({ source, style: layerStyle(layer.color) });
        instance.addLayer(olLayer);
        vectorLayersRef.current.set(layer.id, olLayer);

        const bytes = features.reduce(
          (sum, f) => sum + JSON.stringify(f.getProperties()).length,
          0
        );
        layerByteSizeRef.current.set(layer.id, bytes);
        totalBytesRef.current += bytes;

        addLayerMeta({
          id: layer.id,
          name: layer.name,
          color: layer.color,
          opacity: layer.opacity,
          visible: layer.visible,
          featureCount: features.length,
          geometryType: layer.geometryType,
          attributes: layer.attributes,
          styleMode: layer.styleMode,
          categoryField: layer.categoryField,
          categories: layer.categories,
        });
      });

      if (view) {
        instance.getView().setCenter(fromLonLat(view.center));
        instance.getView().setZoom(view.zoom);
      }
    },
    [addLayerMeta]
  );

  const value = useMemo<MapContextValue>(
    () => ({
      map,
      attach,
      resolution,
      addFiles,
      importBuildingFootprints,
      importBuildingFootprintsForBoundary,
      removeLayer,
      zoomToLayer,
      zoomToAll,
      setLayerCategoryField,
      centerOn,
      markMyLocation,
      setMyLocationVisible,
      focusAdminArea,
      clearAdminArea,
      applyScale,
      loadProject,
      isLoading,
      fireHotspotsStatus,
      fireHotspotCounts,
      fireFetchedAt,
      fireHotspotAt,
      volcanoStatus,
      volcanoMeta,
      volcanoAt,
      volcanoCounts,
      quakeStatus,
      quakeMeta,
      quakeCounts,
      eventBuckets,
      buildingsStatus,
      adminAreaCounts,
      zoomBy,
      quakeAt,
    }),
    [
      map,
      attach,
      resolution,
      addFiles,
      removeLayer,
      importBuildingFootprints,
      importBuildingFootprintsForBoundary,
      zoomToLayer,
      zoomToAll,
      setLayerCategoryField,
      centerOn,
      markMyLocation,
      setMyLocationVisible,
      focusAdminArea,
      clearAdminArea,
      applyScale,
      loadProject,
      isLoading,
      fireHotspotsStatus,
      fireHotspotCounts,
      fireFetchedAt,
      fireHotspotAt,
      volcanoStatus,
      volcanoMeta,
      volcanoAt,
      volcanoCounts,
      quakeStatus,
      quakeMeta,
      quakeCounts,
      eventBuckets,
      buildingsStatus,
      adminAreaCounts,
      zoomBy,
      quakeAt,
    ]
  );

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
}

export function useMap() {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error("useMap must be used within <MapProvider>");
  return ctx;
}
