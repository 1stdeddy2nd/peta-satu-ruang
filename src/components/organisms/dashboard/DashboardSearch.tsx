"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, MapPin, Search, X } from "lucide-react";
import { FloatingPanel } from "@/components/atoms/FloatingPanel";
import { ADMIN_AREA_LEVEL_LABEL, searchAdminAreas, useMap, useMapSettings } from "@/contexts/map";
import type { AdminAreaResult } from "@/lib/admin-types";
import { cn } from "@/lib/utils";
import { MOBILE_QUERY, useMediaQuery } from "@/lib/use-media-query";

export function DashboardSearch({ className }: { className?: string }) {
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const { focusAdminArea, clearAdminArea } = useMap();
  const adminArea = useMapSettings((s) => s.adminArea);
  const setAdminArea = useMapSettings((s) => s.setAdminArea);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminAreaResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // Picking a result writes its name into the box, which must not search again
  // and pop the list straight back open.
  const skipSearchRef = useRef(false);

  const fullScreen = isMobile && expanded;

  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }

    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      setOpen(false);
      return;
    }

    const controller = new AbortController();
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        setResults(await searchAdminAreas(q, controller.signal));
        setOpen(true);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Closing the place card clears the selection; the box follows it.
  useEffect(() => {
    if (adminArea) return;
    setQuery("");
    setResults([]);
    setOpen(false);
  }, [adminArea]);

  useEffect(() => {
    if (fullScreen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [fullScreen]);

  useEffect(() => {
    if (!fullScreen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setExpanded(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [fullScreen]);

  const choose = (area: AdminAreaResult) => {
    // An unchanged query never re-runs the effect, so a flag set for it would
    // swallow the next real search instead.
    if (area.name !== query) skipSearchRef.current = true;
    setQuery(area.name);
    setOpen(false);
    setExpanded(false);
    setAdminArea(area);
    focusAdminArea(area.pcode).catch(() =>
      toast.error("Batas wilayah tidak bisa dimuat.", { position: "top-center" })
    );
  };

  const clear = () => {
    setQuery("");
    setResults([]);
    setOpen(false);
    setAdminArea(null);
    clearAdminArea();
  };

  const resultList =
    results.length === 0 ? (
      <p className={cn("text-[13px] text-slate-500", fullScreen ? "px-4 py-4" : "px-3.5 py-3")}>
        Tidak ada hasil untuk “{query.trim()}”.
      </p>
    ) : (
      <ul>
        {results.map((area) => (
          <li key={area.pcode}>
            <button
              type="button"
              onClick={() => choose(area)}
              className={cn(
                "flex w-full items-start gap-2.5 text-left transition-colors hover:bg-slate-50",
                fullScreen ? "px-4 py-3" : "px-3.5 py-2.5"
              )}
            >
              <MapPin className={cn("shrink-0 text-slate-400", fullScreen ? "mt-0.5 h-4 w-4" : "mt-0.5 h-3.5 w-3.5")} />
              <span className="min-w-0">
                <span className={cn("block truncate font-medium", fullScreen ? "text-[15px]" : "text-[13px]")}>
                  {area.name}
                </span>
                <span className={cn("block truncate text-slate-500", fullScreen ? "text-[12px]" : "text-[11px]")}>
                  {[ADMIN_AREA_LEVEL_LABEL[area.level], area.path].filter(Boolean).join(" · ")}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    );

  const field = (
    <FloatingPanel
      className={cn(
        "flex items-center gap-2.5 rounded-full border-slate-200/80 bg-white/95 px-4 shadow-md backdrop-blur",
        fullScreen ? "h-10 flex-1 border-slate-200 bg-slate-100 shadow-none" : "h-9 sm:h-11"
      )}
    >
      {searching ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" />
      ) : (
        <Search className="h-4 w-4 shrink-0 text-slate-400" />
      )}
      <input
        id="dashboard-search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (isMobile) setExpanded(true);
          if (results.length > 0) setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          if (e.key === "Enter" && results.length > 0) choose(results[0]);
        }}
        placeholder="Cari tempat di Indonesia"
        aria-label="Cari wilayah"
        className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-slate-400 sm:text-[13px]"
      />
      {query && (
        <button
          type="button"
          aria-label="Kosongkan pencarian"
          onClick={clear}
          className="shrink-0 rounded-full p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </FloatingPanel>
  );

  // Typing on a phone puts a keyboard over the bottom half of the screen, so
  // the results cannot live in a sheet down there — the field stays at the top
  // and the list gets everything between it and the keyboard.
  if (fullScreen) {
    return (
      <div ref={containerRef} className="pointer-events-auto fixed inset-0 z-[70] flex flex-col bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2.5">
          <button
            type="button"
            aria-label="Tutup pencarian"
            onClick={() => setExpanded(false)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          {field}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {open ? (
            resultList
          ) : (
            <p className="px-4 py-6 text-[13px] leading-relaxed text-slate-500">
              Ketik nama provinsi, kota, kecamatan, atau desa. Peta akan menyorot wilayahnya dan menghitung
              kejadian di dalamnya.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("pointer-events-auto w-full sm:w-auto", className)}>
      {/* The list is absolute so it never becomes a flex item of the top row —
          in flow it stretched the row and pushed the brand and counts down. */}
      <div className="relative min-w-0 sm:w-[360px]">
        {field}
        {open && (
          <FloatingPanel className="absolute inset-x-0 top-full z-10 mt-2 max-h-[60dvh] overflow-y-auto rounded-2xl">
            {resultList}
          </FloatingPanel>
        )}
      </div>
    </div>
  );
}
