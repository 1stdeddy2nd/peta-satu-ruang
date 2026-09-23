import bcrypt from "bcryptjs";
import { PrismaClient, Role, type Prisma } from "@prisma/client";
import { DEFAULT_LAYOUT } from "../src/contexts/project/project-utils";

const prisma = new PrismaClient();

export const WORKER_PASSWORD = "e2e-worker";

export function workerEmail(index: number) {
  return `e2e-w${index}@example.test`;
}

/**
 * A worker gets its own user because the app gives each user exactly one
 * project (`getUserProject` is a findFirst by userId). Sharing a user across
 * workers would mean sharing that project, and one spec's reset would wipe
 * another's layers mid-run.
 */
export async function ensureWorkerUser(index: number) {
  const email = workerEmail(index);
  const passwordHash = await bcrypt.hash(WORKER_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: Role.admin },
    create: { email, name: `E2E worker ${index}`, passwordHash, role: Role.admin, guidanceDismissed: false },
  });

  const project = await prisma.project.findFirst({ where: { userId: user.id } });
  if (!project) {
    await prisma.project.create({
      data: {
        userId: user.id,
        name: "Untitled project",
        layout: DEFAULT_LAYOUT as unknown as Prisma.InputJsonValue,
      },
    });
  }
  return user.id;
}

export async function resetWorkerProject(index: number) {
  const user = await prisma.user.findUnique({ where: { email: workerEmail(index) } });
  if (!user) throw new Error(`worker ${index} has no user — ensureWorkerUser did not run`);

  const project = await prisma.project.findFirst({ where: { userId: user.id } });
  if (!project) throw new Error(`worker ${index} has no project`);

  await prisma.layer.deleteMany({ where: { projectId: project.id } });
  await prisma.project.update({
    where: { id: project.id },
    data: { layout: DEFAULT_LAYOUT as unknown as Prisma.InputJsonValue },
  });
}
