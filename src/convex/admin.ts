import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { requireAdmin, requireMarketplaceUser } from "./lib/access";
import { addKalaProof, notifyUser, recordAudit } from "./lib/events";
import { fileUrls } from "./lib/files";
import { assertProjectTransition, paymentAllowsProduction } from "./lib/state";
import { internal } from "./_generated/api";

export const claimAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireMarketplaceUser(ctx);
    if (user.role === "admin") return { promoted: false as const };
    const existing = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .take(1);
    if (existing.length > 0) {
      throw new Error("FORBIDDEN: an administrator already exists.");
    }
    if (!user.emailVerificationTime) {
      throw new Error("FORBIDDEN: verify your email before claiming the first admin seat.");
    }
    await ctx.db.patch(user._id, { role: "admin" });
    await recordAudit(ctx, {
      actorId: user._id,
      actorRole: "admin",
      action: "admin.bootstrap_claimed",
      subjectType: "users",
      subjectId: String(user._id),
    });
    return { promoted: true as const };
  },
});

export const stats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const users = await ctx.db.query("users").take(500);
    const profiles = await ctx.db.query("artisanProfiles").take(300);
    const requests = await ctx.db.query("customerRequests").take(300);
    const projects = await ctx.db.query("projects").take(300);
    const disputes = await ctx.db.query("disputes").take(200);
    const orders = await ctx.db.query("paymentOrders").take(300);
    const payouts = await ctx.db.query("payouts").take(200);
    const reports = await ctx.db.query("moderationReports").take(200);
    return {
      users: {
        total: users.filter((user) => !user.isAnonymous).length,
        artisans: profiles.length,
        sampleArtisans: profiles.filter((profile) => profile.sampleLabel).length,
      },
      verifications: {
        pending: profiles.filter((profile) => profile.verificationStatus === "pending").length,
        verified: profiles.filter((profile) => profile.verificationStatus === "verified").length,
      },
      requests: {
        open: requests.filter((request) => request.status === "open").length,
        total: requests.length,
      },
      projects: {
        active: projects.filter((project) =>
          ["funded", "in_production", "review_pending", "delivered"].includes(project.status),
        ).length,
        completed: projects.filter((project) => project.status === "completed").length,
        disputed: projects.filter((project) => project.status === "disputed").length,
      },
      payments: {
        confirmedLiveInr: orders
          .filter((order) => order.mode === "live" && order.status === "paid")
          .reduce((sum, order) => sum + order.amountInr, 0),
        confirmedSandboxInr: orders
          .filter((order) => order.mode === "sandbox" && order.status === "paid")
          .reduce((sum, order) => sum + order.amountInr, 0),
      },
      disputes: disputes.filter((row) => !["resolved", "closed"].includes(row.status)).length,
      reports: reports.filter((row) => ["open", "reviewing"].includes(row.status)).length,
      payoutsPending: payouts.filter((row) => row.status !== "paid" && row.status !== "failed").length,
    };
  },
});

export const verificationQueue = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db
      .query("verificationRequests")
      .withIndex("by_status_submitted", (q) => q.eq("status", "pending"))
      .order("asc")
      .take(50);
    const infoRows = await ctx.db
      .query("verificationRequests")
      .withIndex("by_status", (q) => q.eq("status", "info_required"))
      .take(50);
    return await Promise.all(
      [...rows, ...infoRows].map(async (request) => {
        const user = await ctx.db.get(request.userId);
        const profile = await ctx.db
          .query("artisanProfiles")
          .withIndex("by_user", (q) => q.eq("userId", request.userId))
          .unique();
        const portfolio = await ctx.db
          .query("portfolioItems")
          .withIndex("by_artisan", (q) => q.eq("artisanId", request.userId))
          .take(12);
        return {
          ...request,
          email: user?.email ?? null,
          city: user?.city ?? profile?.city ?? null,
          profile: profile
            ? {
                displayName: profile.displayName,
                craftHeadline: profile.craftHeadline,
                skills: profile.skills,
                products: profile.products,
                yearsExperience: profile.yearsExperience,
                sampleLabel: profile.sampleLabel ?? null,
              }
            : null,
          portfolio: await Promise.all(
            portfolio.map(async (item) => ({
              _id: item._id,
              title: item.title,
              url: item.image ? await ctx.storage.getUrl(item.image.storageId) : item.externalUrl ?? null,
              ownershipDeclared: item.ownershipDeclared,
            })),
          ),
        };
      }),
    );
  },
});

