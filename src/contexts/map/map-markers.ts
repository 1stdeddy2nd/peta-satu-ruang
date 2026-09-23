import type { FeatureLike } from "ol/Feature";
import type Feature from "ol/Feature";
import type Geometry from "ol/geom/Geometry";
import { Fill, Icon, Stroke, Style } from "ol/style";
import CircleStyle from "ol/style/Circle";
import type { PvmbgLevel } from "@/lib/volcano-types";
import { QUAKE_STRONG_MAGNITUDE } from "@/lib/quake-constants";
import { PVMBG_LEVEL_COLOR, UNMONITORED_VOLCANO_COLOR } from "./map-constants";

export type EventGlyphName = "fire" | "quake" | "mountain" | "eruption";

type Glyph = EventGlyphName;

// Lucide's Flame and Activity paths, so the map speaks the same icon language
// as the rest of the app; the two volcano glyphs are drawn for MapCanva.
export const EVENT_GLYPHS: Record<EventGlyphName, { paths: string[]; filled: boolean[] }> = {
  fire: {
    paths: ["M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"],
    filled: [true],
  },
  quake: {
    paths: [
      "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2",
    ],
    filled: [false],
  },
  mountain: { paths: ["M2 20.5 9.5 7l2.5 3.5L14.5 7 22 20.5Z"], filled: [true] },
  eruption: {
    paths: [
      "M1 22.5 7.4 14h9.2L23 22.5Z",
      "M12 11.5c-2.2 0-3.6-1.5-3.6-3.3 0-1.6 1-2.6 1.9-3.5.8-.8 1.5-1.6 1.5-2.7 1.8 1 2.8 2.5 3.2 4 .6-.5.9-1.2 1-2 1.1 1.2 1.7 2.7 1.7 4.2 0 1.8-1.5 3.3-3.7 3.3Z",
    ],
    filled: [true, true],
  },
};

// Shared with the HUD and the timeline, so a colour means the same thing on
// the map and around it.
export const EVENT_GRADIENT = {
  fire: ["#fb923c", "#dc2626"],
  // Earth yellow, and nothing else on this map is yellow.
  quake: ["#fbbf24", "#a16207"],
  volcano: ["#f87171", "#b91c1c"],
} as const satisfies Record<string, readonly [string, string]>;

const FIRE_COLORS: [string, string] = [...EVENT_GRADIENT.fire];
const QUAKE_COLORS: [string, string] = [...EVENT_GRADIENT.quake];
const ERUPTION_COLORS: [string, string] = [...EVENT_GRADIENT.volcano];

const pixelRatio = () => (typeof window === "undefined" ? 1 : Math.min(2, window.devicePixelRatio || 1));

const imageCache = new Map<string, Icon>();

