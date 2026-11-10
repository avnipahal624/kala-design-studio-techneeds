import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { requireMarketplaceUser, requireProjectAccess } from "./lib/access";
import { addKalaProof, notifyUser, recordAudit } from "./lib/events";
import { fileUrls, validateImageRefs } from "./lib/files";
import { assertProjectTransition, type ProjectStatus } from "./lib/state";

const fileRef = v.object({
  storageId: v.id("_storage"),
  name: v.optional(v.string()),
  contentType: v.optional(v.string()),
  size: v.optional(v.number()),
});

const CATEGORIES = [
  "payment_issue",
  "work_not_started",
  "missed_deadline",
  "not_as_approved",
  "damaged",
  "lost",
  "incomplete",
  "excessive_revisions",
  "shipping_problem",
  "misrepresentation",
  "other",
] as const;

const OPEN_STATUSES = ["open", "awaiting_response", "under_review", "appealed"];

export const open = mutation({
  args: {
    projectId: v.id("projects"),
    category: v.union(
      v.literal("payment_issue"),
      v.literal("work_not_started"),
      v.literal("missed_deadline"),
      v.literal("not_as_approved"),
      v.literal("damaged"),
      v.literal("lost"),
      v.literal("incomplete"),
      v.literal("excessive_revisions"),
      v.literal("shipping_problem"),
      v.literal("misrepresentation"),
      v.literal("other"),
    ),
    description: v.string(),
    desiredOutcome: v.string(),
    evidence: v.array(fileRef),
  },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const { project, isCustomer, isArtisan } = await requireProjectAccess(ctx, args.projectId, user);
    if (!isCustomer && !isArtisan) throw new Error("FORBIDDEN: not a project participant.");
    if (project.status === "cancelled" || project.status === "refunded") {
      throw new Error("INVALID: closed projects cannot open a new dispute.");
    }
    if (args.description.trim().length < 30) {
      throw new Error("INVALID: describe what happened in at least 30 characters.");
    }
    if (args.desiredOutcome.trim().length < 10) {
      throw new Error("INVALID: explain the outcome you are asking for.");
    }
    if (!CATEGORIES.includes(args.category)) throw new Error("INVALID: choose a dispute category.");
    const evidence = await validateImageRefs(ctx, args.evidence);

    const existing = await ctx.db
      .query("disputes")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .take(10);
    if (existing.some((row) => OPEN_STATUSES.includes(row.status))) {
      throw new Error("INVALID: there is already an active dispute on this project.");
    }

    const now = Date.now();
    const disputeId = await ctx.db.insert("disputes", {
      projectId: args.projectId,
      openedBy: user._id,
      againstId: isCustomer ? project.artisanId : project.customerId,
      category: args.category,
      description: args.description.trim().slice(0, 3000),
      desiredOutcome: args.desiredOutcome.trim().slice(0, 800),
      evidence,
      status: "awaiting_response",
      createdAt: now,
      updatedAt: now,
    });

    if (project.status !== "disputed") {
      assertProjectTransition(project.status as ProjectStatus, "disputed");
      await ctx.db.patch(args.projectId, { status: "disputed", updatedAt: now });
    }

    await addKalaProof(ctx, {
      projectId: args.projectId,
      requestId: project.requestId,
      type: "dispute_opened",
      title: "Dispute opened",
      note: `${args.category.split("_").join(" ")} · ${args.description.slice(0, 300)}`,
      attachments: evidence,
      actorId: user._id,
      actorRole: isCustomer ? "customer" : "artisan",
    });
    await notifyUser(ctx, isCustomer ? project.artisanId : project.customerId, {
      type: "dispute.opened",
      title: "A dispute was opened",
      body: "Review the case and add your response with evidence.",
      href: `/${isCustomer ? "artisan" : "customer"}/projects/${args.projectId}`,
    });
    const admins = await ctx.db.query("users").filter((q) => q.eq(q.field("role"), "admin")).take(10);
    for (const admin of admins) {
      await notifyUser(ctx, admin._id, {
        type: "dispute.opened",
        title: "New dispute needs review",
        body: `${project.title} — opened by the ${isCustomer ? "customer" : "artisan"}.`,
        href: "/admin/disputes",
      });
    }
    await recordAudit(ctx, {
      actorId: user._id,
      actorRole: isCustomer ? "customer" : "artisan",
      action: "dispute.opened",
      subjectType: "disputes",
      subjectId: String(disputeId),
    });
    return { disputeId };
  },
});

