import { FIRE_BAND_MIN_PERCENT } from "@/lib/fire-constants";
import type { FireConfidenceBand } from "@/lib/fire-types";
import { QUAKE_STRONG_MAGNITUDE } from "@/lib/quake-constants";
import type { QuakeBand } from "@/lib/quake-types";
import type { PvmbgLevel } from "@/lib/volcano-types";
import type { EventKind } from "./map-types";

export const ADMIN_AREA_LEVEL_LABEL: Record<number, string> = {
  1: "Provinsi",
  2: "Kota / Kabupaten",
  3: "Kecamatan",
  4: "Desa / Kelurahan",
};

// SiPongi+'s own legend: red at 80-100%, yellow at 30-79%, green below that.
// The bands themselves already follow its thresholds.
export const FIRE_CONFIDENCE_COLOR: Record<FireConfidenceBand, string> = {
  high: "#dc2626",
  medium: "#eab308",
  low: "#16a34a",
};

// Stacking order on the map. An earthquake or an eruption must never end up
// behind a volcano that is only sitting there.
export const EVENT_Z = {
  volcanoZone: 16,
  fire: 17,
  volcano: 18,
  pulse: 19,
  quake: 20,
  eruptionEffect: 20.5,
  erupting: 21,
} as const;

// A whole window replays in this long at 1×, whatever its length.
export const REPLAY_DURATION_MS = 30_000;
export const REPLAY_TICK_MS = 100;

// Below this a building is a few pixels, so none are fetched or drawn.
export const BUILDINGS_MIN_ZOOM = 13;

export const FIRE_CONFIDENCE_LABEL_ID: Record<FireConfidenceBand, string> = {
  high: "tinggi",
  medium: "sedang",
  low: "rendah",
};

export const PVMBG_LEVEL_COLOR: Record<PvmbgLevel, string> = {
  1: "#16a34a",
  2: "#eab308",
  3: "#f97316",
  4: "#dc2626",
};

export const PVMBG_LEVEL_LABEL: Record<PvmbgLevel, string> = {
  1: "Level I · Normal",
  2: "Level II · Waspada",
  3: "Level III · Siaga",
  4: "Level IV · Awas",
};

export const PVMBG_LEVEL_NAME: Record<PvmbgLevel, string> = {
  1: "NORMAL",
  2: "WASPADA",
  3: "SIAGA",
  4: "AWAS",
};

export const PVMBG_LEVELS: PvmbgLevel[] = [4, 3, 2, 1];

export const UNMONITORED_VOLCANO_COLOR = "#94a3b8";

export const QUAKE_COLOR = "#a16207";

export const BOUNDARY_ATTRIBUTION =
  '<a href="https://data.humdata.org/dataset/cod-ab-idn" target="_blank" rel="noreferrer">BPS/HDX</a>';

export const BUILDINGS_ATTRIBUTION =
  '<a href="https://github.com/microsoft/IdMyPhBuildingFootprints" target="_blank" rel="noreferrer">Microsoft</a>';

// The summary chip's label, and the wider title once its card is open — the
// chip counts eruptions, but the card it opens is about the volcanoes.
export const EVENT_KIND_LABEL: Record<EventKind, string> = { fire: "Titik api", volcano: "Gunung erupsi", quake: "Gempa" };
export const EVENT_CARD_TITLE: Record<EventKind, string> = { fire: "Titik api", volcano: "Gunung api", quake: "Gempa" };

export const EVENT_CHIP_OPEN_CLASS: Record<EventKind, string> = {
  fire: "border-orange-200 bg-orange-50",
  volcano: "border-red-200 bg-red-50",
  quake: "border-violet-200 bg-violet-50",
};

export const FIRE_CONFIDENCE_DETAIL: Record<FireConfidenceBand, string> = {
  high: `≥${FIRE_BAND_MIN_PERCENT.high}% · paling akurat`,
  medium: `${FIRE_BAND_MIN_PERCENT.medium}–${FIRE_BAND_MIN_PERCENT.high - 1}% · perlu dicek`,
  low: `<${FIRE_BAND_MIN_PERCENT.medium}% · sering meleset`,
};

export const QUAKE_BAND_LABEL: Record<QuakeBand, string> = {
  strong: `M ${QUAKE_STRONG_MAGNITUDE.toFixed(1)} ke atas`,
  moderate: "M 3,0 – 4,9",
  light: "Di bawah M 3,0",
};

export const QUAKE_BAND_DETAIL: Record<QuakeBand, string> = {
  strong: "Bisa merusak",
  moderate: "Sering terasa",
  light: "Jarang terasa",
};

// Copy for Katalog data's Administrasi rows and their ⓘ panels, kept together
// so the row label and the panel title never drift into two different words
// for the same thing. One place to translate, too.
export const MAP_LAYER_INFO = {
  boundary: {
    title: "Batas wilayah",
    detail: "Garis provinsi, kota, kecamatan, desa",
    body: "Garis administrasi resmi Indonesia, dari provinsi sampai desa. Dipakai untuk menyorot wilayah yang Anda pilih dan menghitung kejadian di dalamnya. Batasnya mengikuti data Badan Pusat Statistik terbitan sekitar 2020, dibagikan lewat UN OCHA/HDX dengan lisensi CC BY-IGO.",
    source: { name: "Badan Pusat Statistik", href: "https://data.humdata.org/dataset/cod-ab-idn" },
  },
  buildings: {
    title: "Bangunan",
    detail: "Denah bangunan dari citra satelit",
    body: "Denah bangunan hasil deteksi citra satelit, bukan sensus: sebagian bangunan bisa terlewat atau tergambar kasar. Hanya untuk kota, kecamatan, atau desa yang dipilih, dan muncul setelah peta diperbesar. Data Microsoft Building Footprints, lisensi CDLA Permissive 2.0, terakhir diperbarui sekitar 2024.",
    source: { name: "Microsoft Building Footprints", href: "https://github.com/microsoft/IdMyPhBuildingFootprints" },
  },
} as const;

export type MapLayerInfoKey = keyof typeof MAP_LAYER_INFO;
