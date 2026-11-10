import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

export async function requireMarketplaceUser(ctx: Ctx): Promise<Doc<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("UNAUTHENTICATED: sign in to continue.");
  const user = await ctx.db.get(userId);
  if (!user) throw new Error("UNAUTHENTICATED: account not found.");
  if (user.suspendedAt) {
    throw new Error("SUSPENDED: this account is paused. Contact support to appeal.");
  }
  return user;
}

export async function requireAdmin(ctx: Ctx): Promise<Doc<"users">> {
  const user = await requireMarketplaceUser(ctx);
  if (user.role !== "admin") {
    // Do not reveal whether the route exists.
    throw new Error("NOT_FOUND: this page is not available.");
  }
  return user;
}

export async function artisanProfileFor(ctx: Ctx, userId: Id<"users">) {
  return await ctx.db
    .query("artisanProfiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
}

export async function requireArtisan(ctx: Ctx) {
  const user = await requireMarketplaceUser(ctx);
  const profile = await artisanProfileFor(ctx, user._id);
  if (!profile) throw new Error("FORBIDDEN: complete your CraftFit profile first.");
  return { user, profile };
}

export async function customerProfileFor(ctx: Ctx, userId: Id<"users">) {
  return await ctx.db
    .query("customerProfiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
}

export async function requireCustomer(ctx: Ctx) {
  const user = await requireMarketplaceUser(ctx);
  const profile = await customerProfileFor(ctx, user._id);
  if (!profile) throw new Error("FORBIDDEN: finish your customer profile first.");
  return { user, profile };
}

export async function ensureCustomerProfile(ctx: MutationCtx, userId: Id<"users">) {
  const existing = await customerProfileFor(ctx, userId);
  if (existing) return existing;
  const id = await ctx.db.insert("customerProfiles", {
    userId,
    createdAt: Date.now(),
  });
  return (await ctx.db.get(id))!;
}

export function isProjectParticipant(project: Doc<"projects">, userId: Id<"users">) {
  return project.customerId === userId || project.artisanId === userId;
}

/** Loads a project for a participant (or admin) and returns the project plus the viewer's side. */
export async function requireProjectAccess(
  ctx: Ctx,
  projectId: Id<"projects">,
  user: Doc<"users">,
) {
  const project = await ctx.db.get(projectId);
  if (!project) throw new Error("NOT_FOUND: this project no longer exists.");
  const isCustomer = project.customerId === user._id;
  const isArtisan = project.artisanId === user._id;
  if (!isCustomer && !isArtisan && user.role !== "admin") {
    throw new Error("NOT_FOUND: this project no longer exists.");
  }
  return {
    project,
    isCustomer,
    isArtisan,
    isAdmin: user.role === "admin",
  };
}

/** Only the customer's first name is exposed before a project is agreed. */
export function publicFirstName(user: Doc<"users"> | null): string {
  const raw = (user?.name ?? user?.displayName ?? "Customer").trim();
  return raw.split(/\s+/)[0] || "Customer";
}

export function maskName(user: Doc<"users"> | null): string {
  const first = publicFirstName(user);
  return `${first.charAt(0).toUpperCase()}${first.length > 1 ? "•••" : ""}`;
}
