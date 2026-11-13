import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { requireMarketplaceUser } from "./lib/access";
import { notifyUser, recordAudit } from "./lib/events";
import { scoreArtisan, type MatchRequest } from "./lib/matching";

const MAX_TASKS = 5;

type TaskDraft = {
  position: number;
  title: string;
  role: string;
  skill: string;
  brief: string;
  dependsOnPosition?: number;
  dependsOnPositions?: number[];
  weight: number;
};

type Phase = "construction" | "surface" | "finishing";

function phaseForSkill(skill: string): Phase {
  if (["Tailoring", "Woodwork", "Leather Craft"].includes(skill)) return "construction";
  if (["Protective Finishing", "Decorative Finishing"].includes(skill)) return "finishing";
  return "surface";
}

function roleForSkill(skill: string): { title: string; role: string; brief: string } {
  switch (skill) {
    case "Tailoring":
      return {
        title: "Garment construction",
        role: "Tailor",
        brief: "Cut, fit and construct the base piece to the agreed measurements, leaving the decorated panels accessible for the next maker.",
      };
    case "Embroidery":
    case "Chikankari":
    case "Kantha":
    case "Phulkari":
    case "Zardozi":
    case "Beadwork":
      return {
        title: `${skill} surface work`,
        role: "Embroidery artisan",
        brief: "Work the agreed motif and placement in the named embroidery technique, matching the approved palette and thread specification.",
      };
    case "Hand Painting":
    case "Madhubani Painting":
    case "Mandala Painting":
    case "Fabric Painting":
    case "Block Printing":
    case "Textile Dyeing":
      return {
        title: `${skill} surface art`,
        role: "Painting artisan",
        brief: "Prepare the surface and apply the approved artwork, recording material tests and any adaptation needed for the base.",
      };
    case "Leather Craft":
      return {
        title: "Leather construction",
        role: "Leather craftsperson",
        brief: "Prepare, cut and construct the leather base, protecting hardware and seams before decoration.",
      };
    case "Woodwork":
      return {
        title: "Woodwork & structure",
        role: "Wood craftsperson",
        brief: "Build or prepare the wooden structure, including sanding and any priming required before surface work.",
      };
    default:
      return {
        title: skill,
        role: `${skill} specialist`,
        brief: `Complete the ${skill.toLowerCase()} stage against the approved brief, materials and placement.`,
      };
  }
}

/**
 * Deterministic craft decomposition. It adds no AI assumptions: every task is
 * derived from the skills already stored on the request by the Craft DNA engine.
 */
export function decomposeRequest(request: Doc<"customerRequests">): TaskDraft[] {
  const phases = new Map<Phase, TaskDraft[]>();
  const seen = new Set<string>();

  for (const rawSkill of request.requiredSkills) {
    const skill = rawSkill.trim();
    if (!skill || seen.has(skill)) continue;
    if (skill === "Surface Preparation") continue;
    seen.add(skill);
    const phase = phaseForSkill(skill);
    const definition = roleForSkill(skill);
    const list = phases.get(phase) ?? [];
    list.push({
      position: 0,
      ...definition,
      skill,
      weight: phase === "construction" ? 0.38 : phase === "finishing" ? 0.22 : 0.4 / Math.max(1, list.length + 1),
    });
    phases.set(phase, list);
  }

  const ordered: Omit<TaskDraft, "position" | "dependsOnPosition">[] = [];
  const construction = phases.get("construction") ?? [];
  const surface = phases.get("surface") ?? [];
  const finishing = phases.get("finishing") ?? [];
  ordered.push(...construction, ...surface, ...finishing);

  if (ordered.length === 0) {
    ordered.push({
      title: "Craft interpretation",
      role: "Craft artisan",
      skill: request.requiredSkills[0] ?? "Hand Painting",
      brief: "Interpret the brief and propose a making method, materials and finish for customer approval.",
      weight: 1,
    });
  }

  const constructionPositions = construction.map((_, index) => index + 1);
  const surfacePositions = surface.map((_, index) => construction.length + index + 1);
  return ordered.slice(0, MAX_TASKS).map((task, index) => {
    const phase = phaseForSkill(task.skill);
    const position = index + 1;
    let dependsOnPositions: number[] = [];
    if (phase === "surface") dependsOnPositions = constructionPositions;
    if (phase === "finishing") dependsOnPositions = [...constructionPositions, ...surfacePositions];
    // A finishing task must wait for every construction and surface task, not
    // merely the last one. Dependencies are filtered to tasks that exist after
    // the MAX_TASKS cap.
    dependsOnPositions = dependsOnPositions.filter((dependency) => dependency < position);
    return {
      ...task,
      position,
      dependsOnPosition: dependsOnPositions[dependsOnPositions.length - 1],
      dependsOnPositions: dependsOnPositions.length > 0 ? dependsOnPositions : undefined,
    };
  });
}

