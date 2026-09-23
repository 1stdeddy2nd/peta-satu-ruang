"use client";

import { useCallback, useEffect, useRef } from "react";
import { useLayout, type LayoutElement } from "@/contexts/layout";
import { getPagePixelSize, PRINT_PAGE_ID } from "@/contexts/print";
import { MapFrame } from "./MapFrame";
import { DraggableElement } from "./DraggableElement";
import { FlowRegion } from "./FlowRegion";
import { InsetMap } from "./InsetMap";
import { NorthArrow } from "@/components/molecules/canvas/NorthArrow";
import { ScaleBar } from "@/components/molecules/canvas/ScaleBar";
import { Legend } from "@/components/molecules/canvas/Legend";
import { TitleBlock } from "@/components/molecules/canvas/TitleBlock";
import { TextBlock } from "@/components/molecules/canvas/TextBlock";
import { Logo } from "@/components/molecules/canvas/Logo";
import { Divider } from "@/components/molecules/canvas/Divider";

function ElementBody({ element }: { element: LayoutElement }) {
  switch (element.kind) {
    case "title":
      return <TitleBlock element={element} />;
    case "textBlock":
      return <TextBlock element={element} />;
    case "legend":
      return <Legend element={element} />;
    case "northArrow":
      return <NorthArrow element={element} />;
    case "scaleBar":
      return <ScaleBar element={element} />;
    case "logo":
      return <Logo element={element} />;
    case "inset":
      return <InsetMap element={element} />;
    case "divider":
      return <Divider element={element} />;
  }
}

export function PrintCanvas() {
  const page = useLayout((s) => s.page);
  const regions = useLayout((s) => s.regions);
  const elements = useLayout((s) => s.elements);
  const selectElement = useLayout((s) => s.selectElement);
  const canvasZoom = useLayout((s) => s.canvasZoom);
  const autoFit = useLayout((s) => s.autoFit);
  const fitToViewport = useLayout((s) => s.fitToViewport);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { width, height } = getPagePixelSize(page);

  const freeElements = elements.filter((el) => el.placement === "free");

  const renderChild = useCallback(
    (id: string) => {
      const element = elements.find((el) => el.id === id);
      return element ? <ElementBody element={element} /> : null;
    },
    [elements]
  );

  useEffect(() => {
    const node = scrollRef.current;
    if (!node || !autoFit) return;

    const apply = () =>
      fitToViewport({ width: node.clientWidth, height: node.clientHeight });

    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(node);
    return () => observer.disconnect();
  }, [autoFit, fitToViewport, page.size, page.orientation]);

  return (
    <div
      ref={scrollRef}
      className="relative flex h-full w-full items-center justify-center overflow-auto bg-muted/50 p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) selectElement(null);
      }}
    >
      {/* Wrapper keeps scrollbars correct while the sheet itself is scaled. */}
      <div
        style={{ width: width * canvasZoom, height: height * canvasZoom }}
        className="shrink-0"
      >
        <div
          id={PRINT_PAGE_ID}
          className="relative overflow-hidden border border-black bg-white shadow-2xl"
          style={{
            width,
            height,
            transform: `scale(${canvasZoom})`,
            transformOrigin: "top left",
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) selectElement(null);
          }}
        >
          <MapFrame />

          {regions.map((region) => (
            <FlowRegion key={region.id} region={region} renderChild={renderChild} />
          ))}

          {freeElements.map((element) => (
            <DraggableElement key={element.id} element={element}>
              <ElementBody element={element} />
            </DraggableElement>
          ))}
        </div>
      </div>
    </div>
  );
}
