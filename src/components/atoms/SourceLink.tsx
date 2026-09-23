import { ArrowUpRight } from "lucide-react";

export function SourceLink({ href, name }: { href: string; name: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="-mx-1.5 flex items-center justify-between gap-2 rounded-lg px-1.5 py-1.5 text-[12px] transition-colors hover:bg-slate-50"
    >
      <span className="truncate">
        <span className="font-medium text-slate-700">{name}</span>
      </span>
      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
    </a>
  );
}
