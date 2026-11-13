import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { feasibilityVerdictValidator } from "./schema";
import { requireMarketplaceUser } from "./lib/access";
import { notifyUser } from "./lib/events";
import { JOB_FEED_MIN_SCORE, scoreArtisan } from "./lib/matching";

type Ctx = QueryCtx | MutationCtx;

async function requireArtisanAccess(
  ctx: Ctx,
  request: Doc<"customerRequests">,
  userId: Id<"users">,
) {
  const profile = await ctx.db
    .query("artisanProfiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
  if (!profile) throw new Error("FORBIDDEN: complete CraftFit before reviewing a brief.");
  if (profile.verificationStatus === "suspended") {
    throw new Error("FORBIDDEN: this artisan profile is suspended.");
  }
  const [portfolio, invite] = await Promise.all([
    ctx.db.query("portfolioItems").withIndex("by_artisan", (q) => q.eq("artisanId", userId)).take(24),
    ctx.db
      .query("quoteRequests")
      .withIndex("by_request_artisan", (q) => q.eq("requestId", request._id).eq("artisanId", userId))
      .unique(),
  ]);
  const match = scoreArtisan(
    {
      category: request.category,
      budgetInr: request.budgetInr,
      requiredSkills: request.requiredSkills,
      materialsKnown: request.materialsKnown,
      city: request.city,
      fulfilment: request.fulfilment,
      deadline: request.deadline,
      craftPreference: request.craftPreference,
    },
    { ...profile, craftTags: portfolio.flatMap((item) => item.craftTags) },
  );
  const invited = invite?.status === "sent" || invite?.status === "quoted";
  if (!invited && !(match.eligible && match.score >= JOB_FEED_MIN_SCORE)) {
    throw new Error("FORBIDDEN: this brief is not in your KalaJobs.");
  }
  return profile;
}

export const forRequest = query({
  args: { requestId: v.id("customerRequests") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("NOT_FOUND: request not found.");
    const isOwner = request.customerId === user._id;
    const isAdmin = user.role === "admin";
    if (!isOwner && !isAdmin) {
      await requireArtisanAccess(ctx, request, user._id);
    }
    const reviews = await ctx.db
      .query("feasibilityReviews")
      .withIndex("by_request", (q) => q.eq("requestId", args.requestId))
      .order("desc")
      .take(30);
    return reviews
      .filter((review) => isOwner || isAdmin || review.artisanId === user._id)
      .map((review) => ({
        _id: review._id,
        artisanId: review.artisanId,
        artisanName: review.artisanName,
        verdict: review.verdict,
        note: review.note,
        estimatedDays: review.estimatedDays,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        mine: review.artisanId === user._id,
      }));
  },
});

export const submit = mutation({
  args: {
    requestId: v.id("customerRequests"),
    verdict: feasibilityVerdictValidator,
    note: v.string(),
    estimatedDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("NOT_FOUND: request not found.");
    if (request.customerId === user._id) {
      throw new Error("FORBIDDEN: customers cannot submit an artisan review.");
    }
    if (!["open", "quote_selected"].includes(request.status)) {
      throw new Error("INVALID: this brief is no longer active.");
    }
    const note = args.note.trim();
    if (note.length < 30) {
      throw new Error("INVALID: explain the production constraints in at least 30 characters.");
    }
    if (note.length > 1000) throw new Error("INVALID: the review is too long.");
    if (args.estimatedDays !== undefined && (args.estimatedDays < 1 || args.estimatedDays > 365)) {
      throw new Error("INVALID: estimated days must be 1–365.");
    }
    const profile = await requireArtisanAccess(ctx, request, user._id);
    const existing = await ctx.db
      .query("feasibilityReviews")
      .withIndex("by_request_artisan", (q) => q.eq("requestId", args.requestId).eq("artisanId", user._id))
      .unique();
    const now = Date.now();
    const payload = {
      verdict: args.verdict,
      note: note.slice(0, 1000),
      estimatedDays: args.estimatedDays === undefined ? undefined : Math.round(args.estimatedDays),
      artisanName: profile.displayName,
      updatedAt: now,
    };
    const reviewId = existing
      ? existing._id
      : await ctx.db.insert("feasibilityReviews", {
          requestId: args.requestId,
          artisanId: user._id,
          createdAt: now,
          ...payload,
        });
    if (existing) await ctx.db.patch(existing._id, payload);
    await notifyUser(ctx, request.customerId, {
      type: "feasibility.reviewed",
      title: "An artisan reviewed production feasibility",
      body: `${profile.displayName} added a documented review to “${request.title}”.`,
      href: `/customer/requests/${args.requestId}`,
    });
    return { reviewId, updated: Boolean(existing) };
  },
});
