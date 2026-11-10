import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import type { MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { requireMarketplaceUser, requireProjectAccess } from "./lib/access";
import { addKalaProof, notifyUser, recordAudit } from "./lib/events";
import { milestonePlan, paymentConfig } from "./lib/payments";
import { assertProjectTransition } from "./lib/state";

export const config = query({
  args: {},
  handler: async (ctx) => {
    await requireMarketplaceUser(ctx);
    const cfg = paymentConfig();
    return {
      provider: cfg.provider,
      mode: cfg.configured ? ("live" as const) : ("sandbox" as const),
      webhookConfigured: Boolean(cfg.webhookSecret),
      policy: [
        "Payments are confirmed by the provider's signed webhook or a server-side signature check — never by a browser toggle.",
        "Production can only begin after the payment is confirmed and an artisan concept is approved.",
        "Without provider keys, a clearly labelled sandbox records test transactions that never move money.",
      ],
    };
  },
});

export const forProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const { isCustomer, isArtisan, isAdmin } = await requireProjectAccess(ctx, args.projectId, user);
    const orders = await ctx.db
      .query("paymentOrders")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(10);
    const transactions = await ctx.db
      .query("paymentTransactions")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(20);
    const payout = await ctx.db
      .query("payouts")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .first();
    const cfg = paymentConfig();
    return {
      mode: cfg.configured ? ("live" as const) : ("sandbox" as const),
      orders,
      // Only the participants and admins see financial records; KalaProof never
      // carries card or payment credentials.
      transactions: isCustomer || isArtisan || isAdmin ? transactions : [],
      payout: isCustomer || isArtisan || isAdmin ? (payout ?? null) : null,
    };
  },
});

export const myPaymentHistory = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireMarketplaceUser(ctx);
    const orders = await ctx.db
      .query("paymentOrders")
      .withIndex("by_customer", (q) => q.eq("customerId", user._id))
      .order("desc")
      .take(40);
    return await Promise.all(
      orders.map(async (order) => {
        const project = await ctx.db.get(order.projectId);
        return { ...order, projectTitle: project?.title ?? "Project" };
      }),
    );
  },
});

export const createSandboxOrder = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const cfg = paymentConfig();
    if (cfg.configured) {
      throw new Error("INVALID: live payments are configured — use the provider checkout.");
    }
    const { project, isCustomer } = await requireProjectAccess(ctx, args.projectId, user);
    if (!isCustomer) throw new Error("FORBIDDEN: only the customer can pay for this project.");
    if (project.paymentStatus !== "awaiting_payment") {
      throw new Error("INVALID: this project is not awaiting payment.");
    }
    if (project.status !== "awaiting_payment") {
      throw new Error("INVALID: this project can no longer be paid.");
    }

    const existing = await ctx.db
      .query("paymentOrders")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .first();
    if (existing && existing.status === "created" && existing.mode === "sandbox") {
      return { orderId: existing._id, checkoutReference: existing.checkoutReference ?? null };
    }
    const checkoutReference = `sandbox_${Date.now().toString(36)}_${project._id.slice(-6)}`;
    const orderId = await ctx.db.insert("paymentOrders", {
      projectId: args.projectId,
      customerId: user._id,
      provider: "sandbox",
      mode: "sandbox",
      amountInr: project.amountInr,
      currency: "INR",
      status: "created",
      checkoutReference,
      createdAt: Date.now(),
    });
    await addKalaProof(ctx, {
      projectId: args.projectId,
      requestId: project.requestId,
      type: "payment_order_created",
      title: "Sandbox payment order created",
      note: "No money moves in sandbox mode. The order records test data only.",
      actorId: user._id,
      actorRole: "customer",
      visibility: "participants",
    });
    await recordAudit(ctx, {
      actorId: user._id,
      actorRole: "customer",
      action: "payment.sandbox_order_created",
      subjectType: "paymentOrders",
      subjectId: String(orderId),
    });
    return { orderId, checkoutReference };
  },
});

/**
 * Sandbox-only confirmation. It is deliberately impossible to call when a real
 * provider is configured, and the resulting transaction is marked sandbox.
 */
