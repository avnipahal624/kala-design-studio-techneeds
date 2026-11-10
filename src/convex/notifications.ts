import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireMarketplaceUser } from "./lib/access";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireMarketplaceUser(ctx);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(40);
    return { items: rows, unread: rows.filter((row) => !row.readAt).length };
  },
});

export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", userId).eq("readAt", undefined))
      .take(100);
    return rows.length;
  },
});

export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const row = await ctx.db.get(args.notificationId);
    if (!row || row.userId !== user._id) {
      throw new Error("NOT_FOUND: notification not found.");
    }
    await ctx.db.patch(args.notificationId, { readAt: Date.now() });
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireMarketplaceUser(ctx);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", user._id).eq("readAt", undefined))
      .take(100);
    for (const row of rows) await ctx.db.patch(row._id, { readAt: Date.now() });
    return { updated: rows.length };
  },
});
