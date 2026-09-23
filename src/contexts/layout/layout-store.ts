import { create } from "zustand";
import { v4 as uuid } from "uuid";
import { getPagePixelSize } from "@/contexts/print/print-utils";
import { buildTemplate } from "./layout-templates";
import { regionChildren, sequenceFlowOrder } from "./layout-flow";
import type {
  BoxRect,
  LayoutElement,
  LayoutRegion,
  PageOrientation,
  PageSettings,
  PageSize,
  TemplateId,
} from "./layout-types";

export const CANVAS_ZOOM_MIN = 0.25;
export const CANVAS_ZOOM_MAX = 2;

interface LayoutState {
  page: PageSettings;
  mapFrame: BoxRect;
  template: TemplateId;
  regions: LayoutRegion[];
  elements: LayoutElement[];
  selectedElementId: string | null;
  canvasZoom: number;
  autoFit: boolean;

  setPageSize: (size: PageSize) => void;
  setOrientation: (orientation: PageOrientation) => void;
  setMapFrame: (rect: BoxRect) => void;
  applyTemplate: (id: TemplateId) => void;

  setCanvasZoom: (zoom: number) => void;
  setAutoFit: (autoFit: boolean) => void;
  fitToViewport: (viewport: { width: number; height: number }) => void;

  addElement: (kind: LayoutElement["kind"]) => void;
  updateElement: (id: string, patch: Partial<LayoutElement>) => void;
  removeElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  bringToFront: (id: string) => void;

  setFlowSize: (id: string, size: number) => void;
}

let zCounter = 1000;

const MIN_FLOW_SIZE = 12;

function baseFields(): Pick<
  LayoutElement,
  "placement" | "regionId" | "flowOrder" | "flowSize" | "visible" | "zIndex"
> {
  return {
    placement: "free",
    regionId: null,
    flowOrder: 0,
    flowSize: 60,
    visible: true,
    zIndex: zCounter++,
  };
}

function defaultElement(kind: LayoutElement["kind"]): LayoutElement {
  const base = { id: uuid(), ...baseFields() };

  switch (kind) {
    case "title":
      return {
        ...base,
        kind: "title",
        text: "Map Title",
        subtitle: "Subtitle goes here",
        align: "left",
        fontSize: 24,
        color: "#111111",
        flowSize: 62,
        rect: { x: 40, y: 40, width: 320, height: 62 },
      };
    case "legend":
      return {
        ...base,
        kind: "legend",
        title: "Legend",
        entries: [{ id: uuid(), label: "Boundary", color: "#2563eb", symbol: "polygon" }],
        fontSize: 12,
        flowSize: 140,
        rect: { x: 40, y: 460, width: 190, height: 140 },
      };
    case "northArrow":
      return {
        ...base,
        kind: "northArrow",
        style: "classic",
        color: "#111111",
        flowSize: 72,
        rect: { x: 660, y: 40, width: 52, height: 72, rotation: 0 },
      };
    case "scaleBar":
      return {
        ...base,
        kind: "scaleBar",
        style: "bar",
        units: "metric",
        flowSize: 44,
        rect: { x: 300, y: 980, width: 220, height: 44 },
      };
    case "logo":
      return {
        ...base,
        kind: "logo",
        src: null,
        flowSize: 90,
        rect: { x: 640, y: 930, width: 90, height: 90 },
      };
    case "inset":
      return {
        ...base,
        kind: "inset",
        zoomOffset: 5,
        flowSize: 130,
        rect: { x: 600, y: 140, width: 160, height: 130 },
      };
    case "textBlock":
      return {
        ...base,
        kind: "textBlock",
        text: "Text block",
        fontSize: 12,
        align: "left",
        color: "#111111",
        flowSize: 60,
        rect: { x: 40, y: 120, width: 220, height: 60 },
      };
    case "divider":
      return {
        ...base,
        kind: "divider",
        orientation: "horizontal",
        color: "#000000",
        thickness: 1,
        flowSize: 1,
        rect: { x: 40, y: 300, width: 220, height: 1 },
      };
  }
}

const initialPage: PageSettings = {
  size: "A4",
  orientation: "landscape",
  dpi: 96,
  marginMm: 10,
};
const initialSize = getPagePixelSize(initialPage);

