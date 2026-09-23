"use client";

import { Crosshair, Eye, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ColorInput } from "@/components/atoms/ColorInput";
import { SelectField } from "@/components/atoms/SelectField";
import type { MapLayer } from "@/contexts/map";

function firstValue(v: number | readonly number[]): number {
  return Array.isArray(v) ? v[0] : (v as number);
}

const SINGLE = "__single__";

export function LayerCard({
  layer,
  onChange,
  onZoom,
  onRemove,
  onCategoryField,
}: {
  layer: MapLayer;
  onChange: (patch: Partial<MapLayer>) => void;
  onZoom: () => void;
  onRemove: () => void;
  onCategoryField: (field: string | null) => void;
}) {
  const categorised = layer.styleMode === "categorised";
  return (
    <div className="rounded-lg border bg-card p-2.5">
      <div className="flex items-center gap-2">
        <ColorInput
          value={layer.color}
          onChange={(color) => onChange({ color })}
          className="h-6 w-6 p-0.5"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">{layer.name}</p>
          <p className="text-[10px] text-muted-foreground">
            {layer.geometryType} · {layer.featureCount} feature
            {layer.featureCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            title="Zoom to layer"
            onClick={onZoom}
          >
            <Crosshair className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            title={layer.visible ? "Hide layer" : "Show layer"}
            onClick={() => onChange({ visible: !layer.visible })}
          >
            {layer.visible ? (
              <Eye className="h-3.5 w-3.5" />
            ) : (
              <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            title="Remove layer"
            onClick={onRemove}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {layer.attributes.length > 0 && (
        <div className="mt-2 flex items-center gap-2">
          <span className="w-12 shrink-0 text-[10px] text-muted-foreground">Colour by</span>
          <SelectField
            value={layer.categoryField ?? SINGLE}
            onChange={(v) => onCategoryField(v === SINGLE ? null : v)}
            options={[
              { value: SINGLE, label: "Single colour" },
              ...layer.attributes.map((a) => ({ value: a, label: a })),
            ]}
            className="h-7 flex-1 text-xs"
          />
        </div>
      )}

      {categorised && layer.categories.length > 0 && (
        <div className="mt-2 max-h-28 space-y-1 overflow-y-auto rounded-md bg-muted/40 p-1.5">
          {layer.categories.map((cat, i) => (
            <div key={cat.value} className="flex items-center gap-1.5">
              <ColorInput
                value={cat.color}
                onChange={(color) =>
                  onChange({
                    categories: layer.categories.map((c, j) =>
                      j === i ? { ...c, color } : c
                    ),
                  })
                }
                className="h-4 w-4 shrink-0 rounded p-0"
              />
              <span className="truncate text-[10px]">{cat.value}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 flex items-center gap-2">
        <span className="w-12 text-[10px] text-muted-foreground">Opacity</span>
        <Slider
          min={0}
          max={1}
          step={0.05}
          value={[layer.opacity]}
          onValueChange={(v) => onChange({ opacity: firstValue(v) })}
          className="flex-1"
        />
        <span className="w-8 text-right text-[10px] tabular-nums text-muted-foreground">
          {Math.round(layer.opacity * 100)}%
        </span>
      </div>
    </div>
  );
}
