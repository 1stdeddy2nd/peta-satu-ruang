"use client";

import { useEffect } from "react";
import { MapViewport } from "@/components/organisms/canvas/MapViewport";
import { DashboardBrand } from "@/components/organisms/dashboard/DashboardBrand";
import { DashboardSearch } from "@/components/organisms/dashboard/DashboardSearch";
import { EventSummary } from "@/components/organisms/dashboard/EventSummary";
import { EventTimeline } from "@/components/organisms/dashboard/EventTimeline";
import { FireHotspotPopup } from "@/components/organisms/dashboard/FireHotspotPopup";
import { MapControls } from "@/components/organisms/dashboard/MapControls";
import { QuakePopup } from "@/components/organisms/dashboard/QuakePopup";
import { SelectedPlaceCard } from "@/components/organisms/dashboard/SelectedPlaceCard";
import { VolcanoPopup } from "@/components/organisms/dashboard/VolcanoPopup";
import { useMapSettings } from "@/contexts/map";

export function MapDashboard() {
  // Events are what the map is for, so they are on from the first frame.
  useEffect(() => {
    const { setFireHotspots, setVolcano, setQuake } = useMapSettings.getState();
    setFireHotspots({ enabled: true });
    setVolcano({ enabled: true });
    setQuake({ enabled: true });
  }, []);

  return (
    <div className="map-dashboard relative h-dvh w-full overflow-hidden bg-slate-100">
      <MapViewport />
      <FireHotspotPopup />
      <VolcanoPopup />
      <QuakePopup />

      {/* Mobile stacks two rows — brand and search, then the counts across the
          full width. Desktop reorders the same three into brand + counts on
          the left and search on the right. */}
      <div className="pointer-events-none absolute inset-x-3 top-3 z-30 flex flex-wrap items-center gap-2 sm:inset-x-4 sm:top-4 sm:gap-2.5">
        <DashboardBrand />
        <DashboardSearch className="order-2 min-w-0 flex-1 sm:order-3 sm:ml-auto sm:flex-none" />
        <EventSummary className="order-3 w-full sm:order-2 sm:w-auto" />
      </div>

      {/* Below both rows on mobile; beside the search on desktop. */}
      <div className="pointer-events-none absolute right-3 top-[100px] z-20 flex flex-col items-end gap-2 sm:right-4 sm:top-[76px] sm:gap-2.5">
        <MapControls />
        <SelectedPlaceCard className="hidden sm:block" />
      </div>

      <div className="pointer-events-none absolute inset-x-2 bottom-7 z-10 flex flex-col gap-2 sm:inset-x-auto sm:bottom-10 sm:left-1/2 sm:w-[min(600px,calc(100vw-9rem))] sm:-translate-x-1/2">
        <SelectedPlaceCard className="sm:hidden" />
        <EventTimeline />
      </div>
    </div>
  );
}