export const decideVerification = mutation({
  args: {
    requestId: v.id("verificationRequests"),
    decision: v.union(
      v.literal("verified"),
      v.literal("info_required"),
      v.literal("rejected"),
      v.literal("suspended"),
    ),
    reviewerNote: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    if (args.reviewerNote.trim().length < 10) {
      throw new Error("INVALID: record a reviewer note explaining the decision.");
    }
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("NOT_FOUND: verification request not found.");
    if (!["pending", "info_required"].includes(request.status)) {
      throw new Error("INVALID: this request has already been decided.");
    }
    const profile = await ctx.db
      .query("artisanProfiles")
      .withIndex("by_user", (q) => q.eq("userId", request.userId))
      .unique();
    const now = Date.now();
    await ctx.db.patch(args.requestId, {
      status: args.decision,
      reviewerNote: args.reviewerNote.trim().slice(0, 1000),
      reviewerId: admin._id,
      reviewedAt: now,
    });
    if (profile) {
      await ctx.db.patch(profile._id, {
        verificationStatus: args.decision,
        updatedAt: now,
      });
    }
    await notifyUser(ctx, request.userId, {
      type: "verification.updated",
      title:
        args.decision === "verified"
          ? "Your artisan profile is verified"
          : args.decision === "info_required"
            ? "More information needed for verification"
            : args.decision === "rejected"
              ? "Verification was not approved"
              : "Artisan profile suspended",
      body: args.reviewerNote.slice(0, 200),
      href: "/artisan/profile",
    });
    await recordAudit(ctx, {
      actorId: admin._id,
      actorRole: "admin",
      action: `verification.${args.decision}`,
      subjectType: "verificationRequests",
      subjectId: String(args.requestId),
      detail: args.reviewerNote.slice(0, 300),
    });
    return { ok: true as const };
  },
});

export const users = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("users").take(200);
    return await Promise.all(
      rows
        .filter((user) => !user.isAnonymous)
        .map(async (user) => {
          const profile = await ctx.db
            .query("artisanProfiles")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .unique();
          const requests = await ctx.db
            .query("customerRequests")
            .withIndex("by_customer", (q) => q.eq("customerId", user._id))
            .take(1);
          return {
            _id: user._id,
            name: user.name ?? "Unnamed",
            email: user.email ?? null,
            role: user.role ?? "user",
            city: user.city ?? profile?.city ?? null,
            verifiedEmail: Boolean(user.emailVerificationTime),
            suspendedAt: user.suspendedAt ?? null,
            artisan: profile
              ? {
                  displayName: profile.displayName,
                  verificationStatus: profile.verificationStatus,
                  completedProjects: profile.completedProjects,
                  sampleLabel: profile.sampleLabel ?? null,
                }
              : null,
            hasRequests: requests.length > 0,
            createdAt: user._creationTime,
          };
        }),
    );
  },
});

