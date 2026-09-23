import { z } from "zod";
import { auth } from "@/contexts/auth";
import { HISTORY_DAYS } from "@/lib/fire-constants";
import { backfillFireHistory } from "@/server/fire-ingest";

const BackfillBody = z.object({
  days: z.number().int().min(1).max(HISTORY_DAYS).default(HISTORY_DAYS),
});

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "admin") return new Response(null, { status: 403 });

  const body = BackfillBody.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return Response.json({ error: body.error.issues[0].message }, { status: 400 });
  }

  try {
    return Response.json(await backfillFireHistory(body.data.days));
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Backfill failed" },
      { status: 502 }
    );
  }
}
