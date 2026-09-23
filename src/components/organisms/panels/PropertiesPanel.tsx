"use client";

import { MousePointerSquareDashed, Plus, Trash2, Wand2 } from "lucide-react";
import { v4 as uuid } from "uuid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Field } from "@/components/atoms/Field";
import { SelectField } from "@/components/atoms/SelectField";
import { EmptyState } from "@/components/atoms/EmptyState";
import { ColorInput } from "@/components/atoms/ColorInput";
import { FontSizeSelect } from "@/components/atoms/FontSizeSelect";
import { useLayout, type LegendEntry } from "@/contexts/layout";
import { useMapSettings, legendEntriesFromLayers } from "@/contexts/map";
import { ELEMENT_LABEL } from "@/components/molecules/ElementCard";

function firstValue(v: number | readonly number[]): number {
  return Array.isArray(v) ? v[0] : (v as number);
}

export function PropertiesPanel() {
  const layers = useMapSettings((s) => s.layers);
  const elements = useLayout((s) => s.elements);
  const selectedId = useLayout((s) => s.selectedElementId);
  const updateElement = useLayout((s) => s.updateElement);

  const element = elements.find((e) => e.id === selectedId);

  if (!element) {
    return (
      <EmptyState
        icon={MousePointerSquareDashed}
        title="Nothing selected"
        description="Click an element on the page to edit it."
      />
    );
  }

  const patchLegendEntry = (entryId: string, patch: Partial<LegendEntry>) => {
    if (element.kind !== "legend") return;
    updateElement(element.id, {
      entries: element.entries.map((e) => (e.id === entryId ? { ...e, ...patch } : e)),
    });
  };

  return (
    <div className="flex flex-col gap-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {ELEMENT_LABEL[element.kind]}
      </p>

      {element.kind === "title" && (
        <>
          <Field label="Title">
            <Input
              className="h-8"
              value={element.text}
              onChange={(e) => updateElement(element.id, { text: e.target.value })}
            />
          </Field>
          <Field label="Subtitle">
            <Input
              className="h-8"
              value={element.subtitle ?? ""}
              onChange={(e) => updateElement(element.id, { subtitle: e.target.value })}
            />
          </Field>
          <Field label="Alignment" inline>
            <SelectField<"left" | "center" | "right">
              value={element.align}
              onChange={(align) => updateElement(element.id, { align })}
              options={[
                { value: "left", label: "Left" },
                { value: "center", label: "Center" },
                { value: "right", label: "Right" },
              ]}
              className="h-8 w-28"
            />
          </Field>
          <Field label="Font size" inline>
            <FontSizeSelect
              value={element.fontSize}
              onChange={(fontSize) => updateElement(element.id, { fontSize })}
            />
          </Field>
          <Field label="Colour" inline>
            <ColorInput
              value={element.color}
              onChange={(color) => updateElement(element.id, { color })}
            />
          </Field>
        </>
      )}

      {element.kind === "textBlock" && (
        <>
          <Field label="Text" hint="Line breaks are preserved.">
            <textarea
              rows={4}
              value={element.text}
              onChange={(e) => updateElement(element.id, { text: e.target.value })}
              className="w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          </Field>
          <Field label="Alignment" inline>
            <SelectField<"left" | "center" | "right">
              value={element.align}
              onChange={(align) => updateElement(element.id, { align })}
              options={[
                { value: "left", label: "Left" },
                { value: "center", label: "Center" },
                { value: "right", label: "Right" },
              ]}
              className="h-8 w-28"
            />
          </Field>
          <Field label="Font size" inline>
            <FontSizeSelect
              value={element.fontSize}
              onChange={(fontSize) => updateElement(element.id, { fontSize })}
            />
          </Field>
          <Field label="Colour" inline>
            <ColorInput
              value={element.color}
              onChange={(color) => updateElement(element.id, { color })}
            />
          </Field>
        </>
      )}

      {element.kind === "legend" && (
        <>
          <Field label="Heading">
            <Input
              className="h-8"
              value={element.title}
              onChange={(e) => updateElement(element.id, { title: e.target.value })}
            />
          </Field>
          <Field label="Font size" inline>
            <FontSizeSelect
              value={element.fontSize}
              onChange={(fontSize) => updateElement(element.id, { fontSize })}
            />
          </Field>
          <Field label="Entries">
            <div className="flex flex-col gap-1.5">
              <Button
                size="sm"
                variant="secondary"
                className="h-8"
                disabled={layers.length === 0}
                title={
                  layers.length === 0
                    ? "Upload a layer first"
                    : "Replace the entries with the layers as they are drawn"
                }
                onClick={() =>
                  updateElement(element.id, {
                    entries: legendEntriesFromLayers(layers).map((e) => ({
                      id: uuid(),
                      ...e,
                    })),
                  })
                }
              >
                <Wand2 className="mr-1 h-3.5 w-3.5" /> Fill from layers
              </Button>
              {element.entries.map((entry) => (
                <div key={entry.id} className="flex items-center gap-1.5">
                  <ColorInput
                    value={entry.color}
                    onChange={(color) => patchLegendEntry(entry.id, { color })}
                    className="h-8 w-8"
                  />
                  <Input
                    className="h-8 flex-1"
                    value={entry.label}
                    onChange={(e) => patchLegendEntry(entry.id, { label: e.target.value })}
                  />
                  <SelectField<LegendEntry["symbol"]>
                    value={entry.symbol}
                    onChange={(symbol) => patchLegendEntry(entry.id, { symbol })}
                    options={[
                      { value: "polygon", label: "Area" },
                      { value: "line", label: "Line" },
                      { value: "point", label: "Point" },
                    ]}
                    className="h-8 w-20"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0"
                    onClick={() =>
                      updateElement(element.id, {
                        entries: element.entries.filter((e) => e.id !== entry.id),
                      })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() =>
                  updateElement(element.id, {
                    entries: [
                      ...element.entries,
                      {
                        id: uuid(),
                        label: "New item",
                        color: "#2563eb",
                        symbol: "polygon",
                      },
                    ],
                  })
                }
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Add entry
              </Button>
            </div>
          </Field>
        </>
      )}

      {element.kind === "northArrow" && (
        <>
          <Field label="Style" inline>
            <SelectField<"classic" | "simple" | "compass">
              value={element.style}
              onChange={(style) => updateElement(element.id, { style })}
              options={[
                { value: "classic", label: "Classic" },
                { value: "simple", label: "Simple" },
                { value: "compass", label: "Compass" },
              ]}
              className="h-8 w-28"
            />
          </Field>
          <Field label={`Rotation — ${element.rect.rotation ?? 0}°`}>
            <Slider
              min={0}
              max={359}
              step={1}
              value={[element.rect.rotation ?? 0]}
              onValueChange={(v) =>
                updateElement(element.id, {
                  rect: { ...element.rect, rotation: firstValue(v) },
                })
              }
            />
          </Field>
          <Field label="Colour" inline>
            <ColorInput
              value={element.color}
              onChange={(color) => updateElement(element.id, { color })}
            />
          </Field>
        </>
      )}

      {element.kind === "scaleBar" && (
        <>
          <Field label="Style" inline>
            <SelectField<"bar" | "line">
              value={element.style}
              onChange={(style) => updateElement(element.id, { style })}
              options={[
                { value: "bar", label: "Chequered bar" },
                { value: "line", label: "Line" },
              ]}
              className="h-8 w-28"
            />
          </Field>
          <Field label="Units" inline>
            <SelectField<"metric" | "imperial">
              value={element.units}
              onChange={(units) => updateElement(element.id, { units })}
              options={[
                { value: "metric", label: "Metric" },
                { value: "imperial", label: "Imperial" },
              ]}
              className="h-8 w-28"
            />
          </Field>
        </>
      )}

      {element.kind === "logo" && (
        <Field label="Image" hint="PNG or SVG with a transparent background works best.">
          <Input
            type="file"
            accept="image/*"
            className="h-8"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () =>
                updateElement(element.id, { src: reader.result as string });
              reader.readAsDataURL(file);
            }}
          />
        </Field>
      )}

      {element.kind === "inset" && (
        <Field label={`Zoomed out by ${element.zoomOffset} levels`}>
          <Slider
            min={1}
            max={10}
            step={1}
            value={[element.zoomOffset]}
            onValueChange={(v) =>
              updateElement(element.id, { zoomOffset: firstValue(v) })
            }
          />
        </Field>
      )}

      {element.kind === "divider" && (
        <>
          <Field label="Orientation" inline>
            <SelectField<"horizontal" | "vertical">
              value={element.orientation}
              onChange={(orientation) => updateElement(element.id, { orientation })}
              options={[
                { value: "horizontal", label: "Horizontal" },
                { value: "vertical", label: "Vertical" },
              ]}
              className="h-8 w-28"
            />
          </Field>
          <Field label={`Thickness — ${element.thickness}px`}>
            <Slider
              min={1}
              max={8}
              step={1}
              value={[element.thickness]}
              onValueChange={(v) =>
                updateElement(element.id, { thickness: firstValue(v) })
              }
            />
          </Field>
          <Field label="Colour" inline>
            <ColorInput
              value={element.color}
              onChange={(color) => updateElement(element.id, { color })}
            />
          </Field>
        </>
      )}
    </div>
  );
}
