import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  inline = false,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  inline?: boolean;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  if (inline) {
    return (
      <div className={cn("flex items-center justify-between gap-3", className)}>
        <Label htmlFor={htmlFor} className="text-xs font-normal text-muted-foreground">
          {label}
        </Label>
        {children}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-xs font-normal text-muted-foreground">
          {label}
        </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground/80">{hint}</p>}
    </div>
  );
}
