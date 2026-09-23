import type { FireConfidenceBand } from "./fire-types";

export const FIRE_BANDS: FireConfidenceBand[] = ["high", "medium", "low"];

/** MODIS percentages at or above which a detection is high or medium. */
export const FIRE_BAND_MIN_PERCENT = { high: 80, medium: 30 };

export const HISTORY_DAYS = 30;

export const FIRE_SPANS = [1, 3, 7, 30] as const;

/** Append only, never reorder: the index is baked into cached responses. */
export const HISTORY_SENSORS = ["MODIS", "VIIRS"] as const;

/** Append only, never reorder, for the same reason. */
export const HISTORY_SATELLITES = ["Aqua", "Terra", "N", "1", "2"] as const;

/** **Bump whenever `HistoryPoint` changes.** A past day is cached for 24 hours
 * in the browser, so a new field leaves every existing reader parsing the old
 * shape. */
export const HISTORY_PAYLOAD_VERSION = 4;

/** The FIRMS area API refuses a larger window. */
export const MAX_DAY_RANGE = 5;

/** Indonesia spans three zones, but the timeline says "hari" and a user means
 * their own date. One offset, everywhere a day is derived. */
export const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

export const FIRMS_ATTRIBUTION =
  '<a href="https://firms.modaps.eosdis.nasa.gov/" target="_blank" rel="noreferrer">NASA FIRMS</a>';