export const suspendUser = mutation({
  args: { userId: v.id("users"), suspend: v.boolean(), reason: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    if (admin._id === args.userId) throw new Error("INVALID: you cannot suspend your own account.");
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("NOT_FOUND: user not found.");
    if (args.reason.trim().length < 10) throw new Error("INVALID: record a reason.");
    await ctx.db.patch(args.userId, {
      suspendedAt: args.suspend ? Date.now() : undefined,
      suspendedReason: args.suspend ? args.reason.trim().slice(0, 400) : undefined,
    });
    const profile = await ctx.db
      .query("artisanProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    if (profile) {
      await ctx.db.patch(profile._id, {
        verificationStatus: args.suspend ? "suspended" : profile.verificationStatus === "suspended" ? "pending" : profile.verificationStatus,
        updatedAt: Date.now(),
      });
    }
    await recordAudit(ctx, {
      actorId: admin._id,
      actorRole: "admin",
      action: args.suspend ? "user.suspended" : "user.reinstated",
      subjectType: "users",
      subjectId: String(args.userId),
      detail: args.reason.slice(0, 300),
    });
  },
});

export const reports = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("moderationReports").order("desc").take(80);
    return await Promise.all(
      rows.map(async (report) => {
        const reporter = await ctx.db.get(report.reporterId);
        return {
          ...report,
          reporterName: reporter?.name ?? "Member",
          reporterEmail: reporter?.email ?? null,
        };
      }),
    );
  },
});

export const resolveReport = mutation({
  args: {
    reportId: v.id("moderationReports"),
    status: v.union(v.literal("resolved"), v.literal("dismissed"), v.literal("reviewing")),
    adminNote: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("NOT_FOUND: report not found.");
    if (args.adminNote.trim().length < 10) throw new Error("INVALID: record an admin note.");
    await ctx.db.patch(args.reportId, {
      status: args.status,
      adminNote: args.adminNote.trim().slice(0, 1000),
      resolvedAt: args.status === "resolved" || args.status === "dismissed" ? Date.now() : undefined,
    });
    await recordAudit(ctx, {
      actorId: admin._id,
      actorRole: "admin",
      action: `report.${args.status}`,
      subjectType: "moderationReports",
      subjectId: String(args.reportId),
      detail: args.adminNote.slice(0, 300),
    });
  },
});

export const riskSignals = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("riskSignals").order("desc").take(80);
    return await Promise.all(
      rows.map(async (signal) => {
        const user = await ctx.db.get(signal.subjectUserId);
        return { ...signal, userName: user?.name ?? "Member", email: user?.email ?? null };
      }),
    );
  },
});

export const reviewRiskSignal = mutation({
  args: { signalId: v.id("riskSignals") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    await ctx.db.patch(args.signalId, { reviewedAt: Date.now() });
    await recordAudit(ctx, {
      actorId: admin._id,
      actorRole: "admin",
      action: "risk.reviewed",
      subjectType: "riskSignals",
      subjectId: String(args.signalId),
    });
  },
});

export const disputes = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("disputes").order("desc").take(80);
    return await Promise.all(
      rows.map(async (dispute) => {
        const project = await ctx.db.get(dispute.projectId);
        const opener = await ctx.db.get(dispute.openedBy);
        const respondent = await ctx.db.get(dispute.againstId);
        return {
          ...dispute,
          evidence: await fileUrls(ctx, dispute.evidence),
          projectTitle: project?.title ?? "Project",
          projectAmountInr: project?.amountInr ?? 0,
          projectStatus: project?.status ?? null,
          openerName: opener?.name ?? "Member",
          respondentName: respondent?.name ?? "Member",
        };
      }),
    );
  },
});

