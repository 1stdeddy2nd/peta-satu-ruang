"use client";

import { FileDown, ImageDown, Loader2, Map, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ModeSwitch } from "@/components/molecules/ModeSwitch";
import { useWorkspace } from "@/contexts/workspace";
import { useLayout } from "@/contexts/layout";
import { usePrint } from "@/contexts/print";

export function AppHeader() {
  const mode = useWorkspace((s) => s.mode);
  const panelOpen = useWorkspace((s) => s.panelOpen);
  const togglePanel = useWorkspace((s) => s.togglePanel);
  const page = useLayout((s) => s.page);
  const { exportAs, exporting, isExporting } = usePrint();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b bg-background px-3">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0"
          title={panelOpen ? "Hide panel" : "Show panel"}
          onClick={togglePanel}
        >
          {panelOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </Button>
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Map className="h-4 w-4" />
          </div>
          <span className="truncate text-sm font-semibold">MapCanva</span>
        </div>
      </div>

      <ModeSwitch />

      <div className="flex min-w-0 items-center justify-end gap-2">
        {mode === "layout" ? (
          <>
            <span className="hidden text-xs text-muted-foreground lg:inline">
              {page.size} · {page.orientation}
            </span>
            <Separator orientation="vertical" className="hidden h-5 lg:block" />
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              disabled={isExporting}
              onClick={() => exportAs("png")}
            >
              {exporting === "png" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ImageDown className="h-3.5 w-3.5" />
              )}
              PNG
            </Button>
            <Button
              size="sm"
              className="h-8"
              disabled={isExporting}
              onClick={() => exportAs("pdf")}
            >
              {exporting === "pdf" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileDown className="h-3.5 w-3.5" />
              )}
              Export PDF
            </Button>
          </>
        ) : (
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Prepare your data, then switch to Layout
          </span>
        )}
      </div>
    </header>
  );
}
