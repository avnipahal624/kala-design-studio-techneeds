import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { verifyHmacSha256 } from "./lib/crypto";
import { paymentConfig } from "./lib/payments";

const http = httpRouter();

auth.addHttpRoutes(http);

/**
 * Razorpay webhook. Signature is verified over the raw body with the webhook
 * secret, and every event is reconciled idempotently by payment id.
 */
http.route({
  path: "/payments/razorpay/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const config = paymentConfig();
    if (!config.webhookSecret) {
      return new Response("Webhook secret is not configured", { status: 503 });
    }
    const signature = request.headers.get("x-razorpay-signature");
    if (!signature) return new Response("Missing signature", { status: 400 });

    const raw = await request.text();
    let valid = false;
    try {
      valid = await verifyHmacSha256(raw, signature, config.webhookSecret);
    } catch {
      return new Response("Signature verification unavailable", { status: 500 });
    }
    if (!valid) return new Response("Invalid signature", { status: 401 });

    let payload: {
      event?: string;
      payload?: {
        payment?: {
          entity?: { id?: string; order_id?: string; amount?: number; error_description?: string };
        };
      };
    };
    try {
      payload = JSON.parse(raw);
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const event = String(payload.event ?? "");
    const entity = payload.payload?.payment?.entity;

    if (event === "payment.captured" || event === "order.paid") {
      if (!entity?.order_id || !entity.id || typeof entity.amount !== "number") {
        return new Response("Ignored", { status: 200 });
      }
      const order = await ctx.runQuery(internal.payments.getOrderByProviderId, {
        providerOrderId: entity.order_id,
      });
      if (!order) return new Response("Unknown order", { status: 200 });
      if (Math.round(entity.amount) !== Math.round(order.amountInr * 100)) {
        return new Response("Amount mismatch", { status: 400 });
      }
      await ctx.runMutation(internal.payments.confirmOrder, {
        orderId: order.orderId,
        providerPaymentId: entity.id,
        signatureVerified: true,
        event,
        idempotencyKey: `razorpay:${entity.id}`,
        amountInr: order.amountInr,
      });
      return new Response("ok", { status: 200 });
    }

    if (event === "payment.failed" && entity?.order_id) {
      const order = await ctx.runQuery(internal.payments.getOrderByProviderId, {
        providerOrderId: entity.order_id,
      });
      if (order) {
        await ctx.runMutation(internal.payments.markOrderFailed, {
          orderId: order.orderId,
          reason: entity.error_description,
        });
      }
      return new Response("ok", { status: 200 });
    }

    return new Response("Ignored", { status: 200 });
  }),
});

export default http;
