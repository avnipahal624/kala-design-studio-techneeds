import { describe, expect, test } from "bun:test";
import { assessCraftFeasibility } from "../src/components/studio/FeasibilityPanel";
import type { CanvasState } from "../src/lib/design-types";
import { deriveCraftDna } from "../src/convex/lib/craftDna";
import { scoreArtisan } from "../src/convex/lib/matching";

const canvas: CanvasState = {
  productType: "jacket",
  silhouette: "Open-front jacket",
  fabricColor: "#e9dfd0",
  patternId: "none",
  layers: [
    {
      id: "motif-1",
      kind: "motif",
      motifId: "mandala",
      x: 450,
      y: 400,
      size: 220,
      rotation: 0,
      color: "#7a302a",
      opacity: 1,
    },
    {
      id: "text-1",
      kind: "text",
      text: "KALAKARI",
      x: 450,
      y: 650,
      size: 90,
      rotation: 0,
      color: "#28231f",
      opacity: 1,
    },
  ],
};

describe("Craft DNA", () => {
  test("derives production skills for a painted sneaker brief", () => {
    const dna = deriveCraftDna({
      category: "Footwear",
      description: "Hand-paint a mandala on my white canvas sneakers, with a protective finish.",
      craftPreference: "Mandala Painting",
      materialsKnown: "Canvas",
      placement: "Outer sides",
      colours: "Terracotta and gold",
      deadline: "2027-01-31",
      budgetInr: 4000,
      customerSuppliesProduct: true,
    });
    expect(dna.requiredSkills).toContain("Surface Preparation");
    expect(dna.requiredSkills).toContain("Mandala Painting");
    expect(dna.requiredSkills).toContain("Protective Finishing");
    expect(dna.suggestedMaterials.join(" ")).toContain("Canvas");
  });
});

describe("CraftFit", () => {
  const request = {
    category: "Clothing",
    budgetInr: 9000,
    requiredSkills: ["Tailoring", "Embroidery"],
    materialsKnown: "Silk",
    city: "Delhi",
    fulfilment: "shipping" as const,
    deadline: "2027-02-15",
  };

  test("returns an eligible, explainable match with all six dimensions", () => {
    const match = scoreArtisan(request, {
      skills: ["Tailoring", "Embroidery"],
      customSkills: [],
      products: ["Jackets"],
      materials: ["Silk"],
      availability: "available",
      minProjectValue: 3000,
      turnaroundDays: 14,
      city: "Delhi",
      shipsNationwide: true,
      completedProjects: 5,
      craftHeadline: "Tailoring and embroidery",
      craftTags: ["Tailoring", "Embroidery"],
    });
    expect(match.eligible).toBe(true);
    expect(match.score).toBeGreaterThan(70);
    expect(match.breakdown).toHaveLength(6);
    expect(match.reasons.length).toBeGreaterThan(0);
  });

  test("blocks a budget below the artisan minimum", () => {
    const match = scoreArtisan(
      { ...request, budgetInr: 1000 },
      {
        skills: ["Tailoring", "Embroidery"],
        products: ["Jackets"],
        materials: ["Silk"],
        availability: "available",
        minProjectValue: 5000,
        turnaroundDays: 14,
        city: "Delhi",
        shipsNationwide: true,
        completedProjects: 5,
        craftHeadline: "Tailoring and embroidery",
      },
    );
    expect(match.eligible).toBe(false);
    expect(match.blockedReason).toContain("minimum");
  });
});

describe("Craft feasibility", () => {
  test("flags an impossible deadline as potentially impractical", () => {
    const deadline = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    const result = assessCraftFeasibility({
      canvas,
      craftId: "madhubani",
      budgetInr: 9000,
      deadline,
      materialsKnown: "Silk",
      customerSuppliesProduct: true,
      hasReference: true,
    });
    expect(result.verdict).toBe("potentially_impractical");
    expect(result.checks.some((check) => check.key === "deadline" && check.status === "risk")).toBe(true);
  });

  test("requires artisan review when budget and material are unknown", () => {
    const result = assessCraftFeasibility({
      canvas,
      craftId: "madhubani",
      hasReference: true,
    });
    expect(result.verdict).toBe("needs_artisan_review");
    expect(result.missingInfo).toContain("The base material of the product");
  });
});
