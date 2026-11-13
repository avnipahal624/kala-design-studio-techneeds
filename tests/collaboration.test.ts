import { describe, expect, test } from "bun:test";
import type { Doc } from "../src/convex/_generated/dataModel";
import { decomposeRequest } from "../src/convex/collaboration";
import {
  acceptedTotalWithinBudget,
  allDependenciesApproved,
  nextPlanStatusAfterResponse,
} from "../src/convex/lib/collaboration";

function request(skills: string[], title = "The Heirloom Jacket") {
  return {
    _id: "request-1",
    _creationTime: 0,
    customerId: "customer-1",
    title,
    category: "Clothing",
    budgetInr: 9000,
    requiredSkills: skills,
    materialsKnown: "Silk",
    city: "Delhi",
    fulfilment: "shipping",
    deadline: "2027-02-01",
    craftPreference: "Kantha",
  } as unknown as Doc<"customerRequests">;
}

describe("KalaCollab decomposition", () => {
  test("orders construction before surface work and finishing", () => {
    const tasks = decomposeRequest(request(["Tailoring", "Embroidery", "Hand Painting", "Decorative Finishing"]));
    expect(tasks.map((task) => task.skill)).toEqual([
      "Tailoring",
      "Embroidery",
      "Hand Painting",
      "Decorative Finishing",
    ]);
    expect(tasks[0].dependsOnPositions).toBeUndefined();
    expect(tasks[1].dependsOnPositions).toEqual([1]);
    expect(tasks[2].dependsOnPositions).toEqual([1]);
  });

  test("makes finishing wait for every construction and surface task", () => {
    const tasks = decomposeRequest(request(["Tailoring", "Embroidery", "Hand Painting", "Protective Finishing"]));
    const finishing = tasks.find((task) => task.skill === "Protective Finishing");
    expect(finishing?.dependsOnPositions).toEqual([1, 2, 3]);
    expect(finishing?.dependsOnPosition).toBe(3);
  });

  test("skips surface preparation and de-duplicates repeated skills", () => {
    const tasks = decomposeRequest(request(["Surface Preparation", "Embroidery", "Embroidery"]));
    expect(tasks).toHaveLength(1);
    expect(tasks[0].skill).toBe("Embroidery");
  });

  test("falls back to a single interpretation task for an empty skill list", () => {
    const tasks = decomposeRequest(request([]));
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe("Craft interpretation");
    expect(tasks[0].weight).toBe(1);
  });
});

describe("KalaCollab transitions and guards", () => {
  test("only becomes ready when every task is accepted", () => {
    expect(nextPlanStatusAfterResponse([{ status: "accepted" }, { status: "accepted" }])).toBe("ready");
    expect(nextPlanStatusAfterResponse([{ status: "accepted" }, { status: "invited" }])).toBe("awaiting_artisans");
    expect(nextPlanStatusAfterResponse([{ status: "accepted" }, { status: "declined" }])).toBe("draft");
  });

  test("rejects an acceptance that pushes the plan over budget", () => {
    expect(acceptedTotalWithinBudget(4_000, 1_000, 5_000)).toBe(true);
    expect(acceptedTotalWithinBudget(4_000, 1_001, 5_000)).toBe(false);
  });

  test("requires every dependency to be approved", () => {
    expect(allDependenciesApproved(["approved", "approved"])).toBe(true);
    expect(allDependenciesApproved(["approved", "submitted"])).toBe(false);
    expect(allDependenciesApproved([])).toBe(false);
  });
});
