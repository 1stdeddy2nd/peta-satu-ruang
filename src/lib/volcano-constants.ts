export const MAGMA_URL = "https://magma.esdm.go.id";
export const MAGMA_VOLCANO_TYPES_URL = "https://magma.esdm.go.id/v1/edukasi/tipe-gunung-api-di-indonesia-a-b-dan-c";

export const MAGMA_ATTRIBUTION =
  '<a href="https://magma.esdm.go.id" target="_blank" rel="noreferrer">MAGMA Indonesia (PVMBG)</a>';

// magma.esdm.go.id's robots.txt disallows all crawlers; we read it anyway by
// the product owner's decision. Keep every request identifiable, sequential
// and rare — raising this TTL's frequency or parallelising the fetches turns
// polite reading into load on a government site.
export const MAGMA_USER_AGENT =
  "MapCanva/1.0 (+https://github.com/kribabarbraf/map-canva; noncommercial volcano-status dashboard)";

// Change these when the stored JSON shape changes: a row in the old shape
// still passes the TTL check and would be served as if it were current.
export const MAGMA_CACHE_ID = "IDN-magma-v1";


export const MAGMA_TTL_MS = 30 * 60 * 1000;

// Older than this and the snapshot is worth warning about; below it, a missed
// refresh is invisible to the reader, which is what it should be.
export const MAGMA_STALE_AFTER_MS = 3 * MAGMA_TTL_MS;

export const MAGMA_REQUEST_GAP_MS = 2000;

// Node's fetch waits minutes on a stalled connection, and /api/volcanoes waits
// on these calls — without a timeout one hung upstream freezes the dashboard.
export const UPSTREAM_TIMEOUT_MS = 20_000;


export const ERUPTION_PULSE_HOURS = 24;
export const ERUPTION_HISTORY_DAYS = 30;
// Set by the product owner for the paginated eruption history, on top of the
// status pass's own gap. The first backfill takes ~30 minutes because of it —
// that is intended, not a bug to speed up.
export const MAGMA_HISTORY_PAGE_GAP_MS = 30_000;
export const ERUPTION_HISTORY_STATE_ID = "IDN-eruption-history-v1";
