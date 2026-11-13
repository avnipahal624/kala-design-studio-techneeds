import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireAdmin, requireMarketplaceUser, requireProjectAccess } from "./lib/access";
import { recordAudit } from "./lib/events";
import {
  allocatePaise,
  applyBalanceEntry,
  assertPayoutReconciles,
  toPaise,
} from "./lib/payoutLedger";

const PAID_PROJECT_STATUS = "completed";
const ELIGIBLE_PAYMENT_STATUSES = new Set(["confirmed", "settled"]);

async function planRows(ctx: QueryCtx | MutationCtx, projectId: Id<"projects">) {
  return await ctx.db
    .query("payoutPlans")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .order("desc")
    .take(8);
}

async function balanceFor(ctx: QueryCtx | MutationCtx, artisanId: Id<"users">) {
  return await ctx.db
    .query("payoutBalances")
    .withIndex("by_artisan", (q) => q.eq("artisanId", artisanId))
    .unique();
}

async function applyLedgerEntry(
  ctx: MutationCtx,
  input: {
    planId: Id<"payoutPlans">;
    allocationId?: Id<"payoutAllocations">;
    projectId: Id<"projects">;
    artisanId: Id<"users">;
    bucket: "available" | "held" | "paid";
    kind: "allocation_hold" | "hold_release" | "available_credit" | "refund_reversal" | "manual_hold";
    direction: "credit" | "debit";
    amountPaise: number;
    idempotencyKey: string;
    note: string;
  },
) {
  const existing = await ctx.db
    .query("payoutLedger")
    .withIndex("by_idempotency", (q) => q.eq("idempotencyKey", input.idempotencyKey))
    .unique();
  if (existing) return existing;

  const current = await balanceFor(ctx, input.artisanId);
  const base = current
    ? { availablePaise: current.availablePaise, heldPaise: current.heldPaise, paidPaise: current.paidPaise }
    : { availablePaise: 0, heldPaise: 0, paidPaise: 0 };
  const next = applyBalanceEntry(base, {
    bucket: input.bucket,
    direction: input.direction,
    amountPaise: input.amountPaise,
  });
  if (current) {
    await ctx.db.patch(current._id, { ...next, updatedAt: Date.now() });
  } else {
    await ctx.db.insert("payoutBalances", {
      artisanId: input.artisanId,
      ...next,
      updatedAt: Date.now(),
    });
  }
  return await ctx.db.insert("payoutLedger", {
    planId: input.planId,
    allocationId: input.allocationId,
    projectId: input.projectId,
    artisanId: input.artisanId,
    bucket: input.bucket,
    kind: input.kind,
    direction: input.direction,
    amountPaise: input.amountPaise,
    idempotencyKey: input.idempotencyKey,
    note: input.note,
    createdAt: Date.now(),
  });
}

export const forProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const { project, isCustomer, isArtisan, isAdmin } = await requireProjectAccess(ctx, args.projectId, user);
    const plans = await planRows(ctx, args.projectId);
    const visiblePlans = await Promise.all(
      plans.map(async (plan) => {
        const allocations = await ctx.db
          .query("payoutAllocations")
          .withIndex("by_plan", (q) => q.eq("planId", plan._id))
          .take(20);
        const ledger = await ctx.db
          .query("payoutLedger")
          .withIndex("by_plan", (q) => q.eq("planId", plan._id))
          .order("asc")
          .take(80);
        const visibleAllocations = isArtisan ? allocations.filter((row) => row.artisanId === user._id) : allocations;
        const artisanNames = new Map<string, string>();
        await Promise.all(
          visibleAllocations.map(async (allocation) => {
            if (artisanNames.has(allocation.artisanId)) return;
            const profile = await ctx.db
              .query("artisanProfiles")
              .withIndex("by_user", (q) => q.eq("userId", allocation.artisanId))
              .unique();
            const account = await ctx.db.get(allocation.artisanId);
            artisanNames.set(allocation.artisanId, profile?.displayName ?? account?.name ?? "Artisan");
          }),
        );
        return {
          ...plan,
          allocations: visibleAllocations.map((allocation) => ({
            ...allocation,
            artisanName: artisanNames.get(allocation.artisanId) ?? "Artisan",
            balance: null,
          })),
          ledger: isArtisan ? ledger.filter((entry) => entry.artisanId === user._id) : ledger,
          visibleToViewer: true,
        };
      }),
    );
    const balance = isArtisan ? await balanceFor(ctx, user._id) : null;
    return {
      project: {
        _id: project._id,
        status: project.status,
        paymentStatus: project.paymentStatus,
        amountInr: project.amountInr,
        platformFeeInr: project.platformFeeInr,
        netPayoutInr: project.netPayoutInr,
      },
      viewer: { role: isAdmin ? "admin" : isCustomer ? "customer" : "artisan", userId: user._id },
      plans: visiblePlans,
      balance,
      canCreate: (isCustomer || isAdmin) && project.status === PAID_PROJECT_STATUS && ELIGIBLE_PAYMENT_STATUSES.has(project.paymentStatus),
      mode: "sandbox" as const,
    };
  },
});

