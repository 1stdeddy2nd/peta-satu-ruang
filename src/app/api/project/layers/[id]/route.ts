import { auth } from "@/contexts/auth";
import { deleteLayer, getUserProject } from "@/contexts/project/project-utils";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorised" }, { status: 401 });

  const project = await getUserProject(session.user.id);
  if (!project) return new Response(null, { status: 404 });

  const { id } = await params;
  await deleteLayer(project.id, id);

  return Response.json({ ok: true });
}