export const respond = mutation({
  args: { disputeId: v.id("disputes"), response: v.string(), evidence: v.optional(v.array(fileRef)) },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute || (dispute.openedBy !== user._id && dispute.againstId !== user._id)) {
      throw new Error("NOT_FOUND: dispute not found.");
    }
    if (dispute.openedBy === user._id) {
      throw new Error("FORBIDDEN: the opening party cannot file the response.");
    }
    if (!["open", "awaiting_response", "under_review"].includes(dispute.status)) {
      throw new Error("INVALID: this dispute is no longer accepting a response.");
    }
    if (args.response.trim().length < 20) throw new Error("INVALID: respond with at least 20 characters.");
    const evidence = await validateImageRefs(ctx, args.evidence ?? []);
    const allEvidence = [...dispute.evidence, ...evidence].slice(0, 10);
    await ctx.db.patch(args.disputeId, {
      response: args.response.trim().slice(0, 2000),
      respondedAt: Date.now(),
      evidence: allEvidence,
      status: "under_review",
      updatedAt: Date.now(),
    });
    const { project } = await requireProjectAccess(ctx, dispute.projectId, user);
    await addKalaProof(ctx, {
      projectId: dispute.projectId,
      requestId: project.requestId,
      type: "dispute_updated",
      title: "Response added to dispute",
      note: args.response.slice(0, 300),
      attachments: evidence,
      actorId: user._id,
      actorRole: dispute.againstId === user._id && project.artisanId === user._id ? "artisan" : "customer",
    });
    const admins = await ctx.db.query("users").filter((q) => q.eq(q.field("role"), "admin")).take(10);
    for (const admin of admins) {
      await notifyUser(ctx, admin._id, {
        type: "dispute.updated",
        title: "Dispute response received",
        body: "The case is ready for admin review.",
        href: "/admin/disputes",
      });
    }
    await notifyUser(ctx, dispute.openedBy, {
      type: "dispute.updated",
      title: "The other party responded",
      body: "Your dispute is under review.",
      href: `/${dispute.openedBy === project.customerId ? "customer" : "artisan"}/projects/${dispute.projectId}`,
    });
  },
});

export const appeal = mutation({
  args: { disputeId: v.id("disputes"), appealNote: v.string() },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute || (dispute.openedBy !== user._id && dispute.againstId !== user._id)) {
      throw new Error("NOT_FOUND: dispute not found.");
    }
    if (dispute.status !== "resolved" && dispute.status !== "closed") {
      throw new Error("INVALID: only a decided dispute can be appealed.");
    }
    if (args.appealNote.trim().length < 20) throw new Error("INVALID: explain the grounds for appeal.");
    await ctx.db.patch(args.disputeId, {
      status: "appealed",
      appealNote: args.appealNote.trim().slice(0, 2000),
      updatedAt: Date.now(),
    });
    await recordAudit(ctx, {
      actorId: user._id,
      actorRole: "user",
      action: "dispute.appealed",
      subjectType: "disputes",
      subjectId: String(args.disputeId),
    });
    const admins = await ctx.db.query("users").filter((q) => q.eq(q.field("role"), "admin")).take(10);
    for (const admin of admins) {
      await notifyUser(ctx, admin._id, {
        type: "dispute.appealed",
        title: "Dispute appealed",
        body: args.appealNote.slice(0, 160),
        href: "/admin/disputes",
      });
    }
  },
});

export const forProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    await requireProjectAccess(ctx, args.projectId, user);
    const rows = await ctx.db
      .query("disputes")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(10);
    return await Promise.all(
      rows.map(async (row) => ({
        ...row,
        evidence: await fileUrls(ctx, row.evidence),
      })),
    );
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireMarketplaceUser(ctx);
    const opened = await ctx.db
      .query("disputes")
      .withIndex("by_opened_by", (q) => q.eq("openedBy", user._id))
      .order("desc")
      .take(20);
    const projects = await Promise.all([
      ctx.db.query("projects").withIndex("by_customer", (q) => q.eq("customerId", user._id)).take(40),
      ctx.db.query("projects").withIndex("by_artisan", (q) => q.eq("artisanId", user._id)).take(40),
    ]);
    const merged = new Map<string, Doc<"disputes">>();
    for (const row of opened) merged.set(row._id, row);
    for (const projectList of projects) {
      for (const project of projectList) {
        const rows = await ctx.db
          .query("disputes")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .take(10);
        for (const row of rows) merged.set(row._id, row);
      }
    }
    return [...merged.values()].sort((a, b) => b.updatedAt - a.updatedAt);
  },
});
