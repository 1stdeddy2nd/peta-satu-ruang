import type { TextBlockElement } from "@/contexts/layout";

export function TextBlock({ element }: { element: TextBlockElement }) {
  return (
    <div
      className="h-full w-full select-none whitespace-pre-wrap leading-snug"
      style={{
        textAlign: element.align,
        color: element.color,
        fontSize: element.fontSize,
      }}
    >
      {element.text}
    </div>
  );
}
