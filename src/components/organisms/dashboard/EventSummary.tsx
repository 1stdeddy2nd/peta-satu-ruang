"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Layers, Loader2 } from "lucide-react";
import { EventBadge } from "@/components/atoms/EventBadge";
import { EventCatalogPanel } from "./EventCatalogPanel";
import { EventDetailCard } from "./EventDetailCard";
import { EVENT_CHIP_OPEN_CLASS, EVENT_KIND_LABEL, countLabel, useMap, useMapSettings, type EventKind } from "@/contexts/map";
import { FIRE_BANDS } from "@/lib/fire-constants";
import { cn } from "@/lib/utils";
import { MOBILE_QUERY, useMediaQuery } from "@/lib/use-media-query";

export function EventSummary({ className }: { className?: string }) {
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const { fireHotspotCounts, volcanoCounts, quakeCounts, fireHotspotsStatus, volcanoStatus, quakeStatus } = useMap();
  const fireHotspots = useMapSettings((s) => s.fireHotspots);
  const volcano = useMapSettings((s) => s.volcano);
  const quake = useMapSettings((s) => s.quake);
  const activeMobileDrawer = useMapSettings((s) => s.activeMobileDrawer);
  const setActiveMobileDrawer = useMapSettings((s) => s.setActiveMobileDrawer);
  const [open, setOpenState] = useState<EventKind | "peta" | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Functional: two taps in the same frame both read the same `open` from
  // their own render, so a fast double tap would open twice instead of
  // toggling shut.
  const toggleOpen = (next: EventKind | "peta") => {
    setOpenState((current) => (current === next ? null : next));
    if (isMobile) setActiveMobileDrawer("event-summary");
  };

  // A marker's own popup opened — it renders at the same spot on mobile and
  // would otherwise stack with this card.
  useEffect(() => {
    if (isMobile && open && activeMobileDrawer !== "event-summary") setOpenState(null);
  }, [isMobile, activeMobileDrawer, open]);

  useEffect(() => {
    if (!open) return;
    // On mobile the card is a Drawer: its own backdrop tap and Escape close
    // it, and a click anywhere in its portaled content would otherwise look
    // like a click "outside" this component and close it mid-interaction.
    const onPointerDown = (e: PointerEvent) => {
      if (!isMobile && !ref.current?.contains(e.target as Node)) setOpenState(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenState(null);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, isMobile]);

  const fireShown = FIRE_BANDS.filter((band) => !fireHotspots.hiddenBands.includes(band));
  const items: { kind: EventKind; on: boolean; value: number | null; loading: boolean }[] = [
    {
      kind: "fire",
      on: fireHotspots.enabled,
      value: fireHotspotCounts ? fireShown.reduce((sum, band) => sum + fireHotspotCounts.all[band], 0) : null,
      loading: fireHotspotsStatus === "loading",
    },
    {
      kind: "volcano",
      on: volcano.enabled,
      value: volcanoCounts?.eruptedRecently ?? null,
      loading: volcanoStatus === "loading",
    },
    { kind: "quake", on: quake.enabled, value: quakeCounts?.total ?? null, loading: quakeStatus === "loading" },
  ];

  const mapOpen = open === "peta";

  return (
    <div ref={ref} className={cn("pointer-events-auto flex w-full flex-col items-end sm:w-auto", className)}>
      {/* Mobile: equal-width buttons filling the row, no pill around them, so
          the last one lines up with the controls below. Desktop: one pill. */}
      <div
        role="group"
        aria-label="Ringkasan peristiwa"
        className="flex h-9 w-full items-center gap-1.5 rounded-full p-0 sm:h-11 sm:w-auto sm:gap-1 sm:border sm:border-slate-200/80 sm:bg-white/90 sm:p-1 sm:shadow-lg sm:shadow-slate-900/10 sm:backdrop-blur"
      >
        {items.map(({ kind, on, value, loading }) => (
          <button
            key={kind}
            type="button"
            aria-label={`${EVENT_KIND_LABEL[kind]}${value !== null ? `: ${value}` : ""}`}
            aria-expanded={open === kind}
            onClick={() => toggleOpen(kind)}
            className={cn(
              "flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full border py-1 pl-1 pr-2 shadow-md shadow-slate-900/10 backdrop-blur transition-colors sm:h-auto sm:flex-none sm:justify-start sm:pr-1.5 sm:shadow-none",
              open === kind ? EVENT_CHIP_OPEN_CLASS[kind] : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
              !on && "opacity-50"
            )}
          >
            <EventBadge kind={kind} />
            <span className="min-w-[1.5ch] text-[13px] font-bold tabular-nums">
              {value === null ? "–" : countLabel(value)}
            </span>
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-slate-400" />
            ) : (
              // Dropped on mobile: the width it costs is the width the row
              // needs to fit beside the brand.
              <ChevronDown
                className={cn(
                  "hidden h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform sm:block",
                  open === kind && "rotate-180"
                )}
              />
            )}
          </button>
        ))}

        <span className="mx-0.5 hidden h-6 w-px shrink-0 bg-slate-200 sm:block" />
        <button
          type="button"
          aria-label="Katalog data"
          aria-expanded={mapOpen}
          onClick={() => toggleOpen("peta")}
          className={cn(
            "flex h-9 min-w-0 flex-1 items-center justify-center gap-1 rounded-full border p-1 shadow-md shadow-slate-900/10 backdrop-blur transition-colors sm:h-auto sm:flex-none sm:py-1 sm:pl-1 sm:pr-1.5 sm:shadow-none",
            mapOpen ? "border-slate-300 bg-slate-100" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
          )}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <Layers className="h-3.5 w-3.5" />
          </span>
          <ChevronDown
            className={cn("hidden h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform sm:block", mapOpen && "rotate-180")}
          />
        </button>
      </div>

      {mapOpen && <EventCatalogPanel onClose={() => setOpenState(null)} />}
      {/* Keyed by kind: switching hazards should not carry over the previous
          one's open info panel. */}
      {open && open !== "peta" && <EventDetailCard key={open} kind={open} onClose={() => setOpenState(null)} />}
    </div>
  );
}
