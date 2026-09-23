import { v4 as uuid } from "uuid";
import { getPagePixelSize } from "@/contexts/print/print-utils";
import type {
  LayoutElement,
  LayoutRegion,
  PageSettings,
  TemplateId,
} from "./layout-types";

export interface TemplateResult {
  mapFrame: LayoutElement["rect"];
  regions: LayoutRegion[];
  elements: LayoutElement[];
  graticuleEnabled: boolean;
}

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

type ElementSeed = DistributiveOmit<
  LayoutElement,
  "placement" | "regionId" | "flowOrder" | "flowSize" | "visible" | "zIndex" | "rect"
>;

function makeBuilder(regionId: string | null) {
  let order = 0;
  let z = 1;

  return function el(body: ElementSeed, size: number): LayoutElement {
    return {
      ...body,
      placement: regionId ? "flow" : "free",
      regionId,
      flowOrder: order++,
      flowSize: size,
      visible: true,
      zIndex: z++,
      rect: { x: 0, y: 0, width: 0, height: size },
    } as LayoutElement;
  };
}

function blankTemplate(page: PageSettings): TemplateResult {
  const { width, height } = getPagePixelSize(page);
  return {
    mapFrame: { x: 0, y: 0, width, height },
    regions: [],
    elements: [],
    graticuleEnabled: false,
  };
}

function indonesianAdminTemplate(page: PageSettings): TemplateResult {
  const { width, height } = getPagePixelSize(page);

  const sidebarWidth = Math.round(Math.min(320, Math.max(200, width * 0.24)));
  const mapWidth = width - sidebarWidth;

  const region: LayoutRegion = {
    id: uuid(),
    name: "Info column",
    rect: { x: mapWidth, y: 0, width: sidebarWidth, height },
    direction: "column",
    gap: 8,
    padding: 12,
  };

  const el = makeBuilder(region.id);
  const rule = (thickness = 1) =>
    el({ id: uuid(), kind: "divider", orientation: "horizontal", color: "#000000", thickness }, 1);

  const elements: LayoutElement[] = [
    el({ id: uuid(), kind: "logo", src: null }, 84),
    el(
      {
        id: uuid(),
        kind: "title",
        text: "PETA ADMINISTRASI",
        subtitle: "WILAYAH STUDI",
        align: "center",
        fontSize: 16,
        color: "#111111",
      },
      48
    ),
    rule(),
    el({ id: uuid(), kind: "northArrow", style: "compass", color: "#111111" }, 66),
    el({ id: uuid(), kind: "scaleBar", style: "bar", units: "metric" }, 44),
    rule(),
    el(
      {
        id: uuid(),
        kind: "legend",
        title: "LEGENDA",
        fontSize: 11,
        entries: [
          { id: uuid(), label: "Batas Wilayah", color: "#fde68a", symbol: "polygon" },
          { id: uuid(), label: "Batas Administrasi", color: "#111111", symbol: "line" },
        ],
      },
      140
    ),
    rule(),
    el(
      {
        id: uuid(),
        kind: "textBlock",
        text: "Inset Peta",
        fontSize: 11,
        align: "left",
        color: "#111111",
      },
      18
    ),
    el({ id: uuid(), kind: "inset", zoomOffset: 6 }, 104),
    rule(),
    el(
      {
        id: uuid(),
        kind: "textBlock",
        text: "Koordinat System\nProjection : Geographic (Lon/Lat)\nDatum        : WGS 1984\nUnit            : Degree Minute Second",
        fontSize: 9,
        align: "left",
        color: "#111111",
      },
      62
    ),
    rule(),
    el(
      {
        id: uuid(),
        kind: "textBlock",
        text: `Sumber:\n- Data batas administrasi\n\n${new Date().getFullYear()}`,
        fontSize: 9,
        align: "left",
        color: "#111111",
      },
      62
    ),
  ];

  return {
    mapFrame: { x: 0, y: 0, width: mapWidth, height },
    regions: [region],
    elements,
    graticuleEnabled: true,
  };
}

export function buildTemplate(id: TemplateId, page: PageSettings): TemplateResult {
  switch (id) {
    case "id-admin-map":
      return indonesianAdminTemplate(page);
    case "blank":
    default:
      return blankTemplate(page);
  }
}
