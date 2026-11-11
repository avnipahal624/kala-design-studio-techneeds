import { deriveCraftDna } from "@/convex/lib/craftDna";
import { scoreArtisan, type MatchArtisan } from "@/convex/lib/matching";
import { feeBreakdown } from "@/convex/lib/payments";

/**
 * The judge demo is a preloaded scenario, not customer activity. It reuses the
 * exact deterministic brief-structuring and matching helpers that power the
 * real marketplace, so the explanation on screen is computed rather than typed
 * into a slide. No account, upload, AI call or payment is required.
 */
const DAY = 86_400_000;

function isoInDays(days: number) {
  return new Date(Date.now() + days * DAY).toISOString().slice(0, 10);
}

const description =
  "I have a plain white canvas sneaker that I would like hand-painted with a colourful mandala across the outer sides and toe box. I want visible brushwork rather than a printed finish, with indigo, saffron, teal and a little gold. Please keep the laces, eyelets and sole clean.";

const craftDna = deriveCraftDna({
  category: "Footwear",
  description,
  craftPreference: "Mandala Painting",
  materialsKnown: "Canvas",
  placement: "Outer sides and toe box",
  colours: "Indigo, saffron, teal and gold",
  deadline: isoInDays(28),
  budgetInr: 4000,
  customerSuppliesProduct: true,
});

export const demoRequest = {
  title: "Hand-painted mandala on white sneakers",
  category: "Footwear",
  productDescription:
    "A pair of plain white canvas sneakers, UK size 8, worn twice. The upper is clean; the sole and laces should stay white.",
  description,
  craftPreference: "Mandala Painting",
  materialsKnown: "Canvas",
  placement: "Outer sides and toe box",
  colours: "Indigo, saffron, teal and gold",
  budgetInr: 4000,
  deadline: isoInDays(28),
  city: "Pune",
  fulfilment: "shipping" as const,
  customerSuppliesProduct: true,
  requiredSkills: craftDna.requiredSkills,
  suggestedMaterials: craftDna.suggestedMaterials,
  productionNotes: craftDna.productionNotes,
  missingInfo: craftDna.missingInfo,
};

type DemoArtisan = {
  id: string;
  displayName: string;
  headline: string;
  city: string;
  skills: string[];
  products: string[];
  materials: string[];
  sampleLabel: string;
  availability: "available" | "limited" | "paused";
  minProjectValue: number;
  maxProjectValue?: number;
  turnaroundDays: number;
  shipsNationwide: boolean;
  completedProjects: number;
  craftTags: string[];
};

const artisanSeeds: DemoArtisan[] = [
  {
    id: "meera",
    displayName: "Meera",
    headline: "Hand-painted mandala on footwear and denim",
    city: "Udaipur",
    skills: ["Hand Painting", "Mandala Painting", "Surface Preparation", "Protective Finishing"],
    products: ["Footwear", "Jackets", "Tote Bags"],
    materials: ["Canvas", "Denim", "Leather"],
    sampleLabel: "Illustrative artisan — demo only",
    availability: "available",
    minProjectValue: 1500,
    maxProjectValue: 25000,
    turnaroundDays: 12,
    shipsNationwide: true,
    completedProjects: 0,
    craftTags: ["Mandala painting", "Footwear"],
  },
  {
    id: "ayesha",
    displayName: "Ayesha",
    headline: "Chikankari and fine hand embroidery",
    city: "Lucknow",
    skills: ["Embroidery", "Chikankari", "Tailoring", "Surface Preparation"],
    products: ["Kurtas", "Sarees", "Gifts"],
    materials: ["Cotton", "Silk", "Fabric Blends"],
    sampleLabel: "Illustrative artisan — demo only",
    availability: "available",
    minProjectValue: 2500,
    maxProjectValue: 30000,
    turnaroundDays: 18,
    shipsNationwide: true,
    completedProjects: 0,
    craftTags: ["Chikankari", "Embroidery"],
  },
];

