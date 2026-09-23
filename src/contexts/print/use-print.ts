"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useLayout } from "@/contexts/layout/layout-store";
import { exportPageAsPdf, exportPageAsPng } from "./print-utils";

export type ExportFormat = "pdf" | "png";

export function usePrint() {
  const page = useLayout((s) => s.page);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);

  const exportAs = useCallback(
    async (format: ExportFormat) => {
      setExporting(format);
      try {
        if (format === "pdf") await exportPageAsPdf(page);
        else await exportPageAsPng();
        toast.success(`Exported as ${format.toUpperCase()}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Export failed");
      } finally {
        setExporting(null);
      }
    },
    [page]
  );

  return { exportAs, exporting, isExporting: exporting !== null };
}
