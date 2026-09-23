export interface VolcanoKrbZone {
  level: 1 | 2 | 3;
  radiusKm: number;
  color: string;
  description: string;
  plain: string;
}

export interface VolcanoKrbData {
  sourceLabel: string;
  sourceUrl: string;
  zones: VolcanoKrbZone[];
}

// Keyed by MAGMA's volcano code. Transcribed by hand from Badan Geologi's
// published KRB maps — there is no feed; add a volcano only from its own map.
export const VOLCANO_KRB: Record<string, VolcanoKrbData> = {
  KRA: {
    sourceLabel: "Badan Geologi, Kementerian ESDM",
    sourceUrl:
      "https://geologi.esdm.go.id/media-center/perkembangan-erupsi-gunungapi-anak-krakatau-tanggal-7-september-2026",
    zones: [
      {
        level: 3,
        radiusKm: 2,
        color: "#dc2626",
        description: "Sering terlanda aliran lava, awan panas, hujan abu lebat dan lontaran batu pijar/bom vulkanik",
        plain: "Paling berbahaya — sering dilewati lava dan awan panas",
      },
      {
        level: 2,
        radiusKm: 5,
        color: "#f472b6",
        description: "Berpotensi terlanda aliran lava, awan panas, hujan abu lebat dan lontaran batu pijar",
        plain: "Bisa terkena lava, awan panas, dan hujan abu tebal",
      },
      {
        level: 1,
        radiusKm: 8,
        color: "#fde047",
        description: "Berpotensi terhadap hujan abu dan lontaran batu pijar",
        plain: "Bisa terkena hujan abu dan batu panas",
      },
    ],
  },
};
