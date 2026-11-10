import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import {
  artisanProfileFor,
  requireArtisan,
  requireMarketplaceUser,
} from "./lib/access";
import { notifyUser, recordAudit } from "./lib/events";
import { validateImageRef } from "./lib/files";
import { publicArtisan, portfolioWithUrls } from "./lib/serialise";
import { scoreArtisan } from "./lib/matching";

const MAX_PORTFOLIO = 24;

function assertCraftFit(args: {
  displayName: string;
  craftHeadline: string;
  city: string;
  yearsExperience: number;
  intro: string;
  skills: string[];
  products: string[];
  materials: string[];
  minProjectValue: number;
  weeklyCapacity: number;
  turnaroundDays: number;
}) {
  if (args.displayName.trim().length < 2) throw new Error("INVALID: add your display name.");
  if (args.craftHeadline.trim().length < 4) throw new Error("INVALID: add a short craft headline.");
  if (args.city.trim().length < 2) throw new Error("INVALID: add your city.");
  if (args.intro.trim().length < 30) throw new Error("INVALID: write at least a couple of sentences about your work.");
  if (args.skills.length === 0) throw new Error("INVALID: choose at least one craft skill.");
  if (args.products.length === 0) throw new Error("INVALID: choose at least one product capability.");
  if (args.materials.length === 0) throw new Error("INVALID: choose at least one material you work with.");
  if (args.yearsExperience < 0 || args.yearsExperience > 60) throw new Error("INVALID: years of experience looks wrong.");
  if (args.minProjectValue < 100 || args.minProjectValue > 1_000_000) {
    throw new Error("INVALID: set a realistic minimum project value in rupees.");
  }
  if (args.weeklyCapacity < 1 || args.weeklyCapacity > 20) throw new Error("INVALID: weekly capacity must be 1–20.");
  if (args.turnaroundDays < 1 || args.turnaroundDays > 180) throw new Error("INVALID: turnaround must be 1–180 days.");
}

export const saveCraftFit = mutation({
  args: {
    displayName: v.string(),
    craftHeadline: v.string(),
    city: v.string(),
    serviceRegion: v.string(),
    mode: v.union(v.literal("individual"), v.literal("collective")),
    yearsExperience: v.number(),
    intro: v.string(),
    languages: v.array(v.string()),
    skills: v.array(v.string()),
    customSkills: v.optional(v.array(v.string())),
    products: v.array(v.string()),
    materials: v.array(v.string()),
    minProjectValue: v.number(),
    maxProjectValue: v.optional(v.number()),
    weeklyCapacity: v.number(),
    turnaroundDays: v.number(),
    shipsNationwide: v.boolean(),
    localOnly: v.boolean(),
    collaborates: v.boolean(),
    workingHours: v.optional(v.string()),
    availability: v.optional(v.union(v.literal("available"), v.literal("limited"), v.literal("paused"))),
  },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    assertCraftFit(args);
    const existing = await artisanProfileFor(ctx, user._id);
    const now = Date.now();
    const payload = {
      userId: user._id,
      displayName: args.displayName.trim().slice(0, 60),
      craftHeadline: args.craftHeadline.trim().slice(0, 120),
      city: args.city.trim().slice(0, 80),
      serviceRegion: args.serviceRegion.trim().slice(0, 120),
      mode: args.mode,
      yearsExperience: Math.round(args.yearsExperience),
      intro: args.intro.trim().slice(0, 1200),
      languages: args.languages.slice(0, 8),
      skills: args.skills.slice(0, 16),
      customSkills: (args.customSkills ?? []).map((s) => s.trim().slice(0, 48)).filter(Boolean).slice(0, 8),
      products: args.products.slice(0, 16),
      materials: args.materials.slice(0, 12),
      minProjectValue: Math.round(args.minProjectValue),
      maxProjectValue: args.maxProjectValue ? Math.round(args.maxProjectValue) : undefined,
      weeklyCapacity: Math.round(args.weeklyCapacity),
      turnaroundDays: Math.round(args.turnaroundDays),
      shipsNationwide: args.shipsNationwide,
      localOnly: args.localOnly,
      collaborates: args.collaborates,
      workingHours: args.workingHours?.trim().slice(0, 120),
      availability: args.availability ?? ("available" as const),
      craftFitCompletedAt: now,
      updatedAt: now,
    };

    let profileId: Id<"artisanProfiles">;
    if (existing) {
      profileId = existing._id;
      await ctx.db.patch(existing._id, payload);
    } else {
      profileId = await ctx.db.insert("artisanProfiles", {
        ...payload,
        verificationStatus: "not_submitted",
        completedProjects: 0,
        ratingSum: 0,
        ratingCount: 0,
        createdAt: now,
      });
    }

    const lastResponse = await ctx.db
      .query("craftFitResponses")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();
    if (!lastResponse) {
      await ctx.db.insert("craftFitResponses", {
        userId: user._id,
        schemaVersion: 1,
        answers: args,
        submittedAt: now,
      });
    } else {
      await ctx.db.patch(lastResponse._id, { answers: args, submittedAt: now });
    }

    if (!user.role || user.role === "user") {
      await ctx.db.patch(user._id, { role: "artisan" });
    }
    await recordAudit(ctx, {
      actorId: user._id,
      actorRole: "artisan",
      action: existing ? "artisan.craftfit_updated" : "artisan.craftfit_completed",
      subjectType: "artisanProfiles",
      subjectId: profileId,
    });
    return { profileId };
  },
});