function matchInput(request: Doc<"customerRequests">, task: TaskDraft, budgetInr: number): MatchRequest {
  return {
    category: request.category,
    budgetInr,
    requiredSkills: [task.skill],
    materialsKnown: request.materialsKnown,
    city: request.city,
    fulfilment: request.fulfilment,
    deadline: request.deadline,
    craftPreference: request.craftPreference,
  };
}

async function bestArtisan(
  ctx: QueryCtx | MutationCtx,
  request: Doc<"customerRequests">,
  task: TaskDraft,
  budgetInr: number,
  excluded: Set<Id<"users">>,
) {
  const profiles = await ctx.db
    .query("artisanProfiles")
    .withIndex("by_updated")
    .order("desc")
    .take(80);
  let best: {
    profile: Doc<"artisanProfiles">;
    score: number;
    reasons: string[];
  } | null = null;

  for (const profile of profiles) {
    if (profile.sampleLabel || profile.verificationStatus === "suspended") continue;
    if (profile.availability === "paused") continue;
    if (excluded.has(profile.userId)) continue;
    const tags = await ctx.db
      .query("portfolioItems")
      .withIndex("by_artisan", (q) => q.eq("artisanId", profile.userId))
      .take(12);
    const match = scoreArtisan(matchInput(request, task, budgetInr), {
      ...profile,
      craftTags: tags.flatMap((item) => item.craftTags),
    });
    if (!match.eligible) continue;
    if (!best || match.score > best.score) {
      best = { profile, score: match.score, reasons: match.reasons };
    }
  }
  return best;
}

async function buildPlan(ctx: MutationCtx, request: Doc<"customerRequests">) {
  const drafts = decomposeRequest(request);
  const totalWeight = drafts.reduce((sum, task) => sum + task.weight, 0);
  const used = new Set<Id<"users">>();
  const now = Date.now();
  const planId = await ctx.db.insert("collaborationPlans", {
    requestId: request._id,
    customerId: request.customerId,
    title: request.title,
    status: "draft",
    combinedBudgetInr: request.budgetInr,
    createdAt: now,
    updatedAt: now,
  });

  let assigned = 0;
  for (const [index, task] of drafts.entries()) {
    const plannedAmountInr =
      index === drafts.length - 1
        ? request.budgetInr -
          drafts
            .slice(0, -1)
            .reduce((sum, item) => sum + Math.floor((request.budgetInr * item.weight) / totalWeight), 0)
        : Math.floor((request.budgetInr * task.weight) / totalWeight);
    const match = await bestArtisan(ctx, request, task, request.budgetInr, used);
    if (match) {
      used.add(match.profile.userId);
      assigned += 1;
    }
    await ctx.db.insert("collaborationTasks", {
      planId,
      requestId: request._id,
      position: task.position,
      title: task.title,
      role: task.role,
      skill: task.skill,
      brief: task.brief,
      dependsOnPosition: task.dependsOnPosition,
      dependsOnPositions: task.dependsOnPositions,
      artisanId: match?.profile.userId,
      matchScore: match?.score,
      matchReasons: match?.reasons.slice(0, 4) ?? [],
      status: "proposed",
      plannedAmountInr: Math.max(0, plannedAmountInr),
      createdAt: now,
      updatedAt: now,
    });
  }
  return { planId, assigned, total: drafts.length };
}

