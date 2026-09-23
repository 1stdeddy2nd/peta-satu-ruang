"use client";

import { useEffect, useState } from "react";
import { Book } from "lucide-react";
import { Drawer } from "@/components/atoms/Drawer";
import { SourceLink } from "@/components/atoms/SourceLink";
import { useMapSettings } from "@/contexts/map";

// The native OL attribution strip is hidden below the tablet breakpoint
// (print.scss) because its cramped, horizontally-scrolling links are hard to
// read and harder to tap. This reads the same live list — OL keeps it current
// as layers turn on and off — and shows it as a proper sheet instead.
// OSM's own credit is plain text, not a link — every other source is.
const OSM_COPYRIGHT_URL = "https://www.openstreetmap.org/copyright";

function currentSources() {
  return Array.from(document.querySelectorAll(".ol-attribution li")).map((li) => {
    const a = li.querySelector("a");
    return a ? { name: a.textContent ?? "", href: a.href } : { name: li.textContent ?? "", href: OSM_COPYRIGHT_URL };
  });
}

export function MobileAttribution() {
  const activeMobileDrawer = useMapSettings((s) => s.activeMobileDrawer);
  const setActiveMobileDrawer = useMapSettings((s) => s.setActiveMobileDrawer);
  const [open, setOpen] = useState(false);
  const [sources, setSources] = useState<{ name: string; href: string }[]>([]);

  // A hazard card or a marker's popup opened — they render at the same spot.
  useEffect(() => {
    if (open && activeMobileDrawer !== "sources") setOpen(false);
  }, [activeMobileDrawer, open]);

  return (
    <>
      <button
        type="button"
        aria-label="Sumber peta"
        onClick={() => {
          setSources(currentSources());
          setOpen(true);
          setActiveMobileDrawer("sources");
        }}
        className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/90 text-slate-500 shadow-md shadow-slate-900/10 backdrop-blur transition-colors hover:text-slate-900 sm:hidden"
      >
        <Book className="h-4 w-4" />
      </button>

      <Drawer open={open} onClose={() => setOpen(false)} ariaLabel="Sumber peta" title="Sumber peta">
        <div className="p-3 pt-1">
          {sources.map((source) => (
            <SourceLink key={source.href + source.name} href={source.href} name={source.name} />
          ))}
        </div>
      </Drawer>
    </>
  );
}
