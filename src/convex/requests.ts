import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import {
  ensureCustomerProfile,
  publicFirstName,
  requireMarketplaceUser,
} from "./lib/access";
import { deriveCraftDna } from "./lib/craftDna";
import { notifyUser, recordAudit } from "./lib/events";
import { fileUrls, validateImageRefs } from "./lib/files";
import { JOB_FEED_MIN_SCORE, scoreArtisan, type MatchRequest } from "./lib/matching";
import { REQUEST_CATEGORIES } from "./lib/taxonomy";

const MAX_OPEN_REQUESTS = 12;

const fileRef = v.object({
  storageId: v.id("_storage"),
  name: v.optional(v.string()),
  contentType: v.optional(v.string()),
  size: v.optional(v.number()),
});

function assertRequestInput(args: {
  title: string;
  category: string;
  description: string;
  budgetInr: number;
  city: string;
  deadline?: string;
  ownershipConfirmed: boolean;
  customerSuppliesProduct: boolean;
}) {
  if (args.title.trim().length < 5) throw new Error("INVALID: add a short request title.");
  if (!REQUEST_CATEGORIES.includes(args.category as (typeof REQUEST_CATEGORIES)[number])) {
    throw new Error("INVALID: choose a supported product category.");
  }
  if (args.description.trim().length < 20) {
    throw new Error("INVALID: describe the customisation in at least 20 characters.");
  }
  if (args.budgetInr < 500 || args.budgetInr > 1_000_000) {
    throw new Error("INVALID: budget must be between ₹500 and ₹10,00,000.");
  }
  if (args.city.trim().length < 2) throw new Error("INVALID: add your city.");
  if (!args.customerSuppliesProduct && args.description.trim().length < 40) {
    throw new Error("INVALID: describe the base product you want the artisan to supply.");
  }
  if (args.deadline) {
    const due = new Date(args.deadline).getTime();
    if (!Number.isFinite(due)) throw new Error("INVALID: the deadline date is not valid.");
    if (due < Date.now()) throw new Error("INVALID: choose a future date.");
  }
}

function matchInputFromRequest(request: Doc<"customerRequests">): MatchRequest {
  return {
    category: request.category,
    budgetInr: request.budgetInr,
    requiredSkills: request.requiredSkills,
    materialsKnown: request.materialsKnown,
    city: request.city,
    fulfilment: request.fulfilment,
    deadline: request.deadline,
    craftPreference: request.craftPreference,
  };
}

async function findMatches(ctx: MutationCtx, request: Doc<"customerRequests">) {
  const profiles = await ctx.db.query("artisanProfiles").withIndex("by_updated").order("desc").take(80);
  const matches: {
    profile: Doc<"artisanProfiles">;
    score: number;
    reasons: string[];
    previewUrl: string | null;
    previewStorageId: Id<"_storage"> | null;
  }[] = [];
  for (const profile of profiles) {
    // Demo profiles are for directory display only; they must never create the
    // impression that a real artisan is available for this brief.
    if (profile.sampleLabel) continue;
    if (profile.verificationStatus === "suspended") continue;
    const items = await ctx.db
      .query("portfolioItems")
      .withIndex("by_artisan", (q) => q.eq("artisanId", profile.userId))
      .take(12);
    const match = scoreArtisan(matchInputFromRequest(request), {
      ...profile,
      craftTags: items.flatMap((item: Doc<"portfolioItems">) => item.craftTags),
    });
    if (!match.eligible) continue;
    const preview = items.find((item: Doc<"portfolioItems">) => item.image);
    matches.push({
      profile,
      score: match.score,
      reasons: match.reasons,
      previewUrl: preview?.image ? await ctx.storage.getUrl(preview.image.storageId) : null,
      previewStorageId: preview?.image?.storageId ?? null,
    });
  }
  return matches.sort((a, b) => b.score - a.score);
}

