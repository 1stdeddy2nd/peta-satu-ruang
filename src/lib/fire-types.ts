export type FireConfidenceBand = "high" | "medium" | "low";

/** A tuple rather than an object roughly halves a day's payload. Confidence is
 * -1 for VIIRS, which publishes only h/n/l. */
export type HistoryPoint = [
  lon: number,
  lat: number,
  bandIndex: number,
  epochMinutes: number,
  sensorIndex: number,
  brightnessK: number,
  frpMw: number,
  villagePcode: string,
  confidencePct: number,
  satelliteIndex: number,
];

export interface FireHistoryDay {
  day: string;
  total: number;
  high: number;
  medium: number;
  low: number;
}

export interface FireHistoryResponse {
  day: string;
  span: number;
  points: HistoryPoint[];
  counts: Record<FireConfidenceBand, number> & { total: number };
  latestAt: string | null;
}
