import { z } from "zod";
import { auth } from "@/contexts/auth";
import { FIRE_BANDS, FIRE_SPANS } from "@/lib/fire-constants";
import { todayIso } from "@/lib/fire-utils";
import { fireHistorySummary, fireHistoryWindow } from "@/server/fire-queries";

const HistoryQuery = z.object({
  day: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  span: z.coerce
    .number()
    .refine((value) => (FIRE_SPANS as readonly number[]).includes(value))
    .default(1),
  bands: z
    .string()
    .transform((value) => FIRE_BANDS.filter((band) => value.split(",").includes(band)))
    .refine((value) => value.length > 0)
    .default([...FIRE_BANDS]),
  from: z.coerce.number().int().positive().optional(),
  to: z.coerce.number().int().positive().optional(),
  points: z.enum(["0", "1"]).default("1"),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new Response(null, { status: 401 });

  const query = HistoryQuery.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!query.success) {
    return Response.json({ error: query.error.issues[0].message }, { status: 400 });
  }

  const { day, span, bands, from, to, points } = query.data;
  if (!day) return Response.json({ days: await fireHistorySummary() });

  const window = from && to ? { from: new Date(from), to: new Date(to) } : undefined;
  // A past day never changes; today's keeps being appended to by the poll.
  return Response.json(await fireHistoryWindow(day, bands, span, window, points === "1"), {
    headers: {
      "Cache-Control": day === todayIso() && !window ? "no-store" : "private, max-age=86400",
    },
  });
}