export const decideDispute = mutation({
  args: {
    disputeId: v.id("disputes"),
    decision: v.union(
      v.literal("rework"),
      v.literal("partial_refund"),
      v.literal("full_refund"),
      v.literal("release_payment"),
      v.literal("cancellation"),
      v.literal("no_action"),
    ),
    decisionNote: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    if (args.decisionNote.trim().length < 20) {
      throw new Error("INVALID: record the reasoning for this decision.");
    }
    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) throw new Error("NOT_FOUND: dispute not found.");
    if (["resolved", "closed"].includes(dispute.status)) {
      throw new Error("INVALID: this dispute has already been decided.");
    }
    const project = await ctx.db.get(dispute.projectId);
    if (!project) throw new Error("NOT_FOUND: project not found.");
    const now = Date.now();
    const refundDecision = args.decision === "full_refund" || args.decision === "partial_refund";

    await ctx.db.patch(args.disputeId, {
      status: "resolved",
      decision: args.decision,
      decisionNote: args.decisionNote.trim().slice(0, 2000),
      decidedBy: admin._id,
      decidedAt: now,
      updatedAt: now,
    });

    if (args.decision === "rework") {
      assertProjectTransition(project.status, "in_production");
      await ctx.db.patch(project._id, { status: "in_production", updatedAt: now });
    } else if (args.decision === "cancellation") {
      assertProjectTransition(project.status, "cancelled");
      await ctx.db.patch(project._id, {
        status: "cancelled",
        cancellationReason: args.decisionNote.slice(0, 300),
        updatedAt: now,
      });
    } else if (args.decision === "release_payment") {
      assertProjectTransition(project.status, "completed");
      await ctx.db.patch(project._id, {
        status: "completed",
        completedAt: project.completedAt ?? now,
        updatedAt: now,
      });
      const existingPayout = await ctx.db
        .query("payouts")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .first();
      if (!existingPayout) {
        await ctx.db.insert("payouts", {
          projectId: project._id,
          artisanId: project.artisanId,
          amountInr: project.netPayoutInr,
          platformFeeInr: project.platformFeeInr,
          status: "pending",
          provider: "pending_admin_release",
          note: "Created by a dispute decision to release payment.",
          createdAt: now,
        });
      }
    } else if (args.decision === "no_action") {
      const restored: "review_pending" | "funded" = paymentAllowsProduction(project.paymentStatus)
        ? "review_pending"
        : "funded";
      assertProjectTransition(project.status, restored);
      await ctx.db.patch(project._id, { status: restored, updatedAt: now });
    }
    // Refund decisions stay in `disputed` until the provider refund is actually
    // executed and recorded, so the app never claims money has moved.

    await addKalaProof(ctx, {
      projectId: project._id,
      requestId: project.requestId,
      type: "dispute_resolved",
      title: `Dispute decided: ${args.decision.split("_").join(" ")}`,
      note: args.decisionNote.trim().slice(0, 600),
      actorId: admin._id,
      actorRole: "admin",
    });
    const body =
      refundDecision && project.paymentStatus !== "refunded"
        ? "Refund approved. It must be completed with the payment provider; the project stays disputed until then."
        : args.decisionNote.slice(0, 200);
    await notifyUser(ctx, project.customerId, {
      type: "dispute.resolved",
      title: "Dispute decision recorded",
      body,
      href: `/customer/projects/${project._id}`,
    });
    await notifyUser(ctx, project.artisanId, {
      type: "dispute.resolved",
      title: "Dispute decision recorded",
      body,
      href: `/artisan/projects/${project._id}`,
    });
    await recordAudit(ctx, {
      actorId: admin._id,
      actorRole: "admin",
      action: `dispute.decision.${args.decision}`,
      subjectType: "disputes",
      subjectId: String(args.disputeId),
      detail: args.decisionNote.slice(0, 300),
    });
    return { ok: true as const, refundPending: refundDecision };
  },
});

export const markRefundComplete = mutation({
  args: { disputeId: v.id("disputes"), providerReference: v.string(), note: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) throw new Error("NOT_FOUND: dispute not found.");
    if (dispute.decision !== "full_refund" && dispute.decision !== "partial_refund") {
      throw new Error("INVALID: this dispute did not include a refund.");
    }
    if (args.providerReference.trim().length < 3) {
      throw new Error("INVALID: record the provider refund reference.");
    }
    const project = await ctx.db.get(dispute.projectId);
    if (!project) throw new Error("NOT_FOUND: project not found.");
    await ctx.runMutation(internal.payments.markRefunded, {
      projectId: dispute.projectId,
      note: `${args.note.slice(0, 300)} · provider reference ${args.providerReference.trim()}`,
    });
    await ctx.db.patch(dispute._id, { status: "closed", updatedAt: Date.now() });
    await recordAudit(ctx, {
      actorId: admin._id,
      actorRole: "admin",
      action: "dispute.refund_completed",
      subjectType: "disputes",
      subjectId: String(args.disputeId),
      detail: args.providerReference.slice(0, 120),
    });
    return { ok: true as const };
  },
});

