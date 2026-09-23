"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/atoms/SelectField";
import type { AdminBoundaryOption } from "@/lib/admin-types";

const LEVELS = [
  { level: 1, label: "Province", placeholder: "Choose a province" },
  { level: 2, label: "City / Regency", placeholder: "Choose a city or regency" },
  { level: 3, label: "District", placeholder: "Choose a district" },
  { level: 4, label: "Village", placeholder: "Choose a village" },
] as const;

const NONE = "";

interface Chosen {
  id: string;
  pcode: string;
  name: string;
}

/** Any level can be imported; drilling down to a village is not required. */
export function AdminBoundaryPicker({
  onSelect,
  disabled,
}: {
  onSelect: (boundaryId: string) => void;
  disabled?: boolean;
}) {
  const [options, setOptions] = useState<Record<number, AdminBoundaryOption[]>>({});
  const [chosen, setChosen] = useState<Record<number, Chosen | undefined>>({});

  const load = useCallback(async (level: number, parent?: string) => {
    const query = new URLSearchParams({ level: String(level) });
    if (parent) query.set("parent", parent);
    const res = await fetch(`/api/admin-boundaries?${query}`);
    if (!res.ok) return;
    const data = await res.json();
    setOptions((prev) => ({ ...prev, [level]: data.options ?? [] }));
  }, []);

  useEffect(() => {
    void load(1);
  }, [load]);

  const choose = (level: number, pcode: string) => {
    const picked = options[level]?.find((o) => o.pcode === pcode);

    setChosen((prev) => {
      const next: Record<number, Chosen | undefined> = { ...prev, [level]: picked };
      for (let deeper = level + 1; deeper <= 4; deeper++) next[deeper] = undefined;
      return next;
    });
    setOptions((prev) => {
      const next = { ...prev };
      for (let deeper = level + 1; deeper <= 4; deeper++) delete next[deeper];
      return next;
    });

    if (picked && level < 4) void load(level + 1, picked.pcode);
  };

  // Only district and village are offered as imports: 88% of cities and every
  // province hold more buildings than can be drawn, so the deeper levels are
  // navigation rather than a choice.
  const importable = chosen[4] ?? chosen[3];

  return (
    <div className="flex flex-col gap-2">
      {LEVELS.map(({ level, label, placeholder }) => {
        const list = options[level] ?? [];
        const parentChosen = level === 1 || Boolean(chosen[level - 1]);
        return (
          <SelectField
            key={level}
            aria-label={label}
            value={chosen[level]?.pcode ?? NONE}
            onChange={(v) => choose(level, v)}
            disabled={!parentChosen || list.length === 0}
            options={[
              { value: NONE, label: parentChosen ? placeholder : `${label} —` },
              ...list.map((o) => ({ value: o.pcode, label: o.name })),
            ]}
          />
        );
      })}

      <Button
        size="sm"
        className="w-full justify-start gap-2"
        disabled={!importable || disabled}
        onClick={() => importable && onSelect(importable.id)}
      >
        <Building2 className="h-3.5 w-3.5" />
        {importable ? `Import buildings in ${importable.name}` : "Choose a district or village"}
      </Button>
    </div>
  );
}
