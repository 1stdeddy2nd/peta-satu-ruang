"use client";

import { cn } from "@/lib/utils";

export function ColorInput({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (hex: string) => void;
  className?: string;
}) {
  return (
    <input
      type="color"
      value={value.slice(0, 7)}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-8 w-12 shrink-0 cursor-pointer rounded-md border bg-background p-1",
        className
      )}
    />
  );
}
