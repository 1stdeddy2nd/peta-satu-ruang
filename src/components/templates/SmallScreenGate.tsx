"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Monitor } from "lucide-react";

export const MIN_APP_WIDTH = 1024;

export function SmallScreenGate({ children }: { children: ReactNode }) {
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (width === null) return null;

  if (width < MIN_APP_WIDTH) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-muted/40 px-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background shadow-sm">
          <Monitor className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-lg font-semibold">Screen too narrow</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            MapCanva needs at least {MIN_APP_WIDTH}px of width to show the map, the
            page canvas and the tools side by side.
          </p>
        </div>
        <p className="rounded-full bg-background px-3 py-1 text-xs tabular-nums text-muted-foreground shadow-sm">
          Current width: {width}px
        </p>
        <p className="text-xs text-muted-foreground">
          Resize the window, or open it on a laptop or desktop.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
