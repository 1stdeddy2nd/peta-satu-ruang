"use client";

import { Maximize2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLayout, CANVAS_ZOOM_MAX, CANVAS_ZOOM_MIN } from "@/contexts/layout";

const STEP = 0.1;

export function CanvasZoomBar() {
  const canvasZoom = useLayout((s) => s.canvasZoom);
  const setCanvasZoom = useLayout((s) => s.setCanvasZoom);
  const setAutoFit = useLayout((s) => s.setAutoFit);
  const autoFit = useLayout((s) => s.autoFit);

  return (
    <div className="pointer-events-auto absolute bottom-4 right-4 flex items-center gap-0.5 rounded-full border bg-background/95 p-1 shadow-lg backdrop-blur">
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 rounded-full"
        title="Zoom out"
        disabled={canvasZoom <= CANVAS_ZOOM_MIN}
        onClick={() => setCanvasZoom(canvasZoom - STEP)}
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>

      <button
        onClick={() => setCanvasZoom(1)}
        title="Reset to 100%"
        className="min-w-[3.25rem] rounded-full px-1 text-center text-xs font-medium tabular-nums hover:bg-muted"
      >
        {Math.round(canvasZoom * 100)}%
      </button>

      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 rounded-full"
        title="Zoom in"
        disabled={canvasZoom >= CANVAS_ZOOM_MAX}
        onClick={() => setCanvasZoom(canvasZoom + STEP)}
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>

      <Button
        size="icon"
        variant={autoFit ? "secondary" : "ghost"}
        className="h-7 w-7 rounded-full"
        title="Fit page to screen"
        onClick={() => setAutoFit(true)}
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
