"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A card pinned to the bottom of the screen — the mobile stand-in for a
 * popover or an anchored popup, which have nowhere good to anchor to on a
 * small screen. No backdrop by default: like the timeline card, it sits over
 * the map without dimming or blocking it. Pass `backdrop` for a true modal
 * (dims the map, tap-outside/Escape closes it) if a future case needs one.
 */
export function Drawer({
  open,
  onClose,
  children,
  backdrop = false,
  ariaLabel,
  title,
  className,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  backdrop?: boolean;
  ariaLabel: string;
  title?: string;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[60] flex items-end justify-center",
        backdrop ? "bg-slate-900/40 p-3 backdrop-blur-[2px] pointer-events-auto" : "pointer-events-none p-2"
      )}
      onClick={backdrop ? onClose : undefined}
    >
      <div
        role="dialog"
        aria-modal={backdrop}
        aria-label={ariaLabel}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "pointer-events-auto max-h-[80dvh] w-full max-w-[460px] overflow-y-auto rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl shadow-slate-900/25",
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <h2 className="text-[14px] font-bold leading-tight">{title}</h2>
            <button
              type="button"
              aria-label="Tutup"
              onClick={onClose}
              className="-mr-1 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
}
