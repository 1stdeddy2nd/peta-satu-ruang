import { auth } from "@/contexts/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorised" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { guidanceDismissed: true },
  });
  return Response.json({ dismissed: user?.guidanceDismissed ?? false });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const dismissed = Boolean(body?.dismissed ?? true);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { guidanceDismissed: dismissed },
  });
  return Response.json({ dismissed });
}
