import { auth } from "@/contexts/auth";
import { getUserProject, loadLayersWithFeatures, saveLayerMetadata, saveLayout } from "@/contexts/project/project-utils";
import type { LayoutDocument, ProjectResponse, ProjectSavePayload } from "@/contexts/project/project-types";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorised" }, { status: 401 });

  const project = await getUserProject(session.user.id);
  if (!project) return new Response(null, { status: 404 });

  const layers = await loadLayersWithFeatures(project.id);

  const body: ProjectResponse = {
    id: project.id,
    layout: project.layout as unknown as LayoutDocument,
    layers,
  };
  return Response.json(body);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorised" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as ProjectSavePayload | null;
  if (!body?.layout || !Array.isArray(body.layers)) {
    return Response.json({ error: "Invalid project payload" }, { status: 400 });
  }

  const project = await getUserProject(session.user.id);
  if (!project) return new Response(null, { status: 404 });

  await saveLayout(project.id, body.layout);
  if (body.layers.length > 0) await saveLayerMetadata(project.id, body.layers);

  return Response.json({ ok: true });
}
