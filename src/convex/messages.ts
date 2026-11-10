import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { requireMarketplaceUser } from "./lib/access";
import { markRequestConversationRead, notifyUser } from "./lib/events";
import { fileUrls, validateImageRef } from "./lib/files";

const fileRef = v.object({
  storageId: v.id("_storage"),
  name: v.optional(v.string()),
  contentType: v.optional(v.string()),
  size: v.optional(v.number()),
});

async function requireParticipant(
  ctx: MutationCtx | QueryCtx,
  conversationId: Id<"conversations">,
  userId: Id<"users">,
) {
  const conversation = await ctx.db.get(conversationId);
  if (!conversation || (conversation.customerId !== userId && conversation.artisanId !== userId)) {
    throw new Error("NOT_FOUND: conversation not found.");
  }
  return conversation as Doc<"conversations">;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireMarketplaceUser(ctx);
    const [asCustomer, asArtisan] = await Promise.all([
      ctx.db.query("conversations").withIndex("by_customer", (q) => q.eq("customerId", user._id)).take(40),
      ctx.db.query("conversations").withIndex("by_artisan", (q) => q.eq("artisanId", user._id)).take(40),
    ]);
    const merged = new Map<string, Doc<"conversations">>();
    for (const conversation of [...asCustomer, ...asArtisan]) merged.set(conversation._id, conversation);
    const rows = [...merged.values()].sort((a, b) => b.lastMessageAt - a.lastMessageAt);
    return await Promise.all(
      rows.map(async (conversation) => {
        const counterpartId =
          conversation.customerId === user._id ? conversation.artisanId : conversation.customerId;
        const counterpart = await ctx.db.get(counterpartId);
        const profile = await ctx.db
          .query("artisanProfiles")
          .withIndex("by_user", (q) => q.eq("userId", conversation.artisanId))
          .unique();
        const recent = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
          .take(50);
        return {
          ...conversation,
          counterpartName:
            conversation.customerId === user._id
              ? (profile?.displayName ?? counterpart?.name ?? "Artisan")
              : (counterpart?.name ?? "Customer"),
          unread: recent.filter((message) => message.senderId !== user._id && !message.readAt).length,
        };
      }),
    );
  },
});

export const thread = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const conversation = await requireParticipant(ctx, args.conversationId, user._id);
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .take(200);
    const counterpartId =
      conversation.customerId === user._id ? conversation.artisanId : conversation.customerId;
    const [counterpart, profile, request, project] = await Promise.all([
      ctx.db.get(counterpartId),
      ctx.db
        .query("artisanProfiles")
        .withIndex("by_user", (q) => q.eq("userId", conversation.artisanId))
        .unique(),
      conversation.requestId ? ctx.db.get(conversation.requestId) : null,
      conversation.projectId ? ctx.db.get(conversation.projectId) : null,
    ]);
    return {
      conversation,
      counterpart: {
        id: counterpartId,
        name:
          conversation.customerId === user._id
            ? (profile?.displayName ?? counterpart?.name ?? "Artisan")
            : (counterpart?.name ?? "Customer"),
        verification:
          conversation.customerId === user._id
            ? (profile?.verificationStatus ?? "not_submitted")
            : counterpart?.emailVerificationTime
              ? "verified"
              : "not_submitted",
      },
      context: {
        requestTitle: request?.title ?? null,
        requestId: conversation.requestId ?? null,
        projectTitle: project?.title ?? null,
        projectId: conversation.projectId ?? null,
      },
      messages: await Promise.all(
        messages.map(async (message) => ({
          ...message,
          mine: message.senderId === user._id,
          attachments: await fileUrls(ctx, message.attachments),
        })),
      ),
    };
  },
});

export const markRead = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const conversation = await requireParticipant(ctx, args.conversationId, user._id);
    await markRequestConversationRead(ctx, conversation, user._id);
  },
});

