import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { requireAdmin, requireMarketplaceUser, requireProjectAccess } from "./lib/access";
import { recordAudit } from "./lib/events";
import { validateImageRef } from "./lib/files";

const fileRef = v.object({
  storageId: v.id("_storage"),
  name: v.optional(v.string()),
  contentType: v.optional(v.string()),
  size: v.optional(v.number()),
});

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

async function recordFor(ctx: QueryCtx | MutationCtx, project: Doc<"projects">, passport: Doc<"kalaPassports">, publicView = false) {
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
  const collabTasks = await ctx.db
    .query("collaborationTasks")
    .withIndex("by_request", (q) => q.eq("requestId", project.requestId))
    .take(20);
  const participantRoles = new Map<string, string>();
  for (const task of collabTasks) {
    if (task.artisanId && ["accepted", "in_progress", "submitted", "approved"].includes(task.status)) {
      participantRoles.set(task.artisanId, task.role);
    }
  }
  const participantIds = [...new Set([project.artisanId, ...participantRoles.keys()])];
  const participantProfiles = await Promise.all(
    participantIds.map(async (artisanId) => {
      if (artisanId === project.artisanId) return profile;
      return await ctx.db
        .query("artisanProfiles")
        .withIndex("by_user", (q) => q.eq("userId", artisanId as Doc<"users">["_id"]))
        .unique();
    }),
  );

  const verificationStatus = passport.reviewStatus ?? "unreviewed";
  const showArtisanName = !publicView || passport.shareArtisanNames !== false;
  const showProductionLocation = !publicView || passport.shareProductionLocation === true;

  return {
    projectTitle: project.title,
    category: request?.category ?? "Custom creation",
    craftPreference: request?.craftPreference ?? null,
    craftTradition: passport.craftTradition ?? request?.craftPreference ?? null,
    heritageRegion: passport.heritageRegion ?? null,
    productionLocation: showProductionLocation ? passport.productionLocation ?? null : null,
    productionLocationShared: showProductionLocation,
    materialsOrigin: passport.materialsOrigin ?? null,
    techniques: request?.requiredSkills ?? [],
    materials: request?.suggestedMaterials ?? [],
    approvedConceptTitle: approved?.title ?? null,
    approvedConceptApprovedAt: approved?.reviewedAt ?? project.conceptApprovedAt ?? null,
    completedAt: project.completedAt ?? project.deliveredAt ?? null,
    artisans: participantProfiles
      .filter((participant): participant is NonNullable<typeof participant> => Boolean(participant))
      .map((participant) => ({
        name: showArtisanName ? participant.displayName : "Participating artisan (identity private)",
        city: showArtisanName ? participant.city : "Location private",
        craft: participant.craftHeadline,
        verification: participant.verificationStatus,
        skills: participant.skills.slice(0, 5),
        role: participantRoles.get(participant.userId) ?? "Lead artisan",
      })),
    verification: {
      status: verificationStatus,
      label:
        verificationStatus === "verified"
          ? "Reviewed by Kalakari"
          : verificationStatus === "under_review"
            ? "Under review"
            : verificationStatus === "evidence_submitted"
              ? "Evidence submitted"
              : verificationStatus === "rejected"
                ? "Review declined"
                : verificationStatus === "revoked"
                  ? "Verification revoked"
                  : "Not reviewed",
      reviewerName: verificationStatus === "verified" || verificationStatus === "revoked" ? passport.reviewerName ?? null : null,
      reviewedAt: passport.reviewedAt ?? null,
      scope: passport.reviewScope ?? null,
      limitations: passport.verificationLimitations ?? null,
      note: verificationStatus === "rejected" ? passport.reviewNote ?? null : null,
      revokedAt: passport.revokedAt ?? null,
      revocationReason: passport.revocationReason ?? null,
      basis: "Platform review of submitted evidence and KalaProof history.",
      independentAuthentication: false as const,
    },
    evidence: {
      summary: passport.publicEvidenceSummary ?? null,
      fileCount: passport.evidenceFiles?.length ?? 0,
      submittedAt: passport.evidenceSubmittedAt ?? null,
    },
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
    privacy: publicView
      ? "This public summary excludes conversations, addresses, payment identifiers, private evidence files, reviewer notes and customer identity. Location and artisan identity are shown only when the owner enables them."
      : "Private view for project participants and reviewers. Conversations, addresses, payment identifiers and private evidence files are excluded from the certificate display.",
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
    const history = await ctx.db
      .query("passportReviews")
      .withIndex("by_passport", (q) => q.eq("passportId", passport._id))
      .order("asc")
      .take(40);
    return {
      passport,
      record: { ...(await recordFor(ctx, project, passport)), sampleLabel: passport.demoLabel ?? null },
      history,
      evidenceFiles: await Promise.all(
        (passport.evidenceFiles ?? []).map(async (file) => ({
          storageId: file.storageId,
          name: file.name ?? "Evidence file",
          url: await ctx.storage.getUrl(file.storageId),
        })),
      ),
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
      record: { ...(await recordFor(ctx, project, passport, true)), sampleLabel: passport.demoLabel ?? null },
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
    await ctx.db.insert("passportReviews", {
      passportId: passport._id,
      projectId: project._id,
      action: "sharing_changed",
      actorId: user._id,
      actorName: user.name ?? "Customer",
      actorRole: "customer",
      note: args.enabled ? "Public summary sharing enabled by the customer." : "Public summary sharing disabled by the customer.",
      createdAt: Date.now(),
    });
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

export const submitEvidence = mutation({
  args: {
    projectId: v.id("projects"),
    craftTradition: v.string(),
    heritageRegion: v.string(),
    productionLocation: v.optional(v.string()),
    materialsOrigin: v.optional(v.string()),
    publicEvidenceSummary: v.string(),
    evidenceNotes: v.string(),
    evidenceFiles: v.array(fileRef),
    shareProductionLocation: v.optional(v.boolean()),
    shareArtisanNames: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const { project, isCustomer, isArtisan } = await requireProjectAccess(ctx, args.projectId, user);
    if (!isCustomer && !isArtisan) throw new Error("FORBIDDEN: only project participants can submit passport evidence.");
    const passport = await ctx.db
      .query("kalaPassports")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .unique();
    if (!passport) throw new Error("NOT_FOUND: create the passport before submitting evidence.");
    if (passport.reviewStatus === "verified") throw new Error("INVALID: a verified passport cannot be overwritten; use the revocation workflow.");
    if (passport.reviewStatus === "under_review") throw new Error("INVALID: evidence is locked while a reviewer is examining it.");
    if (args.craftTradition.trim().length < 2) throw new Error("INVALID: name the craft tradition.");
    if (args.heritageRegion.trim().length < 2) throw new Error("INVALID: add the heritage region.");
    if (args.publicEvidenceSummary.trim().length < 30) throw new Error("INVALID: add a public evidence summary of at least 30 characters.");
    if (args.evidenceNotes.trim().length < 20) throw new Error("INVALID: describe the evidence for the reviewer.");
    if (args.evidenceFiles.length === 0) throw new Error("INVALID: attach at least one supporting file.");
    const files = [];
    for (const file of args.evidenceFiles.slice(0, 6)) files.push(await validateImageRef(ctx, file));
    const now = Date.now();
    await ctx.db.patch(passport._id, {
      craftTradition: args.craftTradition.trim().slice(0, 100),
      heritageRegion: args.heritageRegion.trim().slice(0, 120),
      productionLocation: args.productionLocation?.trim().slice(0, 160) || undefined,
      materialsOrigin: args.materialsOrigin?.trim().slice(0, 300) || undefined,
      publicEvidenceSummary: args.publicEvidenceSummary.trim().slice(0, 800),
      evidenceFiles: files,
      evidenceSubmittedAt: now,
      shareProductionLocation: args.shareProductionLocation ?? passport.shareProductionLocation ?? false,
      shareArtisanNames: args.shareArtisanNames ?? passport.shareArtisanNames ?? true,
      reviewStatus: "evidence_submitted",
      reviewNote: args.evidenceNotes.trim().slice(0, 1000),
      reviewedBy: undefined,
      reviewerName: undefined,
      reviewScope: undefined,
      reviewedAt: undefined,
      verificationLimitations: undefined,
      revokedAt: undefined,
      revocationReason: undefined,
      updatedAt: now,
    });
    await ctx.db.insert("passportReviews", {
      passportId: passport._id,
      projectId: project._id,
      action: "evidence_submitted",
      actorId: user._id,
      actorName: user.name ?? (isArtisan ? "Artisan" : "Customer"),
      actorRole: isArtisan ? "artisan" : "customer",
      note: args.evidenceNotes.trim().slice(0, 1000),
      scope: "Evidence submission",
      createdAt: now,
    });
    await recordAudit(ctx, {
      actorId: user._id,
      actorRole: isArtisan ? "artisan" : "customer",
      action: "passport.evidence_submitted",
      subjectType: "kalaPassports",
      subjectId: String(passport._id),
    });
    return { status: "evidence_submitted" as const };
  },
});

export const startReview = mutation({
  args: { passportId: v.id("kalaPassports"), scope: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const passport = await ctx.db.get(args.passportId);
    if (!passport) throw new Error("NOT_FOUND: passport not found.");
    if (passport.reviewStatus !== "evidence_submitted" && passport.reviewStatus !== "rejected") {
      throw new Error("INVALID: this passport is not awaiting review.");
    }
    if (args.scope.trim().length < 10) throw new Error("INVALID: describe the scope of review.");
    const now = Date.now();
    await ctx.db.patch(passport._id, {
      reviewStatus: "under_review",
      reviewedBy: admin._id,
      reviewerName: admin.name ?? "Kalakari reviewer",
      reviewScope: args.scope.trim().slice(0, 300),
      updatedAt: now,
    });
    await ctx.db.insert("passportReviews", {
      passportId: passport._id,
      projectId: passport.projectId,
      action: "review_started",
      actorId: admin._id,
      actorName: admin.name ?? "Kalakari reviewer",
      actorRole: "admin",
      note: "Review opened. Evidence and KalaProof history are being examined.",
      scope: args.scope.trim().slice(0, 300),
      createdAt: now,
    });
    await recordAudit(ctx, {
      actorId: admin._id,
      actorRole: "admin",
      action: "passport.review_started",
      subjectType: "kalaPassports",
      subjectId: String(passport._id),
    });
    return { status: "under_review" as const };
  },
});

export const decideReview = mutation({
  args: {
    passportId: v.id("kalaPassports"),
    decision: v.union(v.literal("verified"), v.literal("rejected")),
    note: v.string(),
    limitations: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const passport = await ctx.db.get(args.passportId);
    if (!passport) throw new Error("NOT_FOUND: passport not found.");
    if (passport.reviewStatus !== "under_review") throw new Error("INVALID: start the review before deciding.");
    if (!passport.reviewScope) throw new Error("INVALID: the review has no recorded scope.");
    if (args.note.trim().length < 12) throw new Error("INVALID: record the review basis.");
    if (args.limitations.trim().length < 8) throw new Error("INVALID: record the limitations of this review.");
    const now = Date.now();
    await ctx.db.patch(passport._id, {
      reviewStatus: args.decision,
      reviewerName: admin.name ?? passport.reviewerName ?? "Kalakari reviewer",
      reviewedBy: admin._id,
      reviewedAt: now,
      reviewNote: args.note.trim().slice(0, 1200),
      verificationLimitations: args.limitations.trim().slice(0, 800),
      revokedAt: undefined,
      revocationReason: undefined,
      updatedAt: now,
    });
    await ctx.db.insert("passportReviews", {
      passportId: passport._id,
      projectId: passport.projectId,
      action: args.decision,
      actorId: admin._id,
      actorName: admin.name ?? "Kalakari reviewer",
      actorRole: "admin",
      note: args.note.trim().slice(0, 1200),
      scope: passport.reviewScope,
      createdAt: now,
    });
    await recordAudit(ctx, {
      actorId: admin._id,
      actorRole: "admin",
      action: args.decision === "verified" ? "passport.verified" : "passport.rejected",
      subjectType: "kalaPassports",
      subjectId: String(passport._id),
    });
    return { status: args.decision };
  },
});

export const revokeVerification = mutation({
  args: { passportId: v.id("kalaPassports"), reason: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const passport = await ctx.db.get(args.passportId);
    if (!passport) throw new Error("NOT_FOUND: passport not found.");
    if (passport.reviewStatus !== "verified") throw new Error("INVALID: only a verified passport can be revoked.");
    if (args.reason.trim().length < 12) throw new Error("INVALID: explain the revocation.");
    const now = Date.now();
    await ctx.db.patch(passport._id, {
      reviewStatus: "revoked",
      revokedAt: now,
      revocationReason: args.reason.trim().slice(0, 600),
      publicEnabled: false,
      updatedAt: now,
    });
    await ctx.db.insert("passportReviews", {
      passportId: passport._id,
      projectId: passport.projectId,
      action: "revoked",
      actorId: admin._id,
      actorName: admin.name ?? "Kalakari reviewer",
      actorRole: "admin",
      note: args.reason.trim().slice(0, 600),
      scope: passport.reviewScope,
      createdAt: now,
    });
    await recordAudit(ctx, {
      actorId: admin._id,
      actorRole: "admin",
      action: "passport.revoked",
      subjectType: "kalaPassports",
      subjectId: String(passport._id),
    });
    return { status: "revoked" as const };
  },
});

export const reviewQueue = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("kalaPassports").order("desc").take(80);
    const visible = rows.filter((row) => ["evidence_submitted", "under_review", "verified", "rejected", "revoked"].includes(row.reviewStatus ?? ""));
    return await Promise.all(
      visible.map(async (passport) => {
        const project = await ctx.db.get(passport.projectId);
        return {
          _id: passport._id,
          projectId: passport.projectId,
          projectTitle: project?.title ?? "Completed project",
          reviewStatus: passport.reviewStatus ?? "unreviewed",
          submittedAt: passport.evidenceSubmittedAt ?? null,
          reviewerName: passport.reviewerName ?? null,
          demoLabel: passport.demoLabel ?? null,
        };
      }),
    );
  },
});

