"use client";

import { useCallback } from "react";
import { useMap } from "@/contexts/map";
import { cn } from "@/lib/utils";

export function MapViewport({ className }: { className?: string }) {
  const { attach } = useMap();

  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      attach(node);
    },
    [attach]
  );

  return <div ref={ref} className={cn("h-full w-full", className)} />;
}
