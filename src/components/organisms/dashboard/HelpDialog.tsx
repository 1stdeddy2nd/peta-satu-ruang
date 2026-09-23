"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CalendarClock, HelpCircle, Layers, MousePointerClick, Search, X } from "lucide-react";
import { Drawer } from "@/components/atoms/Drawer";
import { EventBadge } from "@/components/atoms/EventBadge";
import { MIN_CLUSTER_SIZE, useMapSettings } from "@/contexts/map";
import { cn } from "@/lib/utils";
import { MOBILE_QUERY, useMediaQuery } from "@/lib/use-media-query";

function Step({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold leading-tight">{title}</span>
        <span className="block text-[12px] leading-relaxed text-slate-500">{children}</span>
      </span>
    </div>
  );
}

export function HelpDialog({ className }: { className?: string }) {
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const activeMobileDrawer = useMapSettings((s) => s.activeMobileDrawer);
  const setActiveMobileDrawer = useMapSettings((s) => s.setActiveMobileDrawer);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // One card at a time on mobile, where this is a bottom sheet like the rest.
  useEffect(() => {
    if (isMobile && open && activeMobileDrawer !== "help") setOpen(false);
  }, [isMobile, open, activeMobileDrawer]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const body = (
    <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[16px] font-bold leading-tight">Cara pakai peta ini</h2>
                  <p className="text-[12px] text-slate-500">
                    Kejadian terbaru di Indonesia: titik api, gempa, dan gunung api.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Tutup"
                  onClick={() => setOpen(false)}
                  className="-mr-1 -mt-1 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3.5">
                <Step icon={<Search className="h-3.5 w-3.5" />} title="Cari tempatnya">
                  Ketik nama provinsi, kota, kecamatan, atau desa. Peta akan menyorot wilayahnya dan menghitung
                  kejadian di dalamnya.
                </Step>
                <Step icon={<CalendarClock className="h-3.5 w-3.5" />} title="Pilih waktunya">
                  1 jam, 24 jam, 7 hari, atau 30 hari. Tekan putar untuk melihat kejadian muncul sesuai waktu
                  aslinya, atau geser garis waktu ke satu saat tertentu.
                </Step>
                <Step icon={<MousePointerClick className="h-3.5 w-3.5" />} title="Klik untuk detail">
                  Setiap tanda bisa diklik: waktu, lokasi, kekuatan, dan sumber datanya. Lingkaran berangka
                  berarti {MIN_CLUSTER_SIZE} kejadian atau lebih menumpuk — klik untuk memperbesar dan memecahnya.
                </Step>
                <Step icon={<Layers className="h-3.5 w-3.5" />} title="Atur yang tampil">
                  Lewat tombol di kiri atas: hidupkan atau matikan tiap jenis kejadian, pilih tingkatannya,
                  matikan animasi, atau tampilkan batas wilayah dan bangunan.
                </Step>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Tanda di peta</div>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <EventBadge kind="fire" />
                    <span className="text-[12px] text-slate-600">
                      <strong className="font-semibold text-slate-900">Titik api</strong> — titik panas dari
                      satelit NASA. Panasnya berdenyut pelan; belum tentu kebakaran.
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <EventBadge kind="quake" />
                    <span className="text-[12px] text-slate-600">
                      <strong className="font-semibold text-slate-900">Gempa</strong> — lingkarannya mengikuti
                      magnitudo, dan gelombangnya memperkirakan sejauh mana getaran terasa.
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <EventBadge kind="volcano" />
                    <span className="text-[12px] text-slate-600">
                      <strong className="font-semibold text-slate-900">Gunung api</strong> — warnanya level PVMBG.
                      Yang merah, berasap, dan berpendar sedang meletus.
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
                Data dari NASA FIRMS, BMKG, USGS, dan MAGMA Indonesia (PVMBG). Peta ini menampilkan laporan yang
                sudah terjadi — bukan ramalan.
              </p>
    </>
  );

  return (
    <>
      <button
        type="button"
        aria-label="Cara pakai peta"
        onClick={() => {
          setOpen(true);
          if (isMobile) setActiveMobileDrawer("help");
        }}
        className={cn(
          "pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/90 text-slate-500 shadow-md shadow-slate-900/10 backdrop-blur transition-colors hover:text-slate-900 sm:h-11 sm:w-11",
          className
        )}
      >
        <HelpCircle className="h-4 w-4" />
      </button>

      {open && mounted && (
        isMobile ? (
          <Drawer open onClose={() => setOpen(false)} ariaLabel="Cara pakai peta" className="p-4">
            {body}
          </Drawer>
        ) : (
          createPortal(
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-3 backdrop-blur-[2px]"
              onClick={() => setOpen(false)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Cara pakai peta"
                onClick={(e) => e.stopPropagation()}
                className="max-h-[85dvh] w-full max-w-[460px] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-2xl shadow-slate-900/25"
              >
                {body}
              </div>
            </div>,
            document.body
          )
        )
      )}
    </>
  );
}
