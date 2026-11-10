import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export async function requireUserId(ctx: QueryCtx | MutationCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("UNAUTHENTICATED: sign in to continue.");
  }
  return userId;
}

export async function requireUser(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
  const userId = await requireUserId(ctx);
  const user = await ctx.db.get(userId);
  if (!user) throw new Error("UNAUTHENTICATED: account not found.");
  return user;
}

/** Loads a document and verifies it belongs to the signed-in user. */
export async function requireOwned<T extends "designs" | "inspirations">(
  ctx: QueryCtx | MutationCtx,
  table: T,
  id: Id<T>,
  userId: Id<"users">,
): Promise<Doc<T>> {
  const doc = await ctx.db.get(id);
  if (!doc) throw new Error("NOT_FOUND: this item no longer exists.");
  if ((doc as { userId?: Id<"users"> }).userId !== userId) {
    // Same message for "doesn't exist" vs "not yours" to avoid leaking ids.
    throw new Error("NOT_FOUND: this item no longer exists.");
  }
  return doc as Doc<T>;
}
