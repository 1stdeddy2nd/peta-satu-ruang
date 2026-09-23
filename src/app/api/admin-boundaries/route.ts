import { z } from "zod";
import { auth } from "@/contexts/auth";
import { adminAreaAt, adminAreaOutline, adminBoundaryOptions, searchAdminAreas } from "@/server/admin-queries";

const BoundaryQuery = z.union([
  z.object({ q: z.string().trim() }),
  z.object({ pcode: z.string().trim().min(1) }),
  z.object({
    lon: z.coerce.number().min(-180).max(180),
    lat: z.coerce.number().min(-90).max(90),
  }),
  z
    .object({
      level: z.coerce.number().int().min(1).max(4),
      parent: z.string().trim().min(1).optional(),
    })
    // "Every district in Indonesia" is 7,069 rows and not a list to hand anyone.
    .refine((value) => value.level === 1 || value.parent, "parent is required below level 1"),
]);

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new Response(null, { status: 401 });

  const parsed = BoundaryQuery.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const query = parsed.data;

  if ("q" in query) {
    return Response.json({ results: query.q.length < 2 ? [] : await searchAdminAreas(query.q) });
  }

  if ("pcode" in query) {
    const outline = await adminAreaOutline(query.pcode);
    if (!outline) return Response.json({ error: "Area not found" }, { status: 404 });
    return Response.json(outline, { headers: { "Cache-Control": "private, max-age=86400" } });
  }

  if ("lon" in query) {
    return Response.json({ area: await adminAreaAt(query.lon, query.lat) });
  }

  return Response.json({ options: await adminBoundaryOptions(query.level, query.parent) });
}
