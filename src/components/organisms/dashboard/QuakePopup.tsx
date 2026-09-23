"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Overlay from "ol/Overlay";
import type MapBrowserEvent from "ol/MapBrowserEvent";
import { ArrowUpRight, TriangleAlert, X } from "lucide-react";
import { Drawer } from "@/components/atoms/Drawer";
import { QUAKE_COLOR, popupAutoPanMargin, relativeTimeLabel, useMap, useMapSettings } from "@/contexts/map";
import type { QuakeFeatureProperties } from "@/contexts/map";
import { QUAKE_BMKG, QUAKE_USGS } from "@/lib/quake-constants";
import { MOBILE_QUERY, useMediaQuery } from "@/lib/use-media-query";

function whenLabel(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

const LABEL = "text-[10px] font-semibold uppercase tracking-wider text-slate-400";

export function QuakePopup() {
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const { map, quakeAt } = useMap();
  const enabled = useMapSettings((s) => s.quake.enabled);
  const activeMobileDrawer = useMapSettings((s) => s.activeMobileDrawer);
  const setActiveMobileDrawer = useMapSettings((s) => s.setActiveMobileDrawer);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [quake, setQuake] = useState<QuakeFeatureProperties | null>(null);
  const overlayRef = useRef<Overlay | null>(null);
  // The click effect below only runs once; read the latest breakpoint through
  // a ref rather than resubscribing map listeners on every resize.
  const isMobileRef = useRef(isMobile);
  isMobileRef.current = isMobile;

  // Another mobile drawer opened (a hazard card, or a different marker's
  // popup) — they render at the same spot and would otherwise stack.
  useEffect(() => {
    if (isMobile && quake && activeMobileDrawer !== "quake") setQuake(null);
  }, [isMobile, activeMobileDrawer, quake]);

  useEffect(() => {
    setContainer(document.createElement("div"));
  }, []);

  useEffect(() => {
    if (!map || !container) return;
    const overlay = new Overlay({
      element: container,
      positioning: "bottom-center",
      offset: [0, -12],
    });
    map.addOverlay(overlay);
    overlayRef.current = overlay;

    const onClick = (evt: MapBrowserEvent) => {
      const hit = quakeAt(evt.pixel);
      if (!hit) {
        overlay.setPosition(undefined);
        setQuake(null);
        return;
      }
      overlay.setPosition(hit.coordinate);
      // On mobile this renders as a drawer, not anchored to the map, so
      // there is nothing to pan into view.
      if (!isMobileRef.current) {
        // The popup hasn't rendered its real content yet, so 300 (its CSS
        // cap) is the best guess until the resize observer below measures it.
        overlay.panIntoView({ animation: { duration: 250 }, margin: popupAutoPanMargin(window.innerWidth, 300) });
      } else {
        setActiveMobileDrawer("quake");
      }
      setQuake(hit.properties);
    };
    map.on("singleclick", onClick);

    // The popup renders its real content after setPosition, so the pan above
    // can under- or over-shoot. Re-pan on resize, now with the container's
    // actual width so the margin fits what's really there.
    const resizeObserver = new ResizeObserver(() => {
      if (!overlay.getPosition() || isMobileRef.current) return;
      const width = container.getBoundingClientRect().width || 300;
      overlay.panIntoView({ animation: { duration: 250 }, margin: popupAutoPanMargin(window.innerWidth, width) });
    });
    resizeObserver.observe(container);

    return () => {
      map.un("singleclick", onClick);
      map.removeOverlay(overlay);
      resizeObserver.disconnect();
    };
  }, [map, container, quakeAt, setActiveMobileDrawer]);

  useEffect(() => {
    overlayRef.current?.setPosition(undefined);
    setQuake(null);
  }, [enabled]);

  if (!container || !quake) return null;

  // BMKG writes either "Tidak berpotensi tsunami" or a warning; only the
  // warning should read as one.
  const tsunamiRisk = quake.potential !== null && !/tidak berpotensi/i.test(quake.potential);
  const fromBmkg = quake.source === "bmkg";

  const close = () => {
    overlayRef.current?.setPosition(undefined);
    setQuake(null);
  };

  const content = (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-xl shadow-slate-900/15">
        <div className="flex items-start justify-between gap-2 px-3.5 pt-3.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="rounded px-1.5 py-0.5 text-[13px] font-bold tracking-wide text-white"
                style={{ backgroundColor: QUAKE_COLOR }}
              >
                M {quake.magnitude.toFixed(1)}
              </span>
              <span className="text-[12px] font-semibold">{relativeTimeLabel(quake.occurredAt)}</span>
            </div>
            <div className="mt-1 text-[10px] text-slate-400">
              {whenLabel(quake.occurredAt)} · kedalaman {quake.depthKm} km
            </div>
            <div className="mt-0.5 text-[10px] font-medium text-slate-500">
              Sumber: {fromBmkg ? "BMKG" : "katalog USGS"}
            </div>
          </div>
          <button
            type="button"
            aria-label="Tutup"
            onClick={close}
            className="-mr-1 -mt-1 shrink-0 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-2.5 max-h-[min(45vh,360px)] overflow-y-auto px-3.5 pb-3.5">
          <p className="text-[12px] leading-snug text-slate-700">{quake.area}</p>
          {!fromBmkg && (
            <p className="mt-1.5 text-[11px] leading-snug text-slate-500">
              Gempa ini tidak ada di daftar terbaru BMKG, jadi datanya dari katalog USGS. Keterangan lokasi dan
              potensi tsunami versi BMKG tidak tersedia untuknya.
            </p>
          )}

          {quake.potential && (
            <div
              className={`mt-2.5 flex gap-2 rounded-lg p-2.5 text-[12px] leading-snug ${
                tsunamiRisk ? "bg-red-50 text-red-900" : "bg-slate-50 text-slate-700"
              }`}
            >
              {tsunamiRisk && <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />}
              <span>{quake.potential}</span>
            </div>
          )}

          {quake.felt && (
            <div className="mt-2.5">
              <div className={LABEL}>Dirasakan (skala MMI)</div>
              <p className="mt-0.5 text-[12px] leading-snug text-slate-700">{quake.felt}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-slate-400">
                Makin besar angkanya makin kuat guncangannya: II–III terasa di dalam rumah, IV–V bikin barang
                bergoyang, VI ke atas bisa merusak.
              </p>
            </div>
          )}

          <div className="mt-3 border-t border-slate-100 pt-2 text-[10px] leading-relaxed text-slate-400">
            <div className="flex flex-wrap items-center gap-x-2">
              <a
                href={fromBmkg ? QUAKE_BMKG.url : QUAKE_USGS.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-0.5 font-medium text-blue-600 hover:underline"
              >
                {fromBmkg ? "Data resmi BMKG" : "Katalog USGS"} <ArrowUpRight className="h-2.5 w-2.5" />
              </a>
              {quake.shakemapUrl && (
                <a
                  href={quake.shakemapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-0.5 text-blue-600 hover:underline"
                >
                  Peta guncangan <ArrowUpRight className="h-2.5 w-2.5" />
                </a>
              )}
            </div>
          </div>
        </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open onClose={close} ariaLabel="Detail gempa">
        {content}
      </Drawer>
    );
  }

  return createPortal(
    <div role="dialog" aria-label="Detail gempa" className="relative w-[300px] max-w-[calc(100vw-1.5rem)]">
      {content}
      <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-slate-200 bg-white" />
    </div>,
    container
  );
}
