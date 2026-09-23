export const CATEGORY_MAX_LENGTH = 60;
export const CARD_WIDTH_MIN = 200;
export const CARD_WIDTH_MAX = 420;
export const CARD_WIDTH_DEFAULT = 270;
export const CARD_HEIGHT_MIN = 70;
export const CARD_HEIGHT_MAX = 260;
export const CARD_HEIGHT_DEFAULT = 96;
function clamp(value, min, max, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}
export const THEMES = ["mint", "blue", "peach", "lilac", "sand", "rose"];
export const ICONS = [
  "building",
  "globe",
  "wifi",
  "graduation",
  "shield",
  "files",
  "chart",
  "users",
  "database",
  "briefcase",
];
export const STORAGE_KEY = "drids-workspace-v1";

// Replace these starter resources with your region's own systems before publishing.
export const DEFAULT_SYSTEMS = [
  {
    id: "edtr",
    title: "eDTR",
    description: "Electronic Daily Time Record.",
    url: "https://edtr10.github.io/regional/",
    category: "Internal Systems",
    icon: "users",
    theme: "mint",
    cover: "",
    favorite: false,
  },
  {
    id: "edtms",
    title: "eDTMS",
    description: "Electronic Document Tracking Management System.",
    url: "https://edtr10.github.io/dtms",
    category: "Internal Systems",
    icon: "files",
    theme: "blue",
    cover: "",
    favorite: false,
  },
  {
    id: "efas",
    title: "eFAS",
    description: "Electronic Financial and Accountability System.",
    url: "https://edtr10.github.io/e-fas/",
    category: "Internal Systems",
    icon: "chart",
    theme: "peach",
    cover: "",
    favorite: false,
  },
  {
    id: "etms",
    title: "eTMS",
    description: "Electronic Task Management System.",
    url: "https://edtr10.github.io/etms/",
    category: "Internal Systems",
    icon: "briefcase",
    theme: "lilac",
    cover: "",
    favorite: false,
  },
  {
    id: "kms",
    title: "KMS",
    description: "DICT 10 Knowledge Management System.",
    url: "https://edtr10.github.io/kms/",
    category: "Internal Systems",
    icon: "database",
    theme: "sand",
    cover: "",
    favorite: false,
  },
  {
    id: "ebrs",
    title: "eBRS",
    description: "Electronic Booking and Reservation System.",
    url: "https://edtr10.github.io/bookings/",
    category: "Internal Systems",
    icon: "building",
    theme: "rose",
    cover: "",
    favorite: false,
  },
];

export function isWebUrl(value) {
  if (typeof value !== "string" || value.length > 4096) return false;
  try {
    const url = new URL(value);
    return (
      ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export function isHexColor(value) {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

export function validateWorkspace(data) {
  if (
    !data ||
    data.version !== 1 ||
    !Array.isArray(data.systems) ||
    data.systems.length > 250
  )
    throw new Error("Choose a valid DRIDS backup with up to 250 systems.");
  const ids = new Set();
  const systems = data.systems.map((s) => {
    if (
      !s ||
      typeof s.id !== "string" ||
      !s.id ||
      ids.has(s.id) ||
      typeof s.title !== "string" ||
      !s.title.trim() ||
      s.title.length > 80 ||
      typeof s.description !== "string" ||
      s.description.length > 240 ||
      !isWebUrl(s.url) ||
      typeof s.category !== "string" ||
      s.category.length > CATEGORY_MAX_LENGTH ||
      !ICONS.includes(s.icon) ||
      !(THEMES.includes(s.theme) || isHexColor(s.theme)) ||
      (s.cover && !isWebUrl(s.cover))
    )
      throw new Error(
        "The backup contains an invalid system. No changes were made.",
      );
    ids.add(s.id);
    return {
      id: s.id,
      title: s.title.trim(),
      description: s.description,
      url: s.url,
      category: s.category.trim(),
      icon: s.icon,
      theme: s.theme,
      cover: s.cover || "",
      favorite: !!s.favorite,
    };
  });
  return {
    version: 1,
    systems,
    layout: ["list", "custom"].includes(data.layout) ? data.layout : "grid",
    columns: [1, 2, 3, 4].includes(data.columns) ? data.columns : 3,
    cardWidth: clamp(
      data.cardWidth,
      CARD_WIDTH_MIN,
      CARD_WIDTH_MAX,
      CARD_WIDTH_DEFAULT,
    ),
    cardHeight: clamp(
      data.cardHeight,
      CARD_HEIGHT_MIN,
      CARD_HEIGHT_MAX,
      CARD_HEIGHT_DEFAULT,
    ),
    showCovers: data.showCovers !== false,
    showHero: data.showHero !== false,
    showStats: data.showStats !== false,
    appearance: data.appearance === "dark" ? "dark" : "light",
    recent: Array.isArray(data.recent)
      ? [...new Set(data.recent.filter((id) => ids.has(id)))].slice(0, 12)
      : [],
  };
}

export function defaultWorkspace() {
  return {
    version: 1,
    systems: DEFAULT_SYSTEMS.map((s) => ({ ...s })),
    layout: "grid",
    columns: 3,
    cardWidth: CARD_WIDTH_DEFAULT,
    cardHeight: CARD_HEIGHT_DEFAULT,
    showCovers: true,
    showHero: true,
    showStats: true,
    appearance: "light",
    recent: [],
  };
}

export function readWorkspace() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return {
      workspace: raw ? validateWorkspace(JSON.parse(raw)) : defaultWorkspace(),
      error: "",
    };
  } catch {
    return {
      workspace: defaultWorkspace(),
      error:
        "Saved settings could not be loaded. Starter systems are shown; export changes to keep a backup.",
    };
  }
}
