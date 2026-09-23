import { Prisma } from "@prisma/client";
import { auth } from "@/contexts/auth";
import { prisma } from "@/lib/prisma";
import { PIPELINES, stepDataExists } from "@scripts/pipeline/pipelines";

// The worker heartbeats every 30s regardless of stage progress, so a running
// row untouched for this long means the worker died holding it.
const STALE_AFTER_MS = 3 * 60_000;

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "admin") return new Response(null, { status: 403 });

  const pipelines = await Promise.all(
    PIPELINES.map(async (pipeline) => ({
      id: pipeline.id,
      label: pipeline.label,
      steps: await Promise.all(
        pipeline.steps.map(async (step) => {
          const exists = await stepDataExists(step);
          const job = exists
            ? null
            : await prisma.importJob.findFirst({
                where: {
                  type: step.jobType,
                  params: { equals: step.params as Prisma.InputJsonValue },
                },
                orderBy: { createdAt: "desc" },
              });

          const stalled =
            job?.status === "running" && Date.now() - job.updatedAt.getTime() > STALE_AFTER_MS;

          return {
            id: step.id,
            label: step.label,
            source: step.source ?? null,
            dependsOn: step.dependsOn ?? [],
            processes: step.processes,
            status: exists ? "exists" : stalled ? "stalled" : (job?.status ?? "not-started"),
            jobId: job?.id ?? null,
            lastError: job?.lastError ?? null,
            archiveKey: job?.archiveKey ?? null,
            attempts: job?.attempts ?? 0,
            progress: job?.progress ?? null,
          };
        })
      ),
    }))
  );

  return Response.json({ pipelines });
}
