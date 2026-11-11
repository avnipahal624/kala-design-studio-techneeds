import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import {
  requireMarketplaceUser,
  requireProjectAccess,
} from "./lib/access";
import { addKalaProof, notifyUser, recordAudit } from "./lib/events";
import { fileUrls, validateImageRef } from "./lib/files";
import { assertProjectTransition, paymentAllowsProduction } from "./lib/state";

const fileRef = v.object({
  storageId: v.id("_storage"),
  name: v.optional(v.string()),
  contentType: v.optional(v.string()),
  size: v.optional(v.number()),
});

function canSee(
  event: Doc<"kalaProofEvents">,
  viewer: { isCustomer: boolean; isArtisan: boolean; isAdmin: boolean },
) {
  if (viewer.isAdmin) return true;
  switch (event.visibility) {
    case "participants":
      return viewer.isCustomer || viewer.isArtisan;
    case "customer":
      return viewer.isCustomer;
    case "artisan":
      return viewer.isArtisan;
    case "admin":
      return false;
    default:
      return false;
  }
}

async function projectEvents(
  ctx: MutationCtx | QueryCtx,
  projectId: Id<"projects">,
  viewer: { isCustomer: boolean; isArtisan: boolean; isAdmin: boolean },
) {
  const events = await ctx.db
    .query("kalaProofEvents")
    .withIndex("by_project_created", (q) => q.eq("projectId", projectId))
    .order("asc")
    .take(200);
  return await Promise.all(
    events
      .filter((event: Doc<"kalaProofEvents">) => canSee(event, viewer))
      .map(async (event: Doc<"kalaProofEvents">) => ({
        ...event,
        attachments: await fileUrls(ctx, event.attachments),
      })),
  );
}

export const mine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireMarketplaceUser(ctx);
    const asCustomer = await ctx.db
      .query("projects")
      .withIndex("by_customer_created", (q) => q.eq("customerId", user._id))
      .order("desc")
      .take(40);
    const asArtisan = await ctx.db
      .query("projects")
      .withIndex("by_artisan_created", (q) => q.eq("artisanId", user._id))
      .order("desc")
      .take(40);
    const unique = new Map<string, { project: Doc<"projects">; role: "customer" | "artisan" }>();
    for (const project of asCustomer) unique.set(project._id, { project, role: "customer" });
    for (const project of asArtisan) unique.set(project._id, { project, role: "artisan" });
    const rows = [...unique.values()].sort((a, b) => b.project.updatedAt - a.project.updatedAt);
    return await Promise.all(
      rows.map(async ({ project, role }) => {
        const counterpartId = role === "customer" ? project.artisanId : project.customerId;
        const profile = await ctx.db
          .query("artisanProfiles")
          .withIndex("by_user", (q) => q.eq("userId", project.artisanId))
          .unique();
        const counterpart = await ctx.db.get(counterpartId);
        const request = await ctx.db.get(project.requestId);
        return {
          ...project,
          role,
          counterpartName:
            role === "customer"
              ? (profile?.displayName ?? "Artisan")
              : (counterpart?.name ?? "Customer"),
          imageUrl: request?.images[0]
            ? await ctx.storage.getUrl(request.images[0].storageId)
            : null,
        };
      }),
    );
  },
});

