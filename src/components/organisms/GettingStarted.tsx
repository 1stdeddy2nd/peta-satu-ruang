"use client";

import { useEffect, useRef } from "react";
import { ArrowRight, LayoutPanelTop, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/contexts/workspace";
import { useMap, useMapSettings } from "@/contexts/map";
import { useLayout } from "@/contexts/layout";

const TOTAL = 3;

export function GettingStarted() {
  const dismissed = useWorkspace((s) => s.guidanceDismissed);
  const dismiss = useWorkspace((s) => s.dismissGuidance);
  const loadGuidance = useWorkspace((s) => s.loadGuidance);
  const guidanceLoaded = useWorkspace((s) => s.guidanceLoaded);
  const mode = useWorkspace((s) => s.mode);
  const setMode = useWorkspace((s) => s.setMode);

  const layers = useMapSettings((s) => s.layers);
  const { addFiles } = useMap();
  const template = useLayout((s) => s.template);
  const elements = useLayout((s) => s.elements);

  const fileRef = useRef<HTMLInputElement | null>(null);

  // The dismissal lives in a cookie, which only exists on the client. Waiting
  // for mount before rendering keeps the server and client markup identical and
  // avoids the card flashing up for someone who already dismissed it.
  useEffect(() => {
    void loadGuidance();
  }, [loadGuidance]);

  if (!guidanceLoaded || dismissed) return null;

  const guide = (() => {
    if (layers.length === 0) {
      return {
        step: 1,
        icon: UploadCloud,
        title: "Start with your data",
        body: "Upload a GeoJSON, KML or zipped Shapefile. Sample files are in the project's examples folder.",
        action: { label: "Browse files", run: () => fileRef.current?.click() },
      };
    }
    if (mode === "analysis") {
      return {
        step: 2,
        icon: LayoutPanelTop,
        title: "Now compose the sheet",
        body: "Your data is loaded. Layout mode is where you arrange the printable page and export it.",
        action: { label: "Go to Layout", run: () => setMode("layout") },
      };
    }
    if (template === "blank" && elements.length === 0) {
      return {
        step: 3,
        icon: LayoutPanelTop,
        title: "Pick a template",
        body: "A template places the title, legend, north arrow and scale for you. Choose one on the left, or keep the blank canvas and add elements yourself.",
        action: null,
      };
    }
    return null;
  })();

  if (!guide) return null;

  const Icon = guide.icon;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-5 z-30 flex justify-center px-4">
      <div className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border bg-background/97 p-3.5 shadow-lg backdrop-blur">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Step {guide.step} of {TOTAL}
            </span>
            <div className="flex gap-1">
              {Array.from({ length: TOTAL }, (_, i) => (
                <span
                  key={i}
                  className={`h-1 w-4 rounded-full ${
                    i < guide.step ? "bg-primary" : "bg-muted-foreground/25"
                  }`}
                />
              ))}
            </div>
          </div>

          <p className="mt-1 text-sm font-semibold">{guide.title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{guide.body}</p>

          {guide.action && (
            <Button size="sm" className="mt-2.5 h-7" onClick={guide.action.run}>
              {guide.action.label}
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 shrink-0"
          title="Dismiss"
          onClick={dismiss}
        >
          <X className="h-3.5 w-3.5" />
        </Button>

        {/* Its own input, so the prompt works without reaching into the sidebar. */}
        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".geojson,.json,.kml,.zip"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
