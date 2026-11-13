import {
  CRAFTS,
  CRAFT_BY_ID,
  MOTIF_BY_ID,
  PRODUCT_BY_ID,
  type Craft,
  type ProductTypeId,
} from "@/lib/crafts";
import {
  clamp,
  uid,
  type CanvasState,
  type Concept,
  type DesignLayer,
  type ExtractedColor,
} from "@/lib/design-types";

/* ------------------------------------------------------------------ colours */

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const int = Number.parseInt(full.slice(0, 6), 16);
  if (Number.isNaN(int)) return [128, 128, 128];
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

export function rgbToHex(r: number, g: number, b: number) {
  const to = (n: number) =>
    clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function rgbToHsl(r: number, g: number, b: number) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
    else if (max === gn) h = ((bn - rn) / d + 2) * 60;
    else h = ((rn - gn) / d + 4) * 60;
  }
  return { h, s, l };
}

export function hueDistance(a: number, b: number) {
  const raw = Math.abs(a - b) % 360;
  return raw > 180 ? 360 - raw : raw;
}

const COLOR_NAMES: { name: string; hex: string }[] = [
  { name: "Maroon", hex: "#7b2040" },
  { name: "Deep maroon", hex: "#5c1830" },
  { name: "Vermilion", hex: "#d94b39" },
  { name: "Coral", hex: "#f17d68" },
  { name: "Saffron", hex: "#f2a33a" },
  { name: "Marigold", hex: "#f4bd42" },
  { name: "Antique gold", hex: "#c49a55" },
  { name: "Terracotta", hex: "#b65a3c" },
  { name: "Rani pink", hex: "#e66a99" },
  { name: "Peach", hex: "#f7d5bb" },
  { name: "Peacock teal", hex: "#087f83" },
  { name: "Emerald", hex: "#25765a" },
  { name: "Indigo", hex: "#343e87" },
  { name: "Lavender", hex: "#e7e0f4" },
  { name: "Mint", hex: "#d8f0e9" },
  { name: "Warm ivory", hex: "#fff4de" },
  { name: "Parchment", hex: "#f7ecd9" },
  { name: "Deep ink", hex: "#292322" },
  { name: "Charcoal", hex: "#494140" },
  { name: "Stone", hex: "#8c8279" },
  { name: "Clay", hex: "#c2a189" },
];

export function nameColor(hex: string) {
  const [r, g, b] = hexToRgb(hex);
  let best = COLOR_NAMES[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of COLOR_NAMES) {
    const [cr, cg, cb] = hexToRgb(candidate.hex);
    const distance = (r - cr) ** 2 * 0.3 + (g - cg) ** 2 * 0.59 + (b - cb) ** 2 * 0.11;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }
  return best.name;
}

/** Picks readable foreground ink for a given background. */
export function readableInk(hex: string) {
  const [r, g, b] = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#292322" : "#fff4de";
}

export function darken(hex: string, amount = 0.25) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

export function lighten(hex: string, amount = 0.25) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(
    r + (255 - r) * amount,
    g + (255 - g) * amount,
    b + (255 - b) * amount,
  );
}

/* ------------------------------------------------------- craft suggestion */

function colorfulness(hex: string) {
  const [r, g, b] = hexToRgb(hex);
  const { s, l } = rgbToHsl(r, g, b);
  // Colours that read as "fabric" rather than background.
  return s * (1 - Math.abs(l - 0.5) * 1.1);
}

export type CraftSuggestion = {
  craft: Craft;
  score: number;
  confidence: number;
  reasons: string[];
};

