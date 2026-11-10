import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

/** Metadata-only AI usage log. No prompts, file contents or secrets are stored. */
export const record = internalMutation({
  args: {
    userId: v.id("users"),
    kind: v.string(),
    provider: v.string(),
    model: v.optional(v.string()),
    status: v.string(),
    latencyMs: v.optional(v.number()),
    errorCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("aiRuns", args);
  },
});

export const recentCount = internalQuery({
  args: { userId: v.id("users"), windowMs: v.number() },
  handler: async (ctx, { userId, windowMs }) => {
    const since = Date.now() - windowMs;
    const rows = await ctx.db
      .query("aiRuns")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(60);
    return rows.filter((row) => row._creationTime >= since).length;
  },
});