export const detail = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const { project, isCustomer, isArtisan, isAdmin } = await requireProjectAccess(ctx, args.projectId, user);

    const [request, artisanProfile, customer, concepts, milestones, payout, disputes, reviews, conversation] =
      await Promise.all([
        ctx.db.get(project.requestId),
        ctx.db
          .query("artisanProfiles")
          .withIndex("by_user", (q) => q.eq("userId", project.artisanId))
          .unique(),
        ctx.db.get(project.customerId),
        ctx.db
          .query("designConcepts")
          .withIndex("by_project_created", (q) => q.eq("projectId", args.projectId))
          .order("desc")
          .take(40),
        ctx.db
          .query("orderMilestones")
          .withIndex("by_project_position", (q) => q.eq("projectId", args.projectId))
          .order("asc")
          .take(20),
        ctx.db.query("payouts").withIndex("by_project", (q) => q.eq("projectId", args.projectId)).first(),
        ctx.db.query("disputes").withIndex("by_project", (q) => q.eq("projectId", args.projectId)).order("desc").take(5),
        ctx.db.query("reviews").withIndex("by_project", (q) => q.eq("projectId", args.projectId)).take(10),
        ctx.db
          .query("conversations")
          .withIndex("by_scope", (q) => q.eq("scopeType", "project").eq("scopeId", String(args.projectId)))
          .first(),
      ]);

    const events = await projectEvents(ctx, args.projectId, { isCustomer, isArtisan, isAdmin });
    const conceptRows = await Promise.all(
      concepts.map(async (concept) => ({
        ...concept,
        url: await ctx.storage.getUrl(concept.image.storageId),
      })),
    );

    return {
      project,
      viewer: {
        role: isAdmin ? "admin" : isCustomer ? "customer" : "artisan",
        userId: user._id,
      },
      request: request
        ? { ...request, images: await fileUrls(ctx, request.images) }
        : null,
      artisan: artisanProfile
        ? {
            id: artisanProfile.userId,
            displayName: artisanProfile.displayName,
            city: artisanProfile.city,
            verificationStatus: artisanProfile.verificationStatus,
            averageRating:
              artisanProfile.ratingCount > 0
                ? Math.round((artisanProfile.ratingSum / artisanProfile.ratingCount) * 10) / 10
                : null,
            reviewCount: artisanProfile.ratingCount,
          }
        : null,
      customerName: isAdmin || isArtisan || isCustomer ? (customer?.name ?? "Customer") : "Customer",
      concepts: conceptRows,
      events,
      milestones,
      payout: payout ?? null,
      disputes,
      reviews,
      conversationId: conversation?._id ?? null,
      canReview: project.status === "completed" && !reviews.some((review) => review.authorId === user._id),
      awaitingMyReview: isCustomer
        ? !reviews.some((review) => review.authorId === user._id)
        : !reviews.some((review) => review.authorId === user._id),
    };
  },
});

export const kalaProof = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const { isCustomer, isArtisan, isAdmin } = await requireProjectAccess(ctx, args.projectId, user);
    const events = await projectEvents(ctx, args.projectId, { isCustomer, isArtisan, isAdmin });
    return { events };
  },
});

export const uploadConcept = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    note: v.string(),
    image: fileRef,
    usageNote: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const { project, isArtisan } = await requireProjectAccess(ctx, args.projectId, user);
    if (!isArtisan) throw new Error("FORBIDDEN: only the project artisan can upload concepts.");
    if (project.status === "cancelled" || project.status === "refunded" || project.status === "completed") {
      throw new Error("INVALID: this project is no longer accepting concepts.");
    }
    if (args.title.trim().length < 3) throw new Error("INVALID: give the concept a title.");
    if (args.note.trim().length < 12) throw new Error("INVALID: describe the approach and materials.");
    const image = await validateImageRef(ctx, args.image);

    const previous = await ctx.db
      .query("designConcepts")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .take(40);
    if (previous.filter((concept) => concept.status === "approved").length > 0) {
      throw new Error("INVALID: the agreed concept cannot be replaced without a revision request.");
    }
    const version = previous.length + 1;
    for (const concept of previous) {
      if (concept.status === "submitted" || concept.status === "revision_requested") {
        await ctx.db.patch(concept._id, { status: "superseded" });
      }
    }
    const conceptId = await ctx.db.insert("designConcepts", {
      projectId: args.projectId,
      requestId: project.requestId,
      artisanId: user._id,
      customerId: project.customerId,
      title: args.title.trim().slice(0, 100),
      note: args.note.trim().slice(0, 1200),
      image,
      version,
      status: "submitted",
      attribution: `Created by the artisan${project.artisanId === user._id ? "" : ""}`,
      usageNote: args.usageNote.trim().slice(0, 800),
      createdAt: Date.now(),
    });
    await addKalaProof(ctx, {
      projectId: args.projectId,
      requestId: project.requestId,
      type: "concept_uploaded",
      title: `Concept v${version} uploaded by the artisan`,
      note: args.note.slice(0, 400),
      attachments: [image],
      actorId: user._id,
      actorRole: "artisan",
    });
    await notifyUser(ctx, project.customerId, {
      type: "concept.uploaded",
      title: "An artisan concept is ready for review",
      body: `${args.title.slice(0, 60)} — approve it or ask for a revision.`,
      href: `/customer/projects/${args.projectId}`,
    });
    await recordAudit(ctx, {
      actorId: user._id,
      actorRole: "artisan",
      action: "concept.uploaded",
      subjectType: "designConcepts",
      subjectId: String(conceptId),
    });
    return { conceptId };
  },
});