export const forRequest = query({
  args: { requestId: v.id("customerRequests") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request) return null;
    if (request.customerId !== user._id && user.role !== "admin") {
      throw new Error("NOT_FOUND: request not found.");
    }
    const plans = await ctx.db
      .query("collaborationPlans")
      .withIndex("by_request", (q) => q.eq("requestId", args.requestId))
      .order("desc")
      .take(5);
    const plan = plans.find((row) => row.status !== "cancelled") ?? plans[0] ?? null;
    if (!plan) return null;
    const tasks = await ctx.db
      .query("collaborationTasks")
      .withIndex("by_plan_position", (q) => q.eq("planId", plan._id))
      .order("asc")
      .take(MAX_TASKS);
    const enriched = await Promise.all(
      tasks.map(async (task) => {
        const profile = task.artisanId
          ? await ctx.db
              .query("artisanProfiles")
              .withIndex("by_user", (q) => q.eq("userId", task.artisanId!))
              .unique()
          : null;
        return {
          ...task,
          artisanName: profile?.displayName ?? null,
          artisanCity: profile?.city ?? null,
          artisanVerification: profile?.verificationStatus ?? null,
        };
      }),
    );
    return { plan, tasks: enriched };
  },
});

export const mine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireMarketplaceUser(ctx);
    const plans = await ctx.db
      .query("collaborationPlans")
      .withIndex("by_customer", (q) => q.eq("customerId", user._id))
      .order("desc")
      .take(12);
    return await Promise.all(
      plans.map(async (plan) => {
        const tasks = await ctx.db
          .query("collaborationTasks")
          .withIndex("by_plan", (q) => q.eq("planId", plan._id))
          .take(MAX_TASKS);
        return {
          ...plan,
          taskCount: tasks.length,
          acceptedCount: tasks.filter((task) => task.status !== "proposed" && task.status !== "invited" && task.status !== "declined").length,
          completedCount: tasks.filter((task) => task.status === "approved").length,
        };
      }),
    );
  },
});

export const invitations = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireMarketplaceUser(ctx);
    const tasks = await ctx.db
      .query("collaborationTasks")
      .withIndex("by_artisan", (q) => q.eq("artisanId", user._id))
      .order("desc")
      .take(30);
    const rows = [];
    for (const task of tasks) {
      const plan = await ctx.db.get(task.planId);
      if (!plan || plan.status === "cancelled") continue;
      const request = await ctx.db.get(plan.requestId);
      if (!request) continue;
      const customer = await ctx.db.get(plan.customerId);
      const dependencyPositions = task.dependsOnPositions?.length
        ? task.dependsOnPositions
        : task.dependsOnPosition
          ? [task.dependsOnPosition]
          : [];
      const dependencies = (
        await Promise.all(
          dependencyPositions.map((position) =>
            ctx.db
              .query("collaborationTasks")
              .withIndex("by_plan_position", (q) => q.eq("planId", task.planId).eq("position", position))
              .unique(),
          ),
        )
      ).filter((row): row is Doc<"collaborationTasks"> => Boolean(row));
      rows.push({
        ...task,
        planStatus: plan.status,
        planTitle: plan.title,
        requestTitle: request.title,
        requestCategory: request.category,
        customerName: (customer?.name ?? "Customer").trim().split(/\s+/)[0],
        dependencyTitle: dependencies.map((dependency) => dependency.title).join(" + ") || null,
        dependencyStatus:
          dependencies.length === 0
            ? null
            : dependencies.every((dependency) => dependency.status === "approved")
              ? "approved"
              : "pending",
      });
    }
    return rows;
  },
});

