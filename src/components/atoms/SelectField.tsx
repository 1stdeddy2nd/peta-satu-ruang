"use client";

import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

export function SelectField<T extends string>({
  value,
  onChange,
  options,
  className = "h-8 w-full",
  disabled,
  "aria-label": ariaLabel,
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly SelectOption<T>[];
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  const items = useMemo(
    () => Object.fromEntries(options.map((o) => [o.value, o.label])),
    [options]
  );

  return (
    <Select
      items={items}
      value={value}
      onValueChange={(v) => onChange(v as T)}
      disabled={disabled}
    >
      <SelectTrigger className={className} aria-label={ariaLabel}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
