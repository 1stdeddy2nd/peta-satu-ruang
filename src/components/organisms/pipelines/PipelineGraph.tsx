"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Check, Loader2, Circle, X, PackageCheck, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type PipelineStepStatus =
  | "not-started"
  | "exists"
  | "pending"
  | "running"
  | "stalled"
  | "done"
  | "failed";

export interface StepProgress {
  stage?: string;
  level?: number;
  percent?: number;
  processed?: number;
  total?: number;
  tagged?: number;
  imported?: number;
  totalBytes?: number;
  [key: string]: unknown;
}

export interface PipelineProcess {
  id: string;
  label: string;
}

export interface PipelineGraphStep {
  id: string;
  label: string;
  source: string | null;
  status: PipelineStepStatus;
  dependsOn: string[];
  processes: PipelineProcess[];
  progress: StepProgress | null;
  lastError: string | null;
  archiveKey: string | null;
  attempts: number;
}

const STATUS_STYLES: Record<PipelineStepStatus, { border: string; icon: React.ReactNode }> = {
  "not-started": {
    border: "border-muted-foreground/25",
    icon: <Circle className="size-3.5 text-muted-foreground/50" />,
  },
  exists: {
    border: "border-violet-500",
    icon: <PackageCheck className="size-3.5 text-violet-600" />,
  },
  pending: {
    border: "border-muted-foreground/40 border-dashed",
    icon: <Circle className="size-3.5 text-muted-foreground" />,
  },
  running: {
    border: "border-blue-600",
    icon: <Loader2 className="size-3.5 animate-spin text-blue-600" />,
  },
  stalled: {
    border: "border-amber-500",
    icon: <AlertTriangle className="size-3.5 text-amber-600" />,
  },
  done: {
    border: "border-green-600",
    icon: <Check className="size-3.5 text-green-600" />,
  },
  failed: {
    border: "border-destructive",
    icon: <X className="size-3.5 text-destructive" />,
  },
};

const STATUS_LABEL: Record<PipelineStepStatus, string> = {
  "not-started": "Not started",
  exists: "Already imported",
  pending: "Queued",
  running: "Running",
  stalled: "Stalled — worker stopped",
  done: "Done",
  failed: "Failed",
};

function formatBytes(bytes: number): string {
  return `${(bytes / 1_000_000).toFixed(0)}MB`;
}

function processCaption(processId: string, p: StepProgress): string | null {
  if (processId === "downloading" && p.percent != null) {
    return `${p.percent}%${p.totalBytes ? ` of ${formatBytes(p.totalBytes)}` : ""}`;
  }
  if (processId === "importing" && p.imported != null) {
    return `${p.imported.toLocaleString()} rows`;
  }
  if (processId === "tagging" && p.total) {
    return `${(p.processed ?? 0).toLocaleString()} / ${p.total.toLocaleString()} villages${
      p.tagged ? ` · ${p.tagged.toLocaleString()} tagged` : ""
    }`;
  }
  if (p.level) return `level ${p.level}`;
  return null;
}

function processStatus(
  step: PipelineGraphStep,
  index: number
): PipelineStepStatus {
  if (step.status === "exists" || step.status === "done" || step.status === "not-started") {
    return step.status;
  }
  const current = step.processes.findIndex((p) => p.id === step.progress?.stage);
  if (current < 0) return step.status === "pending" ? "pending" : step.status;
  if (index < current) return "done";
  if (index > current) return "pending";
  return step.status;
}

interface ProcessNodeData extends Record<string, unknown> {
  label: string;
  status: PipelineStepStatus;
  caption: string | null;
  percent: number | null;
  width: number;
}

function ProcessNode({ data }: NodeProps<Node<ProcessNodeData>>) {
  const style = STATUS_STYLES[data.status];
  return (
    <div
      className={cn("rounded-md border-2 bg-card px-2.5 py-1.5 shadow-sm", style.border)}
      style={{ width: data.width }}
    >
      <Handle type="target" position={Position.Left} className="!bg-muted-foreground/40" />
      <div className="flex items-center gap-1.5 text-xs font-medium">
        {style.icon}
        <span className="truncate">{data.label}</span>
      </div>
      <p className="truncate text-[10px] text-muted-foreground">
        {data.caption ?? STATUS_LABEL[data.status]}
      </p>
      {data.percent != null && (
        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-blue-600 transition-[width]" style={{ width: `${data.percent}%` }} />
        </div>
      )}
      <Handle type="source" position={Position.Right} className="!bg-muted-foreground/40" />
    </div>
  );
}

