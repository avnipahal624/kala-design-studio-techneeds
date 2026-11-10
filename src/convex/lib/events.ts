import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import type { Infer } from "convex/values";
import type { kalaProofTypeValidator } from "../schema";

type FileRef = { storageId: Id<"_storage">; name?: string; contentType?: string; size?: number };
type Visibility = "participants" | "customer" | "artisan" | "admin";
type ActorRole = "customer" | "artisan" | "admin" | "system";

/** Appends to KalaProof. There is deliberately no update or delete mutation. */
export async function addKalaProof(
  ctx: MutationCtx,
  args: {
    projectId: Id<"projects">;
    requestId?: Id<"customerRequests">;
    type: Infer<typeof kalaProofTypeValidator>;
    title: string;
    note?: string;
    attachments?: FileRef[];
    actorId?: Id<"users">;
    actorRole: ActorRole;
    visibility?: Visibility;
    createdAt?: number;
  },
) {
  return await ctx.db.insert("kalaProofEvents", {
    projectId: args.projectId,
    requestId: args.requestId,
    type: args.type,
    title: args.title.slice(0, 140),
    note: args.note?.slice(0, 1200),
    attachments: (args.attachments ?? []).slice(0, 6),
    actorId: args.actorId,
    actorRole: args.actorRole,
    visibility: args.visibility ?? "participants",
    createdAt: args.createdAt ?? Date.now(),
  });
}

export async function notifyUser(
  ctx: MutationCtx,
  userId: Id<"users">,
  payload: { type: string; title: string; body: string; href?: string },
) {
  await ctx.db.insert("notifications", {
    userId,
    type: payload.type.slice(0, 48),
    title: payload.title.slice(0, 120),
    body: payload.body.slice(0, 400),
    href: payload.href,
    createdAt: Date.now(),
  });
}

export async function recordAudit(
  ctx: MutationCtx,
  args: {
    actorId?: Id<"users">;
    actorRole: string;
    action: string;
    subjectType: string;
    subjectId: string;
    detail?: string;
  },
) {
  await ctx.db.insert("auditEvents", {
    actorId: args.actorId,
    actorRole: args.actorRole,
    action: args.action,
    subjectType: args.subjectType,
    subjectId: args.subjectId,
    detail: args.detail?.slice(0, 600),
    createdAt: Date.now(),
  });
}

export async function markRequestConversationRead(
  ctx: MutationCtx,
  conversation: Doc<"conversations">,
  readerId: Id<"users">,
) {
  const messages = await ctx.db
    .query("messages")
    .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
    .collect();
  for (const message of messages) {
    if (message.senderId !== readerId && !message.readAt) {
      await ctx.db.patch(message._id, { readAt: Date.now() });
    }
  }
}
