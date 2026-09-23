"use client";

import { SelectField } from "./SelectField";

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48];

export function FontSizeSelect({
  value,
  onChange,
  className = "h-8 w-24",
}: {
  value: number;
  onChange: (size: number) => void;
  className?: string;
}) {
  const sizes = FONT_SIZES.includes(value)
    ? FONT_SIZES
    : [...FONT_SIZES, value].sort((a, b) => a - b);

  return (
    <SelectField
      value={String(value)}
      onChange={(v) => onChange(Number(v))}
      options={sizes.map((size) => ({ value: String(size), label: `${size}px` }))}
      className={className}
    />
  );
}
