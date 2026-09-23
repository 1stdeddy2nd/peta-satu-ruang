import { notFound } from "next/navigation";
import { auth } from "@/contexts/auth";
import { PipelineDashboard } from "@/components/templates/PipelineDashboard";

/** 404 rather than a redirect, which would reveal the route exists. */
export default async function PipelinesPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") notFound();

  return <PipelineDashboard />;
}
