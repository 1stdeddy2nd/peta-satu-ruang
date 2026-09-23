"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown, History, LocateFixed, MapPin, MapPinOff, Minus, Plus } from "lucide-react";
import { useMap, useMapSettings } from "@/contexts/map";
import { cn } from "@/lib/utils";
import { HelpDialog } from "./HelpDialog";
import { MobileAttribution } from "./MobileAttribution";

export const BUTTON =
  "flex h-9 w-9 items-center justify-center text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 sm:h-11 sm:w-11";
const GROUP =
  "pointer-events-auto flex flex-col divide-y divide-slate-100 overflow-hidden rounded-full border border-slate-200/80 bg-white/90 shadow-md shadow-slate-900/10 backdrop-blur";

export function MapControls({ className }: { className?: string }) {
  const { markMyLocation, setMyLocationVisible, zoomBy } = useMap();
  const [located, setLocated] = useState(false);
  const [markerVisible, setMarkerVisible] = useState(true);
  const timelineCollapsed = useMapSettings((s) => s.timelineCollapsed);
  const setTimelineCollapsed = useMapSettings((s) => s.setTimelineCollapsed);
  const setActiveMobileDrawer = useMapSettings((s) => s.setActiveMobileDrawer);
  const [toolsOpen, setToolsOpen] = useState(false);

  const goToMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Browser ini tidak bisa membagikan lokasi.", { position: "top-center" });
      return;
    }
    const id = toast.loading("Mencari lokasi Anda…", { position: "top-center" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        toast.dismiss(id);
        markMyLocation(pos.coords.longitude, pos.coords.latitude);
        setLocated(true);
        setMarkerVisible(true);
      },
      (err) =>
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? "Izin lokasi ditolak. Izinkan lokasi di pengaturan browser."
            : "Lokasi Anda tidak bisa didapat.",
          { id, position: "top-center" }
        ),
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  };

  const toggleMarker = () => {
    setMyLocationVisible(!markerVisible);
    setMarkerVisible(!markerVisible);
  };

  const showTimeline = () => {
    setTimelineCollapsed(!timelineCollapsed);
    if (timelineCollapsed) setActiveMobileDrawer("timeline");
  };

  return (
    <div className={cn("flex flex-col items-end gap-2", className)}>
      {/* Mobile keeps one button on screen and the rest behind it; there is
          not enough room for the whole column beside the map. */}
      <button
        type="button"
        aria-label={toolsOpen ? "Sembunyikan alat peta" : "Tampilkan alat peta"}
        aria-expanded={toolsOpen}
        onClick={() => setToolsOpen((v) => !v)}
        className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/90 text-slate-500 shadow-md shadow-slate-900/10 backdrop-blur transition-colors hover:text-slate-900 sm:hidden"
      >
        <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", toolsOpen && "rotate-180")} />
      </button>

      <div className={cn("flex flex-col items-end gap-2", !toolsOpen && "hidden sm:flex")}>
        <HelpDialog />

        <div className={GROUP}>
          <button type="button" className={BUTTON} aria-label="Ke lokasi saya" onClick={goToMyLocation}>
            <LocateFixed className="h-4 w-4" />
          </button>
          {located && (
            <button
              type="button"
              className={BUTTON}
              aria-label={markerVisible ? "Sembunyikan penanda lokasi" : "Tampilkan penanda lokasi"}
              aria-pressed={markerVisible}
              onClick={toggleMarker}
            >
              {markerVisible ? <MapPin className="h-4 w-4 text-blue-600" /> : <MapPinOff className="h-4 w-4" />}
            </button>
          )}
        </div>

        <div className={GROUP}>
          <button type="button" className={BUTTON} aria-label="Perbesar" onClick={() => zoomBy(1)}>
            <Plus className="h-4 w-4" />
          </button>
          <button type="button" className={BUTTON} aria-label="Perkecil" onClick={() => zoomBy(-1)}>
            <Minus className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          aria-label={timelineCollapsed ? "Tampilkan garis waktu" : "Sembunyikan garis waktu"}
          aria-pressed={!timelineCollapsed}
          onClick={showTimeline}
          className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/90 text-slate-500 shadow-md shadow-slate-900/10 backdrop-blur transition-colors hover:text-slate-900 sm:h-11 sm:w-11"
        >
          <History className="h-4 w-4" />
        </button>

        <MobileAttribution />
      </div>
    </div>
  );
}
