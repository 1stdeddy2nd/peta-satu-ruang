import { cn } from "@/lib/utils";

export function Toggle({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-[18px] w-8 shrink-0 items-center rounded-full p-0.5 transition-colors",
        checked ? "bg-slate-800" : "bg-slate-300"
      )}
    >
      <span
        className={cn("h-[14px] w-[14px] rounded-full bg-white shadow transition-transform", checked && "translate-x-[14px]")}
      />
    </span>
  );
}
