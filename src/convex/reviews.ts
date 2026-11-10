import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireMarketplaceUser, requireProjectAccess } from "./lib/access";
import { addKalaProof, notifyUser, recordAudit } from "./lib/events";

export const submit = mutation({
  args: {
    projectId: v.id("projects"),
    rating: v.number(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const { project, isCustomer, isArtisan } = await requireProjectAccess(ctx, args.projectId, user);
    if (!isCustomer && !isArtisan) throw new Error("FORBIDDEN: not a project participant.");
    if (project.status !== "completed") {
      throw new Error("INVALID: reviews open after the project is completed.");
    }
    const rating = Math.round(args.rating);
    if (rating < 1 || rating > 5) throw new Error("INVALID: choose a rating from 1 to 5.");
    if (args.body.trim().length < 10) throw new Error("INVALID: write at least a sentence.");
    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .take(10);
    if (existing.some((review) => review.authorId === user._id)) {
      throw new Error("INVALID: you already reviewed this project.");
    }
    const subjectId = isCustomer ? project.artisanId : project.customerId;
    await ctx.db.insert("reviews", {
      projectId: args.projectId,
      authorId: user._id,
      subjectId,
      authorRole: isCustomer ? "customer" : "artisan",
      rating,
      body: args.body.trim().slice(0, 1200),
      createdAt: Date.now(),
    });

    if (isCustomer) {
      const profile = await ctx.db
        .query("artisanProfiles")
        .withIndex("by_user", (q) => q.eq("userId", project.artisanId))
        .unique();
      if (profile) {
        await ctx.db.patch(profile._id, {
          ratingSum: profile.ratingSum + rating,
          ratingCount: profile.ratingCount + 1,
          updatedAt: Date.now(),
        });
      }
    }

    await addKalaProof(ctx, {
      projectId: args.projectId,
      requestId: project.requestId,
      type: "note",
      title: `Review submitted (${rating}/5)`,
      note: "A verified project review was added to the artisan's public profile.",
      actorId: user._id,
      actorRole: isCustomer ? "customer" : "artisan",
    });
    await notifyUser(ctx, subjectId, {
      type: "review.received",
      title: `New ${rating}-star review`,
      body: args.body.slice(0, 160),
      href: isCustomer ? `/artisans/${project.artisanId}` : "/customer/dashboard",
    });
    await recordAudit(ctx, {
      actorId: user._id,
      actorRole: isCustomer ? "customer" : "artisan",
      action: "review.submitted",
      subjectType: "reviews",
      subjectId: String(args.projectId),
      detail: `${rating}/5`,
    });
  },
});

export const forProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    await requireProjectAccess(ctx, args.projectId, user);
    const rows = await ctx.db
      .query("reviews")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .take(10);
    return await Promise.all(
      rows.map(async (review) => {
        const author = await ctx.db.get(review.authorId);
        return {
          ...review,
          authorName: (author?.name ?? "Member").split(/\s+/)[0],
          mine: review.authorId === user._id,
        };
      }),
    );
  },
});

export const forArtisan = query({
  args: { artisanId: v.id("users") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("reviews")
      .withIndex("by_subject", (q) => q.eq("subjectId", args.artisanId))
      .order("desc")
      .take(30);
    return await Promise.all(
      rows.map(async (review) => {
        const author = await ctx.db.get(review.authorId);
        return {
          ...review,
          authorName: (author?.name ?? "Customer").split(/\s+/)[0],
        };
      }),
    );
  },
});