export const approveConcept = mutation({
  args: { projectId: v.id("projects"), conceptId: v.id("designConcepts") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const { project, isCustomer } = await requireProjectAccess(ctx, args.projectId, user);
    if (!isCustomer) throw new Error("FORBIDDEN: only the customer can approve a concept.");
    const concept = await ctx.db.get(args.conceptId);
    if (!concept || concept.projectId !== args.projectId) throw new Error("NOT_FOUND: concept not found.");
    if (concept.status !== "submitted") throw new Error("INVALID: this concept is not awaiting approval.");
    if (!paymentAllowsProduction(project.paymentStatus) && project.status === "in_production") {
      throw new Error("INVALID: production is not funded.");
    }
    const now = Date.now();
    await ctx.db.patch(args.conceptId, { status: "approved", reviewedAt: now });
    await ctx.db.patch(args.projectId, { conceptApprovedAt: now, updatedAt: now });
    const others = await ctx.db
      .query("designConcepts")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .take(40);
    for (const other of others) {
      if (other._id !== args.conceptId && other.status === "submitted") {
        await ctx.db.patch(other._id, { status: "superseded" });
      }
    }
    await addKalaProof(ctx, {
      projectId: args.projectId,
      requestId: project.requestId,
      type: "concept_approved",
      title: `Concept v${concept.version} approved`,
      note: "Approved by the customer. The artisan remains the creator of this work.",
      attachments: [concept.image],
      actorId: user._id,
      actorRole: "customer",
    });
    await notifyUser(ctx, project.artisanId, {
      type: "concept.approved",
      title: "Concept approved",
      body: "The customer approved your concept. Start production when you are ready; every update goes into KalaProof.",
      href: `/artisan/projects/${args.projectId}`,
    });
    return { ok: true as const };
  },
});

export const requestConceptRevision = mutation({
  args: { projectId: v.id("projects"), conceptId: v.id("designConcepts"), note: v.string() },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const { project, isCustomer } = await requireProjectAccess(ctx, args.projectId, user);
    if (!isCustomer) throw new Error("FORBIDDEN: only the customer can request a revision.");
    if (args.note.trim().length < 10) throw new Error("INVALID: explain what should change.");
    const concept = await ctx.db.get(args.conceptId);
    if (!concept || concept.projectId !== args.projectId) throw new Error("NOT_FOUND: concept not found.");
    if (concept.status !== "submitted") throw new Error("INVALID: this concept is not awaiting review.");
    if (project.revisionRoundsUsed >= 5) throw new Error("INVALID: revision limit reached — open a dispute or message the artisan.");

    await ctx.db.patch(args.conceptId, { status: "revision_requested", reviewedAt: Date.now() });
    await ctx.db.patch(args.projectId, {
      revisionRoundsUsed: project.revisionRoundsUsed + 1,
      updatedAt: Date.now(),
    });
    await addKalaProof(ctx, {
      projectId: args.projectId,
      requestId: project.requestId,
      type: "revision_requested",
      title: "Concept revision requested",
      note: args.note.slice(0, 600),
      actorId: user._id,
      actorRole: "customer",
    });
    await notifyUser(ctx, project.artisanId, {
      type: "concept.revision",
      title: "Revision requested on a concept",
      body: args.note.slice(0, 160),
      href: `/artisan/projects/${args.projectId}`,
    });
    return { ok: true as const };
  },
});

export const startProduction = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const { project, isArtisan } = await requireProjectAccess(ctx, args.projectId, user);
    if (!isArtisan) throw new Error("FORBIDDEN: only the artisan can start production.");
    if (!paymentAllowsProduction(project.paymentStatus)) {
      throw new Error("INVALID: payment must be confirmed before production begins.");
    }
    if (!project.conceptApprovedAt) {
      throw new Error("INVALID: the customer must approve an artisan-created concept first.");
    }
    assertProjectTransition(project.status, "in_production");
    const now = Date.now();
    await ctx.db.patch(args.projectId, {
      status: "in_production",
      startedAt: project.startedAt ?? now,
      updatedAt: now,
    });
    await addKalaProof(ctx, {
      projectId: args.projectId,
      requestId: project.requestId,
      type: "production_started",
      title: "Production started",
      note: "Payment confirmed and concept approved before work began.",
      actorId: user._id,
      actorRole: "artisan",
    });
    await notifyUser(ctx, project.customerId, {
      type: "project.started",
      title: "Production has started",
      body: "Your artisan has begun work. Progress will appear in KalaProof.",
      href: `/customer/projects/${args.projectId}`,
    });
    return { ok: true as const };
  },
});

