"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";
import { useLayout, regionChildren, type LayoutRegion } from "@/contexts/layout";
import { cn } from "@/lib/utils";

export function FlowRegion({
  region,
  renderChild,
}: {
  region: LayoutRegion;
  renderChild: (elementId: string) => ReactNode;
}) {
  const elements = useLayout((s) => s.elements);
  const children = regionChildren(elements, region.id);

  return (
    <div
      className="group/region absolute"
      style={{
        left: region.rect.x,
        top: region.rect.y,
        width: region.rect.width,
        height: region.rect.height,
        padding: region.padding,
        display: "flex",
        flexDirection: region.direction === "column" ? "column" : "row",
        gap: region.gap,
        zIndex: 1,
      }}
    >
      <div className="pointer-events-none absolute inset-0 rounded-sm border border-dashed border-primary/0 transition-colors group-hover/region:border-primary/25" />
      {children.map((element) => (
        <FlowChild key={element.id} element={element} region={region}>
          {renderChild(element.id)}
        </FlowChild>
      ))}
    </div>
  );
}

function FlowChild({
  element,
  region,
  children,
}: {
  element: ReturnType<typeof regionChildren>[number];
  region: LayoutRegion;
  children: ReactNode;
}) {
  const selectElement = useLayout((s) => s.selectElement);
  const setFlowSize = useLayout((s) => s.setFlowSize);
  const canvasZoom = useLayout((s) => s.canvasZoom);
  const selected = useLayout((s) => s.selectedElementId === element.id);

  const dragState = useRef<{ start: number; size: number } | null>(null);
  const isColumn = region.direction === "column";

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragState.current = {
      start: isColumn ? e.clientY : e.clientX,
      size: element.flowSize,
    };
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const state = dragState.current;
    if (!state) return;
    const delta = ((isColumn ? e.clientY : e.clientX) - state.start) / canvasZoom;
    setFlowSize(element.id, state.size + delta);
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    dragState.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <div
      onMouseDown={() => selectElement(element.id)}
      className={cn(
        "relative shrink-0",
        selected
          ? "outline outline-2 outline-offset-1 outline-primary"
          : "hover:outline hover:outline-1 hover:outline-offset-1 hover:outline-primary/40"
      )}
      style={
        isColumn
          ? { height: element.flowSize, width: "100%" }
          : { width: element.flowSize, height: "100%" }
      }
    >
      {children}

      {!element.locked && (
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          title={isColumn ? "Drag to change height" : "Drag to change width"}
          className={cn(
            "absolute z-10 opacity-0 transition-opacity hover:bg-primary/40 group-hover/region:opacity-100",
            isColumn
              ? "bottom-0 left-0 h-1.5 w-full cursor-ns-resize"
              : "right-0 top-0 h-full w-1.5 cursor-ew-resize"
          )}
        />
      )}
    </div>
  );
}