export const confirmSandbox = mutation({
  args: { paymentOrderId: v.id("paymentOrders"), acknowledgedSandbox: v.boolean() },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    if (!args.acknowledgedSandbox) {
      throw new Error("INVALID: acknowledge that this is a sandbox test.");
    }
    if (paymentConfig().configured) {
      throw new Error("INVALID: sandbox confirmation is disabled when live payments are configured.");
    }
    const order = await ctx.db.get(args.paymentOrderId);
    if (!order || order.customerId !== user._id) throw new Error("NOT_FOUND: payment order not found.");
    if (order.mode !== "sandbox") throw new Error("INVALID: not a sandbox order.");

    await ctx.runMutation(internal.payments.confirmOrder, {
      orderId: args.paymentOrderId,
      providerPaymentId: `sandbox_pay_${Date.now().toString(36)}`,
      signatureVerified: false,
      event: "sandbox.confirmed",
      idempotencyKey: `sandbox:${args.paymentOrderId}`,
      amountInr: order.amountInr,
    });
    return { ok: true as const, mode: "sandbox" as const };
  },
});

export const orderContext = internalQuery({
  args: { projectId: v.id("projects"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project || project.customerId !== args.userId) return null;
    const existing = await ctx.db
      .query("paymentOrders")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .first();
    return {
      project: {
        _id: project._id,
        title: project.title,
        amountInr: project.amountInr,
        status: project.status,
        paymentStatus: project.paymentStatus,
        requestId: project.requestId,
      },
      existingOrder: existing
        ? {
            _id: existing._id,
            status: existing.status,
            mode: existing.mode,
            providerOrderId: existing.providerOrderId ?? null,
          }
        : null,
    };
  },
});

export const recordProviderOrder = internalMutation({
  args: {
    projectId: v.id("projects"),
    customerId: v.id("users"),
    providerOrderId: v.string(),
    amountInr: v.number(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project || project.customerId !== args.customerId) {
      throw new Error("NOT_FOUND: project not found.");
    }
    if (project.status !== "awaiting_payment" || project.paymentStatus !== "awaiting_payment") {
      throw new Error("INVALID: project is not awaiting payment.");
    }
    const orderId = await ctx.db.insert("paymentOrders", {
      projectId: args.projectId,
      customerId: args.customerId,
      provider: "razorpay",
      mode: "live",
      providerOrderId: args.providerOrderId,
      amountInr: args.amountInr,
      currency: "INR",
      status: "created",
      createdAt: Date.now(),
    });
    await addKalaProof(ctx, {
      projectId: args.projectId,
      requestId: project.requestId,
      type: "payment_order_created",
      title: "Payment order created",
      note: `Razorpay order ${args.providerOrderId} · ₹${args.amountInr.toLocaleString("en-IN")}`,
      actorId: args.customerId,
      actorRole: "customer",
    });
    return { orderId };
  },
});

export const getOrderForVerification = internalQuery({
  args: { orderId: v.id("paymentOrders") },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) return null;
    return {
      orderId: order._id,
      projectId: order.projectId,
      customerId: order.customerId,
      providerOrderId: order.providerOrderId ?? null,
      amountInr: order.amountInr,
      status: order.status,
      mode: order.mode,
    };
  },
});

export const getOrderByProviderId = internalQuery({
  args: { providerOrderId: v.string() },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("paymentOrders")
      .withIndex("by_provider_order", (q) => q.eq("providerOrderId", args.providerOrderId))
      .first();
    if (!order) return null;
    return {
      orderId: order._id,
      projectId: order.projectId,
      customerId: order.customerId,
      amountInr: order.amountInr,
      status: order.status,
      mode: order.mode,
    };
  },
});