export const submitVerification = mutation({
  args: { applicantNote: v.optional(v.string()) },
  handler: async (ctx) => {
    const { user, profile } = await requireArtisan(ctx);
    if (profile.verificationStatus === "verified") return { status: "verified" as const };
    if (profile.verificationStatus === "suspended") {
      throw new Error("FORBIDDEN: suspended profiles cannot submit verification.");
    }
    const portfolio = await ctx.db
      .query("portfolioItems")
      .withIndex("by_artisan", (q) => q.eq("artisanId", user._id))
      .take(1);
    if (portfolio.length === 0) {
      throw new Error("INVALID: add at least one portfolio piece before requesting verification.");
    }

    const existing = await ctx.db
      .query("verificationRequests")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();
    if (existing) return { status: "pending" as const };

    await ctx.db.insert("verificationRequests", {
      userId: user._id,
      requestedRole: "artisan",
      method: "manual_review",
      status: "pending",
      submittedAt: Date.now(),
    });
    await ctx.db.patch(profile._id, {
      verificationStatus: "pending",
      updatedAt: Date.now(),
    });

    const admins = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .take(10);
    for (const admin of admins) {
      await notifyUser(ctx, admin._id, {
        type: "verification.submitted",
        title: "New artisan verification request",
        body: `${profile.displayName} (${profile.city}) submitted a verification request.`,
        href: "/admin/verifications",
      });
    }
    await recordAudit(ctx, {
      actorId: user._id,
      actorRole: "artisan",
      action: "verification.submitted",
      subjectType: "verificationRequests",
      subjectId: String(user._id),
    });
    return { status: "pending" as const };
  },
});

export const myProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireMarketplaceUser(ctx);
    const profile = await artisanProfileFor(ctx, user._id);
    if (!profile) return null;
    return {
      ...publicArtisan(profile),
      intro: profile.intro,
      weeklyCapacity: profile.weeklyCapacity,
      localOnly: profile.localOnly,
      workingHours: profile.workingHours ?? null,
      customSkills: profile.customSkills ?? [],
      craftFitCompletedAt: profile.craftFitCompletedAt ?? null,
    };
  },
});

