/**
 * Explainable, deterministic artisan ↔ request matching.
 *
 * Weights are initial product assumptions, configurable in one place, and the
 * output always carries human-readable reasons. No protected characteristics
 * are used, and new artisans receive a small, bounded fair-discovery boost.
 */
export const JOB_FEED_MIN_SCORE = 35;

export const MATCH_WEIGHTS = {
  skills: 0.3,
  productMaterial: 0.2,
  availability: 0.15,
  budget: 0.15,
  location: 0.1,
  portfolio: 0.1,
} as const;

export type MatchRequest = {
  category: string;
  budgetInr: number;
  requiredSkills: string[];
  materialsKnown?: string;
  city: string;
  fulfilment: "shipping" | "local_handoff";
  deadline?: string;
  craftPreference?: string;
};

export type MatchArtisan = {
  skills: string[];
  customSkills?: string[];
  products: string[];
  materials: string[];
  availability: "available" | "limited" | "paused";
  minProjectValue: number;
  maxProjectValue?: number;
  turnaroundDays: number;
  city: string;
  shipsNationwide: boolean;
  completedProjects: number;
  craftHeadline: string;
  craftTags?: string[];
};

export type MatchResult = {
  score: number;
  eligible: boolean;
  blockedReason?: string;
  reasons: string[];
  breakdown: { key: string; label: string; score: number; weight: number }[];
  newcomerBoost: number;
};

const DAY = 86_400_000;

const CATEGORY_HINTS: Record<string, string[]> = {
  Footwear: ["footwear"],
  Clothing: ["jackets", "jeans", "kurtas", "sarees", "clothing"],
  Bags: ["tote bags", "handbags", "bags"],
  Accessories: ["wallets", "accessories"],
  "Home Decor": ["home decor"],
  Furniture: ["furniture"],
  Gifts: ["gifts"],
  "Other Custom Products": ["other"],
};

function normalise(value: string) {
  return value.trim().toLowerCase();
}

function productFit(request: MatchRequest, artisan: MatchArtisan) {
  const hints = [normalise(request.category), ...(CATEGORY_HINTS[request.category] ?? [])];
  return artisan.products.some((product) => {
    const p = normalise(product);
    return hints.some((hint) => p === hint || p.includes(hint) || hint.includes(p));
  });
}

function materialFit(request: MatchRequest, artisan: MatchArtisan) {
  const known = normalise(request.materialsKnown ?? "");
  if (!known) return 0.75;
  const hits = artisan.materials.filter((material) => {
    const m = normalise(material);
    return m.length > 2 && (known.includes(m) || m.includes(known));
  });
  return hits.length > 0 ? 1 : 0.4;
}

function skillFit(request: MatchRequest, artisan: MatchArtisan) {
  const owned = [...artisan.skills, ...(artisan.customSkills ?? [])].map(normalise);
  const required = request.requiredSkills.map(normalise).filter(Boolean);
  if (required.length === 0) return { score: 0.5, matched: [] as string[] };
  const matched = required.filter((need) =>
    owned.some((have) => have === need || have.includes(need) || need.includes(have)),
  );
  return { score: matched.length / required.length, matched };
}

function budgetFit(request: MatchRequest, artisan: MatchArtisan) {
  if (request.budgetInr < artisan.minProjectValue) {
    return { score: 0, blocked: true };
  }
  if (artisan.maxProjectValue && request.budgetInr > artisan.maxProjectValue * 1.2) {
    return { score: 0.5, blocked: false };
  }
  return { score: 1, blocked: false };
}

function locationFit(request: MatchRequest, artisan: MatchArtisan) {
  const sameCity = normalise(request.city) === normalise(artisan.city);
  if (request.fulfilment === "local_handoff") {
    return sameCity ? { score: 1, blocked: false } : { score: 0.15, blocked: true };
  }
  if (sameCity) return { score: 1, blocked: false };
  if (artisan.shipsNationwide) return { score: 0.8, blocked: false };
  return { score: 0.25, blocked: true };
}

