export type PvmbgLevel = 1 | 2 | 3 | 4;

export interface VolcanoPastEruption {
  eruptedAt: string;
  // null when PVMBG reports "Visual letusan tidak teramati".
  ashColumnM: number | null;
  ashDirection: string | null;
}

export interface VolcanoEruption extends VolcanoPastEruption {
  ongoing: boolean;
}

export interface MagmaEruptionNotice extends VolcanoPastEruption {
  // MAGMA's own notice id, from its "Details" link.
  id: string;
  volcanoName: string;
}

export interface VolcanoEruptionHistory {
  // Every eruption in the history window, newest first.
  times: string[];
  recent: VolcanoPastEruption[];
}

export interface VolcanoRecommendation {
  text: string;
  // The furthest distance the recommendation names, so a sectoral danger zone
  // (Semeru: 13 km south-east) is never shown as its smaller radius (5 km).
  maxDistanceKm: number | null;
}

export interface MagmaVolcano {
  code: string;
  name: string;
  province: string;
  lat: number;
  lon: number;
  level: PvmbgLevel;
  erupting: boolean;
  latestEruption: VolcanoEruption | null;
  recommendation: VolcanoRecommendation | null;
}

// Badan Geologi's classes: A erupted since 1600, B only before 1600, C no
// recorded eruption but still has solfatara or fumaroles.
export type VolcanoType = "A" | "B" | "C";

