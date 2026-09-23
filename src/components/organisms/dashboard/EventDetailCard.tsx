"use client";

import { useState } from "react";
import { Info, X } from "lucide-react";
import { Drawer } from "@/components/atoms/Drawer";
import { SourceLink } from "@/components/atoms/SourceLink";
import { Toggle } from "@/components/atoms/Toggle";
import {
  EVENT_CARD_TITLE,
  EVENT_GRADIENT,
  EVENT_RANGE_LABEL,
  FIRE_CONFIDENCE_COLOR,
  FIRE_CONFIDENCE_DETAIL,
  FIRE_CONFIDENCE_LABEL_ID,
  PVMBG_LEVELS,
  PVMBG_LEVEL_COLOR,
  PVMBG_LEVEL_LABEL,
  QUAKE_BAND_DETAIL,
  QUAKE_BAND_LABEL,
  UNMONITORED_VOLCANO_COLOR,
  countLabel,
  relativeTimeLabel,
  useMap,
  useMapSettings,
  type EventKind,
  type VolcanoLevelKey,
} from "@/contexts/map";
import { FIRE_BANDS, HISTORY_DAYS } from "@/lib/fire-constants";
import { QUAKE_BANDS } from "@/lib/quake-constants";
import type { QuakeBand } from "@/lib/quake-types";
import { MAGMA_URL, MAGMA_VOLCANO_TYPES_URL } from "@/lib/volcano-constants";
import { cn } from "@/lib/utils";
import { MOBILE_QUERY, useMediaQuery } from "@/lib/use-media-query";

// One row per level, so a reader can take a layer apart without leaving the map.
function LevelRow({
  color,
  label,
  detail,
  count,
  shown,
  onToggle,
}: {
  color: string;
  label: string;
  detail?: string;
  count: number | null;
  shown: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={shown}
      aria-label={label}
      onClick={onToggle}
      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-slate-50"
    >
      <span
        className={cn("h-2.5 w-2.5 shrink-0 rounded-full border-2", !shown && "opacity-50")}
        style={{ backgroundColor: shown ? color : "transparent", borderColor: color }}
      />
      <span className={cn("min-w-0 flex-1", !shown && "opacity-50")}>
        <span className="block text-[12px] font-medium leading-tight">{label}</span>
        {detail && <span className="block truncate text-[10px] text-slate-400">{detail}</span>}
      </span>
      <span
        className={cn(
          "text-[12px] font-bold tabular-nums",
          !shown ? "text-slate-300" : count ? "text-slate-700" : "text-slate-300"
        )}
      >
        {count === null ? "–" : countLabel(count)}
      </span>
      <Toggle checked={shown} />
    </button>
  );
}

