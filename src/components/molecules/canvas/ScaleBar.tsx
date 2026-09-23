"use client";

import { useMap, useMapSettings, resolutionToScale } from "@/contexts/map";
import { useLayout, type ScaleBarElement } from "@/contexts/layout";

const LEAD_DIGITS = [1, 2, 5];

function niceDistance(target: number): number {
  const magnitude = Math.pow(10, Math.floor(Math.log10(target)));
  let best = magnitude;
  for (const digit of LEAD_DIGITS) {
    const candidate = digit * magnitude;
    if (candidate <= target) best = candidate;
  }
  return best;
}

function formatDistance(meters: number, units: "metric" | "imperial") {
  if (units === "imperial") {
    const feet = meters * 3.28084;
    if (feet >= 5280) return `${(feet / 5280).toFixed(feet >= 52800 ? 0 : 1)} mi`;
    return `${feet.toFixed(0)} ft`;
  }
  if (meters >= 1000) return `${(meters / 1000).toFixed(meters >= 10000 ? 0 : 1)} km`;
  return `${meters.toFixed(0)} m`;
}

export function ScaleBar({ element }: { element: ScaleBarElement }) {
  const { resolution } = useMap();
  const view = useMapSettings((s) => s.view);
  const dpi = useLayout((s) => s.page.dpi);

  if (!resolution) {
    return <div className="text-[10px] text-muted-foreground">No map</div>;
  }

  const niceMeters = niceDistance(resolution * 120);
  const barWidth = niceMeters / resolution;
  const scale = Math.round(resolutionToScale(resolution, dpi, view.center));

  return (
    <div className="flex h-full w-full select-none flex-col justify-end gap-1 text-black">
      {element.style === "bar" ? (
        <div className="flex items-end">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{ width: barWidth / 4 }}
              className={`h-2 border border-black ${i % 2 === 0 ? "bg-black" : "bg-white"}`}
            />
          ))}
        </div>
      ) : (
        <div
          style={{ width: barWidth }}
          className="h-2 border-b-2 border-l-2 border-r-2 border-black"
        />
      )}

      <div
        className="flex justify-between text-[10px] leading-none"
        style={{ width: barWidth }}
      >
        <span>0</span>
        <span>{formatDistance(niceMeters, element.units)}</span>
      </div>
      <div className="text-[10px] leading-none">1 : {scale.toLocaleString()}</div>
    </div>
  );
}
