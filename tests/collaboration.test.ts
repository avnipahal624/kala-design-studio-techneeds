import { describe, expect, test } from "bun:test";
import { decomposeRequest } from "../src/convex/collaboration";

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
  } as any;
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
