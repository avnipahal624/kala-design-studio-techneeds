import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { languageModelConfigured, languageProviderName } from "./lib/ai/languageModel";
import { requireMarketplaceUser } from "./lib/access";

export const status = query({
  args: {},
  handler: async () => ({
    configured: languageModelConfigured(),
    provider: languageProviderName(),
    languages: ["English", "हिन्दी", "Hinglish"],
    limits: [
      "KalaSaathi cannot create or copy artwork.",
      "It cannot pay, accept quotes, change prices or approve work.",
      "It only reads your own requests, projects and profile.",
    ],
  }),
});

export const history = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const rows = await ctx.db
      .query("assistantMessages")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(40);
    return rows.reverse();
  },
});

export const clear = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireMarketplaceUser(ctx);
    const rows = await ctx.db
      .query("assistantMessages")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(100);
    for (const row of rows) await ctx.db.delete(row._id);
    return { cleared: rows.length };
  },
});

export const contextForUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    const artisan = await ctx.db
      .query("artisanProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    const requests = await ctx.db
      .query("customerRequests")
      .withIndex("by_customer_created", (q) => q.eq("customerId", args.userId))
      .order("desc")
      .take(4);
    const asCustomer = await ctx.db
      .query("projects")
      .withIndex("by_customer", (q) => q.eq("customerId", args.userId))
      .take(4);
    const asArtisan = await ctx.db
      .query("projects")
      .withIndex("by_artisan", (q) => q.eq("artisanId", args.userId))
      .take(4);
    const quotes = await ctx.db
      .query("quotes")
      .withIndex("by_artisan", (q) => q.eq("artisanId", args.userId))
      .take(20);
    return {
      name: user.name ?? "there",
      role: user.role ?? "user",
      emailVerified: Boolean(user.emailVerificationTime),
      city: user.city ?? artisan?.city ?? null,
      artisan: artisan
        ? {
            displayName: artisan.displayName,
            craft: artisan.craftHeadline,
            skills: artisan.skills,
            city: artisan.city,
            verification: artisan.verificationStatus,
            availability: artisan.availability,
            completedProjects: artisan.completedProjects,
            rating:
              artisan.ratingCount > 0
                ? Math.round((artisan.ratingSum / artisan.ratingCount) * 10) / 10
                : null,
          }
        : null,
      requests: requests.map((request) => ({
        title: request.title,
        category: request.category,
        status: request.status,
        budgetInr: request.budgetInr,
      })),
      projects: [...asCustomer, ...asArtisan]
        .filter((project, index, all) => all.findIndex((p) => p._id === project._id) === index)
        .slice(0, 5)
        .map((project) => ({
          title: project.title,
          status: project.status,
          paymentStatus: project.paymentStatus,
          amountInr: project.amountInr,
          role: project.customerId === args.userId ? "customer" : "artisan",
        })),
      pendingQuotes: quotes.filter((quote) => quote.status === "submitted").length,
    };
  },
});

export const recordAssistant = internalMutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("assistantMessages", {
      userId: args.userId,
      role: args.role,
      body: args.body.slice(0, 2000),
      createdAt: Date.now(),
    });
  },
});

export const recentHistory = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("assistantMessages")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(30);
    return rows.reverse().map((row) => ({
      role: row.role,
      body: row.body,
      createdAt: row.createdAt,
    }));
  },
});
