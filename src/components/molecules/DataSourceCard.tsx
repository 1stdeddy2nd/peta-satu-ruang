import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";

/**
 * One entry in the Data Library (MC-060) — a source MapCanva already has
 * integrated, shown with enough to decide whether to use it (what it is,
 * how current it is, what it's licensed under) and a link to the actual
 * upstream source, for a user who wants the raw data itself.
 */
export function DataSourceCard({
  title,
  description,
  meta,
  sourceUrl,
  sourceLabel = "View source",
  children,
}: {
  title: string;
  description: string;
  meta: string;
  sourceUrl: string;
  sourceLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{meta}</span>
        <a
          href={sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 hover:text-foreground hover:underline"
        >
          {sourceLabel}
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
