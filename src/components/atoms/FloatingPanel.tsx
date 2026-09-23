import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function FloatingPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "pointer-events-auto rounded-xl border border-slate-200 bg-white text-slate-900 shadow-lg shadow-slate-900/10",
        className
      )}
    >
      {children}
    </div>
  );
}
