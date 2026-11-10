import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";
import { languageModelConfigured } from "./lib/ai/languageModel";

export const status = query({
  args: {},
  handler: async () => ({
    configured: languageModelConfigured(),
    vision: false,
    note: "KalaVision reads the written brief only. It never claims to see or analyse photos.",
  }),
});

export const requestForAnalysis = internalQuery({
  args: { requestId: v.id("customerRequests"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request || request.customerId !== args.userId) return null;
    return {
      category: request.category,
      description: request.description,
      craftPreference: request.craftPreference,
      materialsKnown: request.materialsKnown,
      placement: request.placement,
      colours: request.colours,
      deadline: request.deadline,
      budgetInr: request.budgetInr,
      customerSuppliesProduct: request.customerSuppliesProduct,
      imageCount: request.images.length,
      requiredSkills: request.requiredSkills,
      missingInfo: request.missingInfo,
    };
  },
});

export const saveAnalysis = internalMutation({
  args: {
    requestId: v.id("customerRequests"),
    userId: v.id("users"),
    analysis: v.any(),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request || request.customerId !== args.userId) {
      throw new Error("NOT_FOUND: request not found.");
    }
    await ctx.db.patch(args.requestId, { analysis: args.analysis, updatedAt: Date.now() });
  },
});

export const analysisForRequest = query({
  args: { requestId: v.id("customerRequests") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const request = await ctx.db.get(args.requestId);
    if (!request || request.customerId !== userId) return null;
    return {
      analysis: request.analysis ?? null,
      requiredSkills: request.requiredSkills,
      missingInfo: request.missingInfo,
      briefSummary: request.briefSummary ?? null,
    };
  },
});