export const candidates = query({
  args: { taskId: v.id("collaborationTasks") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("NOT_FOUND: task not found.");
    const plan = await ctx.db.get(task.planId);
    if (!plan || plan.customerId !== user._id) throw new Error("NOT_FOUND: plan not found.");
    const request = await ctx.db.get(plan.requestId);
    if (!request) return [];
    const profiles = await ctx.db
      .query("artisanProfiles")
      .withIndex("by_updated")
      .order("desc")
      .take(80);
    const results = [];
    for (const profile of profiles) {
      if (profile.sampleLabel || profile.verificationStatus === "suspended") continue;
      if (profile.availability === "paused") continue;
      if (profile.userId === task.artisanId) continue;
      const tags = await ctx.db
        .query("portfolioItems")
        .withIndex("by_artisan", (q) => q.eq("artisanId", profile.userId))
        .take(12);
      const match = scoreArtisan(matchInput(request, {
        position: task.position,
        title: task.title,
        role: task.role,
        skill: task.skill,
        brief: task.brief,
        dependsOnPosition: task.dependsOnPosition,
        weight: 1,
      }, request.budgetInr), {
        ...profile,
        craftTags: tags.flatMap((item) => item.craftTags),
      });
      if (!match.eligible) continue;
      results.push({
        id: profile.userId,
        name: profile.displayName,
        city: profile.city,
        skills: profile.skills,
        score: match.score,
        reasons: match.reasons.slice(0, 3),
      });
    }
    return results.sort((a, b) => b.score - a.score).slice(0, 8);
  },
});

export const assignTask = mutation({
  args: { taskId: v.id("collaborationTasks"), artisanId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("NOT_FOUND: task not found.");
    const plan = await ctx.db.get(task.planId);
    if (!plan || plan.customerId !== user._id) throw new Error("NOT_FOUND: plan not found.");
    if (!["draft", "awaiting_artisans"].includes(plan.status)) {
      throw new Error("INVALID: assignments are locked after the plan is agreed.");
    }
    if (["accepted", "approved", "in_progress", "submitted"].includes(task.status)) {
      throw new Error("INVALID: this task is already owned by an artisan.");
    }
    const profile = await ctx.db
      .query("artisanProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.artisanId))
      .unique();
    if (!profile || profile.sampleLabel || profile.verificationStatus === "suspended") {
      throw new Error("NOT_FOUND: artisan profile not available.");
    }
    const request = await ctx.db.get(plan.requestId);
    if (!request) throw new Error("NOT_FOUND: request not found.");
    const tags = await ctx.db
      .query("portfolioItems")
      .withIndex("by_artisan", (q) => q.eq("artisanId", args.artisanId))
      .take(12);
    const match = scoreArtisan(matchInput(request, {
      position: task.position,
      title: task.title,
      role: task.role,
      skill: task.skill,
      brief: task.brief,
      dependsOnPosition: task.dependsOnPosition,
      weight: 1,
    }, request.budgetInr), {
      ...profile,
      craftTags: tags.flatMap((item) => item.craftTags),
    });
    if (!match.eligible) throw new Error("INVALID: this artisan is not eligible for the task brief.");
    const previousArtisanId = task.artisanId;
    await ctx.db.patch(task._id, {
      artisanId: args.artisanId,
      matchScore: match.score,
      matchReasons: match.reasons.slice(0, 4),
      status: "proposed",
      quotedAmountInr: undefined,
      artisanNote: undefined,
      updatedAt: Date.now(),
    });
    // Reassignment invalidates the previous invitation. Return the plan to a
    // draft so the customer must explicitly re-send the updated proposal.
    if (plan.status === "awaiting_artisans") {
      await ctx.db.patch(plan._id, { status: "draft", updatedAt: Date.now() });
    }
    if (previousArtisanId && previousArtisanId !== args.artisanId) {
      await notifyUser(ctx, previousArtisanId, {
        type: "collab.reassigned",
        title: "KalaCollab task reassigned",
        body: `${task.title} has been assigned to another maker. You no longer need to respond.`,
        href: "/artisan/collaborations",
      });
    }
    return { assigned: true, score: match.score };
  },
});

export const createPlan = mutation({
  args: { requestId: v.id("customerRequests") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request || request.customerId !== user._id) throw new Error("NOT_FOUND: request not found.");
    if (request.status !== "open") throw new Error("INVALID: this brief is no longer open.");
    const existing = await ctx.db
      .query("collaborationPlans")
      .withIndex("by_request", (q) => q.eq("requestId", args.requestId))
      .take(5);
    if (existing.some((plan) => !["cancelled", "completed"].includes(plan.status))) {
      throw new Error("INVALID: this request already has an active collaboration plan.");
    }
    const result = await buildPlan(ctx, request);
    await recordAudit(ctx, {
      actorId: user._id,
      actorRole: "customer",
      action: "collab.created",
      subjectType: "collaborationPlans",
      subjectId: String(result.planId),
      detail: `${result.assigned}/${result.total} tasks matched`,
    });
    return result;
  },
});

