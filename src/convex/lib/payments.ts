import { PLATFORM_FEE_PERCENT } from "./taxonomy";

/**
 * Payment boundary.
 *
 * The marketplace uses Razorpay when both API keys are present. Without keys
 * the app runs in an explicitly labelled sandbox: no money moves, and the
 * sandbox confirmation is stored as a sandbox transaction, never as a real
 * capture. Milestone settlement and artisan transfers are only claimed when a
 * provider actually supports them.
 */
export type PaymentConfig = {
  configured: boolean;
  keyId: string | null;
  keySecret: string | null;
  webhookSecret: string | null;
  provider: "razorpay" | "sandbox";
};

export function paymentConfig(): PaymentConfig {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim() || null;
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || null;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || null;
  const configured = Boolean(keyId && keySecret);
  return {
    configured,
    keyId,
    keySecret,
    webhookSecret,
    provider: configured ? "razorpay" : "sandbox",
  };
}

export function feeBreakdown(totalInr: number, feePercent = PLATFORM_FEE_PERCENT) {
  const safeTotal = Math.max(0, Math.round(totalInr));
  const platformFeeInr = Math.round((safeTotal * feePercent) / 100);
  return {
    totalInr: safeTotal,
    feePercent,
    platformFeeInr,
    netPayoutInr: Math.max(0, safeTotal - platformFeeInr),
  };
}

/** Three transparent milestones: materials & prep, production, completion. */
export function milestonePlan(totalInr: number) {
  const materials = Math.round(totalInr * 0.4);
  const production = Math.round(totalInr * 0.4);
  const delivery = Math.max(0, totalInr - materials - production);
  return [
    { title: "Materials & preparation", amountInr: materials, position: 1 },
    { title: "Production", amountInr: production, position: 2 },
    { title: "Completion & delivery", amountInr: delivery, position: 3 },
  ];
}

export async function createRazorpayOrder(args: {
  amountInr: number;
  receipt: string;
  notes?: Record<string, string>;
}) {
  const config = paymentConfig();
  if (!config.configured || !config.keyId || !config.keySecret) {
    return { status: "unconfigured" as const };
  }
  const auth = `Basic ${btoa(`${config.keyId}:${config.keySecret}`)}`;
  try {
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: auth,
      },
      body: JSON.stringify({
        amount: Math.round(args.amountInr * 100),
        currency: "INR",
        receipt: args.receipt.slice(0, 40),
        notes: args.notes,
      }),
    });
    if (!response.ok) {
      return { status: "error" as const, reason: `Razorpay responded with ${response.status}.` };
    }
    const payload = (await response.json()) as { id?: string };
    if (!payload.id) return { status: "error" as const, reason: "No order id was returned." };
    return { status: "ok" as const, orderId: payload.id };
  } catch {
    return { status: "error" as const, reason: "The payment provider could not be reached." };
  }
}

export const PAYMENT_POLICY_COPY = [
  "Production starts only after the payment provider confirms the customer's payment.",
  "Platform fee is shown before a quote is accepted, and the artisan's net payout is always visible.",
  "Milestones are recorded in KalaProof as evidence; they do not move money by themselves.",
  "Refunds and payouts follow the payment provider's supported APIs and the agreed terms.",
];
