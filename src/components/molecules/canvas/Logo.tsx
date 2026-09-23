import { ImageIcon } from "lucide-react";
import type { LogoElement } from "@/contexts/layout";

export function Logo({ element }: { element: LogoElement }) {
  if (!element.src) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-sm border border-dashed border-black/25 bg-white/60 text-black/35">
        <ImageIcon className="h-5 w-5" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={element.src}
      alt="Logo"
      draggable={false}
      className="h-full w-full select-none object-contain"
    />
  );
}
