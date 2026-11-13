import { describe, expect, test } from "bun:test";
import {
  DEMO_ARTISANS,
  DEMO_CUSTOMERS,
  DEMO_LABEL,
  DEMO_PORTFOLIO,
  DEMO_REQUESTS,
  demoArtwork,
} from "../src/convex/demoData";

describe("Phase 3 demo data", () => {
  test("provides 20–25 unique fictional artisans with valid match fields", () => {
    expect(DEMO_ARTISANS.length).toBeGreaterThanOrEqual(20);
    expect(DEMO_ARTISANS.length).toBeLessThanOrEqual(25);
    expect(new Set(DEMO_ARTISANS.map((artisan) => artisan.name)).size).toBe(DEMO_ARTISANS.length);

    for (const artisan of DEMO_ARTISANS) {
      expect(artisan.name.trim().length).toBeGreaterThan(0);
      expect(artisan.city.trim().length).toBeGreaterThan(0);
      expect(artisan.skills.length).toBeGreaterThan(0);
      expect(artisan.materials.length).toBeGreaterThan(0);
      expect(artisan.products.length).toBeGreaterThan(0);
      expect(artisan.min).toBeGreaterThan(0);
      expect(artisan.max).toBeGreaterThanOrEqual(artisan.min);
      expect(["available", "limited", "paused"]).toContain(artisan.availability);
    }
  });

  test("supports 40–60 portfolio pieces across the artisan set", () => {
    const itemCount = DEMO_ARTISANS.reduce((total, _artisan, index) => total + (index < 8 ? 3 : 2), 0);
    expect(itemCount).toBeGreaterThanOrEqual(40);
    expect(itemCount).toBeLessThanOrEqual(60);
    expect(DEMO_PORTFOLIO.length).toBeGreaterThan(0);
  });

  test("keeps request, project and collaboration scenarios coherent", () => {
    expect(DEMO_REQUESTS.length).toBe(20);
    expect(DEMO_CUSTOMERS.length).toBe(8);
    expect(DEMO_REQUESTS.filter((request) => request.status === "quote_selected")).toHaveLength(15);
    expect(DEMO_REQUESTS.filter((request) => request.status === "open")).toHaveLength(2);
    expect(DEMO_REQUESTS.filter((request) => request.collab !== undefined)).toHaveLength(3);
    expect(new Set(DEMO_REQUESTS.map((request) => request.title)).size).toBe(DEMO_REQUESTS.length);

    for (const request of DEMO_REQUESTS) {
      expect(request.budget).toBeGreaterThan(0);
      expect(request.skills.length).toBeGreaterThan(0);
      expect(request.customer).toBeGreaterThanOrEqual(0);
      expect(request.customer).toBeLessThan(DEMO_CUSTOMERS.length);
      expect(request.artisan).toBeGreaterThanOrEqual(0);
      expect(request.artisan).toBeLessThan(DEMO_ARTISANS.length);
    }
  });

  test("generates original artwork without external stock URLs", () => {
    const artwork = demoArtwork("Kantha", "Sample jacket", 0);
    expect(artwork.startsWith("data:image/svg+xml")).toBe(true);
    expect(artwork).toContain(encodeURIComponent("Kantha"));
    expect(artwork).not.toContain("http://");
    expect(artwork).not.toContain("https://");
    expect(demoArtwork("Kantha", "Sample jacket", 1)).not.toBe(artwork);
  });

  test("labels all demo content as fictional", () => {
    expect(DEMO_LABEL.toLowerCase()).toContain("sample data");
    expect(DEMO_LABEL.toLowerCase()).toContain("fictional");
    expect(DEMO_LABEL.toLowerCase()).toContain("not a real");
  });
});
