import type { DividerElement } from "@/contexts/layout";

export function Divider({ element }: { element: DividerElement }) {
  return (
    <div
      className="h-full w-full select-none"
      style={
        element.orientation === "horizontal"
          ? { borderTop: `${element.thickness}px solid ${element.color}` }
          : { borderLeft: `${element.thickness}px solid ${element.color}` }
      }
    />
  );
}