interface StepGroupData extends Record<string, unknown> {
  label: string;
  source: string | null;
  status: PipelineStepStatus;
  lastError: string | null;
  archiveKey: string | null;
  attempts: number;
}

function StepGroupNode({ data }: NodeProps<Node<StepGroupData>>) {
  return (
    <div className="size-full rounded-lg border border-dashed bg-muted/20 px-3 pt-1.5">
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-semibold">{data.label}</span>
        {data.source && <span className="text-[10px] text-muted-foreground">{data.source}</span>}
        <span className="ml-auto text-[10px] text-muted-foreground">
          {STATUS_LABEL[data.status]}
          {data.attempts > 1 && ` · attempt ${data.attempts}`}
        </span>
      </div>
      {data.archiveKey && (
        <p className="truncate text-[10px] text-muted-foreground">
          Backed up to MinIO: {data.archiveKey}
        </p>
      )}
      {data.lastError && (
        <p className="truncate text-[10px] text-destructive">{data.lastError}</p>
      )}
    </div>
  );
}

const NODE_TYPES = { process: ProcessNode, stepGroup: StepGroupNode };

const PROCESS_W = 170;
const GAP_X = 22;
const PAD_X = 12;
const HEADER_H = 34;
const PROCESS_H = 52;
const GROUP_H = HEADER_H + PROCESS_H + 12;
const ROW_GAP = 34;
// The step header outgrows a single process node.
const GROUP_MIN_W = 420;

function layout(steps: PipelineGraphStep[]) {
  const byId = new Map(steps.map((s) => [s.id, s]));
  const depth = new Map<string, number>();
  const depthOf = (id: string): number => {
    if (depth.has(id)) return depth.get(id)!;
    depth.set(id, 0);
    const step = byId.get(id);
    const d = step?.dependsOn.length ? 1 + Math.max(...step.dependsOn.map(depthOf)) : 0;
    depth.set(id, d);
    return d;
  };

  const ordered = [...steps].sort((a, b) => depthOf(a.id) - depthOf(b.id));
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  ordered.forEach((step, row) => {
    const n = step.processes.length;
    const width = Math.max(GROUP_MIN_W, PAD_X * 2 + n * PROCESS_W + (n - 1) * GAP_X);
    const processW = (width - PAD_X * 2 - (n - 1) * GAP_X) / n;
    nodes.push({
      id: step.id,
      type: "stepGroup",
      position: { x: 0, y: row * (GROUP_H + ROW_GAP) },
      style: { width, height: GROUP_H },
      draggable: false,
      selectable: false,
      data: {
        label: step.label,
        source: step.source,
        status: step.status,
        lastError: step.status === "failed" ? step.lastError : null,
        archiveKey: step.archiveKey,
        attempts: step.attempts,
      } satisfies StepGroupData,
    });

    step.processes.forEach((process, i) => {
      const status = processStatus(step, i);
      const live = status === "running" || status === "stalled" ? step.progress : null;
      nodes.push({
        id: `${step.id}:${process.id}`,
        type: "process",
        parentId: step.id,
        extent: "parent",
        position: { x: PAD_X + i * (processW + GAP_X), y: HEADER_H },
        draggable: false,
        selectable: false,
        data: {
          label: process.label,
          status,
          caption: live ? processCaption(process.id, live) : null,
          percent: status === "running" ? (live?.percent ?? null) : null,
          width: processW,
        } satisfies ProcessNodeData,
      });

      if (i > 0) {
        const from = `${step.id}:${step.processes[i - 1].id}`;
        const to = `${step.id}:${process.id}`;
        edges.push({ id: `${from}->${to}`, source: from, target: to });
      }
    });

    for (const depId of step.dependsOn) {
      const dep = byId.get(depId);
      if (!dep?.processes.length) continue;
      const from = `${depId}:${dep.processes[dep.processes.length - 1].id}`;
      const to = `${step.id}:${step.processes[0]?.id}`;
      edges.push({
        id: `${from}->${to}`,
        source: from,
        target: to,
        type: "smoothstep",
        animated: step.status === "running",
      });
    }
  });

  return { nodes, edges, rows: ordered.length };
}

export function PipelineGraph({ steps }: { steps: PipelineGraphStep[] }) {
  const { nodes, edges, rows } = useMemo(() => layout(steps), [steps]);

  return (
    <div className="w-full rounded-lg border" style={{ height: rows * (GROUP_H + ROW_GAP) + 40 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
      </ReactFlow>
    </div>
  );
}