export const rebuildPlan = mutation({
  args: { planId: v.id("collaborationPlans") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const plan = await ctx.db.get(args.planId);
    if (!plan || plan.customerId !== user._id) throw new Error("NOT_FOUND: plan not found.");
    if (!["draft", "awaiting_artisans"].includes(plan.status)) {
      throw new Error("INVALID: only a draft plan can be reassigned.");
    }
    const request = await ctx.db.get(plan.requestId);
    if (!request) throw new Error("NOT_FOUND: request not found.");
    const tasks = await ctx.db
      .query("collaborationTasks")
      .withIndex("by_plan_position", (q) => q.eq("planId", plan._id))
      .order("asc")
      .take(MAX_TASKS);
    const used = new Set<Id<"users">>();
    for (const task of tasks) {
      if (task.artisanId && task.status === "accepted") used.add(task.artisanId);
    }
    let reassigned = 0;
    for (const task of tasks) {
      if (task.status === "accepted" || task.status === "approved" || task.status === "in_progress" || task.status === "submitted") {
        continue;
      }
      const draft: TaskDraft = {
        position: task.position,
        title: task.title,
        role: task.role,
        skill: task.skill,
        brief: task.brief,
        dependsOnPosition: task.dependsOnPosition,
        dependsOnPositions: task.dependsOnPositions,
        weight: 1,
      };
      const excluded = new Set(used);
      if (task.status === "declined" && task.artisanId) excluded.add(task.artisanId);
      const match = await bestArtisan(ctx, request, draft, request.budgetInr, excluded);
      if (match) used.add(match.profile.userId);
      await ctx.db.patch(task._id, {
        artisanId: match?.profile.userId,
        matchScore: match?.score,
        matchReasons: match?.reasons.slice(0, 4) ?? [],
        status: "proposed",
        quotedAmountInr: undefined,
        artisanNote: undefined,
        updatedAt: Date.now(),
      });
      if (match) reassigned += 1;
    }
    const refreshed = await ctx.db
      .query("collaborationTasks")
      .withIndex("by_plan", (q) => q.eq("planId", plan._id))
      .take(MAX_TASKS);
    const allAssigned = refreshed.every((task) => Boolean(task.artisanId));
    const allAccepted = refreshed.length > 0 && refreshed.every((task) => task.status === "accepted");
    await ctx.db.patch(plan._id, {
      status: allAssigned ? (allAccepted ? "ready" : "draft") : "draft",
      updatedAt: Date.now(),
    });
    return { reassigned, allAssigned };
  },
});

