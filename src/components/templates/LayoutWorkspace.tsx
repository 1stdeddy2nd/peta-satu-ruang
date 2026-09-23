"use client";

import { PrintCanvas } from "@/components/organisms/canvas/PrintCanvas";
import { CanvasZoomBar } from "@/components/organisms/canvas/CanvasZoomBar";

export function LayoutWorkspace() {
  return (
    <div className="relative h-full w-full">
      <PrintCanvas />
      <CanvasZoomBar />
    </div>
  );
}