function clampZoom(zoom: number) {
  return Math.min(CANVAS_ZOOM_MAX, Math.max(CANVAS_ZOOM_MIN, zoom));
}

/**
 * Rebuilds region geometry for a new page size or orientation.
 *
 * The rebuilt regions must keep the **existing ids**: flow elements reference
 * their region by id, so handing back fresh uuids would orphan every child and
 * the region would render empty.
 */
function rescaleRegions(
  current: LayoutRegion[],
  template: TemplateId,
  page: PageSettings
): LayoutRegion[] {
  return buildTemplate(template, page).regions.map((region, i) =>
    current[i] ? { ...region, id: current[i].id } : region
  );
}

export const useLayout = create<LayoutState>((set, get) => ({
  page: initialPage,
  mapFrame: { x: 0, y: 0, width: initialSize.width, height: initialSize.height },
  template: "blank",
  regions: [],
  elements: [],
  selectedElementId: null,
  canvasZoom: 1,
  autoFit: true,

  setPageSize: (size) =>
    set((s) => {
      const page = { ...s.page, size };
      return {
        page,
        mapFrame: buildTemplate(s.template, page).mapFrame,
        regions: rescaleRegions(s.regions, s.template, page),
      };
    }),

  setOrientation: (orientation) =>
    set((s) => {
      const page = { ...s.page, orientation };
      return {
        page,
        mapFrame: buildTemplate(s.template, page).mapFrame,
        regions: rescaleRegions(s.regions, s.template, page),
      };
    }),

  setMapFrame: (mapFrame) => set({ mapFrame }),

  applyTemplate: (id) =>
    set((s) => {
      const result = buildTemplate(id, s.page);
      return {
        template: id,
        mapFrame: result.mapFrame,
        regions: result.regions,
        elements: result.elements,
        selectedElementId: null,
      };
    }),

  setCanvasZoom: (zoom) => set({ canvasZoom: clampZoom(zoom), autoFit: false }),
  setAutoFit: (autoFit) => set({ autoFit }),

  fitToViewport: ({ width, height }) => {
    const pageSize = getPagePixelSize(get().page);
    const zoom = Math.min(width / (pageSize.width + 64), height / (pageSize.height + 64));
    set({ canvasZoom: clampZoom(zoom) });
  },

  addElement: (kind) => {
    const element = defaultElement(kind);
    set((s) => ({ elements: [...s.elements, element], selectedElementId: element.id }));
  },

  updateElement: (id, patch) =>
    set((s) => ({
      elements: s.elements.map((el) =>
        el.id === id ? ({ ...el, ...patch } as LayoutElement) : el
      ),
    })),

  removeElement: (id) =>
    set((s) => ({
      elements: s.elements.filter((el) => el.id !== id),
      selectedElementId: s.selectedElementId === id ? null : s.selectedElementId,
    })),

  duplicateElement: (id) =>
    set((s) => {
      const source = s.elements.find((el) => el.id === id);
      if (!source) return s;

      const copy = {
        ...source,
        id: uuid(),
        zIndex: zCounter++,
        flowOrder: source.flowOrder + 0.5,
        rect:
          source.placement === "free"
            ? { ...source.rect, x: source.rect.x + 16, y: source.rect.y + 16 }
            : { ...source.rect },
      } as LayoutElement;

      const elements = [...s.elements, copy];
      if (source.placement === "flow" && source.regionId) {
        const ids = regionChildren(elements, source.regionId, {
          includeHidden: true,
        }).map((el) => el.id);
        const order = sequenceFlowOrder(ids);
        return {
          elements: elements.map((el) =>
            order.has(el.id) ? { ...el, flowOrder: order.get(el.id)! } : el
          ),
          selectedElementId: copy.id,
        };
      }
      return { elements, selectedElementId: copy.id };
    }),

  selectElement: (selectedElementId) => set({ selectedElementId }),

  bringToFront: (id) => {
    const z = ++zCounter;
    set((s) => ({
      elements: s.elements.map((el) => (el.id === id ? { ...el, zIndex: z } : el)),
    }));
  },

  setFlowSize: (id, size) =>
    set((s) => ({
      elements: s.elements.map((el) =>
        el.id === id ? { ...el, flowSize: Math.max(MIN_FLOW_SIZE, size) } : el
      ),
    })),
}));
