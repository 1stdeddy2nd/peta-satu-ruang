"use client";

import { useEffect, useState } from "react";
import { MapPinned } from "lucide-react";
import { FloatingPanel } from "@/components/atoms/FloatingPanel";
import { useMapSettings } from "@/contexts/map";

function clock() {
  return new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

export function DashboardBrand() {
  const replaying = useMapSettings((s) => s.eventTime.cursor !== null);
  const [now, setNow] = useState(clock);

  useEffect(() => {
    const timer = setInterval(() => setNow(clock()), 30_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <FloatingPanel className="flex h-9 items-center gap-2.5 rounded-full border-slate-200/80 bg-white/90 p-1 shadow-md backdrop-blur sm:h-11 sm:pr-3">
      <span className="flex h-full w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md shadow-indigo-900/30 sm:w-11">
        <MapPinned className="h-4 w-4" />
      </span>
      <span className="hidden min-w-0 sm:block">
        <span className="block text-[14px] font-bold leading-tight tracking-tight">Peta Satu Ruang</span>
        <span className="flex items-center gap-1.5 text-[10px] leading-tight text-slate-400">
          {replaying ? (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Putar ulang
            </>
          ) : (
            <>
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:hidden" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Langsung · {now} WIB
            </>
          )}
        </span>
      </span>
    </FloatingPanel>
  );
}
