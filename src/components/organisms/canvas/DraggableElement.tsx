"use client";

import type { ReactNode } from "react";
import { Rnd } from "react-rnd";
import { useLayout, type LayoutElement } from "@/contexts/layout";
import { cn } from "@/lib/utils";

export function DraggableElement({
  element,
  children,
}: {
  element: LayoutElement;
  children: ReactNode;
}) {
  const updateElement = useLayout((s) => s.updateElement);
  const selectElement = useLayout((s) => s.selectElement);
  const bringToFront = useLayout((s) => s.bringToFront);
  const selectedId = useLayout((s) => s.selectedElementId);
  const canvasZoom = useLayout((s) => s.canvasZoom);

  if (!element.visible) return null;
  const selected = selectedId === element.id;

  return (
    <Rnd
      size={{ width: element.rect.width, height: element.rect.height }}
      position={{ x: element.rect.x, y: element.rect.y }}
      scale={canvasZoom}
      bounds="parent"
      disableDragging={element.locked}
      enableResizing={
        element.locked
          ? false
          : { bottomRight: true, bottom: true, right: true, top: true, left: true }
      }
      style={{ zIndex: element.zIndex + 10 }}
      onDragStart={() => {
        selectElement(element.id);
        bringToFront(element.id);
      }}
      onDragStop={(_e, d) =>
        updateElement(element.id, { rect: { ...element.rect, x: d.x, y: d.y } })
      }
      onResizeStop={(_e, _dir, ref, _delta, position) =>
        updateElement(element.id, {
          rect: {
            ...element.rect,
            width: parseFloat(ref.style.width),
            height: parseFloat(ref.style.height),
            x: position.x,
            y: position.y,
          },
        })
      }
      onMouseDown={() => selectElement(element.id)}
      className={cn(
        "group/element",
        selected
          ? "outline outline-2 outline-offset-2 outline-primary"
          : "hover:outline hover:outline-1 hover:outline-offset-2 hover:outline-primary/40"
      )}
    >
      <div className="h-full w-full">{children}</div>
    </Rnd>
  );
}
