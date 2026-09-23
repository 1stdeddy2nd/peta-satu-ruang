import { auth } from "@/contexts/auth";
import { QUAKE_BMKG } from "@/lib/quake-constants";
import { quakeFetchedAt, refreshQuakes, refreshUsgs } from "@/server/quake-ingest";
import { quakeHistory } from "@/server/quake-queries";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new Response(null, { status: 401 });

  // Logged where the refresh actually fails, not here on every poll after it.
  const refreshed = await refreshQuakes().catch(() => null);
  await refreshUsgs();
  const [events, fetchedAt] = await Promise.all([quakeHistory(), quakeFetchedAt()]);
  if (events.length === 0) {
    return Response.json({ error: "Data gempa dari BMKG tidak bisa dimuat." }, { status: 502 });
  }

  return Response.json({
    events,
    bmkgUrl: QUAKE_BMKG.url,
    fetchedAt: fetchedAt?.toISOString() ?? null,
    // Nothing older than this has been seen yet, so the timeline must not draw
    // those days as "no earthquakes".
    historySince: events.at(-1)?.occurredAt ?? null,
    stale: !refreshed,
  });
}
