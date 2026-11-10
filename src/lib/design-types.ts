import type { ProductTypeId } from "@/lib/crafts";

export type DesignLayerKind = "motif" | "text";

export type DesignLayer = {
  id: string;
  kind: DesignLayerKind;
  motifId?: string;
  text?: string;
  fontFamily?: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  color: string;
  opacity: number;
};

export type CanvasState = {
  productType: string;
  silhouette: string;
  fabricColor: string;
  patternId?: string;
  layers: DesignLayer[];
};

/** Structured colour measurement taken from an uploaded image. */
export type ExtractedColor = {
  hex: string;
  share: number;
  name: string;
};

/**
 * Analysis produced from real client-side image measurements plus the
 * rule-based craft engine. `method` is always surfaced in the UI so a user can
 * tell measured signals apart from suggestions.
 */
export type InspirationAnalysis = {
  method: "image-signals+craft-rules" | "image-signals+ai";
  palette: ExtractedColor[];
  brightness: number;
  saturation: number;
  contrast: number;
  edgeDensity: number;
  symmetry: number;
  aspectRatio: number;
  complexityScore: number;
  dominantWarmth: "warm" | "cool" | "neutral";
  suggestedCraftId: string;
  suggestedCraftConfidence: number;
  alternativeCraftIds: string[];
  suggestedMotifIds: string[];
  suggestedPlacement: string;
  suggestedProductType: ProductTypeId;
  notes: string[];
  limitations: string[];
  generatedAt: number;
};

export type ProductionStage = {
  name: string;
  detail: string;
  days: number;
  artisanRole: string;
};

export type Concept = {
  title: string;
  summary: string;
  craftId: string;
  productType: string;
  palette: string[];
  motifIds: string[];
  placement: string;
  rationale: string[];
  materials: string[];
  stages: ProductionStage[];
  complexity: "Simple" | "Considered" | "Intricate";
  complexityScore: number;
  confidence: number;
  missingInfo: string[];
  caveats: string[];
  /** "rules" = deterministic platform engine, "ai" = model-assisted narrative. */
  source: "rules" | "ai";
};

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function uid(prefix = "l") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}