// Images are cached by everything that changes their pixels — never by
// zIndex or time — so a replay tick redraws no canvas and the cache stays small.
function badgeStyle({
  glyph,
  colors,
  diameter,
  alpha,
  label,
  caption,
  stacked,
  halo,
  haloWidth = 3,
  zIndex,
}: {
  glyph: Glyph | null;
  colors: [string, string];
  diameter: number;
  alpha: number;
  label?: string;
  // A word under the badge, for a state that has to be read, not decoded.
  caption?: string;
  stacked?: boolean;
  halo?: string;
  haloWidth?: number;
  zIndex: number;
}): Style {
  const key = [glyph, colors[1], diameter, alpha.toFixed(2), label, caption, stacked, halo, haloWidth].join("|");
  const cached = imageCache.get(key);
  if (cached) return new Style({ image: cached, zIndex });

  const ratio = pixelRatio();
  const pad = 4 + (halo ? Math.ceil(haloWidth) : 0);
  const labelWidth = label ? Math.max(18, 7 * label.length + 10) : 0;
  const labelOverhang = label ? Math.max(0, labelWidth - (diameter / 2) * 0.45 - 8) + 2 : 0;
  const captionWidth = caption ? 7.4 * caption.length + 12 : 0;
  const cssWidth = Math.max(diameter + pad * 2 + labelOverhang + (stacked ? 4 : 0), captionWidth + pad * 2);
  const cssHeight = diameter + pad * 2 + (label ? 6 : 0) + (caption ? 18 : 0);
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(cssWidth * ratio);
  canvas.height = Math.ceil(cssHeight * ratio);
  const ctx = canvas.getContext("2d")!;
  ctx.scale(ratio, ratio);
  ctx.globalAlpha = alpha;

  const cx = caption ? cssWidth / 2 : pad + diameter / 2 + (stacked ? 4 : 0);
  const cy = pad + diameter / 2 + (label ? 6 : 0);
  const r = diameter / 2;

  if (halo) {
    ctx.beginPath();
    ctx.arc(cx, cy, r + haloWidth, 0, Math.PI * 2);
    ctx.fillStyle = halo;
    ctx.fill();
  }

  if (stacked) {
    ctx.beginPath();
    ctx.arc(cx - 4, cy + 1, r - 1, 0, Math.PI * 2);
    ctx.fillStyle = colors[0];
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();
  }

  ctx.save();
  ctx.shadowColor = "rgba(15, 23, 42, 0.28)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 1;
  const gradient = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(1, colors[1]);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = diameter >= 12 ? 1.75 : 1.25;
  ctx.stroke();

  if (glyph && diameter >= 12) {
    const size = diameter * 0.56;
    ctx.save();
    ctx.translate(cx - size / 2, cy - size / 2);
    ctx.scale(size / 24, size / 24);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    EVENT_GLYPHS[glyph].paths.forEach((d, i) => {
      const path = new Path2D(d);
      if (EVENT_GLYPHS[glyph].filled[i]) {
        ctx.fillStyle = "#ffffff";
        ctx.fill(path);
      } else {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.75;
        ctx.stroke(path);
      }
    });
    ctx.restore();
  }

  if (label) {
    const x = cx + r * 0.55;
    const y = cy - r * 0.62;
    const w = labelWidth;
    const h = 16;
    ctx.save();
    ctx.shadowColor = "rgba(15, 23, 42, 0.25)";
    ctx.shadowBlur = 3;
    ctx.beginPath();
    ctx.roundRect(x - 4, y - h / 2, w, h, h / 2);
    ctx.fillStyle = "#0f172a";
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 10.5px ${getComputedStyle(document.body).fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x - 4 + w / 2, y + 0.5);
  }

  if (caption) {
    const top = cy + diameter / 2 + 3;
    ctx.save();
    ctx.shadowColor = "rgba(15, 23, 42, 0.25)";
    ctx.shadowBlur = 3;
    ctx.beginPath();
    ctx.roundRect(cx - captionWidth / 2, top, captionWidth, 14, 7);
    ctx.fillStyle = colors[1];
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 9.5px ${getComputedStyle(document.body).fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(caption, cx, top + 7.5);
  }

  const icon = new Icon({
    img: canvas,
    width: cssWidth,
    height: cssHeight,
    anchor: [cx / cssWidth, cy / cssHeight],
  });
  imageCache.set(key, icon);
  return new Style({ image: icon, zIndex });
}

export function countLabel(n: number) {
  if (n < 1000) return String(n);
  return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(".", ",")}rb`;
}

export function quakeDiameter(magnitude: number) {
  return Math.round(Math.min(34, Math.max(14, 8 + magnitude * 4)));
}

// A handful of events stay themselves — only a real crowd becomes a circle.
export const MIN_CLUSTER_SIZE = 10;

// The hotspot keeps its badge; what moves is the heat around it — one slow
// breath, every hotspot on the same beat. Out of step it reads as panic, and
// there are hundreds of them on screen. They all share the frame, so the
// whole cycle is 24 cached images however many hotspots are drawn.
export const FIRE_HEAT_FRAMES = 24;
export const FIRE_HEAT_FRAME_MS = 100;

// One hotspot is drawn in its own confidence colour, the way SiPongi+ draws
// them; a cluster keeps the fire gradient, since it mixes levels.
const FIRE_BAND_COLORS: Record<string, [string, string]> = {
  high: [...EVENT_GRADIENT.fire],
  medium: ["#facc15", "#ca8a04"],
  low: ["#4ade80", "#15803d"],
};

export function eventMarkerStyle(kind: "fire" | "quake", feature: FeatureLike, frame: number): Style {
  if (kind === "fire") {
    const heat = 0.5 + 0.5 * Math.sin((frame / FIRE_HEAT_FRAMES) * Math.PI * 2);
    const band = (feature.get("band") as string) ?? "high";
    return badgeStyle({
      glyph: "fire",
      colors: FIRE_BAND_COLORS[band] ?? FIRE_COLORS,
      diameter: 18,
      alpha: 1,
      halo: `rgba(${band === "low" ? "34, 197, 94" : band === "medium" ? "234, 179, 8" : "249, 115, 22"}, ${(0.16 + 0.2 * heat).toFixed(3)})`,
      // Kept fractional: rounding to whole pixels makes the glow step.
      haloWidth: Number((3 + heat * 4).toFixed(2)),
      zIndex: 1000,
    });
  }
  const magnitude = feature.get("magnitude") as number;
  return badgeStyle({
    glyph: "quake",
    colors: QUAKE_COLORS,
    diameter: quakeDiameter(magnitude),
    alpha: 1,
    zIndex: 1000 + Math.round(magnitude * 10),
  });
}

export function clusterStyle(kind: "fire" | "quake", feature: FeatureLike): Style | undefined {
  const children = feature.get("features") as Feature<Geometry>[];
  const n = children.length;
  // Below the threshold every child is drawn on its own spot instead.
  if (n < MIN_CLUSTER_SIZE) return undefined;

  // Grows with the log of the count, so 1,000 is bigger than 10 without
  // swallowing its neighbours.
  const diameter = Math.round(Math.min(46, 22 + Math.log10(n) * 9));
  let strongest = 0;
  if (kind === "quake") {
    for (const child of children) strongest = Math.max(strongest, child.get("magnitude") as number);
  }
  return badgeStyle({
    glyph: kind,
    colors: kind === "fire" ? FIRE_COLORS : QUAKE_COLORS,
    diameter,
    alpha: 1,
    label: countLabel(n),
    halo:
      kind === "quake" && strongest >= QUAKE_STRONG_MAGNITUDE
        ? "rgba(161, 98, 7, 0.28)"
        : kind === "fire" && n >= 100
          ? "rgba(220, 38, 38, 0.18)"
          : undefined,
    zIndex: 1_000_000 + n,
  });
}

// Zoom below which Normal and Waspada volcanoes step back to a dot, so a
// country-wide view shows which ones matter rather than 127 similar badges.
const QUIET_VOLCANO_MIN_ZOOM = 7;

export function volcanoStatusStyle(level: PvmbgLevel | null, erupting: boolean, zoom: number): Style {
  if (erupting) {
    return badgeStyle({
      glyph: "eruption",
      colors: ERUPTION_COLORS,
      diameter: 34,
      alpha: 1,
      halo: "rgba(239, 68, 68, 0.3)",
      zIndex: 3_000_000,
    });
  }
  const color = level === null ? UNMONITORED_VOLCANO_COLOR : PVMBG_LEVEL_COLOR[level];
  if (zoom < QUIET_VOLCANO_MIN_ZOOM && (level === null || level <= 2)) {
    return badgeStyle({
      glyph: null,
      colors: [color, color],
      diameter: level === 2 ? 10 : 7,
      alpha: 1,
      zIndex: 2_000_000 + (level ?? 0),
    });
  }
  return badgeStyle({
    glyph: "mountain",
    colors: [color, color],
    diameter: level === null ? 16 : level === 4 ? 28 : level === 3 ? 24 : 20,
    alpha: 1,
    zIndex: 2_000_000 + (level ?? 0),
  });
}

export const PULSE_PERIOD_MS = 1300;

const pulseCache = new Map<string, Style>();

// Roughly how far the shaking is felt, doubling with every step up the
// magnitude scale — about 100 km at M5, 200 at M6, 400 at M7. An estimate
// from the magnitude, not a measured contour: BMKG publishes felt intensity
// per place, never a radius. The popup and the card say so.
export function quakeFeltRadiusKm(magnitude: number) {
  return Math.min(800, Math.max(8, 100 * 2 ** (magnitude - 5)));
}

// The ring stops where the shaking is thought to stop, so its size on screen
// changes with the zoom instead of meaning nothing.
export function eventPulseStyle(rgb: string, reach: number, strength: number, phase: number, reducedMotion: boolean): Style {
  const bucket = Math.round(reach / 4) * 4;
  const key = `${rgb}|${bucket}|${strength.toFixed(2)}|${reducedMotion ? "still" : Math.round(phase * 60)}`;
  const cached = pulseCache.get(key);
  if (cached) return cached;

  const style = reducedMotion
    ? new Style({
        image: new CircleStyle({
          radius: bucket,
          stroke: new Stroke({ color: `rgba(${rgb}, ${(0.25 + strength * 0.4).toFixed(2)})`, width: 1 + strength }),
        }),
      })
    : (() => {
        // A shockwave: out fast, then thinner and fainter as it reaches the edge.
        const grow = 1 - (1 - phase) ** 2.2;
        const fade = (1 - phase) ** 1.6;
        return new Style({
          image: new CircleStyle({
            radius: Math.max(1, bucket * grow),
            fill: new Fill({ color: `rgba(${rgb}, ${(fade * strength * 0.07).toFixed(3)})` }),
            stroke: new Stroke({
              color: `rgba(${rgb}, ${(fade * (0.35 + strength * 0.6)).toFixed(3)})`,
              width: Math.max(0.6, (0.8 + strength * 2.4) * fade),
            }),
          }),
        });
      })();
  pulseCache.set(key, style);
  return style;
}

export const QUAKE_PULSE_RGB = "161, 98, 7";

// Heat and ash, drawn straight onto the map canvas: an eruption is the one
// thing here that is still happening while you look at it. Two slow motions,
// both on the same beat as the hotspots' heat — three competing clocks on one
// marker read as panic, not as urgency.
export function eruptionEffectStyle(now: number, reducedMotion: boolean): Style {
  return new Style({
    renderer: (coordinates, state) => {
      const [x, y] = coordinates as number[];
      const ctx = state.context;
      const px = state.pixelRatio;
      const r = 17 * px;
      const seed = (state.feature.get("seed") as number) ?? 0;

      ctx.save();

      // Magma heat, breathing under the badge.
      const beat = reducedMotion ? 0.5 : 0.5 + 0.5 * Math.sin((now / 2400) * Math.PI * 2);
      const auraR = r * (1.7 + 0.45 * beat);
      const aura = ctx.createRadialGradient(x, y, r * 0.55, x, y, auraR);
      aura.addColorStop(0, `rgba(251, 146, 60, ${(0.28 + 0.14 * beat).toFixed(3)})`);
      aura.addColorStop(0.55, `rgba(239, 68, 68, ${(0.13 + 0.07 * beat).toFixed(3)})`);
      aura.addColorStop(1, "rgba(239, 68, 68, 0)");
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(x, y, auraR, 0, Math.PI * 2);
      ctx.fill();

      // Ash, rising and spreading as it goes.
      for (let i = 0; i < 2; i++) {
        const p = reducedMotion ? 0.45 : (now / 4800 + i * 0.5 + seed * 0.13) % 1;
        const cy = y - r * 0.9 - p * 52 * px;
        const spread = (11 + p * 26) * px;
        const alpha = 0.4 * (1 - p * 0.85);
        const plume = ctx.createRadialGradient(x, cy, 0, x, cy, spread);
        plume.addColorStop(0, `rgba(87, 83, 78, ${alpha.toFixed(3)})`);
        plume.addColorStop(0.6, `rgba(120, 113, 108, ${(alpha * 0.55).toFixed(3)})`);
        plume.addColorStop(1, "rgba(120, 113, 108, 0)");
        ctx.fillStyle = plume;
        ctx.beginPath();
        ctx.ellipse(x, cy, spread, spread * 0.82, 0, 0, Math.PI * 2);
        ctx.fill();
        if (reducedMotion) break;
      }

      ctx.restore();
    },
  });
}

export function quakePulseStrength(magnitude: number) {
  return Math.min(1, Math.max(0.15, (magnitude - 1) / 5));
}

// Dims the world outside the picked area, which reads as "this place" without
// an extra colour competing with the event markers.
export function selectionSpotlightStyle(breathe: number): Style[] {
  return [
    new Style({
      renderer: (coordinates, state) => {
        const ctx = state.context;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, ctx.canvas.width, ctx.canvas.height);
        const polygons = (state.geometry.getType() === "MultiPolygon" ? coordinates : [coordinates]) as number[][][][];
        for (const polygon of polygons) {
          for (const ring of polygon) {
            ring.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
            ctx.closePath();
          }
        }
        ctx.fillStyle = "rgba(15, 23, 42, 0.14)";
        ctx.fill("evenodd");
        ctx.restore();
      },
    }),
    new Style({ stroke: new Stroke({ color: `rgba(37, 99, 235, ${(0.18 + breathe * 0.2).toFixed(3)})`, width: 7 + breathe * 7 }) }),
    new Style({ stroke: new Stroke({ color: "#2563eb", width: 2.5 }) }),
  ];
}
