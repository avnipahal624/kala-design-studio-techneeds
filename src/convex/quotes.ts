import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import {
  requireMarketplaceUser,
} from "./lib/access";
import { addKalaProof, notifyUser, recordAudit } from "./lib/events";
import { feeBreakdown } from "./lib/payments";

function assertQuoteInput(args: {
  materialsInr: number;
  labourInr: number;
  preparationInr: number;
  finishingInr: number;
  packagingInr: number;
  deliveryInr: number;
  timelineDays: number;
  revisionRounds: number;
  depositPercent: number;
  terms: string;
}) {
  const lines = [
    args.materialsInr,
    args.labourInr,
    args.preparationInr,
    args.finishingInr,
    args.packagingInr,
    args.deliveryInr,
  ];
  if (lines.some((line) => !Number.isFinite(line) || line < 0 || line > 1_000_000)) {
    throw new Error("INVALID: quote amounts must be between ₹0 and ₹10,00,000.");
  }
  if (args.timelineDays < 1 || args.timelineDays > 365) throw new Error("INVALID: timeline must be 1–365 days.");
  if (args.revisionRounds < 0 || args.revisionRounds > 5) {
    throw new Error("INVALID: revision rounds must be 0–5.");
  }
  if (args.depositPercent < 0 || args.depositPercent > 50) {
    throw new Error("INVALID: deposit must be 0–50%.");
  }
  if (args.terms.trim().length < 40) {
    throw new Error("INVALID: terms must explain scope, revisions and delivery in at least 40 characters.");
  }
}

type QuoteSnapshot = {
  materialsInr: number;
  labourInr: number;
  preparationInr: number;
  finishingInr: number;
  packagingInr: number;
  deliveryInr: number;
  totalInr: number;
  platformFeePercent: number;
  platformFeeInr: number;
  netPayoutInr: number;
  timelineDays: number;
  revisionRounds: number;
  depositPercent: number;
  terms: string;
  version: number;
};

async function loadRequestOrThrow(ctx: MutationCtx, requestId: Id<"customerRequests">) {
  const request = await ctx.db.get(requestId);
  if (!request) throw new Error("NOT_FOUND: request not found.");
  return request;
}

export const submit = mutation({
  args: {
    requestId: v.id("customerRequests"),
    materialsInr: v.number(),
    labourInr: v.number(),
    preparationInr: v.number(),
    finishingInr: v.number(),
    packagingInr: v.number(),
    deliveryInr: v.number(),
    timelineDays: v.number(),
    revisionRounds: v.number(),
    depositPercent: v.number(),
    terms: v.string(),
    note: v.optional(v.string()),
    expiresInDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const profile = await ctx.db
      .query("artisanProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    if (!profile) throw new Error("FORBIDDEN: complete CraftFit before quoting.");
    if (profile.verificationStatus === "suspended") {
      throw new Error("FORBIDDEN: this artisan profile is suspended.");
    }

    const request = await loadRequestOrThrow(ctx, args.requestId);
    if (request.customerId === user._id) {
      throw new Error("FORBIDDEN: you cannot quote on your own request.");
    }
    if (request.status !== "open") throw new Error("INVALID: this request is no longer accepting quotes.");
    if (request.deadline && new Date(request.deadline).getTime() < Date.now()) {
      throw new Error("INVALID: the customer's deadline has passed.");
    }
    assertQuoteInput(args);

    const totalInr = Math.round(
      args.materialsInr +
        args.labourInr +
        args.preparationInr +
        args.finishingInr +
        args.packagingInr +
        args.deliveryInr,
    );
    if (totalInr <= 0) throw new Error("INVALID: the quote total must be greater than zero.");
    if (totalInr > request.budgetInr) {
      throw new Error(
        `INVALID: total exceeds the customer's maximum budget of ₹${request.budgetInr.toLocaleString("en-IN")}.`,
      );
    }
    const fees = feeBreakdown(totalInr);
    const now = Date.now();
    const expiresInDays = Math.min(Math.max(args.expiresInDays ?? 7, 1), 30);

    const existing = await ctx.db
      .query("quotes")
      .withIndex("by_request_artisan", (q) => q.eq("requestId", args.requestId).eq("artisanId", user._id))
      .first();
    if (existing && (existing.status === "accepted" || existing.status === "declined")) {
      throw new Error("INVALID: this quote can no longer be revised.");
    }

    const version = existing ? existing.version + 1 : 1;
    const snapshot: QuoteSnapshot = {
      materialsInr: Math.round(args.materialsInr),
      labourInr: Math.round(args.labourInr),
      preparationInr: Math.round(args.preparationInr),
      finishingInr: Math.round(args.finishingInr),
      packagingInr: Math.round(args.packagingInr),
      deliveryInr: Math.round(args.deliveryInr),
      totalInr: fees.totalInr,
      platformFeePercent: fees.feePercent,
      platformFeeInr: fees.platformFeeInr,
      netPayoutInr: fees.netPayoutInr,
      timelineDays: Math.round(args.timelineDays),
      revisionRounds: Math.round(args.revisionRounds),
      depositPercent: Math.round(args.depositPercent),
      terms: args.terms.trim().slice(0, 2000),
      version,
    };

    const quoteId = existing
      ? existing._id
      : await ctx.db.insert("quotes", {
          requestId: args.requestId,
          artisanId: user._id,
          customerId: request.customerId,
          ...snapshot,
          status: "submitted",
          expiresAt: now + expiresInDays * 86_400_000,
          createdAt: now,
          updatedAt: now,
          note: args.note?.trim().slice(0, 800),
        });

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...snapshot,
        status: "submitted",
        expiresAt: now + expiresInDays * 86_400_000,
        updatedAt: now,
        note: args.note?.trim().slice(0, 800),
      });
    }
    await ctx.db.insert("quoteVersions", {
      quoteId,
      requestId: args.requestId,
      artisanId: user._id,
      version,
      snapshot,
      createdAt: now,
    });

    const invite = await ctx.db
      .query("quoteRequests")
      .withIndex("by_request_artisan", (q) => q.eq("requestId", args.requestId).eq("artisanId", user._id))
      .unique();
    if (invite) {
      await ctx.db.patch(invite._id, { status: "quoted", updatedAt: now });
    }

    await notifyUser(ctx, request.customerId, {
      type: "quote.received",
      title: existing ? "A quote was revised" : "New quote received",
      body: `${profile.displayName} quoted ₹${fees.totalInr.toLocaleString("en-IN")} with a ${snapshot.timelineDays}-day timeline.`,
      href: `/customer/requests/${args.requestId}`,
    });
    await recordAudit(ctx, {
      actorId: user._id,
      actorRole: "artisan",
      action: existing ? "quote.revised" : "quote.submitted",
      subjectType: "quotes",
      subjectId: String(quoteId),
      detail: `₹${fees.totalInr} · version ${version}`,
    });
    return { quoteId, version, totalInr: fees.totalInr, netPayoutInr: fees.netPayoutInr };
  },
});

