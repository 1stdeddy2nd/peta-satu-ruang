import type { NorthArrowElement } from "@/contexts/layout";

export function NorthArrow({ element }: { element: NorthArrowElement }) {
  const rotation = element.rect.rotation ?? 0;

  return (
    <div
      className="flex h-full w-full select-none items-center justify-center"
      style={{ transform: `rotate(${rotation}deg)`, color: element.color }}
    >
      <svg viewBox="0 0 40 60" className="h-full w-full">
        {element.style === "classic" && (
          <g fill="currentColor">
            <polygon points="20,0 28,40 20,32" />
            <polygon
              points="20,0 12,40 20,32"
              fill="#ffffff"
              stroke="currentColor"
              strokeWidth="1"
            />
            <text x="20" y="55" textAnchor="middle" fontSize="12" fill="currentColor">
              N
            </text>
          </g>
        )}
        {element.style === "simple" && (
          <g fill="currentColor">
            <polygon points="20,2 30,42 20,34 10,42" />
            <text x="20" y="55" textAnchor="middle" fontSize="12" fill="currentColor">
              N
            </text>
          </g>
        )}
        {element.style === "compass" && (
          <g fill="currentColor">
            <circle cx="20" cy="24" r="19" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <polygon points="20,6 24,24 20,20 16,24" />
            <polygon points="20,42 24,24 20,28 16,24" fill="currentColor" opacity="0.35" />
            <text x="20" y="57" textAnchor="middle" fontSize="11" fill="currentColor">
              N
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
