"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { AppHeader } from "@/components/organisms/AppHeader";
import { GettingStarted } from "@/components/organisms/GettingStarted";
import { AnalysisPanel } from "@/components/organisms/panels/AnalysisPanel";
import { LayoutPanel } from "@/components/organisms/panels/LayoutPanel";
import { AnalysisWorkspace } from "./AnalysisWorkspace";
import { LayoutWorkspace } from "./LayoutWorkspace";
import { useWorkspace } from "@/contexts/workspace";
import { useProjectSync } from "@/contexts/project";
import { cn } from "@/lib/utils";

export function AppShell() {
  useProjectSync();
  const mode = useWorkspace((s) => s.mode);
  const panelOpen = useWorkspace((s) => s.panelOpen);
  const isAnalysis = mode === "analysis";

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-background">
      <AppHeader />

      <div className="flex min-h-0 flex-1">
        <aside
          className={cn(
            "flex shrink-0 flex-col border-r bg-background transition-[width] duration-200",
            panelOpen ? "w-[336px]" : "w-0 overflow-hidden border-r-0"
          )}
        >
          {isAnalysis ? (
            <ScrollArea className="h-full">
              <AnalysisPanel />
            </ScrollArea>
          ) : (
            <LayoutPanel />
          )}
        </aside>

        <main className="relative min-w-0 flex-1">
          {/*
            Both workspaces stay mounted so the shared OpenLayers instance is
            never torn down; only the active one is attached and visible.
          */}
          <div className={cn("absolute inset-0", !isAnalysis && "hidden")}>
            {isAnalysis && <AnalysisWorkspace />}
          </div>
          <div className={cn("absolute inset-0", isAnalysis && "hidden")}>
            {!isAnalysis && <LayoutWorkspace />}
          </div>

          <GettingStarted />
        </main>
      </div>
    </div>
  );
}