export const dashboard = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireMarketplaceUser(ctx);
    const profile = await artisanProfileFor(ctx, user._id);
    if (!profile) return null;

    const [quotes, projects, payouts, portfolio, invites] = await Promise.all([
      ctx.db.query("quotes").withIndex("by_artisan", (q) => q.eq("artisanId", user._id)).take(100),
      ctx.db.query("projects").withIndex("by_artisan", (q) => q.eq("artisanId", user._id)).take(100),
      ctx.db.query("payouts").withIndex("by_artisan", (q) => q.eq("artisanId", user._id)).take(50),
      ctx.db.query("portfolioItems").withIndex("by_artisan", (q) => q.eq("artisanId", user._id)).take(1),
      ctx.db
        .query("quoteRequests")
        .withIndex("by_artisan", (q) => q.eq("artisanId", user._id))
        .take(50),
    ]);

    const activeStatuses = ["funded", "in_production", "review_pending", "delivered", "disputed"];
    const active = projects.filter((project) => activeStatuses.includes(project.status));
    const pendingQuotes = quotes.filter((quote) => quote.status === "submitted");
    const paidPayouts = payouts.filter((payout) => payout.status === "paid");
    const pendingPayouts = payouts.filter((payout) => payout.status !== "paid" && payout.status !== "failed");
    const inviteCount = invites.filter((invite) => invite.status === "sent").length;
    const portfolioCount = await ctx.db
      .query("portfolioItems")
      .withIndex("by_artisan", (q) => q.eq("artisanId", user._id))
      .take(MAX_PORTFOLIO);

    const completionChecks = [
      Boolean(profile.craftHeadline),
      profile.skills.length > 0,
      profile.products.length > 0,
      portfolio.length > 0,
      profile.craftFitCompletedAt !== undefined,
      profile.verificationStatus === "verified",
    ];
    return {
      profile: {
        ...publicArtisan(profile),
        weeklyCapacity: profile.weeklyCapacity,
        workingHours: profile.workingHours ?? null,
      },
      counts: {
        activeProjects: active.length,
        pendingQuotes: pendingQuotes.length,
        invites: inviteCount,
        pendingPayouts: pendingPayouts.length,
        portfolio: portfolioCount.length,
      },
      earnings: {
        lifetimeReleasedInr: paidPayouts.reduce((sum, payout) => sum + payout.amountInr, 0),
        pendingPayoutInr: pendingPayouts.reduce((sum, payout) => sum + payout.amountInr, 0),
        paidPayoutCount: paidPayouts.length,
      },
      profileCompletion: Math.round(
        (completionChecks.filter(Boolean).length / completionChecks.length) * 100,
      ),
      recentProjects: active.slice(0, 4).map((project) => ({
        _id: project._id,
        title: project.title,
        status: project.status,
        amountInr: project.amountInr,
        updatedAt: project.updatedAt,
      })),
    };
  },
});

export const directory = query({
  args: {
    craft: v.optional(v.string()),
    product: v.optional(v.string()),
    city: v.optional(v.string()),
    availability: v.optional(v.string()),
    maxBudget: v.optional(v.number()),
    delivery: v.optional(v.string()),
    verifiedOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const profiles = await ctx.db
      .query("artisanProfiles")
      .withIndex("by_updated")
      .order("desc")
      .take(120);

    const filtered = profiles.filter((profile) => {
      if (profile.verificationStatus === "suspended") return false;
      if (args.verifiedOnly && profile.verificationStatus !== "verified") return false;
      if (args.craft && ![...profile.skills, ...(profile.customSkills ?? [])].some((s) => s.toLowerCase().includes(args.craft!.toLowerCase()))) return false;
      if (args.product && !profile.products.some((p) => p.toLowerCase() === args.product!.toLowerCase())) return false;
      if (args.city && !profile.city.toLowerCase().includes(args.city.toLowerCase())) return false;
      if (args.availability && profile.availability !== args.availability) return false;
      if (args.maxBudget && profile.minProjectValue > args.maxBudget) return false;
      if (args.delivery === "nationwide" && !profile.shipsNationwide) return false;
      if (args.delivery === "local" && profile.shipsNationwide && profile.localOnly) return false;
      return true;
    });

    return await Promise.all(
      filtered.slice(0, Math.min(args.limit ?? 24, 48)).map(async (profile) => {
        const preview = await ctx.db
          .query("portfolioItems")
          .withIndex("by_artisan_created", (q) => q.eq("artisanId", profile.userId))
          .order("desc")
          .first();
        return {
          ...publicArtisan(profile),
          previewUrl: preview?.image ? await ctx.storage.getUrl(preview.image.storageId) : null,
        };
      }),
    );
  },
});

