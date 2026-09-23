"use client";

import { Layers, LayoutPanelTop } from "lucide-react";
import { useWorkspace, type WorkspaceMode } from "@/contexts/workspace";
import { cn } from "@/lib/utils";

const MODES: { id: WorkspaceMode; label: string; icon: typeof Layers }[] = [
  { id: "analysis", label: "Analysis", icon: Layers },
  { id: "layout", label: "Layout", icon: LayoutPanelTop },
];

export function ModeSwitch() {
  const mode = useWorkspace((s) => s.mode);
  const setMode = useWorkspace((s) => s.setMode);

  return (
    <div
      role="tablist"
      aria-label="Workspace mode"
      className="relative flex items-center gap-1 rounded-full border bg-muted/60 p-1"
    >
      {MODES.map(({ id, label, icon: Icon }) => {
        const active = mode === id;
        return (
          <button
            key={id}
            role="tab"
            aria-selected={active}
            onClick={() => setMode(id)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
