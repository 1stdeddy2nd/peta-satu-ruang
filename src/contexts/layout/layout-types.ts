export type PageSize = "A4" | "A3";
export type PageOrientation = "portrait" | "landscape";

export interface PageSettings {
  size: PageSize;
  orientation: PageOrientation;
  dpi: number;
  marginMm: number;
}

export const PAGE_SIZES_MM: Record<PageSize, { width: number; height: number }> = {
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
};

export type ElementKind =
  | "title"
  | "legend"
  | "northArrow"
  | "scaleBar"
  | "logo"
  | "inset"
  | "textBlock"
  | "divider";

export interface BoxRect {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

export type ElementPlacement = "flow" | "free";

export interface LayoutRegion {
  id: string;
  name: string;
  rect: BoxRect;
  direction: "column" | "row";
  gap: number;
  padding: number;
}

export interface BaseElement {
  id: string;
  kind: ElementKind;
  rect: BoxRect;
  placement: ElementPlacement;
  regionId: string | null;
  flowOrder: number;
  flowSize: number;
  visible: boolean;
  locked?: boolean;
  zIndex: number;
}

export interface TitleElement extends BaseElement {
  kind: "title";
  text: string;
  subtitle?: string;
  align: "left" | "center" | "right";
  fontSize: number;
  color: string;
}

export interface LegendEntry {
  id: string;
  label: string;
  color: string;
  symbol: "polygon" | "line" | "point";
}

export interface LegendElement extends BaseElement {
  kind: "legend";
  title: string;
  entries: LegendEntry[];
  fontSize: number;
}

export interface NorthArrowElement extends BaseElement {
  kind: "northArrow";
  style: "classic" | "simple" | "compass";
  color: string;
}

export interface ScaleBarElement extends BaseElement {
  kind: "scaleBar";
  style: "line" | "bar";
  units: "metric" | "imperial";
}

export interface LogoElement extends BaseElement {
  kind: "logo";
  src: string | null;
}

export interface InsetElement extends BaseElement {
  kind: "inset";
  zoomOffset: number;
}

export interface TextBlockElement extends BaseElement {
  kind: "textBlock";
  text: string;
  fontSize: number;
  align: "left" | "center" | "right";
  color: string;
}

export interface DividerElement extends BaseElement {
  kind: "divider";
  orientation: "horizontal" | "vertical";
  color: string;
  thickness: number;
}

export type LayoutElement =
  | TitleElement
  | LegendElement
  | NorthArrowElement
  | ScaleBarElement
  | LogoElement
  | InsetElement
  | TextBlockElement
  | DividerElement;

export type TemplateId = "blank" | "id-admin-map";

export interface TemplateMeta {
  id: TemplateId;
  name: string;
  description: string;
}

export const TEMPLATE_CATALOG: TemplateMeta[] = [
  {
    id: "blank",
    name: "Blank canvas",
    description: "Map fills the page. Add and place every element yourself.",
  },
  {
    id: "id-admin-map",
    name: "Peta Administrasi",
    description:
      "Bordered map with a coordinate grid, and an info column carrying the logo, title, north arrow, scale, legend, inset and coordinate notes.",
  },
];