export const publicProfile = query({
  args: { artisanId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await artisanProfileFor(ctx, args.artisanId);
    if (!profile || profile.verificationStatus === "suspended") return null;
    const [portfolio, reviews, activeProjects] = await Promise.all([
      portfolioWithUrls(ctx, args.artisanId),
      ctx.db.query("reviews").withIndex("by_subject", (q) => q.eq("subjectId", args.artisanId)).order("desc").take(12),
      ctx.db.query("projects").withIndex("by_artisan", (q) => q.eq("artisanId", args.artisanId)).take(100),
    ]);
    const reviewAuthors = await Promise.all(
      reviews.map(async (review) => {
        const author = await ctx.db.get(review.authorId);
        const name = (author?.name ?? "Customer").trim().split(/\s+/)[0];
        return { ...review, authorName: name };
      }),
    );
    return {
      ...publicArtisan(profile),
      intro: profile.intro,
      workingHours: profile.workingHours ?? null,
      languages: profile.languages,
      portfolio: portfolio.map((item) => ({
        _id: item._id,
        title: item.title,
        description: item.description,
        craftTags: item.craftTags,
        materialTags: item.materialTags,
        durationDays: item.durationDays,
        externalUrl: item.externalUrl,
        url: item.url,
        attribution: item.attribution ?? profile.displayName,
        reusePermission: item.reusePermission,
        sampleLabel: item.sampleLabel ?? null,
      })),
      reviews: reviewAuthors,
      stats: {
        completedProjects: activeProjects.filter((p) => p.status === "completed").length,
      },
    };
  },
});

export const matchesForRequest = query({
  args: { requestId: v.id("customerRequests") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("NOT_FOUND: request not found.");
    if (request.customerId !== user._id && user.role !== "admin") {
      throw new Error("NOT_FOUND: request not found.");
    }
    const profiles = await ctx.db.query("artisanProfiles").withIndex("by_updated").order("desc").take(80);
    const results = [];
    for (const profile of profiles) {
      if (profile.userId === user._id) continue;
      if (profile.sampleLabel) continue;
      if (profile.verificationStatus === "suspended") continue;
      const tags = await ctx.db
        .query("portfolioItems")
        .withIndex("by_artisan", (q) => q.eq("artisanId", profile.userId))
        .take(12);
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
        {
          ...profile,
          craftTags: tags.flatMap((tag) => tag.craftTags),
        },
      );
      if (!match.eligible) continue;
      const preview = await ctx.db
        .query("portfolioItems")
        .withIndex("by_artisan_created", (q) => q.eq("artisanId", profile.userId))
        .order("desc")
        .first();
      results.push({
        ...publicArtisan(profile),
        score: match.score,
        reasons: match.reasons,
        breakdown: match.breakdown,
        previewUrl: preview?.image ? await ctx.storage.getUrl(preview.image.storageId) : null,
      });
    }
    return results.sort((a, b) => b.score - a.score).slice(0, 12);
  },
});