export function suggestCrafts(
  palette: string[],
  productType: ProductTypeId,
  limit = 3,
): CraftSuggestion[] {
  const usable = palette.filter((hex) => colorfulness(hex) > 0.12).slice(0, 5);
  const scored = CRAFTS.map((craft) => {
    let score = 0;
    const reasons: string[] = [];

    let hueMatches = 0;
    for (const hex of usable) {
      const [r, g, b] = hexToRgb(hex);
      const { h } = rgbToHsl(r, g, b);
      let nearest = 999;
      for (const craftHex of craft.palette) {
        const [cr, cg, cb] = hexToRgb(craftHex);
        const ch = rgbToHsl(cr, cg, cb);
        if (ch.s < 0.16) continue;
        nearest = Math.min(nearest, hueDistance(h, ch.h));
      }
      if (nearest < 45) hueMatches += 1;
    }
    score += hueMatches * 16;
    if (hueMatches > 0) {
      reasons.push(
        `${hueMatches} of your image's strongest ${Math.min(usable.length, 5)} colours sit close to the ${craft.name} palette.`,
      );
    }

    if (craft.productFit.includes(productType)) {
      score += 14;
      reasons.push(`The ${PRODUCT_BY_ID[productType]?.label ?? productType} is a common ${craft.name} format.`);
    }

    if (craft.techniques.some((t) => /print|resist/i.test(t))) score += 2;

    return { craft, score, confidence: 0, reasons };
  });

  const max = Math.max(...scored.map((s) => s.score), 1);
  const sorted = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry, index) => ({
      ...entry,
      confidence: Math.round(clamp((entry.score / max) * (index === 0 ? 92 : 68), 24, 92)),
    }));

  // Deterministic tie-break so identical input always yields the same concept.
  return sorted;
}

/* ------------------------------------------------------------ concept build */

const TITLE_ADJECTIVES = [
  "Monsoon",
  "Marigold",
  "Indigo",
  "Bazaar",
  "Chinar",
  "Lotus",
  "Saffron",
  "Peacock",
];

function titleFor(seed: string, craft: Craft, productType: ProductTypeId) {
  const product = PRODUCT_BY_ID[productType];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 9973;
  const adjective = TITLE_ADJECTIVES[hash % TITLE_ADJECTIVES.length];
  return `${adjective} ${craft.name} ${product?.label ?? "Creation"}`;
}

export function buildConcept(args: {
  palette: string[];
  craftId: string;
  productType: ProductTypeId;
  complexityScore: number;
  seed?: string;
}): Concept {
  const craft = CRAFT_BY_ID[args.craftId] ?? CRAFTS[0];
  const product = PRODUCT_BY_ID[args.productType] ?? PRODUCT_BY_ID.jacket;
  const score = clamp(Math.round(args.complexityScore), 8, 96);
  const complexity: Concept["complexity"] =
    score > 68 ? "Intricate" : score > 38 ? "Considered" : "Simple";
  const palette = [
    args.palette[0] ?? craft.palette[0],
    args.palette[1] ?? craft.palette[1],
    args.palette[2] ?? craft.palette[2],
    craft.palette[3] ?? "#fff4de",
    "#292322",
  ].filter(Boolean);

  const motifIds = craft.motifs.slice(0, 3);
  const [low, high] = craft.handworkDays;
  const scale = complexity === "Intricate" ? 1.5 : complexity === "Considered" ? 1.15 : 0.85;
  const days = (n: number) => Math.max(1, Math.round(n * scale));

  const stages = [
    {
      name: "Brief & motif sign-off",
      detail: `Confirm the ${motifIds[0] ? MOTIF_BY_ID[motifIds[0]]?.label ?? "motif" : "motif"} placement and colour count with the artisan before any cutting.`,
      days: 1,
      artisanRole: "Designer + artisan",
    },
    {
      name: "Material sourcing",
      detail: `${craft.materials.slice(0, 2).join(" and ")} sourced in the agreed base shade.`,
      days: days(2),
      artisanRole: "Artisan",
    },
    {
      name: `${craft.name} hand-work`,
      detail: `${craft.techniques.slice(0, 2).join(" + ")} across the approved panel.`,
      days: days(Math.round((low + high) / 2)),
      artisanRole: `${craft.name} artisan`,
    },
    {
      name: "Finishing & review",
      detail: "Edge finishing, pressing, and a customer photo review against the approved design.",
      days: days(2),
      artisanRole: "Artisan + reviewer",
    },
  ];

  const missingInfo = [
    "Finished measurements or a size chart",
    "Quantity (single piece or small batch)",
    "Target delivery date",
  ];
  if (!craft.productFit.includes(args.productType)) {
    missingInfo.push(
      `${craft.name} is unusual on a ${product?.label ?? args.productType} — an artisan should confirm it is practical.`,
    );
  }

  return {
    title: titleFor(args.seed ?? `${craft.id}-${args.productType}`, craft, args.productType),
    summary: `A ${complexity.toLowerCase()} ${craft.name} treatment on a ${product?.label.toLowerCase() ?? "piece"}, using your image's palette and ${motifIds.length} motif families.`,
    craftId: craft.id,
    productType: args.productType,
    palette,
    motifIds,
    placement: "Centre-front main motif with paired chest motifs — mirrors the composition density measured in your reference.",
    rationale: [
      `Craft chosen from palette affinity and product format, not from a trained model.`,
      `${craft.name} hand-work is estimated at ${low}–${high} days for a panel at this complexity.`,
      `Fabric recommendation: ${craft.materials[0]} — suited to ${craft.techniques[0].toLowerCase()}.`,
    ],
    materials: craft.materials.slice(0, 4),
    stages,
    complexity,
    complexityScore: score,
    confidence: 62,
    missingInfo,
    caveats: [
      "Craft suggestions are rule-based platform guidance, not a quotation or an artisan commitment.",
      "Traditional motifs are shared cultural material: attribution is recorded, ownership is not assumed.",
      "Final pricing and feasibility come from an artisan quote.",
    ],
    source: "rules",
  };
}

