"use client";

import { useState, type ReactNode } from "react";
import { Building2, Group, Info, Landmark, Loader2, Sparkles, X } from "lucide-react";
import { Drawer } from "@/components/atoms/Drawer";
import { SourceLink } from "@/components/atoms/SourceLink";
import { Toggle } from "@/components/atoms/Toggle";
import { MAP_LAYER_INFO, MIN_CLUSTER_SIZE, useMap, useMapSettings, type MapLayerInfoKey } from "@/contexts/map";
import { cn } from "@/lib/utils";
import { MOBILE_QUERY, useMediaQuery } from "@/lib/use-media-query";

function MapLayerRow({
  icon,
  tint,
  label,
  detail,
  shown,
  disabled,
  loading,
  onToggle,
  onInfo,
}: {
  icon: ReactNode;
  tint: string;
  label: string;
  detail: string;
  shown: boolean;
  disabled?: boolean;
  loading?: boolean;
  onToggle: () => void;
  onInfo?: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
      <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full", tint, disabled && "opacity-50")}>
        {icon}
      </span>
      <span className={cn("min-w-0 flex-1", disabled && "opacity-50")}>
        <span className="flex items-center gap-1">
          <span className="truncate text-[12px] font-medium leading-tight">{label}</span>
          {onInfo && (
            <button
              type="button"
              aria-label={`Tentang ${label.toLowerCase()}`}
              onClick={onInfo}
              className="shrink-0 rounded-full p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <Info className="h-3 w-3" />
            </button>
          )}
        </span>
        <span className="block truncate text-[10px] text-slate-400">{loading ? "Memuat…" : detail}</span>
      </span>
      {loading && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-slate-400" />}
      <button
        type="button"
        role="switch"
        aria-checked={shown}
        aria-label={label}
        aria-disabled={disabled}
        onClick={() => !disabled && onToggle()}
        className="shrink-0 rounded-full"
      >
        <Toggle checked={shown && !disabled} />
      </button>
    </div>
  );
}

export function EventCatalogPanel({ onClose }: { onClose: () => void }) {
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const { buildingsStatus } = useMap();
  const clusterEnabled = useMapSettings((s) => s.clusterEnabled);
  const setClusterEnabled = useMapSettings((s) => s.setClusterEnabled);
  const animationsEnabled = useMapSettings((s) => s.animationsEnabled);
  const setAnimationsEnabled = useMapSettings((s) => s.setAnimationsEnabled);
  const adminArea = useMapSettings((s) => s.adminArea);
  const boundaryVisible = useMapSettings((s) => s.adminBoundaryVisible);
  const setBoundaryVisible = useMapSettings((s) => s.setAdminBoundaryVisible);
  const buildingsVisible = useMapSettings((s) => s.buildingsVisible);
  const setBuildingsVisible = useMapSettings((s) => s.setBuildingsVisible);
  const [mapInfo, setMapInfo] = useState<MapLayerInfoKey | null>(null);

  const header = (
      <div className="flex items-start gap-1.5 px-1.5 pb-1.5">
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-bold leading-tight">
            {mapInfo ? MAP_LAYER_INFO[mapInfo].title : "Katalog data"}
          </span>
          <span className="block text-[10px] text-slate-400">
            {mapInfo ? "Tentang data ini" : "Data lain yang bisa ditumpuk di peta"}
          </span>
        </span>
        {mapInfo && (
          <button
            type="button"
            aria-label="Tutup penjelasan"
            onClick={() => setMapInfo(null)}
            className="-mr-0.5 -mt-0.5 shrink-0 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {isMobile && !mapInfo && (
          <button
            type="button"
            aria-label="Tutup"
            onClick={onClose}
            className="-mr-0.5 -mt-0.5 shrink-0 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
  );

  const body = mapInfo ? (
        <div className="border-t border-slate-100 px-2 pb-1 pt-2 text-[11px] leading-relaxed text-slate-600">
          <p>{MAP_LAYER_INFO[mapInfo].body}</p>
          <div className="mt-2 border-t border-slate-100 pt-1.5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Sumber</div>
            <SourceLink href={MAP_LAYER_INFO[mapInfo].source.href} name={MAP_LAYER_INFO[mapInfo].source.name} />
          </div>
        </div>
      ) : (
        <>
          <div className="border-t border-slate-100 px-2 pb-1 pt-2">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Administrasi
            </span>
            <span className="block text-[10px] text-slate-400">Pilih wilayah dulu</span>
          </div>
          <div>
            <MapLayerRow
              icon={<Landmark className="h-3.5 w-3.5" />}
              tint="bg-blue-50 text-blue-600"
              label={MAP_LAYER_INFO.boundary.title}
              detail={MAP_LAYER_INFO.boundary.detail}
              onInfo={() => setMapInfo("boundary")}
              shown={adminArea !== null && boundaryVisible}
              disabled={!adminArea}
              onToggle={() => setBoundaryVisible(!boundaryVisible)}
            />
            <MapLayerRow
              icon={<Building2 className="h-3.5 w-3.5" />}
              tint="bg-amber-50 text-amber-600"
              label={MAP_LAYER_INFO.buildings.title}
              detail={MAP_LAYER_INFO.buildings.detail}
              onInfo={() => setMapInfo("buildings")}
              loading={buildingsStatus === "loading"}
              shown={buildingsVisible}
              disabled={!adminArea || adminArea.level < 2}
              onToggle={() => setBuildingsVisible(!buildingsVisible)}
            />
          </div>

          <div className="mt-1.5 border-t border-slate-100 px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Pengaturan
          </div>
          <MapLayerRow
            icon={<Group className="h-3.5 w-3.5" />}
            tint="bg-slate-100 text-slate-600"
            label="Gabungkan yang menumpuk"
            detail={
              clusterEnabled ? `Mulai dari ${MIN_CLUSTER_SIZE} kejadian berdekatan` : "Semua digambar satu per satu"
            }
            shown={clusterEnabled}
            onToggle={() => setClusterEnabled(!clusterEnabled)}
          />
          <MapLayerRow
            icon={<Sparkles className="h-3.5 w-3.5" />}
            tint="bg-slate-100 text-slate-500"
            label="Animasi"
            detail="Panas, gelombang gempa, dan asap erupsi"
            shown={animationsEnabled}
            onToggle={() => setAnimationsEnabled(!animationsEnabled)}
          />
        </>
      );

  if (isMobile) {
    return (
      <Drawer open onClose={onClose} ariaLabel="Katalog data" className="p-2">
        {header}
        {body}
      </Drawer>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Katalog data"
      className="mt-2 w-[300px] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-xl shadow-slate-900/10 backdrop-blur"
    >
      {header}
      {body}
    </div>
  );
}
