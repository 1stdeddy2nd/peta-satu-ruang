"use client";

import { toast } from "sonner";
import { FlaskConical, Layers, LocateFixed, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PanelSection } from "@/components/atoms/PanelSection";
import { EmptyState } from "@/components/atoms/EmptyState";
import { UploadDropzone } from "@/components/molecules/UploadDropzone";
import { LayerCard } from "@/components/molecules/LayerCard";
import { DataLibrary } from "@/components/organisms/DataLibrary";
import { useMap, useMapSettings } from "@/contexts/map";

export function AnalysisPanel() {
  const {
    addFiles,
    centerOn,
    removeLayer,
    zoomToLayer,
    zoomToAll,
    setLayerCategoryField,
    isLoading,
  } = useMap();
  const layers = useMapSettings((s) => s.layers);
  const updateLayer = useMapSettings((s) => s.updateLayer);

  // Browsers only hand out coordinates over HTTPS or on localhost, and a user
  // who declined the prompt gets no callback at all — so both failures need
  // saying out loud rather than a button that silently does nothing.
  const goToMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("This browser can't share your location");
      return;
    }
    toast.info("Finding your location…");
    navigator.geolocation.getCurrentPosition(
      (pos) => centerOn(pos.coords.longitude, pos.coords.latitude),
      (err) =>
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied — allow it in your browser to use this."
            : "Couldn't get your location"
        ),
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  };

  return (
    <div className="flex flex-col gap-5 p-4">
      <PanelSection title="Data">
        <UploadDropzone onFiles={addFiles} loading={isLoading} />
      </PanelSection>

      <Separator />

      <PanelSection title="Data library">
        <DataLibrary />
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={goToMyLocation}
        >
          <LocateFixed className="h-3.5 w-3.5" />
          Go to my location
        </Button>
      </PanelSection>

      <Separator />

      <PanelSection
        title={`Layers${layers.length ? ` (${layers.length})` : ""}`}
        action={
          layers.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 gap-1 px-2 text-[11px]"
              onClick={zoomToAll}
            >
              <Maximize className="h-3 w-3" />
              Zoom all
            </Button>
          )
        }
      >
        {layers.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No layers yet"
            description="Upload a GeoJSON, KML or zipped Shapefile to get started."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {layers.map((layer) => (
              <LayerCard
                key={layer.id}
                layer={layer}
                onChange={(patch) => updateLayer(layer.id, patch)}
                onZoom={() => zoomToLayer(layer.id)}
                onRemove={() => removeLayer(layer.id)}
                onCategoryField={(field) => setLayerCategoryField(layer.id, field)}
              />
            ))}
          </div>
        )}
      </PanelSection>

      <Separator />

      <PanelSection title="Tools">
        <EmptyState
          icon={FlaskConical}
          title="Analysis tools coming soon"
          description="Buffer, intersect, clip and measure will appear here."
        />
      </PanelSection>
    </div>
  );
}