export const addProgress = mutation({
  args: {
    projectId: v.id("projects"),
    note: v.string(),
    images: v.array(fileRef),
    milestoneId: v.optional(v.id("orderMilestones")),
  },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const { project, isArtisan } = await requireProjectAccess(ctx, args.projectId, user);
    if (!isArtisan) throw new Error("FORBIDDEN: only the artisan can add production progress.");
    if (project.status !== "in_production") {
      throw new Error("INVALID: progress can only be added while production is active.");
    }
    if (args.note.trim().length < 10) throw new Error("INVALID: describe the progress.");
    if (args.images.length === 0) throw new Error("INVALID: attach at least one progress photo.");
    const images = [];
    for (const image of args.images.slice(0, 4)) images.push(await validateImageRef(ctx, image));

    await addKalaProof(ctx, {
      projectId: args.projectId,
      requestId: project.requestId,
      type: "progress_uploaded",
      title: "Progress update",
      note: args.note.trim().slice(0, 800),
      attachments: images,
      actorId: user._id,
      actorRole: "artisan",
    });
    if (args.milestoneId) {
      const milestone = await ctx.db.get(args.milestoneId);
      if (milestone && milestone.projectId === args.projectId && milestone.status === "pending") {
        await ctx.db.patch(args.milestoneId, { status: "submitted", note: args.note.slice(0, 300) });
      }
    }
    await notifyUser(ctx, project.customerId, {
      type: "project.progress",
      title: "New progress in KalaProof",
      body: args.note.slice(0, 160),
      href: `/customer/projects/${args.projectId}`,
    });
  },
});

export const documentCondition = mutation({
  args: { projectId: v.id("projects"), note: v.string(), images: v.array(fileRef), stage: v.union(v.literal("received"), v.literal("returned")) },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const { project, isArtisan, isCustomer } = await requireProjectAccess(ctx, args.projectId, user);
    if (!isArtisan && !isCustomer) throw new Error("FORBIDDEN: not a project participant.");
    if (args.note.trim().length < 10) throw new Error("INVALID: describe the condition.");
    if (args.images.length === 0) throw new Error("INVALID: attach a condition photo.");
    const images = [];
    for (const image of args.images.slice(0, 4)) images.push(await validateImageRef(ctx, image));
    await addKalaProof(ctx, {
      projectId: args.projectId,
      requestId: project.requestId,
      type: "condition_documented",
      title: args.stage === "received" ? "Condition documented on receipt" : "Condition documented at return",
      note: args.note.trim().slice(0, 800),
      attachments: images,
      actorId: user._id,
      actorRole: isArtisan ? "artisan" : "customer",
    });
    await notifyUser(ctx, isArtisan ? project.customerId : project.artisanId, {
      type: "project.condition",
      title: "Product condition recorded",
      body: "A condition report was added to KalaProof.",
      href: `/${isArtisan ? "customer" : "artisan"}/projects/${args.projectId}`,
    });
  },
});

export const submitFinalWork = mutation({
  args: { projectId: v.id("projects"), note: v.string(), images: v.array(fileRef) },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const { project, isArtisan } = await requireProjectAccess(ctx, args.projectId, user);
    if (!isArtisan) throw new Error("FORBIDDEN: only the artisan can submit final work.");
    if (project.status !== "in_production") throw new Error("INVALID: production is not active.");
    if (args.note.trim().length < 10) throw new Error("INVALID: add a completion note.");
    if (args.images.length === 0) throw new Error("INVALID: attach final product photos.");
    const images = [];
    for (const image of args.images.slice(0, 6)) images.push(await validateImageRef(ctx, image));
    assertProjectTransition(project.status, "review_pending");
    await ctx.db.patch(args.projectId, { status: "review_pending", updatedAt: Date.now() });
    await addKalaProof(ctx, {
      projectId: args.projectId,
      requestId: project.requestId,
      type: "quality_reviewed",
      title: "Final work submitted for customer review",
      note: args.note.trim().slice(0, 800),
      attachments: images,
      actorId: user._id,
      actorRole: "artisan",
    });
    await notifyUser(ctx, project.customerId, {
      type: "project.review",
      title: "Final work is ready for your review",
      body: "Compare it with the approved concept and KalaProof updates.",
      href: `/customer/projects/${args.projectId}`,
    });
  },
});

