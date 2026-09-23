"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  PipelineGraph,
  type PipelineGraphStep,
} from "@/components/organisms/pipelines/PipelineGraph";

interface Pipeline {
  id: string;
  label: string;
  steps: PipelineGraphStep[];
}

export function PipelineDashboard() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  // Without this a slow response lets polls pile up concurrently.
  const refreshing = useRef(false);

  const refresh = async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    try {
      const res = await fetch("/api/admin/pipelines");
      if (!res.ok) return;
      const data = await res.json();
      setPipelines(data.pipelines ?? []);
    } finally {
      refreshing.current = false;
    }
  };

  useEffect(() => {
    void refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, []);

  const runPipeline = async (id: string) => {
    setRunning(id);
    try {
      const res = await fetch(`/api/admin/pipelines/${id}/run`, { method: "POST" });
      if (!res.ok) {
        toast.error("Failed to run pipeline");
        return;
      }
      const { queued } = await res.json();
      toast.success(queued.length ? `Queued ${queued.length} step(s)` : "Already up to date — nothing to run");
      await refresh();
    } finally {
      setRunning(null);
    }
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-lg font-semibold">Data pipelines</h1>
        <p className="text-sm text-muted-foreground">
          Where our reference data comes from and how it&apos;s regenerated. Every step
          shows each process it runs. A step already imported is marked &quot;Already
          imported&quot; and skipped, not re-run. Admin only.
        </p>
      </div>

      {pipelines.map((pipeline) => (
        <div key={pipeline.id} className="flex flex-col gap-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{pipeline.label}</p>
            <Button onClick={() => void runPipeline(pipeline.id)} disabled={running === pipeline.id}>
              Run
            </Button>
          </div>
          <PipelineGraph steps={pipeline.steps} />
        </div>
      ))}
    </div>
  );
}
