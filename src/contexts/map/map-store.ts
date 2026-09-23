import { create } from "zustand";
import type { AdminAreaResult } from "@/lib/admin-types";
import type {
  BasemapId,
  EventTimeSettings,
  FireHotspotSettings,
  GraticuleSettings,
  MapLayer,
  MapViewSettings,
  MobileDrawerId,
  Sentinel2Year,
  QuakeSettings,
  VolcanoSettings,
} from "./map-types";

interface MapState {
  view: MapViewSettings;
  graticule: GraticuleSettings;
  layers: MapLayer[];
  basemap: BasemapId;
  sentinel2Year: Sentinel2Year;
  fireHotspots: FireHotspotSettings;
  volcano: VolcanoSettings;
  quake: QuakeSettings;
  eventTime: EventTimeSettings;
  // Crowds of events merge into one circle; off draws every one of them.
  clusterEnabled: boolean;
  // One switch for every moving thing on the map.
  animationsEnabled: boolean;
  // Shared so the timeline's own chevron and the History control agree.
  timelineCollapsed: boolean;
  // Which mobile drawer is open, if any — see MobileDrawerId.
  activeMobileDrawer: MobileDrawerId | null;
  adminArea: AdminAreaResult | null;
  adminBoundaryVisible: boolean;
  buildingsVisible: boolean;

  setView: (patch: Partial<MapViewSettings>) => void;
  setGraticule: (patch: Partial<GraticuleSettings>) => void;
  setBasemap: (basemap: BasemapId) => void;
  setSentinel2Year: (year: Sentinel2Year) => void;
  setFireHotspots: (patch: Partial<FireHotspotSettings>) => void;
  setVolcano: (patch: Partial<VolcanoSettings>) => void;
  setQuake: (patch: Partial<QuakeSettings>) => void;
  setEventTime: (patch: Partial<EventTimeSettings>) => void;
  setClusterEnabled: (clusterEnabled: boolean) => void;
  setAnimationsEnabled: (animationsEnabled: boolean) => void;
  setTimelineCollapsed: (timelineCollapsed: boolean) => void;
  setActiveMobileDrawer: (activeMobileDrawer: MobileDrawerId | null) => void;
  setAdminArea: (area: AdminAreaResult | null) => void;
  setAdminBoundaryVisible: (visible: boolean) => void;
  setBuildingsVisible: (visible: boolean) => void;

  addLayer: (layer: MapLayer) => void;
  updateLayer: (id: string, patch: Partial<MapLayer>) => void;
  removeLayer: (id: string) => void;
}

export const useMapSettings = create<MapState>((set) => ({
  view: {
    displayProjection: "EPSG:4326",
    format: "DD",
    center: [118.0, -2.5],
    zoom: 4.6,
    scaleDenominator: 250000,
  },
  graticule: {
    enabled: false,
    intervalDeg: "auto",
    color: "#00000066",
    showLabels: true,
    labelFontSize: 10,
  },
  layers: [],
  basemap: "osm",
  sentinel2Year: 2025,
  fireHotspots: { enabled: false, hiddenBands: ["medium", "low"] },
  // Awas, Siaga and anything erupting are on; the quieter levels are a choice.
  volcano: { enabled: false, hiddenLevels: [2, 1, "unmonitored"] },
  quake: { enabled: false, hiddenBands: [] },
  eventTime: { range: "24h", cursor: null, playing: false, speed: 1 },
  clusterEnabled: false,
  animationsEnabled: true,
  timelineCollapsed: true,
  activeMobileDrawer: null,
  adminArea: null,
  adminBoundaryVisible: true,
  buildingsVisible: true,

  setView: (patch) => set((s) => ({ view: { ...s.view, ...patch } })),
  setGraticule: (patch) => set((s) => ({ graticule: { ...s.graticule, ...patch } })),
  setBasemap: (basemap) => set({ basemap }),
  setSentinel2Year: (sentinel2Year) => set({ sentinel2Year }),
  setFireHotspots: (patch) => set((s) => ({ fireHotspots: { ...s.fireHotspots, ...patch } })),
  setVolcano: (patch) => set((s) => ({ volcano: { ...s.volcano, ...patch } })),
  setQuake: (patch) => set((s) => ({ quake: { ...s.quake, ...patch } })),
  setEventTime: (patch) => set((s) => ({ eventTime: { ...s.eventTime, ...patch } })),
  setClusterEnabled: (clusterEnabled) => set({ clusterEnabled }),
  setAnimationsEnabled: (animationsEnabled) => set({ animationsEnabled }),
  setTimelineCollapsed: (timelineCollapsed) => set({ timelineCollapsed }),
  setActiveMobileDrawer: (activeMobileDrawer) => set({ activeMobileDrawer }),
  setAdminArea: (adminArea) => set({ adminArea, adminBoundaryVisible: true }),
  setAdminBoundaryVisible: (adminBoundaryVisible) => set({ adminBoundaryVisible }),
  setBuildingsVisible: (buildingsVisible) => set({ buildingsVisible }),

  addLayer: (layer) => set((s) => ({ layers: [...s.layers, layer] })),
  updateLayer: (id, patch) =>
    set((s) => ({
      layers: s.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    })),
  removeLayer: (id) => set((s) => ({ layers: s.layers.filter((l) => l.id !== id) })),
}));