export const send = mutation({
  args: {
    conversationId: v.id("conversations"),
    body: v.string(),
    attachments: v.optional(v.array(fileRef)),
  },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const conversation = await requireParticipant(ctx, args.conversationId, user._id);
    const body = args.body.trim();
    if (body.length === 0 && (args.attachments ?? []).length === 0) {
      throw new Error("INVALID: write a message or attach an image.");
    }
    if (body.length > 2000) throw new Error("INVALID: messages are limited to 2000 characters.");

    const recent = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("desc")
      .take(40);
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    const burst = recent.filter(
      (message) => message.senderId === user._id && message.createdAt > tenMinutesAgo,
    );
    if (burst.length >= 12) {
      throw new Error("RATE_LIMIT: too many messages. Please wait a few minutes.");
    }

    const attachments = [];
    for (const attachment of (args.attachments ?? []).slice(0, 3)) {
      attachments.push(await validateImageRef(ctx, attachment));
    }
    const now = Date.now();
    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: user._id,
      body: body.slice(0, 2000),
      attachments,
      createdAt: now,
    });
    await ctx.db.patch(args.conversationId, {
      lastMessageAt: now,
      lastMessagePreview: (body || "Image attachment").slice(0, 160),
    });
    const recipientId =
      conversation.customerId === user._id ? conversation.artisanId : conversation.customerId;
    await notifyUser(ctx, recipientId, {
      type: "message.received",
      title: "New message",
      body: (body || "Sent an image").slice(0, 160),
      href:
        conversation.projectId
          ? `/${conversation.customerId === recipientId ? "customer" : "artisan"}/projects/${conversation.projectId}`
          : `/${conversation.customerId === recipientId ? "customer" : "artisan"}/messages`,
    });
    return { ok: true as const };
  },
});

export const ensure = mutation({
  args: {
    artisanId: v.id("users"),
    scopeType: v.union(v.literal("request"), v.literal("project")),
    scopeId: v.string(),
    requestId: v.optional(v.id("customerRequests")),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const profile = await ctx.db
      .query("artisanProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.artisanId))
      .unique();
    if (!profile) throw new Error("NOT_FOUND: artisan not found.");

    let customerId: Id<"users">;
    if (args.scopeType === "project") {
      if (!args.projectId) throw new Error("INVALID: project is required.");
      const project = await ctx.db.get(args.projectId);
      if (!project) throw new Error("NOT_FOUND: project not found.");
      const pairMatches =
        (project.customerId === user._id && project.artisanId === args.artisanId) ||
        (project.artisanId === user._id && project.customerId === args.artisanId);
      if (!pairMatches) throw new Error("FORBIDDEN: not a project participant.");
      customerId = project.customerId;
    } else {
      if (!args.requestId) throw new Error("INVALID: request is required.");
      const request = await ctx.db.get(args.requestId);
      if (!request) throw new Error("NOT_FOUND: request not found.");
      if (request.customerId === user._id) {
        customerId = user._id;
      } else if (args.artisanId === user._id) {
        customerId = request.customerId;
      } else {
        throw new Error("FORBIDDEN: you are not part of this request.");
      }
      if (request.customerId !== customerId) throw new Error("FORBIDDEN: request mismatch.");
      if (args.artisanId === customerId) throw new Error("INVALID: you cannot message yourself.");
    }

    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_scope", (q) => q.eq("scopeType", args.scopeType).eq("scopeId", args.scopeId))
      .filter((q) => q.eq(q.field("artisanId"), args.artisanId))
      .first();
    if (existing) return { conversationId: existing._id };

    const now = Date.now();
    const conversationId = await ctx.db.insert("conversations", {
      customerId,
      artisanId: args.artisanId,
      scopeType: args.scopeType,
      scopeId: args.scopeId,
      requestId: args.requestId,
      projectId: args.projectId,
      lastMessageAt: now,
      lastMessagePreview: "Conversation started",
      createdAt: now,
    });
    return { conversationId };
  },
});

export const report = mutation({
  args: { conversationId: v.id("conversations"), messageId: v.optional(v.id("messages")), reason: v.string(), detail: v.string() },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    await requireParticipant(ctx, args.conversationId, user._id);
    if (args.detail.trim().length < 10) throw new Error("INVALID: add more detail for review.");
    await ctx.db.insert("moderationReports", {
      reporterId: user._id,
      subjectType: "message",
      subjectId: String(args.messageId ?? args.conversationId),
      reason: args.reason.slice(0, 80),
      detail: args.detail.trim().slice(0, 1200),
      status: "open",
      createdAt: Date.now(),
    });
    return { ok: true as const };
  },
});
