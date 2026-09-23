import { auth } from "@/contexts/auth";
import { createLayerWithFeatures, getUserProject } from "@/contexts/project/project-utils";
import type { LayerFeaturePayload, LayerMetaPayload } from "@/contexts/project/project-types";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorised" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as {
    meta: LayerMetaPayload;
    features: LayerFeaturePayload[];
  } | null;
  if (!body?.meta || !Array.isArray(body.features)) {
    return Response.json({ error: "Invalid layer payload" }, { status: 400 });
  }

  const project = await getUserProject(session.user.id);
  if (!project) return new Response(null, { status: 404 });

  await createLayerWithFeatures(project.id, body.meta, body.features);

  return Response.json({ ok: true });
}
