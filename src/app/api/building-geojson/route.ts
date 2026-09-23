import { gzipSync } from "node:zlib";
import { z } from "zod";
import { auth } from "@/contexts/auth";
import { buildingGeoJson } from "@/server/building-queries";

const GeoJsonQuery = z.object({ area: z.string().trim().min(1) });

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new Response(null, { status: 401 });

  const parsed = GeoJsonQuery.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const json = await buildingGeoJson(parsed.data.area);
  if (!json) return Response.json({ error: "Area not found" }, { status: 404 });

  return new Response(gzipSync(json), {
    headers: {
      "Content-Type": "application/geo+json",
      "Content-Encoding": "gzip",
      "Cache-Control": "private, max-age=86400",
    },
  });
}
