import type { LegendElement, LegendEntry } from "@/contexts/layout";

function Symbol({ color, symbol }: Pick<LegendEntry, "color" | "symbol">) {
  if (symbol === "point") {
    return (
      <span
        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ background: color }}
      />
    );
  }
  if (symbol === "line") {
    return <span className="inline-block h-0.5 w-4 shrink-0" style={{ background: color }} />;
  }
  return (
    <span
      className="inline-block h-3 w-4 shrink-0 border"
      style={{ background: `${color}40`, borderColor: color }}
    />
  );
}

export function Legend({ element }: { element: LegendElement }) {
  return (
    <div
      className="h-full w-full select-none overflow-hidden rounded-sm border border-black/20 bg-white/90 p-2 text-black"
      style={{ fontSize: element.fontSize }}
    >
      <div className="mb-1.5 font-semibold" style={{ fontSize: element.fontSize + 1 }}>
        {element.title}
      </div>
      <div className="flex flex-col gap-1">
        {element.entries.map((entry) => (
          <div key={entry.id} className="flex items-center gap-2">
            <Symbol color={entry.color} symbol={entry.symbol} />
            <span className="truncate">{entry.label}</span>
          </div>
        ))}
        {element.entries.length === 0 && (
          <span className="italic text-black/45">No entries</span>
        )}
      </div>
    </div>
  );
}
