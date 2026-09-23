"use client";

import { MapProvider } from "@/contexts/map";
import { MapDashboard } from "@/components/templates/MapDashboard";

export default function Home() {
  return (
    <MapProvider locale="id" eventMode>
      <MapDashboard />
    </MapProvider>
  );
}
