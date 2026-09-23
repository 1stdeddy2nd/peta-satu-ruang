"use client";

import { Building2, Landmark, X } from "lucide-react";
import { EventBadge } from "@/components/atoms/EventBadge";
import {
  ADMIN_AREA_LEVEL_LABEL,
  BUILDINGS_MIN_ZOOM,
  EVENT_RANGE_LABEL,
  useMap,
  useMapSettings,
  type EventKind,
} from "@/contexts/map";
import { cn } from "@/lib/utils";

export function SelectedPlaceCard({ className }: { className?: string }) {
  const { adminAreaCounts: counts, clearAdminArea } = useMap();
  const area = useMapSettings((s) => s.adminArea);
  const setAdminArea = useMapSettings((s) => s.setAdminArea);
  const range = useMapSettings((s) => s.eventTime.range);
  const zoom = useMapSettings((s) => s.view.zoom);
  const fireOn = useMapSettings((s) => s.fireHotspots.enabled);
  const volcanoOn = useMapSettings((s) => s.volcano.enabled);
  const quakeOn = useMapSettings((s) => s.quake.enabled);
  const boundaryVisible = useMapSettings((s) => s.adminBoundaryVisible);
  const setBoundaryVisible = useMapSettings((s) => s.setAdminBoundaryVisible);
  const buildingsVisible = useMapSettings((s) => s.buildingsVisible);
  const setBuildingsVisible = useMapSettings((s) => s.setBuildingsVisible);

  if (!area) return null;

  const parents = area.path.split(" · ").filter((part) => part && part !== area.name);
  const stats: { kind: EventKind; on: boolean; value: number | undefined; label: string }[] = [
    { kind: "fire", on: fireOn, value: counts?.fire, label: "titik api" },
    { kind: "quake", on: quakeOn, value: counts?.quake, label: "gempa" },
    { kind: "volcano", on: volcanoOn, value: counts?.eruptions, label: "erupsi" },
  ];
  const buildingsHint =
    area.level < 2
      ? "Pilih kota, kecamatan, atau desa"
      : zoom < BUILDINGS_MIN_ZOOM
        ? "Perbesar peta untuk melihatnya"
        : null;

  const close = () => {
    setAdminArea(null);
    clearAdminArea();
  };

  return (
    <section
      aria-label={`Wilayah terpilih: ${area.name}`}
      className={cn(
        "pointer-events-auto rounded-2xl border border-slate-200/80 bg-white/95 p-3.5 text-slate-900 shadow-xl shadow-slate-900/10 backdrop-blur animate-in fade-in slide-in-from-bottom-2 duration-300 sm:slide-in-from-top-2",
        className
      )}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600">
            {ADMIN_AREA_LEVEL_LABEL[area.level] ?? "Wilayah"}
          </p>
          <h2 className="truncate text-[17px] font-bold leading-tight">{area.name}</h2>
          {parents.length > 0 && <p className="truncate text-[12px] text-slate-500">{parents.reverse().join(", ")}</p>}
        </div>
        <button
          type="button"
          aria-label="Tutup wilayah"
          onClick={close}
          className="-mr-1 -mt-1 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-3">
        {stats
          .filter((stat) => stat.on)
          .map((stat) => (
            <div key={stat.kind} className="flex items-center gap-1.5" title={stat.label}>
              <EventBadge kind={stat.kind} className="h-5 w-5" />
              <span className={cn("text-[14px] font-bold tabular-nums", stat.value === 0 && "text-slate-400")}>
                {stat.value ?? "…"}
              </span>
            </div>
          ))}
        <span className="ml-auto text-[11px] text-slate-400">{EVENT_RANGE_LABEL[range]}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
        <button
          type="button"
          aria-pressed={boundaryVisible}
          onClick={() => setBoundaryVisible(!boundaryVisible)}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors",
            boundaryVisible ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"
          )}
        >
          <Landmark className="h-3.5 w-3.5" />
          Batas wilayah
        </button>
        <button
          type="button"
          aria-pressed={buildingsVisible}
          disabled={area.level < 2}
          onClick={() => setBuildingsVisible(!buildingsVisible)}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors disabled:opacity-40",
            buildingsVisible && area.level >= 2
              ? "border-amber-500 bg-amber-500 text-white"
              : "border-slate-200 text-slate-600 hover:bg-slate-50"
          )}
        >
          <Building2 className="h-3.5 w-3.5" />
          Bangunan
        </button>
      </div>
      {buildingsVisible && buildingsHint && <p className="mt-1.5 text-[11px] text-slate-400">{buildingsHint}</p>}
    </section>
  );
}