export const createSandboxPlan = mutation({
  args: {
    projectId: v.id("projects"),
    idempotencyKey: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const { project, isCustomer, isAdmin } = await requireProjectAccess(ctx, args.projectId, user);
    if (!isCustomer && !isAdmin) throw new Error("FORBIDDEN: only the customer can propose a payout plan.");
    if (project.status !== PAID_PROJECT_STATUS) {
      throw new Error("INVALID: a payout plan can only be proposed after the project is complete.");
    }
    if (!ELIGIBLE_PAYMENT_STATUSES.has(project.paymentStatus)) {
      throw new Error("INVALID: the customer payment has not settled.");
    }
    if (args.idempotencyKey.trim().length < 8) throw new Error("INVALID: idempotency key is too short.");

    const duplicate = await ctx.db
      .query("payoutPlans")
      .withIndex("by_idempotency", (q) => q.eq("idempotencyKey", args.idempotencyKey.trim()))
      .unique();
    if (duplicate) return { planId: duplicate._id, existing: true as const };

    const existing = await planRows(ctx, args.projectId);
    if (existing.some((plan) => plan.status !== "cancelled" && plan.status !== "reversed")) {
      throw new Error("INVALID: an active sandbox payout plan already exists for this project.");
    }

    const grossPaise = toPaise(project.amountInr);
    const platformFeePaise = toPaise(project.platformFeeInr);
    const distributablePaise = toPaise(project.netPayoutInr);
    if (grossPaise - platformFeePaise !== distributablePaise) {
      throw new Error("INVALID: the project payment totals do not reconcile.");
    }

    const collabPlans = await ctx.db
      .query("collaborationPlans")
      .withIndex("by_request", (q) => q.eq("requestId", project.requestId))
      .take(5);
    const collab = collabPlans.find((plan) => plan.status !== "cancelled") ?? null;
    const tasks = collab
      ? await ctx.db
          .query("collaborationTasks")
          .withIndex("by_plan", (q) => q.eq("planId", collab._id))
          .take(5)
      : [];

    const eligibleTasks = tasks
      .filter((task) => Boolean(task.artisanId) && !["proposed", "declined"].includes(task.status))
      .sort((a, b) => a.position - b.position);
    const participants = eligibleTasks.length > 0
      ? eligibleTasks.map((task) => ({
          key: task._id as string,
          artisanId: task.artisanId!,
          taskId: task._id,
          label: `${task.title} · ${task.role}`,
          weightPaise: Math.max(1, toPaise(task.quotedAmountInr ?? task.plannedAmountInr)),
        }))
      : [{
          key: project.artisanId as string,
          artisanId: project.artisanId,
          taskId: undefined,
          label: "Lead artisan allocation",
          weightPaise: Math.max(1, distributablePaise),
        }];

    const shares = allocatePaise(
      distributablePaise,
      participants.map((row) => ({ key: row.key, weightPaise: row.weightPaise })),
    );
    const shareByKey = new Map(shares.map((row) => [row.key, row.amountPaise]));
    const allocations = participants.map((row) => ({
      ...row,
      netPaise: shareByKey.get(row.key) ?? 0,
    }));

    assertPayoutReconciles({
      grossPaise,
      platformFeePaise,
      processorFeePaise: 0,
      taxPaise: 0,
      refundedPaise: 0,
      heldPaise: 0,
      distributablePaise,
      allocationsPaise: allocations.reduce((total, row) => total + row.netPaise, 0),
      allocationAmounts: allocations.map((row) => row.netPaise),
    });

    const now = Date.now();
    const planId = await ctx.db.insert("payoutPlans", {
      projectId: project._id,
      requestId: project.requestId,
      customerId: project.customerId,
      collaborationPlanId: collab?._id,
      currency: "INR",
      mode: "sandbox",
      grossPaise,
      platformFeePaise,
      processorFeePaise: 0,
      taxPaise: 0,
      refundedPaise: 0,
      heldPaise: 0,
      distributablePaise,
      status: "proposed",
      idempotencyKey: args.idempotencyKey.trim(),
      feeNote: "Sandbox only: processor fees and taxes are not modelled because no provider transfer is executed. Platform fee comes from the accepted quote.",
      demoLabel: project.demoLabel,
      createdAt: now,
      updatedAt: now,
    });
    for (const allocation of allocations) {
      await ctx.db.insert("payoutAllocations", {
        planId,
        projectId: project._id,
        artisanId: allocation.artisanId,
        taskId: allocation.taskId,
        label: allocation.label,
        weightPaise: allocation.weightPaise,
        netPaise: allocation.netPaise,
        status: "proposed",
        demoLabel: project.demoLabel,
        createdAt: now,
        updatedAt: now,
      });
    }
    await recordAudit(ctx, {
      actorId: user._id,
      actorRole: isAdmin ? "admin" : "customer",
      action: "payout.plan_created",
      subjectType: "payoutPlans",
      subjectId: String(planId),
      detail: `${allocations.length} allocations · ₹${(distributablePaise / 100).toFixed(2)}`,
    });
    return { planId, existing: false as const };
  },
});