export const withdraw = mutation({
  args: { quoteId: v.id("quotes") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const quote = await ctx.db.get(args.quoteId);
    if (!quote || quote.artisanId !== user._id) throw new Error("NOT_FOUND: quote not found.");
    if (quote.status !== "submitted") throw new Error("INVALID: only an open quote can be withdrawn.");
    await ctx.db.patch(args.quoteId, { status: "withdrawn", updatedAt: Date.now() });
    await notifyUser(ctx, quote.customerId, {
      type: "quote.withdrawn",
      title: "A quote was withdrawn",
      body: "The artisan withdrew their quote. Other quotes for this request are still available.",
      href: `/customer/requests/${quote.requestId}`,
    });
  },
});

export const decline = mutation({
  args: { quoteId: v.id("quotes") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const quote = await ctx.db.get(args.quoteId);
    if (!quote || quote.customerId !== user._id) throw new Error("NOT_FOUND: quote not found.");
    if (quote.status !== "submitted") throw new Error("INVALID: only an open quote can be declined.");
    await ctx.db.patch(args.quoteId, { status: "declined", updatedAt: Date.now() });
    await notifyUser(ctx, quote.artisanId, {
      type: "quote.declined",
      title: "Quote not selected",
      body: "The customer chose another quote for this request.",
      href: "/artisan/quotes",
    });
  },
});

