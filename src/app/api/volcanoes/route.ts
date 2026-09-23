import { auth } from "@/contexts/auth";
import { MAGMA_STALE_AFTER_MS, MAGMA_URL } from "@/lib/volcano-constants";
import { refreshEruptionHistory, refreshMagma } from "@/server/volcano-ingest";
import { volcanoFeatures } from "@/server/volcano-queries";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new Response(null, { status: 401 });

  refreshEruptionHistory();
  // Logged where the refresh actually fails, not here on every poll after it.
  const magma = await refreshMagma().catch(() => null);
  const { features, magmaFetchedAt, eruptionHistorySince, eruptionHistoryComplete } = await volcanoFeatures();
  if (features.length === 0) {
    return Response.json({ error: "Data gunung api dari MAGMA tidak bisa dimuat." }, { status: 502 });
  }

  return Response.json({
    features,
    magmaUrl: MAGMA_URL,
    magmaFetchedAt,
    magmaStale: !magma || Date.now() - new Date(magmaFetchedAt ?? 0).getTime() > MAGMA_STALE_AFTER_MS,
    eruptionHistorySince,
    eruptionHistoryComplete,
  });
}
