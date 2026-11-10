"use node";

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { z } from "zod";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import { completeJson, languageModelConfigured } from "./lib/ai/languageModel";

/**
 * Product ↔ craft context used in prompts. Kept server-side so the model is
 * never asked to invent platform facts that we already know.
 */
const CRAFT_CONTEXT: Record<
  string,
  { name: string; region: string; materials: string[]; techniques: string[] }
> = {
  madhubani: {
    name: "Madhubani",
    region: "Mithila, Bihar",
    materials: ["handloom cotton", "silk-cotton", "fine cotton thread"],
    techniques: ["double-outline linework", "flat colour fill", "stem stitch"],
  },
  phulkari: {
    name: "Phulkari",
    region: "Punjab",
    materials: ["khaddar cotton", "floss silk"],
    techniques: ["darning stitch", "counted geometric florals"],
  },
  kalamkari: {
    name: "Kalamkari",
    region: "Andhra Pradesh",
    materials: ["handloom cotton", "natural dyes"],
    techniques: ["kalam pen drawing", "block printing", "wax resist"],
  },
  chikankari: {
    name: "Chikankari",
    region: "Lucknow",
    materials: ["cotton mulmul", "voile", "fine cotton thread"],
    techniques: ["shadow work", "jali cutwork", "murri stitch"],
  },
  ajrakh: {
    name: "Ajrakh",
    region: "Kutch, Gujarat",
    materials: ["cotton", "silk", "indigo", "madder"],
    techniques: ["hand block printing", "resist dyeing"],
  },
  bandhani: {
    name: "Bandhani",
    region: "Gujarat & Rajasthan",
    materials: ["fine cotton", "gajji silk"],
    techniques: ["tie-resist", "dotted field composition"],
  },
  warli: {
    name: "Warli",
    region: "Maharashtra",
    materials: ["cotton canvas", "rice paste pigment"],
    techniques: ["line figure drawing", "spiral composition"],
  },
  gond: {
    name: "Gond painting",
    region: "Central India",
    materials: ["cotton canvas", "natural pigment"],
    techniques: ["dot-and-line infill", "contour drawing"],
  },
  kantha: {
    name: "Kantha",
    region: "West Bengal",
    materials: ["layered cotton", "cotton thread"],
    techniques: ["running stitch quilting", "motif darning"],
  },
  pattachitra: {
    name: "Pattachitra",
    region: "Odisha",
    materials: ["cotton cloth", "tussar silk", "natural pigment"],
    techniques: ["bold outline", "flat colour fill"],
  },
  zardozi: {
    name: "Zardozi",
    region: "Lucknow & Delhi",
    materials: ["silk", "velvet", "metallic thread", "sequins"],
    techniques: ["metal thread couching", "bead work"],
  },
  kashmiri: {
    name: "Kashmiri embroidery",
    region: "Kashmir Valley",
    materials: ["pashmina", "fine wool", "silk thread"],
    techniques: ["satin stitch", "chain stitch", "sozni outlining"],
  },
};

const PRODUCT_LABEL: Record<string, string> = {
  jacket: "open-front jacket",
  kurta: "straight kurta",
  tote: "structured tote bag",
  cushion: "square cushion cover",
  stole: "draped stole",
};

const narrativeSchema = z.object({
  narrative: z.string().min(20).max(700),
  craftNotes: z.string().min(10).max(500),
  caution: z.string().min(10).max(400),
});

const WINDOW_MS = 60 * 60 * 1000;
const MAX_RUNS_PER_WINDOW = 12;

/**
 * Optional AI layer: writes a short design narrative around the rule-based
 * concept. The concept itself (craft, palette, motifs, stages, estimates) is
 * always produced deterministically — the model never invents the numbers.
 */
export const generateConceptNarrative = action({
  args: {
    craftId: v.string(),
    productType: v.string(),
    palette: v.array(v.string()),
    motifIds: v.array(v.string()),
    complexityScore: v.number(),
    dominantWarmth: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { status: "unauthenticated" as const, reason: "Sign in to generate a brief." };
    }

    const craft = CRAFT_CONTEXT[args.craftId];
    if (!craft) {
      return { status: "unavailable" as const, reason: "Unknown craft selected." };
    }
    if (!languageModelConfigured()) {
      return {
        status: "unavailable" as const,
        reason:
          "No language-model key is configured, so only the rule-based concept is available.",
      };
    }

    try {
      const recent = await ctx.runQuery(internal.aiLog.recentCount, {
        userId,
        windowMs: WINDOW_MS,
      });
      if (recent >= MAX_RUNS_PER_WINDOW) {
        return {
          status: "rate_limited" as const,
          reason: "You've reached the AI brief limit for this hour. Try again later.",
        };
      }
    } catch {
      // A logging outage should not block generation.
    }

    const palette = args.palette
      .filter((hex) => /^#[0-9a-fA-F]{3,8}$/.test(hex))
      .slice(0, 5);

    const modelResult = await completeJson(
      [
        {
          role: "system",
          content:
            "You are a craft production assistant for KALAकारी, an Indian craft customisation studio. " +
            "Describe designs respectfully and precisely. Never invent prices, delivery dates, artisan names, " +
            "order statuses or verification claims. Traditional motifs are shared cultural material; do not assert " +
            "ownership. Reply with JSON only: {\"narrative\": string, \"craftNotes\": string, \"caution\": string}. " +
            "narrative is a design concept description (max 90 words), craftNotes explains technique considerations " +
            "(max 60 words), caution states one honest limitation of the concept (max 40 words).",
        },
        {
          role: "user",
          content: [
            `Craft tradition: ${craft.name} (${craft.region}).`,
            `Product: ${PRODUCT_LABEL[args.productType] ?? args.productType}.`,
            `Palette hex values: ${palette.join(", ")}.`,
            `Dominant warmth: ${args.dominantWarmth}.`,
            `Motif families: ${args.motifIds.slice(0, 6).join(", ") || "none selected"}.`,
            `Complexity score: ${Math.round(args.complexityScore)}/100.`,
            `Reference materials: ${craft.materials.join(", ")}.`,
            `Reference techniques: ${craft.techniques.join(", ")}.`,
            "Write the concept description for the customer who uploaded an inspiration image.",
          ].join("\n"),
        },
      ],
      narrativeSchema,
      { maxTokens: 500 },
    );

    try {
      await ctx.runMutation(internal.aiLog.record, {
        userId,
        kind: "concept-narrative",
        provider: modelResult.status === "ok" ? modelResult.provider : "vly-gateway",
        model: modelResult.status === "ok" ? modelResult.model : undefined,
        status: modelResult.status,
        latencyMs: modelResult.status === "ok" ? modelResult.latencyMs : undefined,
        errorCode: modelResult.status === "ok" ? undefined : modelResult.status,
      });
    } catch {
      // Logging must never break the user-facing response.
    }

    if (modelResult.status !== "ok") {
      return { status: modelResult.status, reason: modelResult.reason };
    }

    return {
      status: "ok" as const,
      narrative: modelResult.data.narrative,
      craftNotes: modelResult.data.craftNotes,
      caution: modelResult.data.caution,
      model: modelResult.model,
    };
  },
});
