"use client";

import { Rnd } from "react-rnd";
import { useEffect } from "react";
import { useLayout } from "@/contexts/layout";
import { useMap } from "@/contexts/map";
import { MapViewport } from "./MapViewport";

export function MapFrame() {
  const mapFrame = useLayout((s) => s.mapFrame);
  const setMapFrame = useLayout((s) => s.setMapFrame);
  const canvasZoom = useLayout((s) => s.canvasZoom);
  const { map } = useMap();

  useEffect(() => {
    if (!map) return;
    const id = requestAnimationFrame(() => map.updateSize());
    return () => cancelAnimationFrame(id);
  }, [map, mapFrame.width, mapFrame.height, canvasZoom]);

  return (
    <Rnd
      size={{ width: mapFrame.width, height: mapFrame.height }}
      position={{ x: mapFrame.x, y: mapFrame.y }}
      scale={canvasZoom}
      bounds="parent"
      style={{ zIndex: 0 }}
      enableResizing={{ bottomRight: true, bottom: true, right: true, top: true, left: true }}
      dragHandleClassName="map-frame-handle"
      onDragStop={(_e, d) => setMapFrame({ ...mapFrame, x: d.x, y: d.y })}
      onResizeStop={(_e, _dir, ref, _delta, position) =>
        setMapFrame({
          ...mapFrame,
          width: parseFloat(ref.style.width),
          height: parseFloat(ref.style.height),
          x: position.x,
          y: position.y,
        })
      }
      className="group/frame border-2 border-black"
    >
      {/*
        Only the outer 10px rim drags the frame; the interior stays free so the
        map itself can be panned and zoomed in place.
      */}
      <div className="map-frame-handle absolute -top-1 left-0 z-10 h-2.5 w-full cursor-move" />
      <div className="map-frame-handle absolute -bottom-1 left-0 z-10 h-2.5 w-full cursor-move" />
      <div className="map-frame-handle absolute -left-1 top-0 z-10 h-full w-2.5 cursor-move" />
      <div className="map-frame-handle absolute -right-1 top-0 z-10 h-full w-2.5 cursor-move" />

      <span className="pointer-events-none absolute -top-5 left-0 z-10 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground opacity-0 transition-opacity group-hover/frame:opacity-100">
        Map frame — drag the edge to move
      </span>

      <div className="relative h-full w-full overflow-hidden">
        <MapViewport />
      </div>
    </Rnd>
  );
}
