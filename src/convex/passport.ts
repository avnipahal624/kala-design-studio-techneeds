import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { requireMarketplaceUser, requireProjectAccess } from "./lib/access";
import { recordAudit } from "./lib/events";

const SAFE_EVENT_TYPES = new Set([
  "quote_accepted",
  "concept_uploaded",
  "concept_approved",
  "payment_confirmed",
  "production_started",
  "progress_uploaded",
  "product_dispatched",
  "product_delivered",
  "review_period_started",
  "project_completed",
]);

function newToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

async function recordFor(ctx: QueryCtx | MutationCtx, project: Doc<"projects">) {
  const request = await ctx.db.get(project.requestId);
  const profile = await ctx.db
    .query("artisanProfiles")
    .withIndex("by_user", (q) => q.eq("userId", project.artisanId))
    .unique();
  const concepts = await ctx.db
    .query("designConcepts")
    .withIndex("by_project_created", (q) => q.eq("projectId", project._id))
    .order("desc")
    .take(12);
  const approved = concepts.find((concept) => concept.status === "approved");
  const events = await ctx.db
    .query("kalaProofEvents")
    .withIndex("by_project_created", (q) => q.eq("projectId", project._id))
    .order("asc")
    .take(200);

  return {
    projectTitle: project.title,
    category: request?.category ?? "Custom creation",
    craftPreference: request?.craftPreference ?? null,
    techniques: request?.requiredSkills ?? [],
    materials: request?.suggestedMaterials ?? [],
    approvedConceptTitle: approved?.title ?? null,
    approvedConceptApprovedAt: approved?.reviewedAt ?? project.conceptApprovedAt ?? null,
    completedAt: project.completedAt ?? project.deliveredAt ?? null,
    artisans: profile
      ? [
          {
            name: profile.displayName,
            city: profile.city,
            craft: profile.craftHeadline,
            verification: profile.verificationStatus,
            skills: profile.skills.slice(0, 5),
          },
        ]
      : [],
    timeline: events
      .filter((event) => SAFE_EVENT_TYPES.has(event.type))
      .map((event) => ({
        title: event.title,
        actorRole: event.actorRole,
        type: event.type,
        createdAt: event.createdAt,
      })),
    recordedFrom: "KalaProof" as const,
    independentlyVerified: false as const,
    privacy:
      "This public summary excludes conversations, addresses, payment identifiers, private files and customer identity.",
  };
}

export const ensure = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const { project, isCustomer } = await requireProjectAccess(ctx, args.projectId, user);
    // The passport belongs to the customer. Artisans can view it after the
    // customer creates it, but cannot create or publish the customer's record.
    if (!isCustomer) throw new Error("FORBIDDEN: only the customer can create this KalaPassport.");
    if (project.status !== "completed") {
      throw new Error("INVALID: a KalaPassport becomes available when the project is completed.");
    }
    const existing = await ctx.db
      .query("kalaPassports")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .unique();
    if (existing) return { passportId: existing._id, shareToken: existing.shareToken, publicEnabled: existing.publicEnabled };
    const now = Date.now();
    const passportId = await ctx.db.insert("kalaPassports", {
      projectId: args.projectId,
      customerId: project.customerId,
      shareToken: newToken(),
      publicEnabled: false,
      createdAt: now,
      updatedAt: now,
    });
    const created = await ctx.db.get(passportId);
    if (!created) throw new Error("NOT_FOUND: passport could not be created.");
    await recordAudit(ctx, {
      actorId: user._id,
      actorRole: "customer",
      action: "passport.created",
      subjectType: "kalaPassports",
      subjectId: String(passportId),
    });
    return { passportId, shareToken: created.shareToken, publicEnabled: false };
  },
});

export const getMine = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const { project } = await requireProjectAccess(ctx, args.projectId, user);
    const passport = await ctx.db
      .query("kalaPassports")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .unique();
    if (!passport) return null;
    return {
      passport,
      record: { ...(await recordFor(ctx, project)), sampleLabel: passport.demoLabel ?? null },
    };
  },
});

export const publicGet = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const passport = await ctx.db
      .query("kalaPassports")
      .withIndex("by_token", (q) => q.eq("shareToken", args.token.trim()))
      .unique();
    if (!passport || !passport.publicEnabled) return null;
    const project = await ctx.db.get(passport.projectId);
    if (!project || project.status !== "completed") return null;
    return {
      token: passport.shareToken,
      record: { ...(await recordFor(ctx, project)), sampleLabel: passport.demoLabel ?? null },
    };
  },
});

export const setPublic = mutation({
  args: { projectId: v.id("projects"), enabled: v.boolean() },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const { project, isCustomer } = await requireProjectAccess(ctx, args.projectId, user);
    if (!isCustomer) {
      throw new Error("FORBIDDEN: only the customer controls public sharing for this passport.");
    }
    if (project.status !== "completed") {
      throw new Error("INVALID: sharing opens when the project is completed.");
    }
    const passport = await ctx.db
      .query("kalaPassports")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .unique();
    if (!passport) throw new Error("NOT_FOUND: create the passport first.");
    await ctx.db.patch(passport._id, { publicEnabled: args.enabled, updatedAt: Date.now() });
    await recordAudit(ctx, {
      actorId: user._id,
      actorRole: "customer",
      action: args.enabled ? "passport.shared" : "passport.unshared",
      subjectType: "kalaPassports",
      subjectId: String(passport._id),
    });
    return { enabled: args.enabled };
  },
});
