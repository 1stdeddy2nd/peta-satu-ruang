import { FIRE_BAND_MIN_PERCENT, WIB_OFFSET_MS } from "./fire-constants";
import type { FireConfidenceBand } from "./fire-types";

/** SiPongi+'s bands: 80-100 high, 30-79 medium, below that low. MODIS reports a
 * percentage, VIIRS the letters h/n/l. */
export function fireConfidenceBand(confidence: string): FireConfidenceBand {
  const numeric = Number(confidence);
  if (!Number.isNaN(numeric)) {
    if (numeric >= FIRE_BAND_MIN_PERCENT.high) return "high";
    return numeric >= FIRE_BAND_MIN_PERCENT.medium ? "medium" : "low";
  }
  if (confidence === "h") return "high";
  return confidence === "n" ? "medium" : "low";
}

export function wibDayIso(at: Date | number): string {
  return new Date(new Date(at).getTime() + WIB_OFFSET_MS).toISOString().slice(0, 10);
}

export function todayIso(): string {
  return wibDayIso(Date.now());
}