export function EventDetailCard({ kind, onClose }: { kind: EventKind; onClose: () => void }) {
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const {
    fireHotspotCounts,
    fireFetchedAt,
    volcanoCounts,
    quakeCounts,
    volcanoMeta,
    quakeMeta,
    fireHotspotsStatus,
    volcanoStatus,
    quakeStatus,
  } = useMap();
  const fireHotspots = useMapSettings((s) => s.fireHotspots);
  const setFireHotspots = useMapSettings((s) => s.setFireHotspots);
  const volcano = useMapSettings((s) => s.volcano);
  const setVolcano = useMapSettings((s) => s.setVolcano);
  const quake = useMapSettings((s) => s.quake);
  const setQuake = useMapSettings((s) => s.setQuake);
  const range = useMapSettings((s) => s.eventTime.range);
  const [infoOpen, setInfoOpen] = useState(false);

  const on = kind === "fire" ? fireHotspots.enabled : kind === "volcano" ? volcano.enabled : quake.enabled;
  const loading =
    kind === "fire" ? fireHotspotsStatus === "loading" : kind === "volcano" ? volcanoStatus === "loading" : quakeStatus === "loading";
  const updatedAt =
    kind === "fire"
      ? fireFetchedAt
      : kind === "volcano"
        ? (volcanoMeta?.magmaStale ? null : volcanoMeta?.magmaFetchedAt)
        : (quakeMeta?.stale ? null : quakeMeta?.fetchedAt);

  const toggleFireBand = (band: (typeof FIRE_BANDS)[number]) => {
    const hidden = fireHotspots.hiddenBands.includes(band)
      ? fireHotspots.hiddenBands.filter((b) => b !== band)
      : [...fireHotspots.hiddenBands, band];
    setFireHotspots({ hiddenBands: hidden });
  };

  const toggleQuakeBand = (band: QuakeBand) => {
    const hidden = quake.hiddenBands.includes(band)
      ? quake.hiddenBands.filter((b) => b !== band)
      : [...quake.hiddenBands, band];
    setQuake({ hiddenBands: hidden });
  };

  const toggleVolcanoLevel = (level: VolcanoLevelKey) => {
    const hidden = volcano.hiddenLevels.includes(level)
      ? volcano.hiddenLevels.filter((l) => l !== level)
      : [...volcano.hiddenLevels, level];
    setVolcano({ hiddenLevels: hidden });
  };

  const header = (
      <div className="flex items-start gap-1.5 px-1.5 pb-1.5">
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1">
            <span className="truncate text-[13px] font-bold leading-tight">{EVENT_CARD_TITLE[kind]}</span>
            <button
              type="button"
              aria-label={`Tentang ${EVENT_CARD_TITLE[kind].toLowerCase()}`}
              aria-pressed={infoOpen}
              onClick={() => setInfoOpen((v) => !v)}
              className={cn(
                "shrink-0 rounded-full p-0.5 transition-colors",
                infoOpen ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              {infoOpen ? <X className="h-3 w-3" /> : <Info className="h-3 w-3" />}
            </button>
          </span>
          <span className="block text-[10px] text-slate-400">
            {EVENT_RANGE_LABEL[range]}
            {loading ? " · memuat…" : updatedAt ? ` · diperbarui ${relativeTimeLabel(updatedAt)}` : ""}
          </span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={on ? `Sembunyikan ${EVENT_CARD_TITLE[kind]}` : `Tampilkan ${EVENT_CARD_TITLE[kind]}`}
          onClick={() => {
            if (kind === "fire") setFireHotspots({ enabled: !on });
            if (kind === "volcano") setVolcano({ enabled: !on });
            if (kind === "quake") setQuake({ enabled: !on });
          }}
          className="mt-0.5 shrink-0 rounded-full"
        >
          <Toggle checked={on} />
        </button>
        {isMobile && (
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

  const body = infoOpen ? (
        <div className="border-t border-slate-100 px-2 pb-1 pt-2 text-[11px] leading-relaxed text-slate-600">
          {kind === "fire" && (
            <>
              <p>
                Titik panas adalah lokasi yang terdeteksi satelit NASA sebagai indikasi panas — tidak selalu
                berarti kebakaran. Keyakinan menyatakan seberapa yakin satelitnya.
              </p>
              <p className="mt-2">
                Satelit MODIS (Terra &amp; Aqua) dan VIIRS (Suomi NPP, NOAA-20/21). Diperbarui tiap 10 menit,
                tersedia untuk {HISTORY_DAYS} hari terakhir di Indonesia.
              </p>
            </>
          )}
          {kind === "volcano" && (
            <>
              <p>
                Setiap tanda adalah gunung api aktif menurut Badan Geologi. Yang berwarna dipantau PVMBG —
                warnanya level aktivitas saat ini, dari Normal sampai Awas. Yang abu-abu tidak dipantau, jadi
                tidak punya status; bukan berarti pasti aman.
              </p>
              <p className="mt-2">
                Tanda merah berasap berarti gunung itu erupsi di rentang waktu yang sedang dilihat. Klik untuk
                jarak aman dan rekomendasi resmi PVMBG.
              </p>
            </>
          )}
          {kind === "quake" && (
            <>
              <p>
                Setiap lingkaran adalah satu gempa; makin besar lingkarannya, makin besar magnitudonya.
                Gelombang yang menyebar keluar adalah perkiraan sejauh mana getaran terasa — dihitung dari
                magnitudo (sekitar 100 km pada M5, dua kali lipat tiap naik satu magnitudo), bukan hasil
                pengukuran BMKG. Ukurannya mengikuti jarak di peta, jadi ikut membesar saat diperbesar.
              </p>
              <p className="mt-2">
                Dari tiga daftar resmi BMKG, dibaca ulang tiap 2 menit. Hari-hari yang sudah lewat dari daftar
                itu diisi dari katalog USGS, dan tiap gempa menyebut sumbernya di popup.
              </p>
            </>
          )}

          <div className="mt-2 border-t border-slate-100 pt-1.5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Sumber</div>
            {kind === "fire" && (
              <>
                <SourceLink href="https://firms.modaps.eosdis.nasa.gov/map/" name="NASA FIRMS" />
                <SourceLink href="https://sipongi.gakkum.kehutanan.go.id/" name="SiPongi" />
              </>
            )}
            {kind === "volcano" && (
              <>
                <SourceLink href={volcanoMeta?.magmaUrl ?? MAGMA_URL} name="MAGMA Indonesia" />
                <SourceLink href={MAGMA_VOLCANO_TYPES_URL} name="Badan Geologi" />
              </>
            )}
            {kind === "quake" && (
              <>
                <SourceLink href={quakeMeta?.bmkgUrl ?? "https://data.bmkg.go.id/gempabumi/"} name="BMKG" />
                {(quakeCounts?.fromUsgs ?? 0) > 0 && (
                  <SourceLink href="https://earthquake.usgs.gov/earthquakes/map/" name="USGS" />
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="border-t border-slate-100 pt-1">
          {kind === "fire" &&
            FIRE_BANDS.map((band) => (
              <LevelRow
                key={band}
                color={FIRE_CONFIDENCE_COLOR[band]}
                label={`Keyakinan ${FIRE_CONFIDENCE_LABEL_ID[band]}`}
                detail={FIRE_CONFIDENCE_DETAIL[band]}
                // Switched-off levels are not drawn, so their number comes
                // from the window's own tally rather than the map.
                count={
                  fireHotspots.hiddenBands.includes(band)
                    ? (fireHotspotCounts?.inWindow?.[band] ?? null)
                    : (fireHotspotCounts?.all[band] ?? null)
                }
                shown={!fireHotspots.hiddenBands.includes(band)}
                onToggle={() => toggleFireBand(band)}
              />
            ))}

          {kind === "quake" &&
            QUAKE_BANDS.map((band) => (
              <LevelRow
                key={band}
                color={EVENT_GRADIENT.quake[band === "strong" ? 1 : 0]}
                label={QUAKE_BAND_LABEL[band]}
                detail={QUAKE_BAND_DETAIL[band]}
                count={quakeCounts?.byBand[band] ?? null}
                shown={!quake.hiddenBands.includes(band)}
                onToggle={() => toggleQuakeBand(band)}
              />
            ))}

          {kind === "volcano" && (
            <>
              <LevelRow
                color={EVENT_GRADIENT.volcano[1]}
                label="Erupsi"
                detail={`Meletus dalam ${EVENT_RANGE_LABEL[range].toLowerCase()} ini`}
                count={volcanoCounts?.eruptedRecently ?? null}
                shown={!volcano.hiddenLevels.includes("erupting")}
                onToggle={() => toggleVolcanoLevel("erupting")}
              />
              {PVMBG_LEVELS.map((level) => (
                <LevelRow
                  key={level}
                  color={PVMBG_LEVEL_COLOR[level]}
                  label={PVMBG_LEVEL_LABEL[level]}
                  count={volcanoCounts?.byLevel[level] ?? null}
                  shown={!volcano.hiddenLevels.includes(level)}
                  onToggle={() => toggleVolcanoLevel(level)}
                />
              ))}
              <LevelRow
                color={UNMONITORED_VOLCANO_COLOR}
                label="Tidak dipantau"
                detail="Aktif menurut Badan Geologi, tanpa status PVMBG"
                count={volcanoCounts?.unmonitored ?? null}
                shown={!volcano.hiddenLevels.includes("unmonitored")}
                onToggle={() => toggleVolcanoLevel("unmonitored")}
              />
            </>
          )}
        </div>
      );

  if (isMobile) {
    return (
      <Drawer open onClose={onClose} ariaLabel={EVENT_CARD_TITLE[kind]} className="p-2">
        {header}
        {body}
      </Drawer>
    );
  }

  return (
    <div
      role="dialog"
      aria-label={EVENT_CARD_TITLE[kind]}
      className="mt-2 w-[300px] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-xl shadow-slate-900/10 backdrop-blur"
    >
      {header}
      {body}
    </div>
  );
}
