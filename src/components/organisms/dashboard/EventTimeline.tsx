"use client";

import { useEffect, useRef } from "react";
import { Pause, Play, RotateCcw, X } from "lucide-react";
import {
  EVENT_GRADIENT,
  EVENT_RANGES,
  EVENT_RANGE_LABEL,
  eventTimeLabel,
  eventWindow,
  useMap,
  useMapSettings,
  type ReplaySpeed,
} from "@/contexts/map";
import { cn } from "@/lib/utils";
import { MOBILE_QUERY, useMediaQuery } from "@/lib/use-media-query";

const SPEEDS: ReplaySpeed[] = [1, 2, 5];

export function EventTimeline({ className }: { className?: string }) {
  const { eventBuckets: buckets } = useMap();
  const time = useMapSettings((s) => s.eventTime);
  const setTime = useMapSettings((s) => s.setEventTime);
  const fireOn = useMapSettings((s) => s.fireHotspots.enabled);
  const volcanoOn = useMapSettings((s) => s.volcano.enabled);
  const quakeOn = useMapSettings((s) => s.quake.enabled);
  const collapsed = useMapSettings((s) => s.timelineCollapsed);
  const setCollapsed = useMapSettings((s) => s.setTimelineCollapsed);
  const activeMobileDrawer = useMapSettings((s) => s.activeMobileDrawer);
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const barsRef = useRef<HTMLDivElement>(null);
  const scrubbingRef = useRef(false);

  // One card at a time on mobile: this one sits where every drawer opens.
  useEffect(() => {
    if (isMobile && !collapsed && activeMobileDrawer && activeMobileDrawer !== "timeline") setCollapsed(true);
  }, [isMobile, collapsed, activeMobileDrawer, setCollapsed]);

  if (!fireOn && !volcanoOn && !quakeOn) return null;
  // The History button in MapControls is the only way to show or hide this.
  if (collapsed) return null;

  const bounds = eventWindow({ ...time, cursor: null });
  const live = time.cursor === null;
  const span = bounds.end - bounds.start;
  const cursorFraction = time.cursor === null ? 1 : (time.cursor - bounds.start) / span;
  const withTime = time.range === "1h" || time.range === "24h" || time.cursor !== null;

  const peaks = {
    fire: Math.max(1, ...buckets.map((b) => b.fire)),
    quake: Math.max(1, ...buckets.map((b) => b.quake)),
    volcano: Math.max(1, ...buckets.map((b) => b.volcano)),
  };

  const scrubTo = (clientX: number) => {
    const rect = barsRef.current?.getBoundingClientRect();
    if (!rect) return;
    const fraction = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    setTime({ cursor: bounds.start + fraction * span, playing: false });
  };

  const play = () => {
    if (time.playing) {
      setTime({ playing: false });
      return;
    }
    const atEnd = time.cursor === null || time.cursor >= bounds.end;
    setTime({ playing: true, cursor: atEnd ? bounds.start : time.cursor });
  };

  const heading = time.cursor === null ? "Sekarang" : eventTimeLabel(time.cursor, withTime);

  return (
    <div
      className={cn(
        "pointer-events-auto relative rounded-2xl border border-slate-200/80 bg-white/92 px-3 pb-2.5 pt-2 shadow-lg shadow-slate-900/10 backdrop-blur",
        className
      )}
    >
      <div className="flex items-start gap-1.5 pb-1.5">
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-bold leading-tight">Riwayat kejadian</span>
          <span className="block text-[10px] text-slate-400">Putar ulang atau geser ke satu saat</span>
        </span>
        <button
          type="button"
          aria-label="Tutup"
          onClick={() => setCollapsed(true)}
          className="-mr-0.5 -mt-0.5 shrink-0 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={time.playing ? "Jeda" : "Putar ulang"}
          onClick={play}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
        >
          {time.playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="ml-0.5 h-3.5 w-3.5" />}
        </button>

        <div role="radiogroup" aria-label="Rentang waktu" className="flex min-w-0 items-center gap-0.5 overflow-x-auto">
          {EVENT_RANGES.map((range) => (
            <button
              key={range}
              type="button"
              role="radio"
              aria-checked={time.range === range}
              onClick={() => setTime({ range, cursor: null, playing: false })}
              className={cn(
                "shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold transition-colors sm:px-2.5",
                time.range === range ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              {EVENT_RANGE_LABEL[range]}
            </button>
          ))}

        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1">
          {!live && (
            <button
              type="button"
              aria-label="Kembali ke sekarang"
              title="Kembali ke sekarang"
              onClick={() => setTime({ cursor: null, playing: false })}
              className="flex h-6 w-6 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            aria-label={`Kecepatan putar ${time.speed}×`}
            onClick={() => setTime({ speed: SPEEDS[(SPEEDS.indexOf(time.speed) + 1) % SPEEDS.length] })}
            className="h-6 min-w-8 rounded-full border border-slate-200 px-1.5 text-[11px] font-bold tabular-nums text-slate-600 transition-colors hover:bg-slate-100"
          >
            {time.speed}×
          </button>
        </div>
      </div>

      <div
        ref={barsRef}
        role="slider"
        aria-label="Posisi waktu"
        aria-valuemin={bounds.start}
        aria-valuemax={bounds.end}
        aria-valuenow={time.cursor ?? bounds.end}
        aria-valuetext={heading}
        tabIndex={0}
        onPointerDown={(e) => {
          scrubbingRef.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          scrubTo(e.clientX);
        }}
        onPointerMove={(e) => scrubbingRef.current && scrubTo(e.clientX)}
        onPointerUp={() => (scrubbingRef.current = false)}
        onPointerCancel={() => (scrubbingRef.current = false)}
        onKeyDown={(e) => {
          if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
          e.preventDefault();
          const step = span / Math.max(1, buckets.length);
          const from = time.cursor ?? bounds.end;
          const next = Math.min(bounds.end, Math.max(bounds.start, from + (e.key === "ArrowRight" ? step : -step)));
          setTime({ cursor: next, playing: false });
        }}
        className="relative mt-2 h-8 cursor-pointer touch-none select-none outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
      >
        <div className="flex h-full items-end gap-[2px]">
          {buckets.map((bucket) => {
            const parts = [
              { key: "fire", on: fireOn, value: bucket.fire / peaks.fire, color: EVENT_GRADIENT.fire[0] },
              { key: "quake", on: quakeOn, value: bucket.quake / peaks.quake, color: EVENT_GRADIENT.quake[0] },
              { key: "volcano", on: volcanoOn, value: bucket.volcano / peaks.volcano, color: EVENT_GRADIENT.volcano[0] },
            ].filter((part) => part.on && part.value > 0);
            const total = parts.reduce((sum, part) => sum + part.value, 0);
            // Each kind is scaled to its own peak — fire outnumbers quakes a
            // hundredfold, and one scale would flatten every quake to nothing.
            const height = parts.length ? total / parts.length : 0;
            const future = time.cursor !== null && bucket.from > time.cursor;
            return (
              <div
                key={bucket.from}
                className={cn("flex flex-1 flex-col-reverse overflow-hidden rounded-[3px] transition-opacity", future && "opacity-25")}
                style={{ height: `${Math.max(8, height * 100)}%` }}
              >
                {total === 0 ? (
                  <div className="h-full w-full bg-slate-200" />
                ) : (
                  parts.map((part) => (
                    <div key={part.key} style={{ height: `${(part.value / total) * 100}%`, backgroundColor: part.color }} />
                  ))
                )}
              </div>
            );
          })}
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-1 -top-1 w-0.5 -translate-x-1/2 rounded-full bg-slate-900"
          style={{ left: `${cursorFraction * 100}%` }}
        >
          <span className="absolute -top-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full border-2 border-white bg-slate-900 shadow" />
        </div>
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-slate-400">
        <span className="tabular-nums">{eventTimeLabel(bounds.start, withTime)}</span>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
          {live && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
          {heading}
        </span>
        <span className="tabular-nums">{eventTimeLabel(bounds.end, withTime)}</span>
      </div>
    </div>
  );
}
