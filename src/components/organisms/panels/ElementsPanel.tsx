"use client";

import type { ElementType } from "react";
import {
  Compass,
  ImageIcon,
  LayoutPanelTop,
  ListTree,
  MapPinned,
  Minus,
  PenLine,
  Rows3,
  Ruler,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PanelSection } from "@/components/atoms/PanelSection";
import { EmptyState } from "@/components/atoms/EmptyState";
import { ElementCard } from "@/components/molecules/ElementCard";
import {
  useLayout,
  regionChildren,
  type ElementKind,
  type LayoutElement,
} from "@/contexts/layout";

const ADDABLE: { kind: ElementKind; label: string; icon: ElementType }[] = [
  { kind: "title", label: "Title", icon: Type },
  { kind: "textBlock", label: "Text", icon: PenLine },
  { kind: "legend", label: "Legend", icon: ListTree },
  { kind: "northArrow", label: "North", icon: Compass },
  { kind: "scaleBar", label: "Scale", icon: Ruler },
  { kind: "logo", label: "Logo", icon: ImageIcon },
  { kind: "inset", label: "Inset", icon: MapPinned },
  { kind: "divider", label: "Divider", icon: Minus },
];

export function ElementsPanel() {
  const elements = useLayout((s) => s.elements);
  const regions = useLayout((s) => s.regions);
  const addElement = useLayout((s) => s.addElement);

  const freeElements = [...elements]
    .filter((el) => el.placement === "free")
    .sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div className="flex flex-col gap-5">
      <PanelSection title="Add element">
        <div className="grid grid-cols-4 gap-1.5">
          {ADDABLE.map(({ kind, label, icon: Icon }) => (
            <Button
              key={kind}
              variant="outline"
              size="sm"
              title={`Add ${label.toLowerCase()}`}
              className="h-auto flex-col gap-1 px-1 py-2"
              onClick={() => addElement(kind)}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="text-[10px] leading-none">{label}</span>
            </Button>
          ))}
        </div>
      </PanelSection>

      {elements.length === 0 && (
        <EmptyState
          icon={LayoutPanelTop}
          title="Empty page"
          description="Add an element above, or pick a template to start from."
        />
      )}

      {regions.map((region) => {
        const children = regionChildren(elements, region.id, { includeHidden: true });
        if (children.length === 0) return null;

        return (
          <PanelSection
            key={region.id}
            title={region.name}
            action={
              <span className="flex items-center gap-1 text-[10px] font-normal text-muted-foreground">
                <Rows3 className="h-3 w-3" />
                Auto-layout
              </span>
            }
          >
            <p className="-mt-1 text-[10px] leading-relaxed text-muted-foreground">
              Stacked in the template&apos;s standard order. Resize one by dragging its
              edge on the page; the rest reflow and never overlap.
            </p>
            <div className="flex flex-col gap-1.5">
              {children.map((element) => (
                <ElementRow key={element.id} element={element} />
              ))}
            </div>
          </PanelSection>
        );
      })}

      {freeElements.length > 0 && (
        <PanelSection title="Free elements">
          <p className="-mt-1 text-[10px] text-muted-foreground">
            Positioned by hand. Drag one on the page to bring it to the front.
          </p>
          <div className="flex flex-col gap-1.5">
            {freeElements.map((element) => (
              <ElementRow key={element.id} element={element} />
            ))}
          </div>
        </PanelSection>
      )}
    </div>
  );
}

function ElementRow({ element }: { element: LayoutElement }) {
  const selectedId = useLayout((s) => s.selectedElementId);
  const selectElement = useLayout((s) => s.selectElement);
  const updateElement = useLayout((s) => s.updateElement);
  const removeElement = useLayout((s) => s.removeElement);
  const duplicateElement = useLayout((s) => s.duplicateElement);

  return (
    <ElementCard
      element={element}
      selected={selectedId === element.id}
      onSelect={() => selectElement(element.id)}
      onToggleVisible={() => updateElement(element.id, { visible: !element.visible })}
      onToggleLock={() => updateElement(element.id, { locked: !element.locked })}
      onDuplicate={() => duplicateElement(element.id)}
      onRemove={() => removeElement(element.id)}
    />
  );
}
