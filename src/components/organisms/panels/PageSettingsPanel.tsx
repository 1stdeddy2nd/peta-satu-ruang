"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { PanelSection } from "@/components/atoms/PanelSection";
import { Field } from "@/components/atoms/Field";
import { SelectField } from "@/components/atoms/SelectField";
import { ColorInput } from "@/components/atoms/ColorInput";
import { FontSizeSelect } from "@/components/atoms/FontSizeSelect";
import { useLayout } from "@/contexts/layout";
import {
  useMap,
  useMapSettings,
  parseLocaleNumber,
  resolutionToScale,
  type CoordinateFormat,
  type DisplayProjection,
} from "@/contexts/map";

export function PageSettingsPanel() {
  const page = useLayout((s) => s.page);

  const graticule = useMapSettings((s) => s.graticule);
  const setGraticule = useMapSettings((s) => s.setGraticule);
  const view = useMapSettings((s) => s.view);
  const setView = useMapSettings((s) => s.setView);

  const { centerOn, applyScale, resolution } = useMap();

  const [lon, setLon] = useState(String(view.center[0]));
  const [lat, setLat] = useState(String(view.center[1]));
  const [scaleInput, setScaleInput] = useState(String(view.scaleDenominator));

  useEffect(() => {
    setLon(view.center[0].toFixed(5));
    setLat(view.center[1].toFixed(5));
  }, [view.center]);

  useEffect(() => {
    setScaleInput(String(view.scaleDenominator));
  }, [view.scaleDenominator]);

  const currentScale =
    resolution != null
      ? Math.round(resolutionToScale(resolution, page.dpi, view.center))
      : null;

  const handleCenter = () => {
    const lonNum = parseLocaleNumber(lon);
    const latNum = parseLocaleNumber(lat);
    if (!Number.isFinite(lonNum) || !Number.isFinite(latNum)) {
      toast.error("Enter a valid longitude and latitude");
      return;
    }
    if (lonNum < -180 || lonNum > 180 || latNum < -90 || latNum > 90) {
      toast.error("Longitude must be −180…180 and latitude −90…90");
      return;
    }
    centerOn(lonNum, latNum);
    setView({ center: [lonNum, latNum] });
  };

  const handleApplyScale = () => {
    const n = parseLocaleNumber(scaleInput);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Scale must be a positive number");
      setScaleInput(String(view.scaleDenominator));
      return;
    }
    const rounded = Math.round(n);
    setView({ scaleDenominator: rounded });
    applyScale(rounded, page.dpi);
  };

  return (
    <div className="flex flex-col gap-5">
      <PanelSection
        title="Coordinate grid"
        action={
          <Switch
            checked={graticule.enabled}
            onCheckedChange={(enabled) => setGraticule({ enabled })}
          />
        }
      >
        {graticule.enabled && (
          <div className="flex flex-col gap-2.5">
            <Field label="Interval" inline>
              <SelectField
                value={String(graticule.intervalDeg)}
                onChange={(v) =>
                  setGraticule({ intervalDeg: v === "auto" ? "auto" : Number(v) })
                }
                options={[
                  { value: "auto", label: "Auto" },
                  { value: "0.01", label: "0.01°" },
                  { value: "0.05", label: "0.05°" },
                  { value: "0.1", label: "0.1°" },
                  { value: "0.5", label: "0.5°" },
                  { value: "1", label: "1°" },
                  { value: "5", label: "5°" },
                ]}
                className="h-8 w-28"
              />
            </Field>
            <Field label="Show labels" inline>
              <Switch
                checked={graticule.showLabels}
                onCheckedChange={(showLabels) => setGraticule({ showLabels })}
              />
            </Field>
            {graticule.showLabels && (
              <Field label="Label size" inline>
                <FontSizeSelect
                  value={graticule.labelFontSize}
                  onChange={(labelFontSize) => setGraticule({ labelFontSize })}
                />
              </Field>
            )}
            <Field label="Line colour" inline>
              <ColorInput
                value={graticule.color}
                onChange={(color) => setGraticule({ color })}
              />
            </Field>
          </div>
        )}
      </PanelSection>

      <Separator />

      <PanelSection title="Position & scale">
        <Field label="Projection" inline>
          <SelectField<DisplayProjection>
            value={view.displayProjection}
            onChange={(displayProjection) => setView({ displayProjection })}
            options={[
              { value: "EPSG:4326", label: "WGS 84 (lon/lat)" },
              { value: "EPSG:3857", label: "Web Mercator" },
            ]}
            className="h-8 w-40"
          />
        </Field>

        <Field label="Coordinate format" inline>
          <SelectField<CoordinateFormat>
            value={view.format}
            onChange={(format) => setView({ format })}
            options={[
              { value: "DD", label: "Decimal degrees" },
              { value: "DMS", label: "Degrees / min / sec" },
            ]}
            className="h-8 w-40"
          />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Longitude">
            <Input
              className="h-8"
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCenter()}
            />
          </Field>
          <Field label="Latitude">
            <Input
              className="h-8"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCenter()}
            />
          </Field>
        </div>
        <Button size="sm" variant="outline" className="h-8" onClick={handleCenter}>
          Center map here
        </Button>

        <Field
          label="Exact scale (1 : N)"
          hint={currentScale ? `Currently 1 : ${currentScale.toLocaleString()}` : undefined}
        >
          <div className="flex gap-2">
            <Input
              className="h-8"
              value={scaleInput}
              onChange={(e) => setScaleInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleApplyScale()}
            />
            <Button
              size="sm"
              variant="outline"
              className="h-8 shrink-0"
              onClick={handleApplyScale}
            >
              Apply
            </Button>
          </div>
        </Field>
      </PanelSection>
    </div>
  );
}
