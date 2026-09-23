"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Overlay from "ol/Overlay";
import type MapBrowserEvent from "ol/MapBrowserEvent";
import { ArrowUpRight, TriangleAlert, X } from "lucide-react";
import { Drawer } from "@/components/atoms/Drawer";
import {
  PVMBG_LEVEL_COLOR,
  PVMBG_LEVEL_LABEL,
  PVMBG_LEVEL_NAME,
  UNMONITORED_VOLCANO_COLOR,
  popupAutoPanMargin,
  relativeTimeLabel,
  useMap,
  useMapSettings,
} from "@/contexts/map";
import type { VolcanoFeatureProperties } from "@/contexts/map";
import { ERUPTION_HISTORY_DAYS, ERUPTION_PULSE_HOURS, MAGMA_URL, MAGMA_VOLCANO_TYPES_URL } from "@/lib/volcano-constants";
import type { VolcanoType } from "@/lib/volcano-types";
import { MOBILE_QUERY, useMediaQuery } from "@/lib/use-media-query";

const LABEL = "text-[10px] font-semibold uppercase tracking-wider text-slate-400";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(time: number) {
  const d = new Date(time);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function dayAndTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

const TYPE_MEANING: Record<VolcanoType, string> = {
  A: "pernah meletus sejak tahun 1600.",
  B: "letusan terakhirnya tercatat sebelum tahun 1600.",
  C: "tidak ada catatan letusan, tapi masih ada tanda aktivitas seperti uap panas atau belerang.",
};

export function VolcanoPopup() {
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const { map, volcanoAt, volcanoMeta } = useMap();
  const enabled = useMapSettings((s) => s.volcano.enabled);
  const activeMobileDrawer = useMapSettings((s) => s.activeMobileDrawer);
  const setActiveMobileDrawer = useMapSettings((s) => s.setActiveMobileDrawer);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [volcano, setVolcano] = useState<VolcanoFeatureProperties | null>(null);
  const [recommendationOpen, setRecommendationOpen] = useState(false);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const overlayRef = useRef<Overlay | null>(null);
  const isMobileRef = useRef(isMobile);
  isMobileRef.current = isMobile;

  useEffect(() => {
    if (isMobile && volcano && activeMobileDrawer !== "volcano") setVolcano(null);
  }, [isMobile, activeMobileDrawer, volcano]);

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
      const hit = volcanoAt(evt.pixel);
      if (!hit) {
        overlay.setPosition(undefined);
        setVolcano(null);
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
        setActiveMobileDrawer("volcano");
      }
      setVolcano(hit.properties);
      setRecommendationOpen(false);
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
  }, [map, container, volcanoAt, setActiveMobileDrawer]);

  useEffect(() => {
    overlayRef.current?.setPosition(undefined);
    setVolcano(null);
  }, [enabled]);

  if (!container || !volcano) return null;

  const monitored = volcano.level !== null;
  const eruption = volcano.latestEruption;
  const eruptedRecently =
    eruption !== null && Date.now() - Date.parse(eruption.eruptedAt) < ERUPTION_PULSE_HOURS * 3600 * 1000;
  const magmaLink = eruption
    ? `${MAGMA_URL}/v1/gunung-api/informasi-letusan/${volcano.code}`
    : `${MAGMA_URL}/v1/gunung-api/tingkat-aktivitas`;
  const history = volcano.eruptionHistory;
  const today = startOfDay(Date.now());
  const historySince = volcanoMeta?.eruptionHistorySince ? startOfDay(Date.parse(volcanoMeta.eruptionHistorySince)) : null;
  const historyDays = Array.from({ length: ERUPTION_HISTORY_DAYS }, (_, i) => {
    const day = today - (ERUPTION_HISTORY_DAYS - 1 - i) * DAY_MS;
    return { day, count: 0, known: volcanoMeta?.eruptionHistoryComplete || (historySince !== null && day >= historySince) };
  });
  for (const time of history?.times ?? []) {
    const index = ERUPTION_HISTORY_DAYS - 1 - Math.round((today - startOfDay(Date.parse(time))) / DAY_MS);
    if (index >= 0 && index < ERUPTION_HISTORY_DAYS) historyDays[index].count++;
  }
  const busiestDay = Math.max(1, ...historyDays.map((d) => d.count));
  const hovered = hoveredDay === null ? null : historyDays[hoveredDay];
  const levelDetail =
    volcano.level === null
      ? null
      : [PVMBG_LEVEL_LABEL[volcano.level].split(" · ")[0], volcano.province].filter(Boolean).join(" · ");

  const close = () => {
    overlayRef.current?.setPosition(undefined);
    setVolcano(null);
  };

  const content = (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-xl shadow-slate-900/15">
        <div className="flex items-start justify-between gap-2 px-3.5 pt-3.5">
          <div className="min-w-0">
            <div className="truncate text-[14px] font-semibold leading-tight">{volcano.name}</div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {volcano.level === null ? (
                <span
                  className="rounded px-1.5 py-0.5 text-[11px] font-bold tracking-wide text-white"
                  style={{ backgroundColor: UNMONITORED_VOLCANO_COLOR }}
                >
                  TIDAK DIPANTAU
                </span>
              ) : (
                <span
                  className={`rounded px-1.5 py-0.5 text-[11px] font-bold tracking-wide ${volcano.level === 2 ? "text-slate-900" : "text-white"}`}
                  style={{ backgroundColor: PVMBG_LEVEL_COLOR[volcano.level] }}
                >
                  {PVMBG_LEVEL_NAME[volcano.level]}
                </span>
              )}
              {eruptedRecently && (
                <span className="inline-flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-[11px] font-bold tracking-wide text-white">
                  <span className="flex h-1.5 w-1.5">
                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                  </span>
                  ERUPSI
                </span>
              )}
              {levelDetail && <span className="text-[10px] text-slate-400">{levelDetail}</span>}
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
          {!monitored && (
            <p className="text-[12px] leading-snug text-slate-600">
              Gunung ini tidak ada dalam daftar pantauan PVMBG, jadi tidak ada status atau laporan letusan resmi.
              Itu <strong className="font-semibold text-slate-900">bukan</strong> berarti pasti aman.
            </p>
          )}
          {volcano.volcanoType && (
            <p className="mt-1.5 text-[12px] leading-snug text-slate-600">
              <strong className="font-semibold text-slate-900">Tipe {volcano.volcanoType}</strong> —{" "}
              {TYPE_MEANING[volcano.volcanoType]}
            </p>
          )}
          {volcano.recommendation?.maxDistanceKm && (
            <div className="flex gap-2 rounded-lg bg-red-50 p-2.5 text-[12px] leading-snug text-red-900">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <span>
                Bahaya bisa mencapai <strong className="font-semibold">{volcano.recommendation.maxDistanceKm} km</strong> dari
                puncak. Baca arahnya di rekomendasi PVMBG di bawah.
              </span>
            </div>
          )}

          {eruption && (
            <div className="mt-2.5">
              <div className={LABEL}>Erupsi terakhir</div>
              <p className="mt-0.5 text-[12px] leading-snug">
                <strong className="font-semibold">{relativeTimeLabel(eruption.eruptedAt)}</strong>
                {eruption.ongoing && " · masih berlangsung"}
                {" — "}
                {eruption.ashColumnM
                  ? `kolom abu ± ${eruption.ashColumnM.toLocaleString("id-ID")} m di atas puncak${eruption.ashDirection ? `, ke arah ${eruption.ashDirection}` : ""}.`
                  : "tinggi kolom abu tidak teramati."}
              </p>
            </div>
          )}

          {history && (
            <div className="mt-2.5">
              <div className={LABEL}>Erupsi {ERUPTION_HISTORY_DAYS} hari terakhir</div>
              {history.times.length === 0 && volcanoMeta?.eruptionHistoryComplete ? (
                <p className="mt-0.5 text-[12px] leading-snug text-slate-600">Tidak ada erupsi tercatat.</p>
              ) : historySince === null && !volcanoMeta?.eruptionHistoryComplete ? (
                <p className="mt-0.5 text-[12px] leading-snug text-slate-600">Riwayat sedang dikumpulkan dari MAGMA.</p>
              ) : (
                <>
                  <p className="mt-0.5 text-[12px] leading-snug">
                    {hovered ? (
                      <>
                        <strong className="font-semibold">
                          {new Date(hovered.day).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                        </strong>
                        {hovered.known ? ` — ${hovered.count} kali erupsi` : " — belum terkumpul"}
                      </>
                    ) : (
                      <>
                        <strong className="font-semibold">{history.times.length} kali</strong> erupsi
                      </>
                    )}
                  </p>
                  <div
                    className="mt-1.5 flex h-8 items-end gap-[2px]"
                    role="img"
                    aria-label={`Jumlah erupsi per hari, ${ERUPTION_HISTORY_DAYS} hari terakhir`}
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    {historyDays.map((d, i) => (
                      <div key={d.day} className="flex h-full flex-1 items-end" onMouseEnter={() => setHoveredDay(i)}>
                        <div
                          className={
                            !d.known
                              ? "h-px w-full"
                              : d.count === 0
                                ? "h-px w-full bg-slate-200"
                                : `w-full rounded-t-sm ${hoveredDay === i ? "bg-red-700" : "bg-red-500"}`
                          }
                          style={d.known && d.count > 0 ? { height: `${Math.max(3, (d.count / busiestDay) * 32)}px` } : undefined}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-0.5 flex justify-between text-[10px] text-slate-400">
                    <span>{ERUPTION_HISTORY_DAYS} hari lalu</span>
                    <span>hari ini</span>
                  </div>
                  {!volcanoMeta?.eruptionHistoryComplete && volcanoMeta?.eruptionHistorySince && (
                    <p className="mt-1 text-[10px] leading-snug text-amber-700">
                      Riwayat masih dikumpulkan — baru tercatat sejak{" "}
                      {new Date(volcanoMeta.eruptionHistorySince).toLocaleDateString("id-ID", { day: "numeric", month: "long" })}.
                    </p>
                  )}
                  {history.recent.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5 text-[11px] leading-snug text-slate-600">
                      {history.recent.map((r) => (
                        <li key={r.eruptedAt}>
                          <span className="font-medium text-slate-800">{dayAndTime(r.eruptedAt)}</span>
                          {r.ashColumnM
                            ? ` · abu ± ${r.ashColumnM.toLocaleString("id-ID")} m${r.ashDirection ? ` ke ${r.ashDirection}` : ""}`
                            : " · abu tidak teramati"}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          )}

          {volcano.recommendation && (
            <div className="mt-2.5">
              <div className={LABEL}>Rekomendasi PVMBG</div>
              <p className={`mt-0.5 text-[12px] leading-snug text-slate-700 ${recommendationOpen ? "" : "line-clamp-4"}`}>
                {volcano.recommendation.text}
              </p>
              <button
                type="button"
                onClick={() => setRecommendationOpen((open) => !open)}
                className="mt-0.5 text-[11px] font-medium text-blue-600 hover:underline"
              >
                {recommendationOpen ? "Ringkas" : "Selengkapnya"}
              </button>
            </div>
          )}


          {volcano.krb && (
            <div className="mt-2.5">
              <div className={LABEL}>Kalau makin dekat</div>
              <div className="mt-1 space-y-1">
                {volcano.krb.zones.map((zone) => (
                  <div key={zone.level} className="flex items-start gap-1.5 text-[12px] leading-snug">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: zone.color }} />
                    <span title={zone.description}>
                      <strong className="font-semibold">Dalam {zone.radiusKm} km</strong>{" "}
                      <span className="text-slate-600">{zone.plain}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3 border-t border-slate-100 pt-2 text-[10px] leading-relaxed text-slate-400">
            {monitored && volcanoMeta?.magmaFetchedAt && <div>Data MAGMA {relativeTimeLabel(volcanoMeta.magmaFetchedAt)}</div>}
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2">
              {monitored ? (
                <a
                  href={magmaLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-0.5 font-medium text-blue-600 hover:underline"
                >
                  Laporan resmi MAGMA <ArrowUpRight className="h-2.5 w-2.5" />
                </a>
              ) : (
                <a
                  href={MAGMA_VOLCANO_TYPES_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-0.5 font-medium text-blue-600 hover:underline"
                >
                  Daftar gunung api aktif <ArrowUpRight className="h-2.5 w-2.5" />
                </a>
              )}
              {volcano.krb && (
                <a
                  href={volcano.krb.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-0.5 text-blue-600 hover:underline"
                >
                  Badan Geologi <ArrowUpRight className="h-2.5 w-2.5" />
                </a>
              )}
            </div>
          </div>
        </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open onClose={close} ariaLabel="Detail gunung api">
        {content}
      </Drawer>
    );
  }

  return createPortal(
    <div role="dialog" aria-label="Detail gunung api" className="relative w-[300px] max-w-[calc(100vw-1.5rem)]">
      {content}
      <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-slate-200 bg-white" />
    </div>,
    container
  );
}