export const acceptSandboxPlan = mutation({
  args: { planId: v.id("payoutPlans"), note: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const plan = await ctx.db.get(args.planId);
    if (!plan) throw new Error("NOT_FOUND: payout plan not found.");
    const { isCustomer, isAdmin } = await requireProjectAccess(ctx, plan.projectId, user);
    if (!isCustomer && !isAdmin) throw new Error("FORBIDDEN: only the customer can accept a split.");
    if (plan.status === "accepted" || plan.status === "simulated") {
      return { ok: true as const, status: plan.status };
    }
    if (plan.status !== "proposed") throw new Error("INVALID: this plan can no longer be accepted.");
    const allocations = await ctx.db.query("payoutAllocations").withIndex("by_plan", (q) => q.eq("planId", plan._id)).take(20);
    assertPayoutReconciles({
      grossPaise: plan.grossPaise,
      platformFeePaise: plan.platformFeePaise,
      processorFeePaise: plan.processorFeePaise,
      taxPaise: plan.taxPaise,
      refundedPaise: plan.refundedPaise,
      heldPaise: plan.heldPaise,
      distributablePaise: plan.distributablePaise,
      allocationsPaise: allocations.reduce((total, row) => total + row.netPaise, 0),
      allocationAmounts: allocations.map((row) => row.netPaise),
    });

    for (const allocation of allocations) {
      if (allocation.status !== "proposed") throw new Error("INVALID: an allocation is already held or reversed.");
      await applyLedgerEntry(ctx, {
        planId: plan._id,
        allocationId: allocation._id,
        projectId: plan.projectId,
        artisanId: allocation.artisanId,
        bucket: "held",
        kind: "allocation_hold",
        direction: "credit",
        amountPaise: allocation.netPaise,
        idempotencyKey: `${plan._id}:hold:${allocation._id}`,
        note: `Sandbox hold for ${allocation.label}`,
      });
      await ctx.db.patch(allocation._id, { status: "held", updatedAt: Date.now() });
    }
    await ctx.db.patch(plan._id, {
      status: "accepted",
      acceptedAt: Date.now(),
      updatedAt: Date.now(),
    });
    await recordAudit(ctx, {
      actorId: user._id,
      actorRole: isAdmin ? "admin" : "customer",
      action: "payout.plan_accepted",
      subjectType: "payoutPlans",
      subjectId: String(plan._id),
      detail: `Sandbox holds placed for ${allocations.length} allocations`,
    });
    return { ok: true as const, status: "accepted" as const };
  },
});

