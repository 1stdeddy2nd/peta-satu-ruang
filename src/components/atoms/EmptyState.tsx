import type { ElementType, ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: ElementType;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-7 text-center">
      <Icon className="h-5 w-5 text-muted-foreground/70" />
      <p className="text-xs font-medium">{title}</p>
      {description && (
        <p className="max-w-[24ch] text-[11px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
