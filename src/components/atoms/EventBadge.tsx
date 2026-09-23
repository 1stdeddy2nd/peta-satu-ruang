import { EVENT_GRADIENT, type EventKind } from "@/contexts/map";
import { cn } from "@/lib/utils";
import { EventGlyph } from "./EventGlyph";

const GLYPH_FOR = { fire: "fire", quake: "quake", volcano: "eruption" } as const;

export function EventBadge({ kind, className }: { kind: EventKind; className?: string }) {
  const [from, to] = EVENT_GRADIENT[kind];
  return (
    <span
      className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white shadow-sm ring-[1.5px] ring-white", className)}
      style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      <EventGlyph name={GLYPH_FOR[kind]} className="h-[58%] w-[58%]" />
    </span>
  );
}