export const simulateSandboxPayouts = mutation({
  args: { planId: v.id("payoutPlans") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const plan = await ctx.db.get(args.planId);
    if (!plan) throw new Error("NOT_FOUND: payout plan not found.");
    const { isCustomer, isAdmin } = await requireProjectAccess(ctx, plan.projectId, user);
    if (!isCustomer && !isAdmin) throw new Error("FORBIDDEN: only the customer can run the sandbox simulator.");
    if (plan.status === "simulated") return { ok: true as const, status: "simulated" as const, movedMoney: false as const };
    if (plan.status !== "accepted") throw new Error("INVALID: accept the proposed split before simulating payouts.");
    const allocations = await ctx.db.query("payoutAllocations").withIndex("by_plan", (q) => q.eq("planId", plan._id)).take(20);
    if (allocations.some((row) => row.status !== "held")) throw new Error("INVALID: every allocation must be held first.");

    for (const allocation of allocations) {
      await applyLedgerEntry(ctx, {
        planId: plan._id,
        allocationId: allocation._id,
        projectId: plan.projectId,
        artisanId: allocation.artisanId,
        bucket: "held",
        kind: "hold_release",
        direction: "debit",
        amountPaise: allocation.netPaise,
        idempotencyKey: `${plan._id}:release-held:${allocation._id}`,
        note: "Sandbox hold released to available balance",
      });
      await applyLedgerEntry(ctx, {
        planId: plan._id,
        allocationId: allocation._id,
        projectId: plan.projectId,
        artisanId: allocation.artisanId,
        bucket: "available",
        kind: "available_credit",
        direction: "credit",
        amountPaise: allocation.netPaise,
        idempotencyKey: `${plan._id}:available:${allocation._id}`,
        note: "Sandbox simulated payout credit; no money moved",
      });
      await ctx.db.patch(allocation._id, { status: "available", updatedAt: Date.now() });
    }
    await ctx.db.patch(plan._id, {
      status: "simulated",
      simulatedAt: Date.now(),
      updatedAt: Date.now(),
    });
    await recordAudit(ctx, {
      actorId: user._id,
      actorRole: isAdmin ? "admin" : "customer",
      action: "payout.simulated",
      subjectType: "payoutPlans",
      subjectId: String(plan._id),
      detail: "Sandbox simulator only; no provider transfer",
    });
    return { ok: true as const, status: "simulated" as const, movedMoney: false as const };
  },
});

export const reverseAllocation = mutation({
  args: { allocationId: v.id("payoutAllocations"), reason: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    if (args.reason.trim().length < 8) throw new Error("INVALID: explain the refund or reversal.");
    const allocation = await ctx.db.get(args.allocationId);
    if (!allocation) throw new Error("NOT_FOUND: allocation not found.");
    if (allocation.status === "reversed" || allocation.status === "proposed") {
      throw new Error("INVALID: only a held or available allocation can be reversed.");
    }
    const plan = await ctx.db.get(allocation.planId);
    if (!plan) throw new Error("NOT_FOUND: payout plan not found.");
    const bucket = allocation.status === "held" ? "held" : "available";
    await applyLedgerEntry(ctx, {
      planId: plan._id,
      allocationId: allocation._id,
      projectId: plan.projectId,
      artisanId: allocation.artisanId,
      bucket,
      kind: "refund_reversal",
      direction: "debit",
      amountPaise: allocation.netPaise,
      idempotencyKey: `${plan._id}:reverse:${allocation._id}`,
      note: args.reason.trim().slice(0, 240),
    });
    await ctx.db.patch(allocation._id, {
      status: "reversed",
      holdReason: args.reason.trim().slice(0, 240),
      updatedAt: Date.now(),
    });
    const all = await ctx.db.query("payoutAllocations").withIndex("by_plan", (q) => q.eq("planId", plan._id)).take(20);
    if (all.every((row) => row.status === "reversed")) {
      await ctx.db.patch(plan._id, { status: "reversed", updatedAt: Date.now() });
    }
    await recordAudit(ctx, {
      actorId: admin._id,
      actorRole: "admin",
      action: "payout.reversed",
      subjectType: "payoutAllocations",
      subjectId: String(allocation._id),
      detail: args.reason.trim().slice(0, 300),
    });
    return { ok: true as const };
  },
});

/** Admin overview of ledger balances; no live money movement. */
export const balances = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("payoutBalances").order("desc").take(100);
    return await Promise.all(
      rows.map(async (row) => {
        const account = await ctx.db.get(row.artisanId);
        return { ...row, artisanName: account?.name ?? "Artisan" };
      }),
    );
  },
});
