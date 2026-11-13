import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { ATLAS_CRAFTS, canonicalStateName, craftsForState } from "../src/lib/kala-atlas";

type BoundaryCollection = {
  type: string;
  features: { properties?: { name?: string }; geometry?: { type: string } }[];
};

const boundaries = JSON.parse(
  readFileSync(new URL("../public/data/india-states.geojson", import.meta.url), "utf8"),
) as BoundaryCollection;
const stateNames = new Set(boundaries.features.map((feature) => canonicalStateName(feature.properties?.name)));

describe("KalaAtlas boundary and craft data", () => {
  test("contains state and union-territory geometry rather than an approximation image", () => {
    expect(boundaries.type).toBe("FeatureCollection");
    expect(boundaries.features.length).toBe(36);
    expect(boundaries.features.every((feature) => feature.geometry?.type && feature.properties?.name)).toBe(true);
    expect(stateNames.size).toBe(36);
  });

  test("normalises common state name variants for directory filters", () => {
    expect(canonicalStateName("Jammu and Kashmir")).toBe("Jammu & Kashmir");
    expect(canonicalStateName("NCT of Delhi")).toBe("Delhi");
    expect(canonicalStateName("Orissa")).toBe("Odisha");
    expect(canonicalStateName(" Rajasthan ")).toBe("Rajasthan");
  });

  test("every curated craft points at a real boundary feature and an authoritative source", () => {
    for (const craft of ATLAS_CRAFTS) {
      expect(stateNames.has(craft.state)).toBe(true);
      expect(craft.coords[0]).toBeGreaterThan(68);
      expect(craft.coords[0]).toBeLessThan(98);
      expect(craft.coords[1]).toBeGreaterThan(6);
      expect(craft.coords[1]).toBeLessThan(38);
      expect(craft.sources.length).toBeGreaterThan(0);
      expect(craft.sources.every((source) => source.url.startsWith("https://"))).toBe(true);
      expect(craft.note.toLowerCase()).not.toContain("certified authentic");
    }
  });

  test("filters craft tiles by state instead of treating a craft as exclusive to a country", () => {
    expect(craftsForState("Rajasthan").map((craft) => craft.id)).toContain("sanganeri-block");
    expect(craftsForState("Rajasthan").map((craft) => craft.id)).toContain("blue-pottery");
    expect(craftsForState("Punjab").map((craft) => craft.id)).toEqual(["phulkari"]);
    expect(craftsForState("Kerala")).toEqual([]);
    expect(ATLAS_CRAFTS.every((craft) => craft.note.toLowerCase().includes("not") || craft.note.toLowerCase().includes("does not") || craft.note.toLowerCase().includes("rather than"))).toBe(true);
  });
});
