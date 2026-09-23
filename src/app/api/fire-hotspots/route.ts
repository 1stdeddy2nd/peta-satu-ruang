import { auth } from "@/contexts/auth";
import { FIRMS_ATTRIBUTION } from "@/lib/fire-constants";
import { refreshRecentFires } from "@/server/fire-ingest";
import { recentFireFeatures } from "@/server/fire-queries";

// The editor's live layer (MC-052). The dashboard reads `./history`; both share
// one FIRMS pull, decided in `server/fire-ingest.ts`.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new Response(null, { status: 401 });

  // A FIRMS outage must fail visibly, but the table still holds what we had:
  // serve it marked stale rather than an empty map.
  const refreshed = await refreshRecentFires().catch(() => null);
  const features = await recentFireFeatures();
  if (!refreshed && features.length === 0) {
    return Response.json({ error: "NASA FIRMS is unreachable." }, { status: 502 });
  }

  return Response.json({
    features,
    layerName: "Fire hotspots (NASA FIRMS)",
    attribution: FIRMS_ATTRIBUTION,
    fetchedAt: refreshed?.fetchedAt ?? null,
    stale: !refreshed,
  });
}