export const payouts = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("payouts").order("desc").take(100);
    return await Promise.all(
      rows.map(async (payout) => {
        const project = await ctx.db.get(payout.projectId);
        const profile = await ctx.db
          .query("artisanProfiles")
          .withIndex("by_user", (q) => q.eq("userId", payout.artisanId))
          .unique();
        return {
          ...payout,
          projectTitle: project?.title ?? "Project",
          artisanName: profile?.displayName ?? "Artisan",
        };
      }),
    );
  },
});

export const releasePayout = mutation({
  args: { payoutId: v.id("payouts"), providerReference: v.string(), note: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const payout = await ctx.db.get(args.payoutId);
    if (!payout) throw new Error("NOT_FOUND: payout not found.");
    if (payout.status === "paid") throw new Error("INVALID: this payout is already recorded as paid.");
    if (args.providerReference.trim().length < 3) {
      throw new Error("INVALID: record the transfer reference from your payout provider.");
    }
    await ctx.db.patch(args.payoutId, {
      status: "paid",
      processedAt: Date.now(),
      providerTransferId: args.providerReference.trim().slice(0, 120),
      note: args.note?.slice(0, 300) ?? "Recorded after an out-of-app transfer.",
    });
    const project = await ctx.db.get(payout.projectId);
    if (project) {
      await ctx.db.patch(project._id, { paymentStatus: "settled", updatedAt: Date.now() });
      await addKalaProof(ctx, {
        projectId: payout.projectId,
        requestId: project.requestId,
        type: "payout_processed",
        title: "Artisan payout recorded",
        note: `₹${payout.amountInr.toLocaleString("en-IN")} transferred to the artisan.`,
        actorId: admin._id,
        actorRole: "admin",
      });
    }
    await notifyUser(ctx, payout.artisanId, {
      type: "payout.processed",
      title: "Payout processed",
      body: `₹${payout.amountInr.toLocaleString("en-IN")} was recorded as transferred.`,
      href: "/artisan/earnings",
    });
    await recordAudit(ctx, {
      actorId: admin._id,
      actorRole: "admin",
      action: "payout.released",
      subjectType: "payouts",
      subjectId: String(args.payoutId),
      detail: `${args.providerReference} · ₹${payout.amountInr}`,
    });
    return { ok: true as const };
  },
});

export const transactions = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const orders = await ctx.db.query("paymentOrders").order("desc").take(100);
    return await Promise.all(
      orders.map(async (order) => {
        const project = await ctx.db.get(order.projectId);
        const transactions = await ctx.db
          .query("paymentTransactions")
          .withIndex("by_order", (q) => q.eq("paymentOrderId", order._id))
          .take(10);
        return {
          ...order,
          projectTitle: project?.title ?? "Project",
          transactions,
        };
      }),
    );
  },
});

export const auditLog = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("auditEvents").order("desc").take(150);
    return await Promise.all(
      rows.map(async (row) => {
        const actor = row.actorId ? await ctx.db.get(row.actorId) : null;
        return { ...row, actorName: actor?.name ?? row.actorRole };
      }),
    );
  },
});

/**
 * Clearly labelled sample artisans for demonstration. They have no login, no
 * verification badge and no reviews. Never counted as real marketplace supply.
 */
