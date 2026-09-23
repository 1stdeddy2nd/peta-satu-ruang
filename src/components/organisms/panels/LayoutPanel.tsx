"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { PanelSection } from "@/components/atoms/PanelSection";
import { TemplatePanel } from "./TemplatePanel";
import { ElementsPanel } from "./ElementsPanel";
import { PropertiesPanel } from "./PropertiesPanel";
import { PageSettingsPanel } from "./PageSettingsPanel";

export function LayoutPanel() {
  return (
    <Tabs defaultValue="design" className="flex min-h-0 flex-1 flex-col">
      <div className="px-4 pt-3">
        <TabsList className="w-full">
          <TabsTrigger value="design" className="flex-1">
            Design
          </TabsTrigger>
          <TabsTrigger value="page" className="flex-1">
            Page &amp; map
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="design" className="min-h-0 flex-1">
        <ScrollArea className="h-full">
          <div className="flex flex-col gap-5 p-4">
            <TemplatePanel />
            <Separator />
            <ElementsPanel />
            <Separator />
            <PanelSection title="Properties">
              <PropertiesPanel />
            </PanelSection>
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="page" className="min-h-0 flex-1">
        <ScrollArea className="h-full">
          <div className="p-4">
            <PageSettingsPanel />
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}