export const dispatchPlan = mutation({
  args: { planId: v.id("collaborationPlans") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const plan = await ctx.db.get(args.planId);
    if (!plan || plan.customerId !== user._id) throw new Error("NOT_FOUND: plan not found.");
    if (plan.status !== "draft") throw new Error("INVALID: this plan cannot be dispatched yet.");
    const tasks = await ctx.db
      .query("collaborationTasks")
      .withIndex("by_plan", (q) => q.eq("planId", plan._id))
      .take(MAX_TASKS);
    if (tasks.length === 0) throw new Error("INVALID: the plan has no tasks.");
    if (tasks.some((task) => !task.artisanId)) {
      throw new Error("INVALID: every task needs a matched artisan before the proposal is sent.");
    }
    for (const task of tasks) {
      if (task.status !== "proposed" && task.status !== "declined") continue;
      await ctx.db.patch(task._id, { status: "invited", updatedAt: Date.now() });
      if (task.artisanId) {
        await notifyUser(ctx, task.artisanId, {
          type: "collab.invited",
          title: "KalaCollab task invitation",
          body: `${plan.title} · ${task.title}. Review the brief and accept your part.`,
          href: "/artisan/collaborations",
        });
      }
    }
    await ctx.db.patch(plan._id, { status: "awaiting_artisans", updatedAt: Date.now() });
    await recordAudit(ctx, {
      actorId: user._id,
      actorRole: "customer",
      action: "collab.dispatched",
      subjectType: "collaborationPlans",
      subjectId: String(plan._id),
      detail: `${tasks.length} task invitations`,
    });
    return { invited: tasks.length };
  },
});