export const createSampleArtisans = mutation({
  args: {},
  handler: async (ctx) => {
    const admin = await requireAdmin(ctx);
    const samples: {
      name: string;
      displayName: string;
      headline: string;
      city: string;
      region: string;
      craft: string;
      skills: string[];
      products: string[];
      materials: string[];
      intro: string;
      years: number;
    }[] = [
      {
        name: "Sample Artisan · Meera",
        displayName: "Meera — sample profile",
        headline: "Hand-painted mandala on footwear and denim",
        city: "Udaipur",
        region: "Rajasthan",
        craft: "Mandala Painting",
        skills: ["Hand Painting", "Mandala Painting", "Surface Preparation", "Protective Finishing"],
        products: ["Footwear", "Jackets", "Tote Bags"],
        materials: ["Canvas", "Denim", "Leather"],
        intro:
          "Demonstration profile for KALकारी. Shows how an artisan describes mandala work on canvas sneakers and denim jackets. This is sample data, not a real artisan.",
        years: 6,
      },
      {
        name: "Sample Artisan · Ayesha",
        displayName: "Ayesha — sample profile",
        headline: "Chikankari and fine hand embroidery",
        city: "Lucknow",
        region: "Uttar Pradesh",
        craft: "Chikankari",
        skills: ["Embroidery", "Chikankari", "Tailoring", "Surface Preparation"],
        products: ["Kurtas", "Sarees", "Gift"],
        materials: ["Cotton", "Silk", "Fabric Blends"],
        intro:
          "Demonstration profile for KALकारी. Illustrates an embroidery-led CraftFit profile with kurta and saree work. This is sample data, not a real artisan.",
        years: 9,
      },
      {
        name: "Sample Artisan · Rohan",
        displayName: "Rohan — sample profile",
        headline: "Leather painting and hand-finished bags",
        city: "Mumbai",
        region: "Maharashtra",
        craft: "Leather Craft",
        skills: ["Leather Craft", "Hand Painting", "Decorative Finishing", "Protective Finishing"],
        products: ["Handbags", "Wallets", "Accessories"],
        materials: ["Leather", "Canvas", "Metal"],
        intro:
          "Demonstration profile for KALकारी. Shows leather customisation, edge finishing and hardware masking. This is sample data, not a real artisan.",
        years: 4,
      },
    ];

    let created = 0;
    for (const sample of samples) {
      const existing = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", `${sample.displayName.split(" ")[0].toLowerCase()}.sample@kalkaari.demo`))
        .first();
      if (existing) continue;
      const email = `${sample.displayName.split(" ")[0].toLowerCase()}.sample@kalkaari.demo`;
      const userId = await ctx.db.insert("users", {
        name: sample.name,
        email,
        role: "artisan",
        city: sample.city,
      });
      await ctx.db.insert("artisanProfiles", {
        userId,
        displayName: sample.displayName,
        craftHeadline: sample.headline,
        city: sample.city,
        serviceRegion: sample.region,
        mode: "individual",
        yearsExperience: sample.years,
        intro: sample.intro,
        languages: ["Hindi", "English"],
        skills: sample.skills,
        products: sample.products.map((p) => (p === "Gift" ? "Gifts" : p)),
        materials: sample.materials,
        minProjectValue: 1500,
        maxProjectValue: 25000,
        weeklyCapacity: 3,
        turnaroundDays: 12,
        shipsNationwide: true,
        localOnly: false,
        collaborates: false,
        availability: "available",
        verificationStatus: "not_submitted",
        craftFitCompletedAt: Date.now(),
        completedProjects: 0,
        ratingSum: 0,
        ratingCount: 0,
        sampleLabel: "Sample profile — demonstration only, not verified",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      created += 1;
    }
    await recordAudit(ctx, {
      actorId: admin._id,
      actorRole: "admin",
      action: "admin.sample_artisans_created",
      subjectType: "users",
      subjectId: "sample",
      detail: `${created} created`,
    });
    return { created };
  },
});

export type AdminUser = Doc<"users">;
