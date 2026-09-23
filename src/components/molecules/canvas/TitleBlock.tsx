import type { TitleElement } from "@/contexts/layout";

export function TitleBlock({ element }: { element: TitleElement }) {
  return (
    <div
      className="flex h-full w-full select-none flex-col justify-center"
      style={{ textAlign: element.align, color: element.color }}
    >
      <div className="font-bold leading-tight" style={{ fontSize: element.fontSize }}>
        {element.text}
      </div>
      {element.subtitle && (
        <div
          className="leading-tight opacity-75"
          style={{ fontSize: Math.max(9, element.fontSize * 0.45) }}
        >
          {element.subtitle}
        </div>
      )}
    </div>
  );
}
