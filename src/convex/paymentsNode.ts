"use node";

import { getAuthUserId } from "@convex-dev/auth/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { paymentConfig } from "./lib/payments";

type CreateOrderResult = {
  paymentOrderId: Id<"paymentOrders">;
  providerOrderId: string;
  keyId: string;
  amountInr: number;
  currency: "INR";
  projectTitle: string;
};

function razorpayAuth(keyId: string, keySecret: string) {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

/**
 * Live checkout creation. Only runs when both Razorpay keys are configured;
 * otherwise the client uses the labelled sandbox mutations instead.
 */
export const createOrder = action({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args): Promise<CreateOrderResult> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("UNAUTHENTICATED: sign in to pay.");
    const cfg = paymentConfig();
    if (!cfg.configured || !cfg.keyId || !cfg.keySecret) {
      throw new Error("PAYMENTS_NOT_CONFIGURED: use the labelled sandbox flow.");
    }
    const context = await ctx.runQuery(internal.payments.orderContext, {
      projectId: args.projectId,
      userId,
    });
    if (!context) throw new Error("NOT_FOUND: project not found.");
    if (context.project.paymentStatus !== "awaiting_payment") {
      throw new Error("INVALID: this project is not awaiting payment.");
    }
    if (context.project.status !== "awaiting_payment") {
      throw new Error("INVALID: this project can no longer be paid.");
    }
    if (context.existingOrder?.status === "created" && context.existingOrder.providerOrderId) {
      return {
        paymentOrderId: context.existingOrder._id,
        providerOrderId: context.existingOrder.providerOrderId,
        keyId: cfg.keyId,
        amountInr: context.project.amountInr,
        currency: "INR" as const,
        projectTitle: context.project.title,
      };
    }

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: razorpayAuth(cfg.keyId, cfg.keySecret),
      },
      body: JSON.stringify({
        amount: Math.round(context.project.amountInr * 100),
        currency: "INR",
        receipt: `kal_${String(context.project._id).slice(-24)}`,
        notes: { projectId: String(context.project._id) },
      }),
    });
    if (!response.ok) {
      throw new Error(`PAYMENT_PROVIDER: order creation failed (${response.status}).`);
    }
    const order = (await response.json()) as { id?: string };
    if (!order.id) throw new Error("PAYMENT_PROVIDER: no order id returned.");

    const recorded = await ctx.runMutation(internal.payments.recordProviderOrder, {
      projectId: args.projectId,
      customerId: userId,
      providerOrderId: order.id,
      amountInr: context.project.amountInr,
    });
    return {
      paymentOrderId: recorded.orderId,
      providerOrderId: order.id,
      keyId: cfg.keyId,
      amountInr: context.project.amountInr,
      currency: "INR" as const,
      projectTitle: context.project.title,
    };
  },
});

/**
 * Server-side checkout verification. The browser only supplies ids and the
 * provider signature; the amount and status are checked directly with Razorpay
 * before the project is unlocked.
 */
export const verifyCheckout = action({
  args: {
    paymentOrderId: v.id("paymentOrders"),
    razorpayPaymentId: v.string(),
    razorpaySignature: v.string(),
  },
  handler: async (ctx, args): Promise<{ ok: true }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("UNAUTHENTICATED: sign in to verify a payment.");
    const cfg = paymentConfig();
    if (!cfg.configured || !cfg.keyId || !cfg.keySecret) {
      throw new Error("PAYMENTS_NOT_CONFIGURED: no live provider is configured.");
    }
    const order = await ctx.runQuery(internal.payments.getOrderForVerification, {
      orderId: args.paymentOrderId,
    });
    if (!order) throw new Error("NOT_FOUND: payment order not found.");
    if (order.customerId !== userId) throw new Error("FORBIDDEN: this payment belongs to another account.");
    if (order.mode !== "live" || !order.providerOrderId) {
      throw new Error("INVALID: not a live payment order.");
    }

    const expected = createHmac("sha256", cfg.keySecret)
      .update(`${order.providerOrderId}|${args.razorpayPaymentId}`)
      .digest("hex");
    const received = args.razorpaySignature.trim();
    const valid =
      expected.length === received.length &&
      timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(received, "utf8"));
    if (!valid) throw new Error("PAYMENT_SIGNATURE_INVALID: the payment could not be verified.");

    const auth = razorpayAuth(cfg.keyId, cfg.keySecret);
    const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(args.razorpayPaymentId)}`, {
      headers: { authorization: auth },
    });
    if (!response.ok) throw new Error("PAYMENT_PROVIDER: could not verify the payment.");
    const payment = (await response.json()) as {
      order_id?: string;
      amount?: number;
      status?: string;
    };
    const expectedAmount = Math.round(order.amountInr * 100);
    if (payment.order_id !== order.providerOrderId || payment.amount !== expectedAmount) {
      throw new Error("PAYMENT_MISMATCH: the provider amount or order does not match.");
    }

    if (payment.status === "authorized") {
      const capture = await fetch(
        `https://api.razorpay.com/v1/payments/${encodeURIComponent(args.razorpayPaymentId)}/capture`,
        {
          method: "POST",
          headers: { authorization: auth, "content-type": "application/json" },
          body: JSON.stringify({ amount: expectedAmount, currency: "INR" }),
        },
      );
      if (!capture.ok) {
        throw new Error("PAYMENT_PENDING: payment authorised but not captured yet. The webhook will confirm it.");
      }
    } else if (payment.status !== "captured") {
      throw new Error(`PAYMENT_PENDING: provider status is ${payment.status ?? "unknown"}.`);
    }

    await ctx.runMutation(internal.payments.confirmOrder, {
      orderId: order.orderId,
      providerPaymentId: args.razorpayPaymentId,
      signatureVerified: true,
      event: "checkout.verified",
      idempotencyKey: `razorpay:${args.razorpayPaymentId}`,
      amountInr: order.amountInr,
    });
    return { ok: true };
  },
});
