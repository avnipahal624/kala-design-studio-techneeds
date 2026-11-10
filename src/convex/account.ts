import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  artisanProfileFor,
  customerProfileFor,
  ensureCustomerProfile,
  requireMarketplaceUser,
} from "./lib/access";
import { recordAudit } from "./lib/events";

export const profiles = query({
  args: {},
  handler: async (ctx) => {
    const userId = await import("@convex-dev/auth/server").then((m) => m.getAuthUserId(ctx));
    if (!userId) return null;
    const [customer, artisan] = await Promise.all([
      customerProfileFor(ctx, userId),
      artisanProfileFor(ctx, userId),
    ]);
    return { customer, artisan };
  },
});

/** Creates the lightweight customer profile on first entry to the customer portal. */
export const ensureCustomer = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireMarketplaceUser(ctx);
    await ensureCustomerProfile(ctx, user._id);
    await ctx.db.patch(user._id, { lastActiveAt: Date.now() });
    if (!user.role || user.role === "user") {
      await ctx.db.patch(user._id, { role: "customer" });
    }
    return { ok: true as const };
  },
});

export const saveCustomerProfile = mutation({
  args: {
    city: v.string(),
    serviceRegion: v.optional(v.string()),
    preferredContact: v.optional(v.union(v.literal("email"), v.literal("phone"))),
    notes: v.optional(v.string()),
    marketingOptIn: v.optional(v.boolean()),
    displayName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const profile = await ensureCustomerProfile(ctx, user._id);
    await ctx.db.patch(profile._id, {
      city: args.city.trim().slice(0, 80),
      serviceRegion: args.serviceRegion?.trim().slice(0, 120),
      preferredContact: args.preferredContact,
      notes: args.notes?.trim().slice(0, 600),
      marketingOptIn: args.marketingOptIn ?? false,
    });
    if (args.displayName?.trim()) {
      await ctx.db.patch(user._id, {
        name: args.displayName.trim().slice(0, 60),
        displayName: args.displayName.trim().slice(0, 60),
      });
    }
    return { ok: true as const };
  },
});

export const setActiveRole = mutation({
  args: { role: v.union(v.literal("customer"), v.literal("artisan")) },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    if (args.role === "artisan") {
      const profile = await artisanProfileFor(ctx, user._id);
      if (!profile) {
        throw new Error("FORBIDDEN: complete CraftFit before switching to the artisan workspace.");
      }
    } else {
      await ensureCustomerProfile(ctx, user._id);
    }
    await ctx.db.patch(user._id, { role: args.role, lastActiveAt: Date.now() });
    return { ok: true as const };
  },
});

export const updateContact = mutation({
  args: {
    name: v.string(),
    city: v.optional(v.string()),
    phone: v.optional(v.string()),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const name = args.name.trim().slice(0, 60);
    if (name.length < 2) throw new Error("INVALID: enter your name.");
    if (args.phone && !/^[+]?[0-9\s-]{7,16}$/.test(args.phone)) {
      throw new Error("INVALID: enter a valid phone number, or leave it blank.");
    }
    await ctx.db.patch(user._id, {
      name,
      displayName: name,
      city: args.city?.trim().slice(0, 80),
      phone: args.phone?.trim() || undefined,
      language: args.language?.slice(0, 24),
    });
    await recordAudit(ctx, {
      actorId: user._id,
      actorRole: user.role ?? "user",
      action: "profile.updated",
      subjectType: "users",
      subjectId: user._id,
    });
    return { ok: true as const };
  },
});

/**
 * Requesting deletion flags the account for review. It intentionally does not
 * hard-delete records that a counterparty needs for an open project, dispute or
 * payment record.
 */
export const requestDeletion = mutation({
  args: { reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    await ctx.db.patch(user._id, {
      deletionRequestedAt: Date.now(),
      suspendedReason: args.reason?.slice(0, 300),
    });
    await recordAudit(ctx, {
      actorId: user._id,
      actorRole: user.role ?? "user",
      action: "account.deletion_requested",
      subjectType: "users",
      subjectId: user._id,
    });
    return { ok: true as const };
  },
});