export const setPrivacy = mutation({
  args: { projectId: v.id("projects"), shareProductionLocation: v.boolean(), shareArtisanNames: v.boolean() },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const { project, isCustomer } = await requireProjectAccess(ctx, args.projectId, user);
    if (!isCustomer) throw new Error("FORBIDDEN: only the customer controls public passport privacy.");
    const passport = await ctx.db
      .query("kalaPassports")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .unique();
    if (!passport) throw new Error("NOT_FOUND: create the passport first.");
    await ctx.db.patch(passport._id, {
      shareProductionLocation: args.shareProductionLocation,
      shareArtisanNames: args.shareArtisanNames,
      updatedAt: Date.now(),
    });
    await ctx.db.insert("passportReviews", {
      passportId: passport._id,
      projectId: project._id,
      action: "sharing_changed",
      actorId: user._id,
      actorName: user.name ?? "Customer",
      actorRole: "customer",
      note: `Public location ${args.shareProductionLocation ? "shown" : "hidden"}; artisan identity ${args.shareArtisanNames ? "shown" : "hidden"}.`,
      createdAt: Date.now(),
    });
    return { ok: true as const };
  },
});

export const rotateShareToken = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const { project, isCustomer } = await requireProjectAccess(ctx, args.projectId, user);
    if (!isCustomer) throw new Error("FORBIDDEN: only the customer can revoke this share link.");
    const passport = await ctx.db
      .query("kalaPassports")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .unique();
    if (!passport) throw new Error("NOT_FOUND: create the passport first.");
    const shareToken = newToken();
    await ctx.db.patch(passport._id, { shareToken, publicEnabled: false, updatedAt: Date.now() });
    await ctx.db.insert("passportReviews", {
      passportId: passport._id,
      projectId: project._id,
      action: "sharing_changed",
      actorId: user._id,
      actorName: user.name ?? "Customer",
      actorRole: "customer",
      note: "Previous public link revoked and a new token generated. Sharing is off.",
      createdAt: Date.now(),
    });
    await recordAudit(ctx, {
      actorId: user._id,
      actorRole: "customer",
      action: "passport.share_revoked",
      subjectType: "kalaPassports",
      subjectId: String(passport._id),
    });
    return { shareToken, publicEnabled: false as const };
  },
});
