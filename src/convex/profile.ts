import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireUserId } from "./lib/guards";
import { roleValidator } from "./schema";

/** Saves the light-weight onboarding preferences used for recommendations. */
export const savePreferences = mutation({
  args: {
    name: v.string(),
    role: roleValidator,
    language: v.string(),
    craftInterests: v.array(v.string()),
    stylePreferences: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    await ctx.db.patch(userId, {
      name: args.name.trim().slice(0, 60) || undefined,
      displayName: args.name.trim().slice(0, 60) || undefined,
      role: args.role,
      language: args.language.slice(0, 24),
      craftInterests: args.craftInterests.slice(0, 8),
      stylePreferences: args.stylePreferences.slice(0, 8),
      onboardedAt: Date.now(),
    });
  },
});
