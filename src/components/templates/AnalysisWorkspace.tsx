"use client";

import { useMapSettings, formatCoordinate } from "@/contexts/map";
import { MapViewport } from "@/components/organisms/canvas/MapViewport";

export function AnalysisWorkspace() {
  const view = useMapSettings((s) => s.view);

  return (
    <div className="relative h-full w-full">
      <MapViewport />

      <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 rounded-full border bg-background/90 px-3 py-1.5 text-[11px] tabular-nums text-muted-foreground shadow-sm backdrop-blur">
        <span>{formatCoordinate(view.center[0], "lon", view.format)}</span>
        <span className="text-muted-foreground/40">·</span>
        <span>{formatCoordinate(view.center[1], "lat", view.format)}</span>
        <span className="text-muted-foreground/40">·</span>
        <span>z{view.zoom.toFixed(1)}</span>
      </div>
    </div>
  );
}
