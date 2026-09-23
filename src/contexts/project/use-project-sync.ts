"use client";

import { useEffect, useRef } from "react";
import { useMap, useMapSettings } from "@/contexts/map";
import { useLayout } from "@/contexts/layout";
import { fetchProject, saveProject } from "./project-api";
import type { LayerMetaPayload, LayoutDocument } from "./project-types";

const AUTOSAVE_DEBOUNCE_MS = 2000;

function buildLayoutDocument(): LayoutDocument {
  const layout = useLayout.getState();
  const map = useMapSettings.getState();
  return {
    page: layout.page,
    mapFrame: layout.mapFrame,
    template: layout.template,
    regions: layout.regions,
    elements: layout.elements,
    view: map.view,
    graticule: map.graticule,
    basemap: map.basemap,
    sentinel2Year: map.sentinel2Year,
  };
}

function buildLayerMetaPayload(): LayerMetaPayload[] {
  return useMapSettings.getState().layers.map((layer, index) => ({
    id: layer.id,
    name: layer.name,
    color: layer.color,
    opacity: layer.opacity,
    visible: layer.visible,
    geometryType: layer.geometryType,
    attributes: layer.attributes,
    styleMode: layer.styleMode,
    categoryField: layer.categoryField,
    categories: layer.categories,
    sortOrder: index,
  }));
}

/**
 * Loads the signed-in user's one project on mount, then autosaves layout and
 * layer metadata (never feature geometry — that is written once at upload
 * time, see api/project.createLayer) after 2s of idle, so panning the map
 * does not produce a write per frame.
 */
export function useProjectSync() {
  const { loadProject } = useMap();
  const loadedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Snapshotted before the fetch fires, so a field the user has already
    // changed by the time it resolves (still possible on a slow connection —
    // exactly who this product is built for) can be told apart from one still
    // sitting at its untouched initial value. Every store setter here always
    // returns a new reference on change, so reference equality is enough.
    const beforeLoadLayout = useLayout.getState();
    const beforeLoadMap = useMapSettings.getState();

    void (async () => {
      try {
        const project = await fetchProject();
        if (cancelled) return;

        const currentLayout = useLayout.getState();
        const layoutPatch: Partial<typeof currentLayout> = {};
        if (currentLayout.page === beforeLoadLayout.page) layoutPatch.page = project.layout.page;
        if (currentLayout.mapFrame === beforeLoadLayout.mapFrame)
          layoutPatch.mapFrame = project.layout.mapFrame;
        if (currentLayout.template === beforeLoadLayout.template)
          layoutPatch.template = project.layout.template;
        if (currentLayout.regions === beforeLoadLayout.regions)
          layoutPatch.regions = project.layout.regions;
        if (currentLayout.elements === beforeLoadLayout.elements)
          layoutPatch.elements = project.layout.elements;
        useLayout.setState(layoutPatch);

        const currentMap = useMapSettings.getState();
        const mapPatch: Partial<typeof currentMap> = {};
        if (currentMap.graticule === beforeLoadMap.graticule)
          mapPatch.graticule = project.layout.graticule;
        if (currentMap.basemap === beforeLoadMap.basemap)
          mapPatch.basemap = project.layout.basemap ?? "osm";
        if (currentMap.sentinel2Year === beforeLoadMap.sentinel2Year)
          mapPatch.sentinel2Year = project.layout.sentinel2Year ?? 2025;
        useMapSettings.setState(mapPatch);

        const viewUntouched = currentMap.view === beforeLoadMap.view;
        loadProject(project.layers, viewUntouched ? project.layout.view : null);
      } finally {
        if (!cancelled) loadedRef.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadProject]);

  useEffect(() => {
    const flush = () => {
      if (!loadedRef.current) return;
      void saveProject({ layout: buildLayoutDocument(), layers: buildLayerMetaPayload() });
    };

    const schedule = () => {
      if (!loadedRef.current) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, AUTOSAVE_DEBOUNCE_MS);
    };

    const unsubMap = useMapSettings.subscribe(schedule);
    const unsubLayout = useLayout.subscribe(schedule);

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      unsubMap();
      unsubLayout();
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
}
