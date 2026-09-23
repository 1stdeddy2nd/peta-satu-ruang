import type { Geometry } from "geojson";
import type {
  BasemapId,
  GraticuleSettings,
  MapLayer,
  MapViewSettings,
  Sentinel2Year,
} from "@/contexts/map";
import type {
  BoxRect,
  LayoutElement,
  LayoutRegion,
  PageSettings,
  TemplateId,
} from "@/contexts/layout";

/** Everything in `Project.layout` besides per-layer data, which lives in `Layer` rows instead. */
export interface LayoutDocument {
  page: PageSettings;
  mapFrame: BoxRect;
  template: TemplateId;
  regions: LayoutRegion[];
  elements: LayoutElement[];
  view: MapViewSettings;
  graticule: GraticuleSettings;
  basemap: BasemapId;
  sentinel2Year: Sentinel2Year;
}

export interface LayerFeaturePayload {
  properties: Record<string, unknown>;
  geometry: Geometry;
}

/** `MapLayer` minus the derived `featureCount`, plus its position in the layer list. */
export type LayerMetaPayload = Omit<MapLayer, "featureCount"> & { sortOrder: number };

export interface LayerWithFeaturesResponse extends LayerMetaPayload {
  features: LayerFeaturePayload[];
}

/** GET /api/project — full restore, features included. */
export interface ProjectResponse {
  id: string;
  layout: LayoutDocument;
  layers: LayerWithFeaturesResponse[];
}

/** PUT /api/project body — layout + layer metadata only, never features. */
export interface ProjectSavePayload {
  layout: LayoutDocument;
  layers: LayerMetaPayload[];
}
