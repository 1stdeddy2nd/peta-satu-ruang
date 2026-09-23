"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PanelSection } from "@/components/atoms/PanelSection";
import { Field } from "@/components/atoms/Field";
import { SelectField } from "@/components/atoms/SelectField";
import { TemplateCard } from "@/components/molecules/TemplateCard";
import {
  useLayout,
  buildTemplate,
  TEMPLATE_CATALOG,
  type PageOrientation,
  type PageSize,
  type TemplateId,
} from "@/contexts/layout";
import { useMapSettings } from "@/contexts/map";

export function TemplatePanel() {
  const template = useLayout((s) => s.template);
  const elements = useLayout((s) => s.elements);
  const page = useLayout((s) => s.page);
  const applyTemplate = useLayout((s) => s.applyTemplate);
  const setPageSize = useLayout((s) => s.setPageSize);
  const setOrientation = useLayout((s) => s.setOrientation);
  const setGraticule = useMapSettings((s) => s.setGraticule);

  const [pending, setPending] = useState<TemplateId | null>(null);

  const commit = (id: TemplateId) => {
    applyTemplate(id);
    setGraticule({ enabled: buildTemplate(id, page).graticuleEnabled });
    setPending(null);
  };

  const handleSelect = (id: TemplateId) => {
    if (id === template) return;
    if (elements.length > 0) setPending(id);
    else commit(id);
  };

  return (
    <>
      <PanelSection title="Page format">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Size">
            <SelectField<PageSize>
              value={page.size}
              onChange={setPageSize}
              options={[
                { value: "A4", label: "A4" },
                { value: "A3", label: "A3" },
              ]}
              className="h-8"
            />
          </Field>
          <Field label="Orientation">
            <SelectField<PageOrientation>
              value={page.orientation}
              onChange={setOrientation}
              options={[
                { value: "portrait", label: "Portrait" },
                { value: "landscape", label: "Landscape" },
              ]}
              className="h-8"
            />
          </Field>
        </div>
      </PanelSection>

      <PanelSection title="Template">
        <div className="flex flex-col gap-2">
          {TEMPLATE_CATALOG.map((meta) => (
            <TemplateCard
              key={meta.id}
              template={meta}
              orientation={page.orientation}
              active={template === meta.id}
              onSelect={() => handleSelect(meta.id)}
            />
          ))}
        </div>
      </PanelSection>

      <Dialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replace current layout?</DialogTitle>
            <DialogDescription>
              Applying a template clears the {elements.length} element
              {elements.length === 1 ? "" : "s"} on the page and rebuilds it from the
              template. Your uploaded data and map position are not affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button onClick={() => pending && commit(pending)}>Apply template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