export function emptyCanvas(productType: ProductTypeId): CanvasState {
  const product = PRODUCT_BY_ID[productType] ?? PRODUCT_BY_ID.jacket;
  return {
    productType,
    silhouette: product.silhouette,
    fabricColor: product.baseFabric,
    patternId: "none",
    layers: [],
  };
}

export function buildCanvas(concept: Concept): CanvasState {
  const product = PRODUCT_BY_ID[concept.productType] ?? PRODUCT_BY_ID.jacket;
  const craft = CRAFT_BY_ID[concept.craftId] ?? CRAFTS[0];
  const [primary, secondary, accent] = concept.palette;
  const base = product.baseFabric;

  const emblem = concept.motifIds[0] ?? craft.motifs[0] ?? "mandala";
  const flank = concept.motifIds[1] ?? "sprig";
  const trim = concept.motifIds[2] ?? "border";

  const layers: DesignLayer[] = [
    {
      id: uid("m"),
      kind: "motif",
      motifId: emblem,
      x: 450,
      y: 430,
      size: Math.round(190 * product.motifScale),
      rotation: 0,
      color: primary,
      opacity: 1,
    },
    {
      id: uid("m"),
      kind: "motif",
      motifId: flank,
      x: 335,
      y: 520,
      size: Math.round(96 * product.motifScale),
      rotation: 0,
      color: secondary,
      opacity: 1,
    },
    {
      id: uid("m"),
      kind: "motif",
      motifId: flank,
      x: 565,
      y: 520,
      size: Math.round(96 * product.motifScale),
      rotation: 0,
      color: secondary,
      opacity: 1,
    },
    {
      id: uid("m"),
      kind: "motif",
      motifId: trim,
      x: 450,
      y: 668,
      size: Math.round(230 * product.motifScale),
      rotation: 0,
      color: accent,
      opacity: 0.9,
    },
  ];

  return {
    productType: concept.productType,
    silhouette: product.silhouette,
    fabricColor: base,
    patternId: "none",
    layers,
  };
}

/** Three deterministic palette variations of a saved concept. */
export function variationsFor(concept: Concept): { name: string; colors: string[] }[] {
  const craft = CRAFT_BY_ID[concept.craftId] ?? CRAFTS[0];
  return [
    { name: "Your palette", colors: concept.palette.slice(0, 4) },
    { name: "Deeper ground", colors: [darken(concept.palette[0], 0.28), concept.palette[1], concept.palette[2], "#fff4de"] },
    { name: "Craft reference", colors: craft.palette.slice(0, 4) },
    { name: "Ink & gold", colors: ["#292322", "#c49a55", craft.palette[0], "#fff4de"] },
  ];
}

export function complexityFromSignals(edgeDensity: number, paletteLength: number, symmetry: number) {
  const density = clamp(edgeDensity * 100, 0, 60);
  const variety = clamp(paletteLength * 6, 0, 26);
  const order = clamp(symmetry * 14, 0, 14);
  return clamp(Math.round(density + variety + order), 8, 96);
}

export type { ExtractedColor };