export const respondTask = mutation({
  args: {
    taskId: v.id("collaborationTasks"),
    accept: v.boolean(),
    quotedAmountInr: v.optional(v.number()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task || task.artisanId !== user._id) throw new Error("NOT_FOUND: task not found.");
    const plan = await ctx.db.get(task.planId);
    if (!plan || plan.status !== "awaiting_artisans") throw new Error("INVALID: this invitation is no longer open.");
    if (task.status !== "invited") throw new Error("INVALID: this task has already been answered.");
    const currentTasks = await ctx.db
      .query("collaborationTasks")
      .withIndex("by_plan", (q) => q.eq("planId", plan._id))
      .take(MAX_TASKS);
    if (args.accept) {
      const amount = Math.round(args.quotedAmountInr ?? 0);
      if (amount < 1 || amount > 1_000_000) {
        throw new Error("INVALID: add your amount for this task.");
      }
      const alreadyAccepted = currentTasks
        .filter((row) => row.status === "accepted")
        .reduce((sum, row) => sum + (row.quotedAmountInr ?? 0), 0);
      if (alreadyAccepted + amount > plan.combinedBudgetInr) {
        throw new Error(
          `INVALID: accepting this amount would exceed the customer's ₹${plan.combinedBudgetInr.toLocaleString("en-IN")} plan budget.`,
        );
      }
      await ctx.db.patch(task._id, {
        status: "accepted",
        quotedAmountInr: amount,
        artisanNote: args.note?.trim().slice(0, 600),
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.patch(task._id, {
        status: "declined",
        artisanNote: args.note?.trim().slice(0, 600),
        updatedAt: Date.now(),
      });
    }
    const all = await ctx.db
      .query("collaborationTasks")
      .withIndex("by_plan", (q) => q.eq("planId", plan._id))
      .take(MAX_TASKS);
    const allAccepted = all.length > 0 && all.every((row) => row.status === "accepted");
    const anyDeclined = all.some((row) => row.status === "declined");
    await ctx.db.patch(plan._id, {
      status: allAccepted ? "ready" : anyDeclined ? "draft" : "awaiting_artisans",
      updatedAt: Date.now(),
    });
    await notifyUser(ctx, plan.customerId, {
      type: args.accept ? "collab.accepted" : "collab.declined",
      title: args.accept ? "An artisan accepted their KalaCollab task" : "A KalaCollab task needs reassignment",
      body: `${task.title} · ${args.accept ? `₹${Math.round(args.quotedAmountInr ?? 0).toLocaleString("en-IN")} proposed` : "The artisan declined."}`,
      href: `/customer/requests/${plan.requestId}`,
    });
    return { planStatus: allAccepted ? "ready" : anyDeclined ? "draft" : "awaiting_artisans" };
  },
});

export const approvePlan = mutation({
  args: { planId: v.id("collaborationPlans") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const plan = await ctx.db.get(args.planId);
    if (!plan || plan.customerId !== user._id) throw new Error("NOT_FOUND: plan not found.");
    if (plan.status !== "ready") throw new Error("INVALID: every artisan must accept before you approve the plan.");
    const tasks = await ctx.db
      .query("collaborationTasks")
      .withIndex("by_plan", (q) => q.eq("planId", plan._id))
      .take(MAX_TASKS);
    if (!tasks.every((task) => task.status === "accepted")) {
      throw new Error("INVALID: the plan is not fully accepted.");
    }
    const quotedTotal = tasks.reduce((sum, task) => sum + (task.quotedAmountInr ?? 0), 0);
    if (quotedTotal > plan.combinedBudgetInr) {
      throw new Error(
        `INVALID: the accepted task amounts total ₹${quotedTotal.toLocaleString("en-IN")}, above the ₹${plan.combinedBudgetInr.toLocaleString("en-IN")} plan budget.`,
      );
    }
    await ctx.db.patch(plan._id, { status: "approved", approvedAt: Date.now(), updatedAt: Date.now() });
    for (const task of tasks) {
      if (task.artisanId) {
        await notifyUser(ctx, task.artisanId, {
          type: "collab.approved",
          title: "KalaCollab plan approved",
          body: `${plan.title} is approved. Open your task workspace for the agreed scope.`,
          href: "/artisan/collaborations",
        });
      }
    }
    await recordAudit(ctx, {
      actorId: user._id,
      actorRole: "customer",
      action: "collab.approved",
      subjectType: "collaborationPlans",
      subjectId: String(plan._id),
      detail: `${tasks.length} tasks · ₹${tasks.reduce((sum, task) => sum + (task.quotedAmountInr ?? 0), 0)} planned`,
    });
    return { approved: true };
  },
});

export const startTask = mutation({
  args: { taskId: v.id("collaborationTasks") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task || task.artisanId !== user._id) throw new Error("NOT_FOUND: task not found.");
    const plan = await ctx.db.get(task.planId);
    if (!plan || !["approved", "in_production"].includes(plan.status)) {
      throw new Error("INVALID: the collaboration plan is not approved yet.");
    }
    if (task.status !== "accepted") throw new Error("INVALID: this task cannot start.");
    const dependencyPositions = task.dependsOnPositions?.length
      ? task.dependsOnPositions
      : task.dependsOnPosition
        ? [task.dependsOnPosition]
        : [];
    const dependencies = (
      await Promise.all(
        dependencyPositions.map((position) =>
          ctx.db
            .query("collaborationTasks")
            .withIndex("by_plan_position", (q) => q.eq("planId", task.planId).eq("position", position))
            .unique(),
        ),
      )
    ).filter((row): row is Doc<"collaborationTasks"> => Boolean(row));
    const blocked = dependencies.find((dependency) => dependency.status !== "approved");
    if (blocked) {
      throw new Error(`DEPENDENCY: wait for “${blocked.title}” to be approved first.`);
    }
    await ctx.db.patch(task._id, { status: "in_progress", startedAt: Date.now(), updatedAt: Date.now() });
    if (plan.status === "approved") await ctx.db.patch(plan._id, { status: "in_production", updatedAt: Date.now() });
    await notifyUser(ctx, plan.customerId, {
      type: "collab.started",
      title: "A KalaCollab task has started",
      body: `${task.title} is in progress.`,
      href: `/customer/requests/${plan.requestId}`,
    });
    return { started: true };
  },
});

export const submitTask = mutation({
  args: {
    taskId: v.id("collaborationTasks"),
    note: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task || task.artisanId !== user._id) throw new Error("NOT_FOUND: task not found.");
    if (task.status !== "in_progress") throw new Error("INVALID: only an in-progress task can be submitted.");
    if (args.note.trim().length < 12) throw new Error("INVALID: describe what you completed.");
    await ctx.db.patch(task._id, {
      status: "submitted",
      artisanNote: args.note.trim().slice(0, 1200),
      submittedAt: Date.now(),
      updatedAt: Date.now(),
    });
    const plan = await ctx.db.get(task.planId);
    if (plan) {
      await notifyUser(ctx, plan.customerId, {
        type: "collab.submitted",
        title: "A KalaCollab contribution is ready",
        body: `${task.title}: review the artisan's completion note.`,
        href: `/customer/requests/${plan.requestId}`,
      });
    }
    return { submitted: true };
  },
});

