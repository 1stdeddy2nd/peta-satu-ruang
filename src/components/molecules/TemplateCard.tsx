"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PageOrientation, TemplateId, TemplateMeta } from "@/contexts/layout";

function TemplatePreview({
  id,
  orientation,
}: {
  id: TemplateId;
  orientation: PageOrientation;
}) {
  const portrait = orientation === "portrait";
  const w = portrait ? 60 : 84;
  const h = portrait ? 84 : 60;

  const sidebar = portrait ? 15 : 18;
  const mapW = w - sidebar;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-20 w-20 shrink-0 rounded border bg-white p-0.5"
      preserveAspectRatio="xMidYMid meet"
    >
      <g className="text-slate-300" strokeWidth="1.5" fill="none" stroke="currentColor">
        {id === "blank" && <rect x="2" y="2" width={w - 4} height={h - 4} />}

        {id === "id-admin-map" && (
          <>
            <rect x="2" y="2" width={mapW - 4} height={h - 4} />
            <rect x={mapW} y="2" width={sidebar - 2} height={h - 4} />
            <g className="text-slate-400" strokeWidth="1">
              {[0.18, 0.34, 0.56, 0.74].map((f) => (
                <line
                  key={f}
                  x1={mapW + 1.5}
                  y1={h * f}
                  x2={w - 1.5}
                  y2={h * f}
                  stroke="currentColor"
                />
              ))}
            </g>
          </>
        )}
      </g>
    </svg>
  );
}

export function TemplateCard({
  template,
  orientation,
  active,
  onSelect,
}: {
  template: TemplateMeta;
  orientation: PageOrientation;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border bg-card p-2.5 text-left transition-all hover:border-primary/50 hover:shadow-sm",
        active && "border-primary bg-primary/5 ring-1 ring-primary/20"
      )}
    >
      <TemplatePreview id={template.id} orientation={orientation} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold">{template.name}</span>
          {active && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          {template.description}
        </p>
      </div>
    </button>
  );
}
