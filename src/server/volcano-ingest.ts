import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ERUPTION_HISTORY_DAYS,
  ERUPTION_HISTORY_STATE_ID,
  MAGMA_CACHE_ID,
  MAGMA_HISTORY_PAGE_GAP_MS,
  MAGMA_TTL_MS,
} from "@/lib/volcano-constants";
import type { MagmaEruptionNotice } from "@/lib/volcano-types";
import { fetchEruptionNoticePage, fetchMagmaSnapshot } from "./volcano-magma";

const MAGMA_RETRY_AFTER_FAILURE_MS = 5 * 60 * 1000;

// Every viewer's poll can land here. Without the shared in-flight promise,
// simultaneous polls each start their own MAGMA pass; without the failure
// cooldown, a MAGMA outage makes every poll retry against it immediately.
// Either would turn one polite reader into a stampede on a government site.
let magmaInFlight: Promise<{ fetchedAt: Date }> | null = null;
let magmaFailedAt = 0;

function startMagmaRefresh() {
  magmaInFlight = (async () => {
    try {
      const volcanoes = (await fetchMagmaSnapshot()) as unknown as Prisma.InputJsonValue;
      const fetchedAt = new Date();
      await prisma.volcanoCatalogCache.upsert({
        where: { id: MAGMA_CACHE_ID },
        create: { id: MAGMA_CACHE_ID, volcanoes, fetchedAt },
        update: { volcanoes, fetchedAt },
      });
      return { fetchedAt };
    } catch (err) {
      magmaFailedAt = Date.now();
      console.error("MAGMA refresh failed:", err instanceof Error ? err.message : err);
      throw err;
    } finally {
      magmaInFlight = null;
    }
  })();
  return magmaInFlight;
}

// A full pass is six spaced requests (~12 s), so a due refresh runs in the
// background while the viewer gets the snapshot already held; only the first
// load, with nothing cached, waits. Throws when the snapshot is overdue and the
// last attempt failed, so the caller can mark it stale.
export async function refreshMagma() {
  const marker = await prisma.volcanoCatalogCache.findUnique({ where: { id: MAGMA_CACHE_ID } });
  const due = !marker || Date.now() - marker.fetchedAt.getTime() >= MAGMA_TTL_MS;
  const coolingDown = Date.now() - magmaFailedAt < MAGMA_RETRY_AFTER_FAILURE_MS;

  if (due && !coolingDown && !magmaInFlight) {
    const refresh = startMagmaRefresh();
    // Already logged and recorded inside; this only keeps a background failure
    // from surfacing as an unhandled rejection.
    if (marker) refresh.catch(() => {});
  }

  if (!marker) {
    if (magmaInFlight) return magmaInFlight;
    throw new Error("No MAGMA snapshot yet and the last attempt failed");
  }
  // A failed refresh is not an outage for the reader: the stored snapshot is
  // still today's status. Whether it has gone too old to trust is the caller's
  // call, from its own age.
  return { fetchedAt: marker.fetchedAt };
}

interface EruptionHistoryState {
  backfillPage: number;
  backfillDone: boolean;
}

let historyInFlight: Promise<void> | null = null;
let historyFailedAt = 0;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function storeNotices(notices: MagmaEruptionNotice[], cutoff: number) {
  await prisma.volcanoEruptionNotice.createMany({
    data: notices
      .filter((n) => Date.parse(n.eruptedAt) >= cutoff)
      .map((n) => ({
        id: n.id,
        volcanoName: n.volcanoName,
        eruptedAt: new Date(n.eruptedAt),
        ashColumnM: n.ashColumnM,
        ashDirection: n.ashDirection,
      })),
    skipDuplicates: true,
  });
}

async function saveHistoryState(state: EruptionHistoryState) {
  const events = state as unknown as Prisma.InputJsonValue;
  const fetchedAt = new Date();
  await prisma.volcanoEventCache.upsert({
    where: { id: ERUPTION_HISTORY_STATE_ID },
    create: { id: ERUPTION_HISTORY_STATE_ID, events, fetchedAt },
    update: { events, fetchedAt },
  });
}

// Fire and forget: the first backfill reads ~50 pages at MAGMA_HISTORY_PAGE_GAP_MS
// apart, far longer than any request may wait. Progress is saved per page, so
// a restart resumes rather than starting over.
export function refreshEruptionHistory() {
  if (historyInFlight || Date.now() - historyFailedAt < MAGMA_RETRY_AFTER_FAILURE_MS) return;
  historyInFlight = (async () => {
    try {
      const marker = await prisma.volcanoEventCache.findUnique({ where: { id: ERUPTION_HISTORY_STATE_ID } });
      const state = (marker?.events ?? { backfillPage: 1, backfillDone: false }) as unknown as EruptionHistoryState;
      if (marker && state.backfillDone && Date.now() - marker.fetchedAt.getTime() < MAGMA_TTL_MS) return;
      const cutoff = Date.now() - ERUPTION_HISTORY_DAYS * 24 * 60 * 60 * 1000;
      const reachesCutoff = (notices: MagmaEruptionNotice[]) =>
        notices.length === 0 || notices.some((n) => Date.parse(n.eruptedAt) < cutoff);

      if (state.backfillDone) {
        // New notices only: stop at the first page holding one already stored.
        for (let page = 1; ; page++) {
          if (page > 1) await wait(MAGMA_HISTORY_PAGE_GAP_MS);
          const notices = await fetchEruptionNoticePage(page);
          const known = await prisma.volcanoEruptionNotice.count({ where: { id: { in: notices.map((n) => n.id) } } });
          await storeNotices(notices, cutoff);
          if (known > 0 || reachesCutoff(notices)) break;
        }
        await saveHistoryState(state);
      } else {
        // New notices push older ones down a page while this runs; resuming at
        // the saved page re-reads a few (skipped as duplicates) but never skips any.
        for (let page = state.backfillPage; ; page++) {
          if (page > state.backfillPage) await wait(MAGMA_HISTORY_PAGE_GAP_MS);
          const notices = await fetchEruptionNoticePage(page);
          await storeNotices(notices, cutoff);
          const done = reachesCutoff(notices);
          await saveHistoryState({ backfillPage: page + 1, backfillDone: done });
          if (done) break;
        }
      }

      await prisma.volcanoEruptionNotice.deleteMany({ where: { eruptedAt: { lt: new Date(cutoff) } } });
    } catch (err) {
      historyFailedAt = Date.now();
      console.error("MAGMA eruption history refresh failed:", err instanceof Error ? err.message : err);
    } finally {
      historyInFlight = null;
    }
  })();
}

