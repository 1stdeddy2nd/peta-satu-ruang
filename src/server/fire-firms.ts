import { fireConfidenceBand, wibDayIso } from "@/lib/fire-utils";
import type { FireConfidenceBand } from "@/lib/fire-types";

const FIRMS_SOURCES = ["MODIS_NRT", "VIIRS_SNPP_NRT"] as const;

const INDONESIA_BBOX = "94.0,-11.5,141.5,6.5";


interface FirmsDetection {
  key: string;
  lat: number;
  lon: number;
  detectedAt: Date;
  day: Date;
  confidence: string;
  band: FireConfidenceBand;
  sensor: string;
  satellite: string;
  brightnessK: number | null;
  frpMw: number | null;
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    return Object.fromEntries(headers.map((h, i) => [h, cells[i]]));
  });
}

function toIsoTime(date: string, time: string): string {
  const padded = time.padStart(4, "0");
  return `${date}T${padded.slice(0, 2)}:${padded.slice(2)}:00Z`;
}

/**
 * `startDate` is the first day of the window (`YYYY-MM-DD`); omit it for the
 * most recent `dayRange` days. FIRMS returns 200 with a plain-text error body
 * on a bad key or an exhausted quota, not an HTTP error status.
 */
export async function fetchFirmsWindow(
  mapKey: string,
  dayRange: number,
  startDate?: string
): Promise<FirmsDetection[]> {
  const results = await Promise.all(
    FIRMS_SOURCES.map(async (source) => {
      const suffix = startDate ? `/${startDate}` : "";
      const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${mapKey}/${source}/${INDONESIA_BBOX}/${dayRange}${suffix}`;
      const res = await fetch(url);
      const text = await res.text();
      if (!res.ok || /invalid|error|<html/i.test(text.slice(0, 200))) {
        throw new Error(`FIRMS ${source} request failed: ${text.slice(0, 200)}`);
      }
      return parseCsv(text);
    })
  );

  return results.flat().flatMap((row) => {
    const lat = Number(row.latitude);
    const lon = Number(row.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lon) || !row.acq_date) return [];

    const detectedAt = new Date(toIsoTime(row.acq_date, row.acq_time));
    const confidence = row.confidence ?? "";

    return [
      {
        // FIRMS has no id of its own; this is stable across overlapping windows.
        key: `${row.instrument}:${lat.toFixed(5)}:${lon.toFixed(5)}:${detectedAt.toISOString()}`,
        lat,
        lon,
        detectedAt,
        day: new Date(`${wibDayIso(detectedAt)}T00:00:00Z`),
        confidence,
        band: fireConfidenceBand(confidence),
        sensor: row.instrument,
        satellite: row.satellite,
        // MODIS reports channel-21/22 brightness temperature as `brightness`,
        // VIIRS the I-4 band as `bright_ti4`.
        brightnessK: Number(row.brightness ?? row.bright_ti4) || null,
        frpMw: Number(row.frp) || null,
      },
    ];
  });
}
