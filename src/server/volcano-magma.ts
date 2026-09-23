import { MAGMA_REQUEST_GAP_MS, MAGMA_URL, MAGMA_USER_AGENT, UPSTREAM_TIMEOUT_MS } from "@/lib/volcano-constants";
import type {
  MagmaEruptionNotice,
  MagmaVolcano,
  PvmbgLevel,
  VolcanoEruption,
  VolcanoRecommendation,
} from "@/lib/volcano-types";

const MONTHS_ID = [
  "januari",
  "februari",
  "maret",
  "april",
  "mei",
  "juni",
  "juli",
  "agustus",
  "september",
  "oktober",
  "november",
  "desember",
];

const TIMEZONE_OFFSET_HOURS: Record<string, number> = { WIB: 7, WITA: 8, WIT: 9 };

interface MagmaMarker {
  ga_code: string;
  ga_nama_gapi: string;
  ga_prov_gapi: string;
  ga_lat_gapi: number;
  ga_lon_gapi: number;
  ga_status: number;
  erupt_icon: boolean;
}

async function get(path: string) {
  const res = await fetch(`${MAGMA_URL}${path}`, {
    headers: { "User-Agent": MAGMA_USER_AGENT },
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`MAGMA ${path} returned ${res.status}`);
  return res.text();
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function plainText(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&plusmn;/g, "±")
    .replace(/&deg;/g, "°")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

function parseEruption(sentence: string): VolcanoEruption | null {
  // WITA before WIT: WIT is a prefix of WITA, so the other order reads a
  // WITA time as WIT and shifts it by an hour.
  const when = /(\d{1,2}) ([A-Za-z]+) (\d{4}),? pukul (\d{1,2})[:.](\d{2}) (WITA|WIT|WIB)/.exec(sentence);
  const month = when ? MONTHS_ID.indexOf(when[2].toLowerCase()) : -1;
  if (!when || month < 0) return null;
  const eruptedAt = new Date(
    Date.UTC(Number(when[3]), month, Number(when[1]), Number(when[4]) - TIMEZONE_OFFSET_HOURS[when[6]], Number(when[5]))
  );

  // Indonesian thousands use a dot: "± 1.500 m" is fifteen hundred metres.
  const height = /tinggi kolom abu teramati\s*±?\s*([\d.,]+)\s*m di atas puncak/i.exec(sentence);
  const direction = /ke arah ([a-z\s]+?)\./i.exec(sentence);
  return {
    eruptedAt: eruptedAt.toISOString(),
    ashColumnM: height ? Number(height[1].replace(/[.,]/g, "")) : null,
    ashDirection: height && direction ? direction[1].trim() : null,
    ongoing: /erupsi masih berlangsung/i.test(sentence),
  };
}

// Requests go one at a time with a gap between them, never in parallel — see
// MAGMA_USER_AGENT for why.
export async function fetchMagmaSnapshot(): Promise<MagmaVolcano[]> {
  const home = await get("/");
  const markerStart = home.indexOf("var markersGunungApi");
  const arrayStart = home.indexOf("[", markerStart);
  if (markerStart < 0 || arrayStart < 0) throw new Error("MAGMA homepage: volcano markers not found");
  let depth = 0;
  let arrayEnd = -1;
  for (let i = arrayStart; i < home.length; i++) {
    if (home[i] === "[") depth++;
    else if (home[i] === "]" && --depth === 0) {
      arrayEnd = i;
      break;
    }
  }
  const markers = JSON.parse(home.slice(arrayStart, arrayEnd + 1)) as MagmaMarker[];
  if (markers.length === 0) throw new Error("MAGMA homepage: volcano marker list is empty");

  const volcanoes: MagmaVolcano[] = markers.map((m) => ({
    code: m.ga_code,
    name: m.ga_nama_gapi.trim(),
    province: m.ga_prov_gapi,
    lat: Number(m.ga_lat_gapi),
    lon: Number(m.ga_lon_gapi),
    level: Math.min(4, Math.max(1, Number(m.ga_status))) as PvmbgLevel,
    erupting: Boolean(m.erupt_icon),
    latestEruption: null,
    recommendation: null,
  }));

  for (const volcano of volcanoes.filter((v) => v.erupting)) {
    await wait(MAGMA_REQUEST_GAP_MS);
    const page = await get(`/v1/gunung-api/informasi-letusan/${volcano.code}`);
    const firstText = /class="timeline-text">([\s\S]*?)<\/p>/.exec(page);
    if (!firstText) continue;
    const eruption = parseEruption(plainText(firstText[1]));
    if (!eruption) continue;
    volcano.latestEruption = eruption;
  }

  await wait(MAGMA_REQUEST_GAP_MS);
  const daily = await get("/v1/gunung-api/laporan-harian");
  const body = /<tbody>([\s\S]*?)<\/tbody>/.exec(daily);
  const hasSiaga = volcanoes.some((v) => v.level >= 3);
  if (!body && hasSiaga) throw new Error("MAGMA laporan-harian: table not found");
  for (const row of body ? body[1].match(/<tr>[\s\S]*?<\/tr>/g) ?? [] : []) {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => plainText(c[1]));
    if (cells.length < 5) continue;
    const volcano = volcanoes.find((v) => v.name === cells[1]);
    if (!volcano || !cells[4]) continue;
    const distances = [...cells[4].matchAll(/(\d+(?:[.,]\d+)?)\s*km\b/gi)].map((d) =>
      Number(d[1].replace(",", "."))
    );
    const recommendation: VolcanoRecommendation = {
      text: cells[4],
      maxDistanceKm: distances.length ? Math.max(...distances) : null,
    };
    volcano.recommendation = recommendation;
  }

  return volcanoes;
}

export async function fetchEruptionNoticePage(page: number): Promise<MagmaEruptionNotice[]> {
  const html = await get(`/v1/gunung-api/informasi-letusan?page=${page}`);
  const notices: MagmaEruptionNotice[] = [];
  // Day headers are "timeline-item timeline-day", so this exact class splits
  // only the notices.
  for (const block of html.split('class="timeline-item"').slice(1)) {
    const id = /informasi-letusan\/([0-9a-f-]{36})\/show/.exec(block);
    const name = /class="timeline-title">\s*<a[^>]*>([\s\S]*?)<\/a>/.exec(block);
    const text = /class="timeline-text">([\s\S]*?)<\/p>/.exec(block);
    const eruption = text ? parseEruption(plainText(text[1])) : null;
    if (!id || !name || !eruption) continue;
    notices.push({
      id: id[1],
      volcanoName: plainText(name[1]),
      eruptedAt: eruption.eruptedAt,
      ashColumnM: eruption.ashColumnM,
      ashDirection: eruption.ashDirection,
    });
  }
  // A page of notices that parses to nothing means MAGMA changed its markup;
  // reading on would look like "no eruptions" and end the backfill early.
  if (notices.length === 0 && html.includes('class="timeline-text"')) {
    throw new Error(`MAGMA informasi-letusan page ${page}: notices found but none parsed`);
  }
  return notices;
}