export const approveTask = mutation({
  args: { taskId: v.id("collaborationTasks") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("NOT_FOUND: task not found.");
    const plan = await ctx.db.get(task.planId);
    if (!plan || plan.customerId !== user._id) throw new Error("NOT_FOUND: plan not found.");
    if (task.status !== "submitted") throw new Error("INVALID: this task is not ready for approval.");
    await ctx.db.patch(task._id, { status: "approved", approvedAt: Date.now(), updatedAt: Date.now() });
    const all = await ctx.db
      .query("collaborationTasks")
      .withIndex("by_plan", (q) => q.eq("planId", plan._id))
      .take(MAX_TASKS);
    const completed = all.every((row) => row.status === "approved" || row._id === task._id);
    await ctx.db.patch(plan._id, {
      status: completed ? "completed" : plan.status,
      completedAt: completed ? Date.now() : undefined,
      updatedAt: Date.now(),
    });
    if (task.artisanId) {
      await notifyUser(ctx, task.artisanId, {
        type: "collab.task_approved",
        title: "Your KalaCollab contribution was approved",
        body: task.title,
        href: "/artisan/collaborations",
      });
    }
    return { planCompleted: completed };
  },
});

export const cancelPlan = mutation({
  args: { planId: v.id("collaborationPlans") },
  handler: async (ctx, args) => {
    const user = await requireMarketplaceUser(ctx);
    const plan = await ctx.db.get(args.planId);
    if (!plan || plan.customerId !== user._id) throw new Error("NOT_FOUND: plan not found.");
    if (["completed", "cancelled"].includes(plan.status)) throw new Error("INVALID: this plan is already closed.");
    const tasks = await ctx.db
      .query("collaborationTasks")
      .withIndex("by_plan", (q) => q.eq("planId", plan._id))
      .take(MAX_TASKS);
    await ctx.db.patch(plan._id, { status: "cancelled", updatedAt: Date.now() });
    for (const task of tasks) {
      if (!task.artisanId || !["invited", "accepted", "in_progress"].includes(task.status)) continue;
      await notifyUser(ctx, task.artisanId, {
        type: "collab.cancelled",
        title: "KalaCollab plan cancelled",
        body: `${plan.title} · ${task.title} has been cancelled by the customer. Do not continue this task.`,
        href: "/artisan/collaborations",
      });
    }
    await recordAudit(ctx, {
      actorId: user._id,
      actorRole: "customer",
      action: "collab.cancelled",
      subjectType: "collaborationPlans",
      subjectId: String(plan._id),
      detail: `${tasks.length} tasks`,
    });
    return { cancelled: true };
  },
});