export const requestRework = mutation({
  args: { projectId: v.id("projects"), note: v.string() },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const { project, isCustomer } = await requireProjectAccess(ctx, args.projectId, user);
    if (!isCustomer) throw new Error("FORBIDDEN: only the customer can request rework.");
    if (project.status !== "review_pending") throw new Error("INVALID: nothing is awaiting review.");
    if (args.note.trim().length < 10) throw new Error("INVALID: explain what needs correction.");
    assertProjectTransition(project.status, "in_production");
    await ctx.db.patch(args.projectId, {
      status: "in_production",
      revisionRoundsUsed: project.revisionRoundsUsed + 1,
      updatedAt: Date.now(),
    });
    await addKalaProof(ctx, {
      projectId: args.projectId,
      requestId: project.requestId,
      type: "revision_requested",
      title: "Rework requested after final review",
      note: args.note.slice(0, 600),
      actorId: user._id,
      actorRole: "customer",
    });
    await notifyUser(ctx, project.artisanId, {
      type: "project.rework",
      title: "The customer requested rework",
      body: args.note.slice(0, 160),
      href: `/artisan/projects/${args.projectId}`,
    });
  },
});

export const approveWork = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const { project, isCustomer } = await requireProjectAccess(ctx, args.projectId, user);
    if (!isCustomer) throw new Error("FORBIDDEN: only the customer can approve final work.");
    if (project.status !== "review_pending") throw new Error("INVALID: nothing is awaiting approval.");
    assertProjectTransition(project.status, "delivered");
    const now = Date.now();
    await ctx.db.patch(args.projectId, { status: "delivered", deliveredAt: now, updatedAt: now });
    await addKalaProof(ctx, {
      projectId: args.projectId,
      requestId: project.requestId,
      type: "quality_reviewed",
      title: "Customer approved the final work",
      note: "Handover or shipping is the next step.",
      actorId: user._id,
      actorRole: "customer",
    });
    await addKalaProof(ctx, {
      projectId: args.projectId,
      requestId: project.requestId,
      type: "review_period_started",
      title: "Delivery arrangement started",
      note: "Confirm delivery once the product is in your hands, or open a dispute if something is wrong.",
      actorId: user._id,
      actorRole: "customer",
    });
    await notifyUser(ctx, project.artisanId, {
      type: "project.approved",
      title: "Final work approved",
      body: "Arrange shipping or local handoff, then the customer confirms delivery.",
      href: `/artisan/projects/${args.projectId}`,
    });
  },
});

export const addShipping = mutation({
  args: {
    projectId: v.id("projects"),
    carrier: v.string(),
    trackingNumber: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const { project, isArtisan } = await requireProjectAccess(ctx, args.projectId, user);
    if (!isArtisan) throw new Error("FORBIDDEN: only the artisan can add shipping details.");
    if (project.status !== "delivered") {
      throw new Error("INVALID: shipping can be recorded after the customer approves the final work.");
    }
    if (args.carrier.trim().length < 2 || args.trackingNumber.trim().length < 3) {
      throw new Error("INVALID: add the carrier and tracking number.");
    }
    await addKalaProof(ctx, {
      projectId: args.projectId,
      requestId: project.requestId,
      type: "product_shipped",
      title: "Product shipped",
      note: `${args.carrier.trim()} · ${args.trackingNumber.trim()}${args.note ? ` · ${args.note.slice(0, 300)}` : ""}`,
      actorId: user._id,
      actorRole: "artisan",
    });
    await notifyUser(ctx, project.customerId, {
      type: "project.shipped",
      title: "Your order is on its way",
      body: `${args.carrier} · ${args.trackingNumber}`,
      href: `/customer/projects/${args.projectId}`,
    });
  },
});