export const create = mutation({
  args: {
    title: v.string(),
    category: v.string(),
    productDescription: v.string(),
    conditionNotes: v.optional(v.string()),
    ownershipConfirmed: v.boolean(),
    description: v.string(),
    craftPreference: v.optional(v.string()),
    colours: v.optional(v.string()),
    placement: v.optional(v.string()),
    materialsKnown: v.optional(v.string()),
    specialInstructions: v.optional(v.string()),
    budgetInr: v.number(),
    deadline: v.optional(v.string()),
    city: v.string(),
    fulfilment: v.union(v.literal("shipping"), v.literal("local_handoff")),
    customerSuppliesProduct: v.boolean(),
    images: v.array(fileRef),
    designId: v.optional(v.id("designs")),
    invitedArtisanIds: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    if (!args.ownershipConfirmed) {
      throw new Error("INVALID: confirm you own the product you want customised.");
    }
    assertRequestInput(args);
    if (args.images.length === 0) {
      throw new Error("INVALID: upload at least one photo of the product.");
    }
    const images = await validateImageRefs(ctx, args.images);
    await ensureCustomerProfile(ctx, user._id);
    let designId: Id<"designs"> | undefined;
    if (args.designId) {
      const design = await ctx.db.get(args.designId);
      if (!design || design.userId !== user._id) {
        throw new Error("NOT_FOUND: saved design not found.");
      }
      designId = design._id;
    }

    const now = Date.now();
    const dayAgo = now - 86_400_000;
    const recent = await ctx.db
      .query("customerRequests")
      .withIndex("by_customer_created", (q) => q.eq("customerId", user._id).gte("createdAt", dayAgo))
      .take(MAX_OPEN_REQUESTS + 1);
    if (recent.length >= MAX_OPEN_REQUESTS) {
      throw new Error("LIMIT: you have created many requests today. Try again tomorrow.");
    }

    const dna = deriveCraftDna({
      category: args.category,
      description: args.description,
      craftPreference: args.craftPreference,
      materialsKnown: args.materialsKnown,
      placement: args.placement,
      colours: args.colours,
      deadline: args.deadline,
      budgetInr: args.budgetInr,
      customerSuppliesProduct: args.customerSuppliesProduct,
    });

    const id = await ctx.db.insert("customerRequests", {
      customerId: user._id,
      title: args.title.trim().slice(0, 100),
      category: args.category,
      productDescription: args.productDescription.trim().slice(0, 1200),
      conditionNotes: args.conditionNotes?.trim().slice(0, 600),
      ownershipConfirmed: true,
      description: args.description.trim().slice(0, 2000),
      craftPreference: args.craftPreference?.slice(0, 80),
      colours: args.colours?.trim().slice(0, 160),
      placement: args.placement?.trim().slice(0, 160),
      materialsKnown: args.materialsKnown?.trim().slice(0, 160),
      specialInstructions: args.specialInstructions?.trim().slice(0, 800),
      budgetInr: Math.round(args.budgetInr),
      deadline: args.deadline,
      city: args.city.trim().slice(0, 80),
      fulfilment: args.fulfilment,
      customerSuppliesProduct: args.customerSuppliesProduct,
      images,
      designId,
      requiredSkills: dna.requiredSkills,
      suggestedMaterials: dna.suggestedMaterials,
      productionNotes: dna.productionNotes,
      missingInfo: dna.missingInfo,
      briefSummary: dna.summary,
      status: "open",
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    if (!user.role || user.role === "user") {
      await ctx.db.patch(user._id, { role: "customer" });
    }

    // Explicit invitations from the wizard.
    const invited = new Set<Id<"users">>();
    for (const artisanId of (args.invitedArtisanIds ?? []).slice(0, 8)) {
      if (artisanId === user._id || invited.has(artisanId)) continue;
      const profile = await ctx.db
        .query("artisanProfiles")
        .withIndex("by_user", (q) => q.eq("userId", artisanId))
        .unique();
      if (!profile || profile.sampleLabel || profile.verificationStatus === "suspended") continue;
      invited.add(artisanId);
      await ctx.db.insert("quoteRequests", {
        requestId: id,
        customerId: user._id,
        artisanId,
        status: "sent",
        message: "The customer selected you while preparing this brief.",
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("conversations", {
        customerId: user._id,
        artisanId,
        scopeType: "request",
        scopeId: String(id),
        requestId: id,
        lastMessageAt: now,
        lastMessagePreview: "Quote request sent",
        createdAt: now,
      });
      await notifyUser(ctx, artisanId, {
        type: "job.invited",
        title: "New quote request",
        body: `${args.title.trim().slice(0, 60)} — budget ₹${Math.round(args.budgetInr).toLocaleString("en-IN")}.`,
        href: `/artisan/jobs/${id}`,
      });
    }

    // Notify a small number of strong matches so good work is discoverable,
    // without spamming every artisan on the platform.
    const matches = await findMatches(ctx, (await ctx.db.get(id))!);
    for (const match of matches.slice(0, 3)) {
      if (invited.has(match.profile.userId) || match.profile.userId === user._id) continue;
      await notifyUser(ctx, match.profile.userId, {
        type: "job.match",
        title: "A new KalaJob matches your craft",
        body: `${args.title.trim().slice(0, 60)} — ${match.score}% match.`,
        href: `/artisan/jobs/${id}`,
      });
    }

    await recordAudit(ctx, {
      actorId: user._id,
      actorRole: "customer",
      action: "request.created",
      subjectType: "customerRequests",
      subjectId: String(id),
      detail: `${args.category} · ₹${Math.round(args.budgetInr)}`,
    });
    await notifyUser(ctx, user._id, {
      type: "request.published",
      title: "Your brief is live",
      body: `${matches.length} eligible artisans are available for this type of work.`,
      href: `/customer/requests/${id}`,
    });
    return { requestId: id, eligibleMatches: matches.length };
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireMarketplaceUser(ctx);
    const rows = await ctx.db
      .query("customerRequests")
      .withIndex("by_customer_created", (q) => q.eq("customerId", user._id))
      .order("desc")
      .take(30);
    return await Promise.all(
      rows.map(async (request) => {
        const quotes = await ctx.db
          .query("quotes")
          .withIndex("by_request", (q) => q.eq("requestId", request._id))
          .take(20);
        const activeQuotes = quotes.filter((quote) => quote.status === "submitted");
        return {
          _id: request._id,
          title: request.title,
          category: request.category,
          status: request.status,
          budgetInr: request.budgetInr,
          deadline: request.deadline ?? null,
          city: request.city,
          createdAt: request.createdAt,
          quoteCount: activeQuotes.length,
          bestQuoteInr:
            activeQuotes.length > 0 ? Math.min(...activeQuotes.map((quote) => quote.totalInr)) : null,
          imageUrl: request.images[0]
            ? await ctx.storage.getUrl(request.images[0].storageId)
            : null,
        };
      }),
    );
  },
});

export const getMine = query({
  args: { requestId: v.id("customerRequests") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request || (request.customerId !== user._id && user.role !== "admin")) {
      throw new Error("NOT_FOUND: request not found.");
    }
    const [quotes, images, invitations, project] = await Promise.all([
      ctx.db.query("quotes").withIndex("by_request", (q) => q.eq("requestId", args.requestId)).take(30),
      fileUrls(ctx, request.images),
      ctx.db.query("quoteRequests").withIndex("by_request", (q) => q.eq("requestId", args.requestId)).take(20),
      ctx.db.query("projects").withIndex("by_request", (q) => q.eq("requestId", args.requestId)).first(),
    ]);
    const quoteRows = await Promise.all(
      quotes.map(async (quote) => {
        const profile = await ctx.db
          .query("artisanProfiles")
          .withIndex("by_user", (q) => q.eq("userId", quote.artisanId))
          .unique();
        const portfolioPreview = await ctx.db
          .query("portfolioItems")
          .withIndex("by_artisan_created", (q) => q.eq("artisanId", quote.artisanId))
          .order("desc")
          .first();
        return {
          ...quote,
          artisanName: profile?.displayName ?? "Artisan",
          artisanCity: profile?.city ?? "",
          artisanSkills: profile?.skills ?? [],
          artisanVerification: profile?.verificationStatus ?? "not_submitted",
          artisanRating:
            profile && profile.ratingCount > 0
              ? Math.round((profile.ratingSum / profile.ratingCount) * 10) / 10
              : null,
          artisanPreviewUrl:
            portfolioPreview?.image ? await ctx.storage.getUrl(portfolioPreview.image.storageId) : null,
        };
      }),
    );
    return {
      request: { ...request, images },
      quotes: quoteRows,
      invitations,
      project: project ?? null,
    };
  },
});

export const jobFeed = query({
  args: {
    minScore: v.optional(v.number()),
    includeSavedOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const profile = await ctx.db
      .query("artisanProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    if (!profile) return { needsProfile: true as const, jobs: [] };

    const openRequests = await ctx.db
      .query("customerRequests")
      .withIndex("by_status_published", (q) => q.eq("status", "open"))
      .order("desc")
      .take(60);

    const [saved, invites, myQuotes, portfolio] = await Promise.all([
      ctx.db.query("savedJobs").withIndex("by_artisan", (q) => q.eq("artisanId", user._id)).take(100),
      ctx.db.query("quoteRequests").withIndex("by_artisan", (q) => q.eq("artisanId", user._id)).take(100),
      ctx.db.query("quotes").withIndex("by_artisan", (q) => q.eq("artisanId", user._id)).take(100),
      ctx.db.query("portfolioItems").withIndex("by_artisan", (q) => q.eq("artisanId", user._id)).take(24),
    ]);
    const savedIds = new Set(saved.map((row) => row.requestId));
    const declinedInvites = new Set(
      invites.filter((invite) => invite.status === "declined").map((invite) => invite.requestId),
    );
    const invitedIds = new Set(invites.filter((invite) => invite.status !== "declined").map((invite) => invite.requestId));
    const quotedIds = new Set(
      myQuotes.filter((quote) => quote.status === "submitted").map((quote) => quote.requestId),
    );
    const tags = portfolio.flatMap((item) => item.craftTags);

    const jobs = [];
    for (const request of openRequests) {
      if (declinedInvites.has(request._id)) continue;
      if (request.customerId === user._id) continue;
      const match = scoreArtisan(matchInputFromRequest(request), { ...profile, craftTags: tags });
      const invited = invitedIds.has(request._id);
      if (!match.eligible && !invited) continue;
      const scoreThreshold = args.minScore ?? JOB_FEED_MIN_SCORE;
      if (!invited && match.score < scoreThreshold) continue;
      if (args.includeSavedOnly && !savedIds.has(request._id)) continue;
      const customer = await ctx.db.get(request.customerId);
      jobs.push({
        _id: request._id,
        title: request.title,
        category: request.category,
        description: request.description.slice(0, 240),
        craftPreference: request.craftPreference ?? null,
        requiredSkills: request.requiredSkills,
        budgetInr: request.budgetInr,
        deadline: request.deadline ?? null,
        city: request.city,
        fulfilment: request.fulfilment,
        createdAt: request.createdAt,
        previewUrl: request.images[0] ? await ctx.storage.getUrl(request.images[0].storageId) : null,
        score: match.score,
        reasons: match.reasons,
        breakdown: match.breakdown,
        invited,
        saved: savedIds.has(request._id),
        quoted: quotedIds.has(request._id),
        customerFirstName: publicFirstName(customer ?? null),
        customerVerified: Boolean(customer?.emailVerificationTime),
      });
    }
    return {
      needsProfile: false as const,
      jobs: jobs.sort((a, b) => Number(b.invited) - Number(a.invited) || b.score - a.score),
    };
  },
});

export const getJob = query({
  args: { requestId: v.id("customerRequests") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const profile = await ctx.db
      .query("artisanProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    if (!profile) throw new Error("FORBIDDEN: complete CraftFit first.");
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("NOT_FOUND: job not found.");

    const [invite, existingQuote, saved, customer, portfolio] = await Promise.all([
      ctx.db
        .query("quoteRequests")
        .withIndex("by_request_artisan", (q) => q.eq("requestId", args.requestId).eq("artisanId", user._id))
        .unique(),
      ctx.db
        .query("quotes")
        .withIndex("by_request_artisan", (q) => q.eq("requestId", args.requestId).eq("artisanId", user._id))
        .first(),
      ctx.db
        .query("savedJobs")
        .withIndex("by_artisan_request", (q) => q.eq("artisanId", user._id).eq("requestId", args.requestId))
        .unique(),
      ctx.db.get(request.customerId),
      ctx.db.query("portfolioItems").withIndex("by_artisan", (q) => q.eq("artisanId", user._id)).take(24),
    ]);
    const isOwner = request.customerId === user._id;
    const activeInvite = Boolean(invite && invite.status !== "declined");
    const match = scoreArtisan(matchInputFromRequest(request), {
      ...profile,
      craftTags: portfolio.flatMap((item) => item.craftTags),
    });
    // A logged-in artisan must not be able to read an arbitrary brief by guessing
    // its id. Open jobs are visible only when the deterministic match clears the
    // KalaJobs threshold, or when this customer invited them / they already quoted.
    const visibleAsMatch = match.eligible && match.score >= JOB_FEED_MIN_SCORE;
    if (!isOwner && !activeInvite && !existingQuote && !visibleAsMatch) {
      throw new Error("NOT_FOUND: this job is not available in your KalaJobs.");
    }
    if (request.status !== "open" && !isOwner && !activeInvite && !existingQuote) {
      throw new Error("NOT_FOUND: this job is closed.");
    }
    return {
      request: {
        ...request,
        customerId: undefined,
        images: await fileUrls(ctx, request.images),
        customerFirstName: publicFirstName(customer ?? null),
        customerVerified: Boolean(customer?.emailVerificationTime),
        customerCity: customer?.city ?? null,
      },
      match,
      invite: invite ?? null,
      existingQuote: existingQuote ?? null,
      saved: Boolean(saved),
      isOwner,
    };
  },
});

export const inviteArtisans = mutation({
  args: { requestId: v.id("customerRequests"), artisanIds: v.array(v.id("users")) },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request || request.customerId !== user._id) throw new Error("NOT_FOUND: request not found.");
    if (request.status !== "open") throw new Error("INVALID: this request is no longer open.");

    const added: string[] = [];
    for (const artisanId of args.artisanIds.slice(0, 8)) {
      if (artisanId === user._id) continue;
      const profile = await ctx.db
        .query("artisanProfiles")
        .withIndex("by_user", (q) => q.eq("userId", artisanId))
        .unique();
      if (!profile || profile.sampleLabel || profile.verificationStatus === "suspended") continue;
      const existing = await ctx.db
        .query("quoteRequests")
        .withIndex("by_request_artisan", (q) => q.eq("requestId", args.requestId).eq("artisanId", artisanId))
        .unique();
      if (existing) continue;
      await ctx.db.insert("quoteRequests", {
        requestId: args.requestId,
        customerId: user._id,
        artisanId,
        status: "sent",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      const conversation = await ctx.db
        .query("conversations")
        .withIndex("by_scope", (q) => q.eq("scopeType", "request").eq("scopeId", String(args.requestId)))
        .filter((q) => q.eq(q.field("artisanId"), artisanId))
        .first();
      if (!conversation) {
        await ctx.db.insert("conversations", {
          customerId: user._id,
          artisanId,
          scopeType: "request",
          scopeId: String(args.requestId),
          requestId: args.requestId,
          lastMessageAt: Date.now(),
          lastMessagePreview: "Quote request sent",
          createdAt: Date.now(),
        });
      }
      await notifyUser(ctx, artisanId, {
        type: "job.invited",
        title: "Quote request from a customer",
        body: `${request.title} — budget ₹${request.budgetInr.toLocaleString("en-IN")}.`,
        href: `/artisan/jobs/${args.requestId}`,
      });
      added.push(String(artisanId));
    }
    return { invited: added.length };
  },
});

export const close = mutation({
  args: { requestId: v.id("customerRequests") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request || request.customerId !== user._id) throw new Error("NOT_FOUND: request not found.");
    if (request.status !== "open") throw new Error("INVALID: only open requests can be closed.");
    await ctx.db.patch(args.requestId, { status: "closed", closedAt: Date.now(), updatedAt: Date.now() });
    await recordAudit(ctx, {
      actorId: user._id,
      actorRole: "customer",
      action: "request.closed",
      subjectType: "customerRequests",
      subjectId: String(args.requestId),
    });
  },
});

export const toggleSavedJob = mutation({
  args: { requestId: v.id("customerRequests") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const profile = await ctx.db
      .query("artisanProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    if (!profile) throw new Error("FORBIDDEN: complete CraftFit first.");
    const existing = await ctx.db
      .query("savedJobs")
      .withIndex("by_artisan_request", (q) => q.eq("artisanId", user._id).eq("requestId", args.requestId))
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return { saved: false };
    }
    await ctx.db.insert("savedJobs", {
      artisanId: user._id,
      requestId: args.requestId,
      createdAt: Date.now(),
    });
    return { saved: true };
  },
});

export const declineInvitation = mutation({
  args: {
    requestId: v.id("customerRequests"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const invite = await ctx.db
      .query("quoteRequests")
      .withIndex("by_request_artisan", (q) => q.eq("requestId", args.requestId).eq("artisanId", user._id))
      .unique();
    if (!invite) throw new Error("NOT_FOUND: invitation not found.");
    await ctx.db.patch(invite._id, {
      status: "declined",
      message: args.reason?.slice(0, 300),
      updatedAt: Date.now(),
    });
    const request = await ctx.db.get(args.requestId);
    if (request) {
      await notifyUser(ctx, request.customerId, {
        type: "quote.declined",
        title: "An artisan declined your invitation",
        body: "You can invite another artisan from your matches.",
        href: `/customer/requests/${args.requestId}`,
      });
    }
  },
});

export const report = mutation({
  args: {
    requestId: v.id("customerRequests"),
    reason: v.string(),
    detail: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("NOT_FOUND: job not found.");
    if (args.detail.trim().length < 10) throw new Error("INVALID: add a little detail for the review team.");
    await ctx.db.insert("moderationReports", {
      reporterId: user._id,
      subjectType: "request",
      subjectId: String(args.requestId),
      reason: args.reason.slice(0, 80),
      detail: args.detail.trim().slice(0, 1200),
      status: "open",
      createdAt: Date.now(),
    });
    await ctx.db.insert("riskSignals", {
      subjectUserId: request.customerId,
      kind: "request_reported",
      severity: "low",
      detail: args.reason.slice(0, 140),
      requestId: request._id,
      createdAt: Date.now(),
    });
    return { ok: true as const };
  },
});