function toMatchArtisan(artisan: DemoArtisan): MatchArtisan {
  return {
    skills: artisan.skills,
    customSkills: [],
    products: artisan.products,
    materials: artisan.materials,
    availability: artisan.availability,
    minProjectValue: artisan.minProjectValue,
    maxProjectValue: artisan.maxProjectValue,
    turnaroundDays: artisan.turnaroundDays,
    city: artisan.city,
    shipsNationwide: artisan.shipsNationwide,
    completedProjects: artisan.completedProjects,
    craftHeadline: artisan.headline,
    craftTags: artisan.craftTags,
  };
}

export const demoMatches = artisanSeeds
  .map((artisan) => {
    const match = scoreArtisan(
      {
        category: demoRequest.category,
        budgetInr: demoRequest.budgetInr,
        requiredSkills: demoRequest.requiredSkills,
        materialsKnown: demoRequest.materialsKnown,
        city: demoRequest.city,
        fulfilment: demoRequest.fulfilment,
        deadline: demoRequest.deadline,
        craftPreference: demoRequest.craftPreference,
      },
      toMatchArtisan(artisan),
    );
    return { ...artisan, match };
  })
  .sort((a, b) => Number(b.match.eligible) - Number(a.match.eligible) || b.match.score - a.match.score);

const quoteLines = {
  materialsInr: 900,
  labourInr: 2200,
  preparationInr: 250,
  finishingInr: 300,
  packagingInr: 100,
  deliveryInr: 100,
};

const fee = feeBreakdown(
  Object.values(quoteLines).reduce((sum, value) => sum + value, 0),
);

export const demoQuote = {
  ...quoteLines,
  ...fee,
  timelineDays: 14,
  revisionRounds: 1,
  depositPercent: 50,
  terms:
    "50% project deposit; balance after final approval. One revision round included. I will seal the painted area with a flexible matte finish and share progress photos before handover.",
  status: "Accepted",
};

export const demoProofEvents = [
  {
    key: "accepted",
    title: "Quote accepted",
    note: "Customer accepted Meera's ₹3,850 quote with a 14-day timeline and one revision round.",
    actor: "Customer",
    day: "Day 1",
    image: null as string | null,
  },
  {
    key: "payment",
    title: "Sandbox payment confirmed — no money moved",
    note: "A clearly labelled sandbox transaction unlocked production. In the live app the project only reaches this state after a verified Razorpay event or an explicit sandbox acknowledgement.",
    actor: "Customer · sandbox",
    day: "Day 2",
    image: null as string | null,
  },
  {
    key: "concept",
    title: "Artisan concept v1 approved",
    note: "Meera uploaded her own placement sketch. The customer approved the mandala layout before any paint touched the shoes.",
    actor: "Artisan → customer",
    day: "Day 3",
    image: "/demo-concept.svg",
  },
  {
    key: "production",
    title: "Production started",
    note: "Concept approved and the project is funded. Surface preparation and masking begin.",
    actor: "Artisan",
    day: "Day 4",
    image: null as string | null,
  },
  {
    key: "progress",
    title: "Progress update",
    note: "Base mandala laid in; eyelets and sole taped off. Fresh progress photo added to the record.",
    actor: "Artisan",
    day: "Day 8",
    image: "/demo-sneaker.svg",
  },
  {
    key: "dispatch",
    title: "Product shipped",
    note: "Flexible matte seal cured for 48 hours. Packed with care and handed to the courier.",
    actor: "Artisan",
    day: "Day 12",
    image: null as string | null,
  },
  {
    key: "delivered",
    title: "Delivery confirmed",
    note: "Customer confirmed the sneakers arrived and matched the approved concept.",
    actor: "Customer",
    day: "Day 14",
    image: null as string | null,
  },
  {
    key: "completed",
    title: "Project completed",
    note: "Payout moves to review and administrator release. Both sides can now leave a verified review.",
    actor: "KALकारी",
    day: "Day 14",
    image: null as string | null,
  },
];

export const demoTrustStages = [
  "Brief",
  "Quote accepted",
  "Funded",
  "Concept approved",
  "In production",
  "Delivered",
  "Completed",
];

export const demoSkills = craftDna.requiredSkills;
export const demoMaterials = craftDna.suggestedMaterials;
export const demoNotes = craftDna.productionNotes;
