"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Overlay from "ol/Overlay";
import { toLonLat } from "ol/proj";
import type MapBrowserEvent from "ol/MapBrowserEvent";
import { X } from "lucide-react";
import { Drawer } from "@/components/atoms/Drawer";
import {
  FIRE_CONFIDENCE_COLOR,
  FIRE_CONFIDENCE_LABEL_ID,
  fetchAdminAreaAt,
  fireConfidenceStyle,
  popupAutoPanMargin,
  useMap,
  useMapSettings,
} from "@/contexts/map";
import type { FireHotspotProperties } from "@/contexts/map";
import type { AdminAreaResult } from "@/lib/admin-types";
import { MOBILE_QUERY, useMediaQuery } from "@/lib/use-media-query";

// FIRMS names VIIRS satellites by code.
const SATELLITE_NAME: Record<string, string> = {
  N: "Suomi NPP",
  "1": "NOAA-20",
  "2": "NOAA-21",
};

function ago(detectedAt: string) {
  const hours = Math.floor((Date.now() - Date.parse(detectedAt)) / 3_600_000);
  if (hours < 1) return "kurang dari 1 jam lalu";
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

export function FireHotspotPopup() {
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const { map, fireHotspotAt } = useMap();
  const enabled = useMapSettings((s) => s.fireHotspots.enabled);
  const hiddenBands = useMapSettings((s) => s.fireHotspots.hiddenBands);
  const eventRange = useMapSettings((s) => s.eventTime.range);
  const activeMobileDrawer = useMapSettings((s) => s.activeMobileDrawer);
  const setActiveMobileDrawer = useMapSettings((s) => s.setActiveMobileDrawer);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [hotspot, setHotspot] = useState<FireHotspotProperties | null>(null);
  // undefined while the lookup runs; null when the point is in no Indonesian village.
  const [place, setPlace] = useState<AdminAreaResult | null | undefined>(undefined);
  const overlayRef = useRef<Overlay | null>(null);
  const requestRef = useRef(0);
  const isMobileRef = useRef(isMobile);
  isMobileRef.current = isMobile;

  useEffect(() => {
    if (isMobile && hotspot && activeMobileDrawer !== "fire") setHotspot(null);
  }, [isMobile, activeMobileDrawer, hotspot]);

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
      const hit = fireHotspotAt(evt.pixel);
      const request = ++requestRef.current;
      if (!hit) {
        overlay.setPosition(undefined);
        setHotspot(null);
        return;
      }
      overlay.setPosition(hit.coordinate);
      // On mobile this renders as a drawer, not anchored to the map, so
      // there is nothing to pan into view. Otherwise: the container is still
      // empty at this point — React hasn't rendered the popup's content into
      // it yet — so this pan is a rough guess at best, corrected by the
      // resize observer below once there's real content.
      if (!isMobileRef.current) {
        overlay.panIntoView({ animation: { duration: 250 }, margin: popupAutoPanMargin(window.innerWidth, 300) });
      } else {
        setActiveMobileDrawer("fire");
      }
      setHotspot(hit.properties);
      setPlace(undefined);
      const [lon, lat] = toLonLat(hit.coordinate);
      fetchAdminAreaAt(lon, lat)
        .then((area) => request === requestRef.current && setPlace(area))
        .catch(() => request === requestRef.current && setPlace(null));
    };
    map.on("singleclick", onClick);

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
  }, [map, container, fireHotspotAt, setActiveMobileDrawer]);

  // A new window or filter redraws the map; the pinned point may be gone.
  useEffect(() => {
    overlayRef.current?.setPosition(undefined);
    setHotspot(null);
  }, [enabled, hiddenBands, eventRange]);

  if (!container || !hotspot) return null;

  const { band } = fireConfidenceStyle(hotspot.confidence);
  const percent = Number.isNaN(Number(hotspot.confidence)) ? "" : ` (${hotspot.confidence}%)`;
  const detected = new Date(hotspot.detectedAt).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const [province, regency, district] = place?.path.split(" · ") ?? [];

  const close = () => {
    overlayRef.current?.setPosition(undefined);
    setHotspot(null);
  };

  const content = (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-slate-900 shadow-xl shadow-slate-900/15">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-[13px] font-semibold">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: FIRE_CONFIDENCE_COLOR[band] }} />
            Titik api · keyakinan {FIRE_CONFIDENCE_LABEL_ID[band]}
            {percent}
          </span>
          <button
            type="button"
            aria-label="Tutup"
            onClick={close}
            className="rounded-full p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <dl className="mt-2.5 space-y-2 text-[12px]">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Terdeteksi</dt>
            <dd>
              {detected} · {ago(hotspot.detectedAt)}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Lokasi</dt>
            <dd>
              {place === undefined && <span className="text-slate-400">Mencari lokasi…</span>}
              {place === null && "Di luar wilayah Indonesia"}
              {place && (
                <>
                  <span className="block">
                    {place.name}, Kec. {district}
                  </span>
                  <span className="block">
                    {regency}, {province}
                  </span>
                </>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Sumber</dt>
            <dd>
              {hotspot.sensor} · satelit {SATELLITE_NAME[hotspot.satellite] ?? hotspot.satellite} · NASA FIRMS
            </dd>
          </div>
        </dl>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open onClose={close} ariaLabel="Detail titik api">
        {content}
      </Drawer>
    );
  }

  return createPortal(
    <div role="dialog" aria-label="Detail titik api" className="relative w-[272px] max-w-[calc(100vw-1.5rem)]">
      {content}
      <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-slate-200 bg-white" />
    </div>,
    container
  );
}
