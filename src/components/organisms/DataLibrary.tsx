"use client";

import { useState } from "react";
import { Building2, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SelectField } from "@/components/atoms/SelectField";
import { DataSourceCard } from "@/components/molecules/DataSourceCard";
import { AdminBoundaryPicker } from "@/components/molecules/AdminBoundaryPicker";
import { SENTINEL2_YEARS, useMap, useMapSettings } from "@/contexts/map";
import type { Sentinel2Year } from "@/contexts/map";

const BASEMAP_OPTIONS = [
  { value: "osm", label: "OpenStreetMap" },
  { value: "sentinel2", label: "Sentinel-2 cloudless" },
] as const;

const YEAR_OPTIONS = SENTINEL2_YEARS.map((year) => ({
  value: String(year),
  label: String(year),
}));

/** Anything that puts data on the map closes the dialog, or the result is
 * hidden behind it. Changing the basemap does not. */
export function DataLibrary() {
  const [open, setOpen] = useState(false);
  const {
    importBuildingFootprints,
    importBuildingFootprintsForBoundary,
    isLoading,
    fireHotspotsStatus,
  } = useMap();
  const basemap = useMapSettings((s) => s.basemap);
  const setBasemap = useMapSettings((s) => s.setBasemap);
  const sentinel2Year = useMapSettings((s) => s.sentinel2Year);
  const setSentinel2Year = useMapSettings((s) => s.setSentinel2Year);
  const fireHotspots = useMapSettings((s) => s.fireHotspots);
  const setFireHotspots = useMapSettings((s) => s.setFireHotspots);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="w-full justify-start gap-2" />}>
        <Library className="h-3.5 w-3.5" />
        Browse the data library
      </DialogTrigger>

      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Data library</DialogTitle>
          <DialogDescription>
            Everything MapCanva already has, ready to add — no file to find or download first.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DataSourceCard
            title="Sentinel-2 cloudless"
            description="Satellite imagery as a basemap, in place of OpenStreetMap."
            meta="EOX · annual composite, not live"
            sourceUrl="https://cloudless.eox.at/"
          >
            <div className="flex flex-col gap-2">
              <SelectField value={basemap} onChange={setBasemap} options={BASEMAP_OPTIONS} />
              {basemap === "sentinel2" && (
                <SelectField
                  value={String(sentinel2Year)}
                  onChange={(v) => setSentinel2Year(Number(v) as Sentinel2Year)}
                  options={YEAR_OPTIONS}
                />
              )}
            </div>
          </DataSourceCard>

          <DataSourceCard
            title="Building footprints"
            description="A starting shape to trace over — not a survey."
            meta="Microsoft · as of ~2024"
            sourceUrl="https://github.com/microsoft/IdMyPhBuildingFootprints"
          >
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => {
                setOpen(false);
                void importBuildingFootprints();
              }}
              disabled={isLoading}
            >
              <Building2 className="h-3.5 w-3.5" />
              Import for current view
            </Button>
          </DataSourceCard>

          <DataSourceCard
            title="Fire hotspots"
            description="Active-fire detections for karhutla monitoring — independent of SIPONGI."
            meta={
              fireHotspots.enabled && fireHotspotsStatus === "error"
                ? "Failed to load — check again shortly"
                : "NASA FIRMS · refreshes every 10 min"
            }
            sourceUrl="https://firms.modaps.eosdis.nasa.gov/"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {fireHotspots.enabled ? "On" : "Off"}
              </span>
              <Switch
                checked={fireHotspots.enabled}
                onCheckedChange={(enabled) => setFireHotspots({ enabled })}
              />
            </div>
          </DataSourceCard>

          <DataSourceCard
            title="Admin boundaries"
            description="Pick an area and get exactly the buildings inside it."
            meta="BPS via UN OCHA/HDX · as of ~2020"
            sourceUrl="https://data.humdata.org/dataset/cod-ab-idn"
          >
            <AdminBoundaryPicker
              onSelect={(boundaryId) => {
                setOpen(false);
                void importBuildingFootprintsForBoundary(boundaryId);
              }}
              disabled={isLoading}
            />
          </DataSourceCard>
        </div>
      </DialogContent>
    </Dialog>
  );
}
