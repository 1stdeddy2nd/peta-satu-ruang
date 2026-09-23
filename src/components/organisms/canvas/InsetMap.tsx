"use client";

import { useEffect, useRef } from "react";
import OlMap from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import Polygon from "ol/geom/Polygon";
import { Fill, Stroke, Style } from "ol/style";
import { useMap, createBasemapSource } from "@/contexts/map";
import type { InsetElement } from "@/contexts/layout";

const extentStyle = new Style({
  stroke: new Stroke({ color: "#dc2626", width: 2 }),
  fill: new Fill({ color: "rgba(220, 38, 38, 0.12)" }),
});

export function InsetMap({ element }: { element: InsetElement }) {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const insetRef = useRef<OlMap | null>(null);
  const extentSourceRef = useRef(new VectorSource());
  const { map: mainMap } = useMap();

  useEffect(() => {
    if (!targetRef.current || insetRef.current) return;

    insetRef.current = new OlMap({
      target: targetRef.current,
      layers: [
        new TileLayer({ source: createBasemapSource() }),
        new VectorLayer({ source: extentSourceRef.current, style: extentStyle }),
      ],
      view: new View({ center: [0, 0], zoom: 1 }),
      controls: [],
      interactions: [],
    });

    const inset = insetRef.current;
    return () => {
      inset.setTarget(undefined);
      insetRef.current = null;
    };
  }, []);

  useEffect(() => {
    const inset = insetRef.current;
    if (!inset || !mainMap) return;

    const sync = () => {
      const view = mainMap.getView();
      const center = view.getCenter();
      const zoom = view.getZoom();
      const size = mainMap.getSize();
      if (!center || zoom === undefined || !size) return;

      inset.getView().setCenter(center);
      inset.getView().setZoom(Math.max(zoom - element.zoomOffset, 0));

      const [minX, minY, maxX, maxY] = view.calculateExtent(size);
      extentSourceRef.current.clear();
      extentSourceRef.current.addFeature(
        new Feature(
          new Polygon([
            [
              [minX, minY],
              [maxX, minY],
              [maxX, maxY],
              [minX, maxY],
              [minX, minY],
            ],
          ])
        )
      );
    };

    sync();
    mainMap.on("moveend", sync);
    return () => {
      mainMap.un("moveend", sync);
    };
  }, [mainMap, element.zoomOffset]);

  useEffect(() => {
    const id = requestAnimationFrame(() => insetRef.current?.updateSize());
    return () => cancelAnimationFrame(id);
  }, [element.rect.width, element.rect.height]);

  return (
    <div className="h-full w-full overflow-hidden border border-black/40 bg-white">
      <div ref={targetRef} className="h-full w-full" />
    </div>
  );
}