function deadlineFit(request: MatchRequest, artisan: MatchArtisan) {
  if (!request.deadline) return 0.8;
  const due = new Date(request.deadline).getTime();
  if (!Number.isFinite(due)) return 0.6;
  const availableDays = Math.floor((due - Date.now()) / DAY);
  if (availableDays <= 0) return 0.1;
  return Math.max(0.1, Math.min(1, availableDays / Math.max(1, artisan.turnaroundDays)));
}

function portfolioFit(request: MatchRequest, artisan: MatchArtisan) {
  const tags = (artisan.craftTags ?? []).map(normalise);
  if (tags.length === 0) return 0.4;
  const needs = [
    ...request.requiredSkills.map(normalise),
    normalise(request.craftPreference ?? ""),
  ].filter(Boolean);
  const hits = tags.filter((tag) => needs.some((need) => tag === need || need.includes(tag)));
  return Math.min(1, 0.4 + (hits.length / Math.max(1, needs.length)) * 0.6);
}

export function scoreArtisan(request: MatchRequest, artisan: MatchArtisan): MatchResult {
  const skills = skillFit(request, artisan);
  const product = productFit(request, artisan) ? 1 : 0;
  const material = materialFit(request, artisan);
  const availability = artisan.availability === "available" ? 1 : artisan.availability === "limited" ? 0.55 : 0;
  const budget = budgetFit(request, artisan);
  const location = locationFit(request, artisan);
  const portfolio = portfolioFit(request, artisan);
  const deadline = deadlineFit(request, artisan);

  const productMaterial = product * 0.65 + material * 0.35;
  const delivery = location.score * 0.8 + deadline * 0.2;

  const weighted =
    skills.score * MATCH_WEIGHTS.skills * 100 +
    productMaterial * MATCH_WEIGHTS.productMaterial * 100 +
    availability * MATCH_WEIGHTS.availability * 100 +
    budget.score * MATCH_WEIGHTS.budget * 100 +
    delivery * MATCH_WEIGHTS.location * 100 +
    portfolio * MATCH_WEIGHTS.portfolio * 100;

  const newcomerBoost = artisan.completedProjects < 3 ? 3 : 0;
  const score = Math.round(Math.min(100, weighted + newcomerBoost));

  let blockedReason: string | undefined;
  if (artisan.availability === "paused") blockedReason = "Not accepting work right now.";
  else if (location.blocked)
    blockedReason =
      request.fulfilment === "local_handoff"
        ? "This request needs a local handoff in another city."
        : "Delivery area does not cover this request.";
  else if (budget.blocked) blockedReason = "Budget is below this artisan's minimum project value.";

  const reasons: string[] = [];
  if (skills.matched.length > 0) {
    reasons.push(
      `Specialises in ${skills.matched.slice(0, 3).join(", ").toLowerCase()} — the skills this brief needs.`,
    );
  }
  if (product) reasons.push(`Customises ${request.category.toLowerCase()} and works with the right base products.`);
  if (budget.score === 1) reasons.push("Accepts projects in this budget range.");
  if (delivery >= 0.75) reasons.push("Timing and delivery area fit the requested plan.");
  if (portfolio >= 0.75) reasons.push("Portfolio work is close to the style you described.");
  if (newcomerBoost) reasons.push("Newer to KALकारी — shown with a fair-discovery boost.");
  if (reasons.length === 0) reasons.push("CraftFit profile is a partial match for this request.");

  return {
    score,
    eligible: !blockedReason,
    blockedReason,
    reasons,
    breakdown: [
      { key: "skills", label: "Skills", score: Math.round(skills.score * 100), weight: MATCH_WEIGHTS.skills },
      {
        key: "product",
        label: "Product & material",
        score: Math.round(productMaterial * 100),
        weight: MATCH_WEIGHTS.productMaterial,
      },
      {
        key: "availability",
        label: "Availability",
        score: Math.round(availability * 100),
        weight: MATCH_WEIGHTS.availability,
      },
      { key: "budget", label: "Budget", score: Math.round(budget.score * 100), weight: MATCH_WEIGHTS.budget },
      { key: "location", label: "Location & delivery", score: Math.round(delivery * 100), weight: MATCH_WEIGHTS.location },
      { key: "portfolio", label: "Portfolio", score: Math.round(portfolio * 100), weight: MATCH_WEIGHTS.portfolio },
    ],
    newcomerBoost,
  };
}
