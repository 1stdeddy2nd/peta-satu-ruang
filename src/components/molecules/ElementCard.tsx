"use client";

import { Copy, Eye, EyeOff, Lock, Trash2, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ElementKind, LayoutElement } from "@/contexts/layout";

export const ELEMENT_LABEL: Record<ElementKind, string> = {
  title: "Title",
  textBlock: "Text block",
  legend: "Legend",
  northArrow: "North arrow",
  scaleBar: "Scale bar",
  logo: "Logo",
  inset: "Inset map",
  divider: "Divider",
};

export function ElementCard({
  element,
  selected,
  onSelect,
  onToggleVisible,
  onToggleLock,
  onDuplicate,
  onRemove,
}: {
  element: LayoutElement;
  selected: boolean;
  onSelect: () => void;
  onToggleVisible: () => void;
  onToggleLock: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "group flex cursor-pointer select-none items-center gap-1 rounded-lg border bg-card px-2.5 py-1.5 transition-all",
        selected && "border-primary ring-1 ring-primary/25"
      )}
    >
      <span className="min-w-0 flex-1 truncate text-xs">{ELEMENT_LABEL[element.kind]}</span>

      <div className="flex items-center opacity-60 transition-opacity group-hover:opacity-100">
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          title="Duplicate"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
        >
          <Copy className="h-3 w-3" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          title={element.visible ? "Hide" : "Show"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisible();
          }}
        >
          {element.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          title={element.locked ? "Unlock" : "Lock"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock();
          }}
        >
          {element.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          title="Delete"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
