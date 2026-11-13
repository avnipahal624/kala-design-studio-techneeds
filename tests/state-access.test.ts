import { describe, expect, test } from "bun:test";
import type { Doc, Id } from "../src/convex/_generated/dataModel";
import type { QueryCtx } from "../src/convex/_generated/server";
import { requireOwned } from "../src/convex/lib/guards";
import { requireProjectAccess } from "../src/convex/lib/access";
import { assertProjectTransition, paymentAllowsProduction } from "../src/convex/lib/state";

describe("project state machine", () => {
  test("rejects skipping from funded straight to delivered", () => {
    expect(() => assertProjectTransition("funded", "delivered")).toThrow("INVALID_STATE");
  });

  test("allows the funded → production → review → completed path", () => {
    expect(() => assertProjectTransition("funded", "in_production")).not.toThrow();
    expect(() => assertProjectTransition("in_production", "review_pending")).not.toThrow();
    expect(() => assertProjectTransition("review_pending", "completed")).not.toThrow();
  });

  test("only confirmed or settled payments unlock production", () => {
    expect(paymentAllowsProduction("awaiting_payment")).toBe(false);
    expect(paymentAllowsProduction("pending")).toBe(false);
    expect(paymentAllowsProduction("confirmed")).toBe(true);
    expect(paymentAllowsProduction("settled")).toBe(true);
  });
});

describe("project authorization", () => {
  const project = {
    _id: "project-1",
    customerId: "customer-1",
    artisanId: "artisan-1",
  } as unknown as Doc<"projects">;
  const ctx = {
    db: { get: async (id: string) => (id === "project-1" ? project : null) },
  } as unknown as QueryCtx;

  test("allows the customer and artisan, but hides the project from outsiders", async () => {
    const customer = { _id: "customer-1", role: "customer" } as unknown as Doc<"users">;
    const artisan = { _id: "artisan-1", role: "artisan" } as unknown as Doc<"users">;
    const outsider = { _id: "other-1", role: "customer" } as unknown as Doc<"users">;

    await expect(requireProjectAccess(ctx, "project-1" as Id<"projects">, customer)).resolves.toMatchObject({
      isCustomer: true,
      isArtisan: false,
    });
    await expect(requireProjectAccess(ctx, "project-1" as Id<"projects">, artisan)).resolves.toMatchObject({
      isCustomer: false,
      isArtisan: true,
    });
    await expect(requireProjectAccess(ctx, "project-1" as Id<"projects">, outsider)).rejects.toThrow("NOT_FOUND");
  });

  test("allows an administrator to review a project", async () => {
    const admin = { _id: "admin-1", role: "admin" } as unknown as Doc<"users">;
    await expect(requireProjectAccess(ctx, "project-1" as Id<"projects">, admin)).resolves.toMatchObject({
      isAdmin: true,
    });
  });
});

describe("owned resource authorization", () => {
  test("returns the same not-found error for another user's design", async () => {
    const ctx = {
      db: { get: async (id: string) => (id === "design-1" ? { _id: id, userId: "owner-1" } : null) },
    } as unknown as QueryCtx;
    await expect(
      requireOwned(ctx, "designs", "design-1" as Id<"designs">, "other-1" as Id<"users">),
    ).rejects.toThrow("NOT_FOUND");
  });
});
