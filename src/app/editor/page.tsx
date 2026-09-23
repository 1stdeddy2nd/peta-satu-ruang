"use client";

import { MapProvider } from "@/contexts/map";
import { AppShell } from "@/components/templates/AppShell";
import { SmallScreenGate } from "@/components/templates/SmallScreenGate";

export default function EditorPage() {
  return (
    <SmallScreenGate>
      <MapProvider>
        <AppShell />
      </MapProvider>
    </SmallScreenGate>
  );
}
