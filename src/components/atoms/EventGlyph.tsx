import { EVENT_GLYPHS, type EventGlyphName } from "@/contexts/map";
import { cn } from "@/lib/utils";

export function EventGlyph({ name, className }: { name: EventGlyphName; className?: string }) {
  const glyph = EVENT_GLYPHS[name];
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("h-3.5 w-3.5", className)}>
      {glyph.paths.map((d, i) =>
        glyph.filled[i] ? (
          <path key={d} d={d} fill="currentColor" />
        ) : (
          <path key={d} d={d} fill="none" stroke="currentColor" strokeWidth={2.75} strokeLinecap="round" strokeLinejoin="round" />
        )
      )}
    </svg>
  );
}
