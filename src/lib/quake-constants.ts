// BMKG is the source of record: the agency that issues Indonesia's earthquake
// and tsunami information. It allows 60 requests a minute per IP; one pass is
// three feeds, shared by every viewer, so only a shorter ttl approaches that.
export const QUAKE_BMKG = {
  url: "https://data.bmkg.go.id/gempabumi/",
  feedUrl: "https://data.bmkg.go.id/DataMKG/TEWS",
  attribution: '<a href="https://data.bmkg.go.id/gempabumi/" target="_blank" rel="noreferrer">BMKG</a>',
  // Change this when the stored shape changes: a row in the old shape still
  // passes the TTL check and would be served as if it were current.
  cacheId: "IDN-bmkg-v1",
  ttlMs: 2 * 60 * 1000,
} as const;

// USGS only fills the days BMKG's three "latest" feeds no longer cover. Its
// catalogue reaches about M4 here, so it never replaces BMKG's small local
// quakes, and BMKG wins wherever both hold the same event.
export const QUAKE_USGS = {
  url: "https://earthquake.usgs.gov/earthquakes/map/",
  eventUrl: "https://earthquake.usgs.gov/fdsnws/event/1/query",
  attribution: '<a href="https://earthquake.usgs.gov/" target="_blank" rel="noreferrer">USGS</a>',
  cacheId: "IDN-usgs-v1",
  ttlMs: 60 * 60 * 1000,
} as const;

export const QUAKE_UPSTREAM_TIMEOUT_MS = 20_000;

// The newest quake pulses while it is this recent, so "just now" reads as new
// without every quake of the day blinking.
export const QUAKE_PULSE_HOURS = 24;

// M5.0 and above is the threshold BMKG's own "gempa terkini" feed uses.
export const QUAKE_STRONG_MAGNITUDE = 5;

export const QUAKE_HISTORY_DAYS = 30;

// Same event in both catalogues: seconds apart at most, and located within a
// couple of hundred kilometres of each other.
export const QUAKE_SAME_EVENT_SECONDS = 90;
export const QUAKE_SAME_EVENT_KM = 200;

// Bands the card counts by, mirroring Titik Api's confidence bands.
export const QUAKE_BANDS = ["strong", "moderate", "light"] as const;
export const QUAKE_BAND_MIN_MAGNITUDE: Record<(typeof QUAKE_BANDS)[number], number> = {
  strong: 5,
  moderate: 3,
  light: 0,
};