export const addPortfolioItem = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    craftTags: v.array(v.string()),
    materialTags: v.array(v.string()),
    durationDays: v.optional(v.number()),
    externalUrl: v.optional(v.string()),
    image: v.optional(
      v.object({
        storageId: v.id("_storage"),
        name: v.optional(v.string()),
        contentType: v.optional(v.string()),
        size: v.optional(v.number()),
      }),
    ),
    ownershipDeclared: v.boolean(),
    attribution: v.optional(v.string()),
    reusePermission: v.union(
      v.literal("display_only"),
      v.literal("portfolio_and_promotion"),
      v.literal("reuse_with_credit"),
    ),
    sampleLabel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user, profile } = await requireArtisan(ctx);
    if (!args.ownershipDeclared) {
      throw new Error("INVALID: confirm that this work is yours to share.");
    }
    if (args.title.trim().length < 3) throw new Error("INVALID: add a portfolio title.");
    if (args.description.trim().length < 12) throw new Error("INVALID: describe the work briefly.");
    if (!args.image && !args.externalUrl?.trim()) {
      throw new Error("INVALID: upload an image or link to the work.");
    }
    if (args.craftTags.length === 0) throw new Error("INVALID: add at least one craft tag.");
    if (args.sampleLabel) {
      throw new Error("INVALID: sample labels can only be added by the demo seed.");
    }
    const count = await ctx.db
      .query("portfolioItems")
      .withIndex("by_artisan", (q) => q.eq("artisanId", user._id))
      .take(MAX_PORTFOLIO + 1);
    if (count.length >= MAX_PORTFOLIO) throw new Error("INVALID: portfolio limit reached (24 items).");

    let externalUrl: string | undefined;
    if (args.externalUrl?.trim()) {
      const candidate = args.externalUrl.trim();
      if (!/^https:\/\//i.test(candidate)) throw new Error("INVALID: links must start with https://");
      externalUrl = candidate.slice(0, 300);
    }
    const image = args.image ? await validateImageRef(ctx, args.image) : undefined;

    const id = await ctx.db.insert("portfolioItems", {
      artisanId: user._id,
      title: args.title.trim().slice(0, 100),
      description: args.description.trim().slice(0, 800),
      craftTags: args.craftTags.slice(0, 8),
      materialTags: args.materialTags.slice(0, 8),
      durationDays: args.durationDays,
      externalUrl,
      image,
      ownershipDeclared: true,
      attribution: args.attribution?.trim().slice(0, 120),
      reusePermission: args.reusePermission,
      createdAt: Date.now(),
    });
    await ctx.db.patch(profile._id, { updatedAt: Date.now() });
    await recordAudit(ctx, {
      actorId: user._id,
      actorRole: "artisan",
      action: "portfolio.added",
      subjectType: "portfolioItems",
      subjectId: String(id),
    });
    return { id };
  },
});

export const removePortfolioItem = mutation({
  args: { portfolioItemId: v.id("portfolioItems") },
  handler: async (ctx, args) => {
    const { user } = await requireArtisan(ctx);
    const item = await ctx.db.get(args.portfolioItemId);
    if (!item || item.artisanId !== user._id) throw new Error("NOT_FOUND: portfolio item not found.");
    if (item.image) await ctx.storage.delete(item.image.storageId);
    await ctx.db.delete(args.portfolioItemId);
    await recordAudit(ctx, {
      actorId: user._id,
      actorRole: "artisan",
      action: "portfolio.removed",
      subjectType: "portfolioItems",
      subjectId: String(args.portfolioItemId),
    });
  },
});

export const setAvailability = mutation({
  args: {
    availability: v.union(v.literal("available"), v.literal("limited"), v.literal("paused")),
    weeklyCapacity: v.optional(v.number()),
    workingHours: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user, profile } = await requireArtisan(ctx);
    const user2 = await ctx.db.get(user._id);
    if (!user2) throw new Error("UNAUTHENTICATED: account not found.");
    if (args.weeklyCapacity !== undefined && (args.weeklyCapacity < 1 || args.weeklyCapacity > 20)) {
      throw new Error("INVALID: weekly capacity must be 1–20.");
    }
    await ctx.db.patch(profile._id, {
      availability: args.availability,
      weeklyCapacity: args.weeklyCapacity ?? profile.weeklyCapacity,
      workingHours: args.workingHours?.trim().slice(0, 120) ?? profile.workingHours,
      updatedAt: Date.now(),
    });
    return { ok: true as const };
  },
});

export const profileStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await import("@convex-dev/auth/server").then((m) => m.getAuthUserId(ctx));
    if (!userId) return null;
    const profile = await artisanProfileFor(ctx, userId);
    const request = await ctx.db
      .query("verificationRequests")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();
    return {
      hasProfile: Boolean(profile),
      verificationStatus: profile?.verificationStatus ?? "not_submitted",
      request: request
        ? {
            status: request.status,
            submittedAt: request.submittedAt,
            reviewerNote: request.reviewerNote ?? null,
            reviewedAt: request.reviewedAt ?? null,
          }
        : null,
    };
  },
});

export type ArtisanProfileDoc = Doc<"artisanProfiles">;