async function applyConfirmedPayment(
  ctx: MutationCtx,
  args: {
    orderId: Id<"paymentOrders">;
    providerPaymentId?: string;
    signatureVerified: boolean;
    event: string;
    idempotencyKey: string;
    amountInr: number;
  },
) {
  const order = await ctx.db.get(args.orderId);
  if (!order) throw new Error("NOT_FOUND: payment order not found.");
  if (order.status === "paid") return { alreadyProcessed: true as const, projectId: order.projectId };
  if (Math.round(args.amountInr) !== order.amountInr) {
    throw new Error("INVALID: the confirmed amount does not match the order.");
  }
  const duplicate = await ctx.db
    .query("paymentTransactions")
    .withIndex("by_idempotency", (q) => q.eq("idempotencyKey", args.idempotencyKey))
    .first();
  if (duplicate) return { alreadyProcessed: true as const, projectId: order.projectId };

  const project = await ctx.db.get(order.projectId);
  if (!project) throw new Error("NOT_FOUND: project not found.");
  if (project.paymentStatus !== "awaiting_payment") {
    return { alreadyProcessed: true as const, projectId: project._id };
  }
  const now = Date.now();

  await ctx.db.patch(order._id, {
    status: "paid",
    paidAt: now,
    checkoutReference: args.providerPaymentId ?? order.checkoutReference,
  });

  if (order.mode === "live") {
    assertProjectTransition(project.status, "funded");
    await ctx.db.patch(project._id, {
      status: "funded",
      paymentStatus: "confirmed",
      fundedAt: now,
      updatedAt: now,
    });
  } else {
    // Sandbox projects are marked funded for the demonstration but are always
    // labelled sandbox in the UI and in KalaProof.
    await ctx.db.patch(project._id, {
      status: "funded",
      paymentStatus: "confirmed",
      fundedAt: now,
      updatedAt: now,
    });
  }

  await ctx.db.insert("paymentTransactions", {
    paymentOrderId: order._id,
    projectId: project._id,
    provider: order.provider,
    event: args.event,
    providerPaymentId: args.providerPaymentId,
    idempotencyKey: args.idempotencyKey,
    amountInr: args.amountInr,
    signatureVerified: args.signatureVerified,
    createdAt: now,
  });

  const existingMilestones = await ctx.db
    .query("orderMilestones")
    .withIndex("by_project", (q) => q.eq("projectId", project._id))
    .take(1);
  if (existingMilestones.length === 0) {
    for (const entry of milestonePlan(project.amountInr)) {
      await ctx.db.insert("orderMilestones", {
        projectId: project._id,
        title: entry.title,
        amountInr: entry.amountInr,
        position: entry.position,
        status: "pending",
        createdAt: now,
      });
    }
  }

  await addKalaProof(ctx, {
    projectId: project._id,
    requestId: project.requestId,
    type: "payment_confirmed",
    title: order.mode === "sandbox" ? "Sandbox payment confirmed (no money moved)" : "Payment confirmed",
    note:
      order.mode === "sandbox"
        ? "This is a demonstration transaction. Production is unlocked for the sandbox walkthrough only."
        : `₹${project.amountInr.toLocaleString("en-IN")} confirmed by the payment provider.`,
    actorRole: "system",
    visibility: "participants",
  });

  await notifyUser(ctx, project.artisanId, {
    type: "payment.confirmed",
    title: order.mode === "sandbox" ? "Sandbox payment confirmed" : "Payment confirmed",
    body: `${project.title} — you can start once the concept is approved.`,
    href: `/artisan/projects/${project._id}`,
  });
  await notifyUser(ctx, project.customerId, {
    type: "payment.confirmed",
    title: "Payment confirmed",
    body: "Your payment is recorded. Approve the artisan's concept to begin production.",
    href: `/customer/projects/${project._id}`,
  });
  await recordAudit(ctx, {
    actorRole: "system",
    action: order.mode === "sandbox" ? "payment.sandbox_confirmed" : "payment.confirmed",
    subjectType: "paymentOrders",
    subjectId: String(order._id),
    detail: `${order.provider} · ₹${args.amountInr}`,
  });
  return { alreadyProcessed: false as const, projectId: project._id };
}

export const confirmOrder = internalMutation({
  args: {
    orderId: v.id("paymentOrders"),
    providerPaymentId: v.optional(v.string()),
    signatureVerified: v.boolean(),
    event: v.string(),
    idempotencyKey: v.string(),
    amountInr: v.number(),
  },
  handler: async (ctx, args) => await applyConfirmedPayment(ctx, args),
});

export const markOrderFailed = internalMutation({
  args: { orderId: v.id("paymentOrders"), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order || order.status === "paid") return;
    await ctx.db.patch(args.orderId, { status: "failed" });
    await recordAudit(ctx, {
      actorRole: "system",
      action: "payment.failed",
      subjectType: "paymentOrders",
      subjectId: String(args.orderId),
      detail: args.reason,
    });
  },
});

/** Used by the admin console to record a provider-supported refund outcome. */
export const markRefunded = internalMutation({
  args: { projectId: v.id("projects"), note: v.string() },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("NOT_FOUND: project not found.");
    const orders = await ctx.db
      .query("paymentOrders")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .take(10);
    for (const order of orders) {
      if (order.status === "paid") await ctx.db.patch(order._id, { status: "refunded" });
    }
    await ctx.db.patch(args.projectId, { paymentStatus: "refunded", status: "refunded", updatedAt: Date.now() });
    await addKalaProof(ctx, {
      projectId: args.projectId,
      requestId: project.requestId,
      type: "dispute_resolved",
      title: "Refund recorded",
      note: args.note.slice(0, 600),
      actorRole: "admin",
      visibility: "participants",
    });
  },
});

export type PaymentOrderDoc = Doc<"paymentOrders">;
