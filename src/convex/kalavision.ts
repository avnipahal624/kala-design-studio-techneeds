"use node";

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { z } from "zod";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import { completeJson, languageModelConfigured } from "./lib/ai/languageModel";
import { deriveCraftDna } from "./lib/craftDna";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_RUNS_PER_WINDOW = 12;

const insightSchema = z.object({
  craftStyle: z.string().min(2).max(160),
  likelyMaterials: z.array(z.string().min(2).max(80)).max(5),
  requiredSkills: z.array(z.string().min(2).max(60)).max(8),
  clarifyingQuestions: z.array(z.string().min(5).max(200)).max(5),
  uncertainties: z.array(z.string().min(5).max(200)).max(4),
  confidence: z.enum(["low", "medium", "high"]),
});

type Insight = z.infer<typeof insightSchema>;

type InsightInput = {
  category: string;
  description: string;
  craftPreference?: string;
  materialsKnown?: string;
  placement?: string;
  colours?: string;
  deadline?: string;
  budgetInr: number;
  customerSuppliesProduct: boolean;
};

/** Deterministic fallback so the wizard is still useful without a provider. */
function fallbackInsight(input: InsightInput): Insight {
  const dna = deriveCraftDna(input);
  return {
    craftStyle: input.craftPreference?.trim() || "Hand-work customisation",
    likelyMaterials: input.materialsKnown ? [input.materialsKnown] : [],
    requiredSkills: dna.requiredSkills,
    clarifyingQuestions: dna.missingInfo.map(
      (item) => `Could you confirm: ${item.toLowerCase()}?`,
    ),
    uncertainties: [
      "Material cannot be confirmed without the artisan inspecting the product.",
      "Photos were not analysed by AI — only your written brief was used.",
    ],
    confidence: "low",
  };
}

async function runInsight(input: InsightInput & { imageCount: number }) {
  const fallback = fallbackInsight(input);
  if (!languageModelConfigured()) {
    return {
      status: "unavailable" as const,
      reason: "No AI provider is configured. The rule-based brief below is still complete.",
      fallback,
    };
  }
  const result = await completeJson(
    [
      {
        role: "system",
        content:
          "You are KalaVision, a production-brief assistant for KALकारी, an Indian artisan marketplace. " +
          "You cannot see images and must never claim to. You do not create artwork, motifs or designs. " +
          "Use only the customer's written details. Never invent measurements, exact materials, prices, " +
          "artisan names or verification results. Mark uncertainty honestly. " +
          "Reply with JSON only: {\"craftStyle\": string, \"likelyMaterials\": string[], " +
          "\"requiredSkills\": string[], \"clarifyingQuestions\": string[], \"uncertainties\": string[], " +
          "\"confidence\": \"low\"|\"medium\"|\"high\"}. Keep each list to at most five short items. " +
          "Skills should be practical production skills (for example surface preparation, hand painting, " +
          "protective finishing), not art styles alone.",
      },
      {
        role: "user",
        content: [
          `Product category: ${input.category}.`,
          `Customer supplies the product: ${input.customerSuppliesProduct ? "yes" : "no"}.`,
          `Written brief: ${input.description.slice(0, 1200)}.`,
          `Craft preference: ${input.craftPreference ?? "not stated"}.`,
          `Known material: ${input.materialsKnown ?? "not stated"}.`,
          `Placement: ${input.placement ?? "not stated"}.`,
          `Colours: ${input.colours ?? "not stated"}.`,
          `Budget: ₹${input.budgetInr}. Deadline: ${input.deadline ?? "not stated"}.`,
          `Photos attached: ${input.imageCount} (you cannot see them).`,
          "Return the structured brief analysis.",
        ].join("\n"),
      },
    ],
    insightSchema,
    { maxTokens: 700 },
  );

  if (result.status !== "ok") {
    return { status: result.status, reason: result.reason, fallback };
  }
  return { status: "ok" as const, output: result.data, model: result.model, provider: result.provider };
}

export const analyzeDraft = action({
  args: {
    category: v.string(),
    description: v.string(),
    craftPreference: v.optional(v.string()),
    materialsKnown: v.optional(v.string()),
    placement: v.optional(v.string()),
    colours: v.optional(v.string()),
    deadline: v.optional(v.string()),
    budgetInr: v.number(),
    customerSuppliesProduct: v.boolean(),
    imageCount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { status: "unauthenticated" as const, reason: "Sign in to use KalaVision." };
    if (args.description.trim().length < 20) {
      return { status: "invalid" as const, reason: "Write a little more detail first." };
    }
    if (languageModelConfigured()) {
      try {
        const recent = await ctx.runQuery(internal.aiLog.recentCount, { userId, windowMs: WINDOW_MS });
        if (recent >= MAX_RUNS_PER_WINDOW) {
          return {
            status: "rate_limited" as const,
            reason: "You have reached the AI limit for this hour.",
            fallback: fallbackInsight(args),
          };
        }
      } catch {
        // Logging outages must not block the wizard.
      }
    }

    const outcome = await runInsight(args);
    try {
      await ctx.runMutation(internal.aiLog.record, {
        userId,
        kind: "kalavision-draft",
        provider: outcome.status === "ok" ? outcome.provider : "none",
        model: outcome.status === "ok" ? outcome.model : undefined,
        status: outcome.status === "ok" ? "ok" : outcome.status,
        errorCode: outcome.status === "ok" ? undefined : outcome.status,
      });
    } catch {
      // ignore logging failures
    }
    if (outcome.status !== "ok") {
      return {
        status: outcome.status,
        reason: outcome.reason,
        fallback: outcome.fallback,
        visionUsed: false as const,
      };
    }
    return { status: "ok" as const, insight: outcome.output, visionUsed: false as const };
  },
});

export const analyzeRequest = action({
  args: { requestId: v.id("customerRequests") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { status: "unauthenticated" as const, reason: "Sign in to use KalaVision." };
    const request = await ctx.runQuery(internal.kalavisionData.requestForAnalysis, {
      requestId: args.requestId,
      userId,
    });
    if (!request) return { status: "not_found" as const, reason: "Request not found." };

    const outcome = await runInsight(request);
    const analysis =
      outcome.status === "ok"
        ? {
            source: "ai-text-only",
            status: "ok",
            visionUsed: false,
            generatedAt: Date.now(),
            output: outcome.output,
            model: outcome.model,
          }
        : {
            source: "rules",
            status: outcome.status,
            visionUsed: false,
            generatedAt: Date.now(),
            reason: outcome.reason,
            output: outcome.fallback,
          };
    await ctx.runMutation(internal.kalavisionData.saveAnalysis, {
      requestId: args.requestId,
      userId,
      analysis,
    });
    return { status: outcome.status, analysis };
  },
});