export const confirmDelivery = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const { project, isCustomer } = await requireProjectAccess(ctx, args.projectId, user);
    if (!isCustomer) throw new Error("FORBIDDEN: only the customer can confirm delivery.");
    if (project.status !== "delivered") throw new Error("INVALID: this project is not awaiting delivery confirmation.");
    assertProjectTransition(project.status, "completed");
    const now = Date.now();
    await ctx.db.patch(args.projectId, {
      status: "completed",
      completedAt: now,
      updatedAt: now,
    });

    const existingPayout = await ctx.db
      .query("payouts")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .first();
    if (!existingPayout) {
      await ctx.db.insert("payouts", {
        projectId: args.projectId,
        artisanId: project.artisanId,
        amountInr: project.netPayoutInr,
        platformFeeInr: project.platformFeeInr,
        status: "pending",
        provider: "pending_admin_release",
        note: "Release after the review window. Transfer API support depends on the configured provider.",
        createdAt: now,
      });
    }

    const profile = await ctx.db
      .query("artisanProfiles")
      .withIndex("by_user", (q) => q.eq("userId", project.artisanId))
      .unique();
    if (profile) {
      await ctx.db.patch(profile._id, {
        completedProjects: profile.completedProjects + 1,
        updatedAt: now,
      });
    }

    await addKalaProof(ctx, {
      projectId: args.projectId,
      requestId: project.requestId,
      type: "product_delivered",
      title: "Delivery confirmed by the customer",
      note: "Payout is pending review and administrator release.",
      actorId: user._id,
      actorRole: "customer",
    });
    await addKalaProof(ctx, {
      projectId: args.projectId,
      requestId: project.requestId,
      type: "project_completed",
      title: "Project completed",
      note: "Both sides can now leave a review.",
      actorId: user._id,
      actorRole: "customer",
    });
    await notifyUser(ctx, project.artisanId, {
      type: "project.completed",
      title: "Delivery confirmed — payout pending",
      body: `₹${project.netPayoutInr.toLocaleString("en-IN")} will be released after review.`,
      href: `/artisan/earnings`,
    });
    await recordAudit(ctx, {
      actorId: user._id,
      actorRole: "customer",
      action: "project.completed",
      subjectType: "projects",
      subjectId: String(args.projectId),
    });
    return { ok: true as const };
  },
});

export const cancelBeforePayment = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const { project, isCustomer } = await requireProjectAccess(ctx, args.projectId, user);
    if (!isCustomer) throw new Error("FORBIDDEN: only the customer can cancel.");
    if (project.status !== "awaiting_payment") {
      throw new Error("INVALID: only an unpaid project can be cancelled here. Open a dispute after payment.");
    }
    assertProjectTransition(project.status, "cancelled");
    await ctx.db.patch(args.projectId, {
      status: "cancelled",
      cancellationReason: "Cancelled by customer before payment",
      updatedAt: Date.now(),
    });
    await addKalaProof(ctx, {
      projectId: args.projectId,
      requestId: project.requestId,
      type: "note",
      title: "Project cancelled before payment",
      actorId: user._id,
      actorRole: "customer",
    });
  },
});

export const approveMilestone = mutation({
  args: { projectId: v.id("projects"), milestoneId: v.id("orderMilestones") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const { project, isCustomer } = await requireProjectAccess(ctx, args.projectId, user);
    if (!isCustomer) throw new Error("FORBIDDEN: only the customer can approve milestones.");
    const milestone = await ctx.db.get(args.milestoneId);
    if (!milestone || milestone.projectId !== args.projectId) throw new Error("NOT_FOUND: milestone not found.");
    if (milestone.status !== "submitted") throw new Error("INVALID: this milestone is not awaiting approval.");
    await ctx.db.patch(args.milestoneId, { status: "approved", approvedAt: Date.now() });
    await addKalaProof(ctx, {
      projectId: args.projectId,
      requestId: project.requestId,
      type: "quality_reviewed",
      title: `Milestone approved: ${milestone.title}`,
      note: "Approval records evidence only; funds are released through the payout flow.",
      actorId: user._id,
      actorRole: "customer",
    });
    await notifyUser(ctx, project.artisanId, {
      type: "milestone.approved",
      title: "Milestone approved",
      body: `${milestone.title} was approved by the customer.`,
      href: `/artisan/projects/${args.projectId}`,
    });
  },
});

export const milestonesForProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    await requireProjectAccess(ctx, args.projectId, user);
    return await ctx.db
      .query("orderMilestones")
      .withIndex("by_project_position", (q) => q.eq("projectId", args.projectId))
      .order("asc")
      .take(20);
  },
});

