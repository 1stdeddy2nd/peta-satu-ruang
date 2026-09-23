import { Prisma } from "@prisma/client";
import { auth } from "@/contexts/auth";
import { prisma } from "@/lib/prisma";
import { PIPELINES, stepDataExists } from "@scripts/pipeline/pipelines";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "admin") return new Response(null, { status: 403 });

  const { id } = await params;
  const pipeline = PIPELINES.find((p) => p.id === id);
  if (!pipeline) return new Response(null, { status: 404 });

  const existsById = new Map<string, boolean>();
  for (const step of pipeline.steps) {
    existsById.set(step.id, await stepDataExists(step));
  }

  const queued: string[] = [];
  for (const step of pipeline.steps) {
    if (existsById.get(step.id)) continue;

    // Queuing before dependencies exist would not error, it would tag nothing.
    const depsSatisfied = (step.dependsOn ?? []).every((dep) => existsById.get(dep));
    if (!depsSatisfied) continue;

    const paramsFilter = { equals: step.params as Prisma.InputJsonValue };
    const active = await prisma.importJob.findFirst({
      where: { type: step.jobType, params: paramsFilter, status: { in: ["pending", "running"] } },
    });
    if (active) continue;

    await prisma.importJob.create({
      data: {
        type: step.jobType,
        params: step.params as Prisma.InputJsonValue,
        status: "pending",
        attempts: 0,
      },
    });
    queued.push(step.id);
  }

  return Response.json({ queued });
}