export const accept = mutation({
  args: { quoteId: v.id("quotes") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const quote = await ctx.db.get(args.quoteId);
    if (!quote || quote.customerId !== user._id) throw new Error("NOT_FOUND: quote not found.");
    if (quote.status !== "submitted") throw new Error("INVALID: this quote can no longer be accepted.");
    if (quote.expiresAt && quote.expiresAt < Date.now()) {
      throw new Error("INVALID: this quote has expired. Ask the artisan for a new one.");
    }
    const request = await loadRequestOrThrow(ctx, quote.requestId);
    if (request.status !== "open") throw new Error("INVALID: this request is no longer open.");
    if (request.customerId === quote.artisanId) {
      throw new Error("FORBIDDEN: a customer cannot accept their own quote.");
    }

    const now = Date.now();
    const projectId = await ctx.db.insert("projects", {
      requestId: quote.requestId,
      quoteId: quote._id,
      customerId: quote.customerId,
      artisanId: quote.artisanId,
      title: request.title,
      acceptedQuote: {
        materialsInr: quote.materialsInr,
        labourInr: quote.labourInr,
        preparationInr: quote.preparationInr,
        finishingInr: quote.finishingInr,
        packagingInr: quote.packagingInr,
        deliveryInr: quote.deliveryInr,
        totalInr: quote.totalInr,
        platformFeePercent: quote.platformFeePercent,
        platformFeeInr: quote.platformFeeInr,
        netPayoutInr: quote.netPayoutInr,
        timelineDays: quote.timelineDays,
        revisionRounds: quote.revisionRounds,
        depositPercent: quote.depositPercent,
        terms: quote.terms,
        version: quote.version,
        acceptedAt: now,
      },
      amountInr: quote.totalInr,
      platformFeeInr: quote.platformFeeInr,
      netPayoutInr: quote.netPayoutInr,
      status: "awaiting_payment",
      paymentStatus: "awaiting_payment",
      revisionRoundsUsed: 0,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(quote._id, {
      status: "accepted",
      acceptedAt: now,
      projectId,
      updatedAt: now,
    });
    await ctx.db.patch(request._id, {
      status: "quote_selected",
      closedAt: now,
      updatedAt: now,
    });

    const siblingQuotes = await ctx.db
      .query("quotes")
      .withIndex("by_request", (q) => q.eq("requestId", quote.requestId))
      .take(30);
    for (const sibling of siblingQuotes) {
      if (sibling._id === quote._id || sibling.status !== "submitted") continue;
      await ctx.db.patch(sibling._id, { status: "declined", updatedAt: now });
      await notifyUser(ctx, sibling.artisanId, {
        type: "quote.declined",
        title: "Quote not selected",
        body: "Another quote was accepted for this request. New KalaJobs are waiting.",
        href: "/artisan/jobs",
      });
    }

    await ctx.db.insert("conversations", {
      customerId: quote.customerId,
      artisanId: quote.artisanId,
      scopeType: "project",
      scopeId: String(projectId),
      requestId: quote.requestId,
      projectId,
      lastMessageAt: now,
      lastMessagePreview: "Project workspace created",
      createdAt: now,
    });

    await addKalaProof(ctx, {
      projectId,
      requestId: quote.requestId,
      type: "quote_submitted",
      title: `Quote #${quote.version} submitted`,
      note: `₹${quote.totalInr.toLocaleString("en-IN")} · ${quote.timelineDays} days · ${quote.revisionRounds} revisions`,
      actorId: quote.artisanId,
      actorRole: "artisan",
    });
    await addKalaProof(ctx, {
      projectId,
      requestId: quote.requestId,
      type: "quote_accepted",
      title: "Quote and terms accepted",
      note: `Accepted version ${quote.version}. Payment is required before production begins.`,
      actorId: user._id,
      actorRole: "customer",
    });

    await notifyUser(ctx, quote.artisanId, {
      type: "quote.accepted",
      title: "Your quote was accepted",
      body: `Awaiting the customer's protected payment for ${request.title}.`,
      href: `/artisan/projects/${projectId}`,
    });
    await notifyUser(ctx, user._id, {
      type: "project.created",
      title: "Project created — payment next",
      body: "Review the accepted terms and complete payment before production starts.",
      href: `/customer/projects/${projectId}`,
    });
    await recordAudit(ctx, {
      actorId: user._id,
      actorRole: "customer",
      action: "quote.accepted",
      subjectType: "quotes",
      subjectId: String(quote._id),
      detail: `project ${projectId}`,
    });
    return { projectId };
  },
});

export const forArtisan = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireMarketplaceUser(ctx);
    const quotes = await ctx.db
      .query("quotes")
      .withIndex("by_artisan", (q) => q.eq("artisanId", user._id))
      .order("desc")
      .take(50);
    return await Promise.all(
      quotes.map(async (quote) => {
        const request = await ctx.db.get(quote.requestId);
        return {
          ...quote,
          requestTitle: request?.title ?? "Request",
          requestCategory: request?.category ?? "",
          requestStatus: request?.status ?? "closed",
          requestImageUrl: request?.images[0]
            ? await ctx.storage.getUrl(request.images[0].storageId)
            : null,
        };
      }),
    );
  },
});

export const forCustomer = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireMarketplaceUser(ctx);
    const quotes = await ctx.db
      .query("quotes")
      .withIndex("by_customer", (q) => q.eq("customerId", user._id))
      .order("desc")
      .take(50);
    return await Promise.all(
      quotes.map(async (quote) => {
        const request = await ctx.db.get(quote.requestId);
        const profile = await ctx.db
          .query("artisanProfiles")
          .withIndex("by_user", (q) => q.eq("userId", quote.artisanId))
          .unique();
        return {
          ...quote,
          requestTitle: request?.title ?? "Request",
          artisanName: profile?.displayName ?? "Artisan",
          artisanCity: profile?.city ?? "",
          artisanVerification: profile?.verificationStatus ?? "not_submitted",
        };
      }),
    );
  },
});

export const get = query({
  args: { quoteId: v.id("quotes") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const quote = await ctx.db.get(args.quoteId);
    if (!quote || (quote.customerId !== user._id && quote.artisanId !== user._id && user.role !== "admin")) {
      throw new Error("NOT_FOUND: quote not found.");
    }
    const versions = await ctx.db
      .query("quoteVersions")
      .withIndex("by_quote", (q) => q.eq("quoteId", args.quoteId))
      .order("desc")
      .take(20);
    return { quote, versions };
  },
});
