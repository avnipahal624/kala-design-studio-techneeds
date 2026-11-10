import { CRAFT_SKILL_MAP, CATEGORY_PRODUCT_MAP } from "./taxonomy";

export type CraftDnaInput = {
  category: string;
  description: string;
  craftPreference?: string;
  materialsKnown?: string;
  placement?: string;
  colours?: string;
  deadline?: string;
  budgetInr: number;
  customerSuppliesProduct: boolean;
};

export type CraftDna = {
  requiredSkills: string[];
  suggestedMaterials: string[];
  productionNotes: string[];
  missingInfo: string[];
  summary: string;
};

function detectCraftSkill(input: CraftDnaInput): string | null {
  const text = `${input.craftPreference ?? ""} ${input.description}`.toLowerCase();
  const checks: [RegExp, string][] = [
    [/chikankari/, CRAFT_SKILL_MAP.chikankari],
    [/phulkari/, CRAFT_SKILL_MAP.phulkari],
    [/kantha/, CRAFT_SKILL_MAP.kantha],
    [/zardozi|zardosi/, CRAFT_SKILL_MAP.zardozi],
    [/madhubani|mithila/, CRAFT_SKILL_MAP.madhubani],
    [/mandala/, CRAFT_SKILL_MAP.mandala],
    [/embroid|stitch/, CRAFT_SKILL_MAP.embroidery],
    [/block print|ajrakh|kalamkari/, CRAFT_SKILL_MAP.block_printing],
    [/bandhani|tie.?dye|natural dye|dyeing/, CRAFT_SKILL_MAP.dyeing],
    [/leather|saddle/, CRAFT_SKILL_MAP.leather],
    [/wood|furniture/, CRAFT_SKILL_MAP.woodwork],
    [/tailor|stitched to|alter/, CRAFT_SKILL_MAP.tailoring],
    [/fabric paint|textile paint/, CRAFT_SKILL_MAP.fabric_painting],
    [/paint|brush|illustrat/, CRAFT_SKILL_MAP.hand_painting],
  ];
  for (const [pattern, skill] of checks) {
    if (pattern.test(text)) return skill;
  }
  return null;
}

function detectMaterial(input: CraftDnaInput): string | null {
  const text = `${input.materialsKnown ?? ""} ${input.description}`.toLowerCase();
  const checks: [RegExp, string][] = [
    [/denim|jeans/, "Denim"],
    [/leather/, "Leather"],
    [/canvas|sneaker|shoe/, "Canvas"],
    [/silk/, "Silk"],
    [/wool|pashmina|knit/, "Wool"],
    [/wood|teak|mango wood/, "Wood"],
    [/cotton|khadi|mulmul/, "Cotton"],
    [/metal|brass/, "Metal"],
  ];
  for (const [pattern, material] of checks) {
    if (pattern.test(text)) return material;
  }
  return null;
}

/**
 * Rule-based production requirements. The result is a starting brief that the
 * customer can correct — it is never presented as material analysis from a photo.
 */
export function deriveCraftDna(input: CraftDnaInput): CraftDna {
  const craftSkill = detectCraftSkill(input);
  const material = detectMaterial(input);
  const skills = new Set<string>();
  const materials = new Set<string>();
  const notes = new Set<string>();

  skills.add("Surface Preparation");

  switch (input.category) {
    case "Footwear":
      skills.add(craftSkill ?? "Hand Painting");
      skills.add("Protective Finishing");
      materials.add("Surface-appropriate acrylic or leather paint");
      materials.add("Fine detail brushes and masking tape");
      materials.add("Flexible protective sealant");
      notes.add("Paint must flex with the upper — test on an inconspicuous area first.");
      notes.add("Seams, eyelets and soles need masking before painting.");
      break;
    case "Clothing":
      if (craftSkill && /Embroidery|Chikan|Kantha|Phulkari|Zardozi/.test(craftSkill)) {
        skills.add(craftSkill);
        materials.add("Hand-embroidery needle set and matching thread");
      } else {
        skills.add(craftSkill ?? "Fabric Painting");
        materials.add("Fabric paints or dyes matched to the base cloth");
      }
      if (/hem|size|fit|tailor|alter/.test(input.description.toLowerCase())) skills.add("Tailoring");
      notes.add("Wash-care and ironing instructions must be agreed before hand-work begins.");
      break;
    case "Bags":
      skills.add(craftSkill ?? (material === "Leather" ? "Leather Craft" : "Hand Painting"));
      materials.add("Leather or fabric prep agent suited to the base");
      notes.add("Straps, zips and hardware are removed or masked before decoration.");
      break;
    case "Accessories":
      skills.add(craftSkill ?? "Hand Painting");
      skills.add("Decorative Finishing");
      notes.add("Small surfaces need scaled-down motifs so detail stays legible.");
      break;
    case "Home Decor":
      skills.add(craftSkill ?? "Hand Painting");
      skills.add("Decorative Finishing");
      notes.add("Confirm whether the piece will be washed, wiped or kept dry.");
      break;
    case "Furniture":
      skills.add("Woodwork");
      skills.add(craftSkill ?? "Hand Painting");
      skills.add("Decorative Finishing");
      skills.add("Protective Finishing");
      materials.add("Wood filler, sandpaper and primer");
      materials.add("Water-resistant top coat");
      notes.add("Transport and on-site handling must be planned before painting.");
      break;
    case "Gifts":
      skills.add(craftSkill ?? "Hand Painting");
      notes.add("Gift deadlines need buffer time for drying, packing and courier pickup.");
      break;
    default:
      skills.add(craftSkill ?? "Hand Painting");
      notes.add("Unusual substrates should be tested before the full design is applied.");
  }

  if (material) {
    materials.add(`${material}-compatible preparation materials`);
    notes.add(`Base material appears to be ${material.toLowerCase()} — confirm before quoting.`);
  } else {
    materials.add("Preparation materials to be confirmed after inspection");
  }

  const missing: string[] = [];
  if (!input.materialsKnown?.trim()) missing.push("The exact material of the product");
  if (!input.colours?.trim()) missing.push("Preferred colour direction");
  if (!input.placement?.trim()) missing.push("Where the design should sit");
  if (!input.deadline?.trim()) missing.push("A target date or delivery window");
  if (input.budgetInr <= 0) missing.push("A realistic budget range");
  if (!input.description || input.description.trim().length < 40) {
    missing.push("A little more detail about the look you want");
  }

  const productFit = CATEGORY_PRODUCT_MAP[input.category]?.join(", ") ?? input.category;
  const summary = [
    `${input.category} customisation with ${craftSkill ?? "hand-work"}.`,
    `Budget ₹${input.budgetInr.toLocaleString("en-IN")}.`,
    `${input.customerSuppliesProduct === false ? "Artisan supplies the base product" : "Customer supplies the product"}.`,
    `Production focus: ${[...skills].slice(0, 3).join(", ")}.`,
  ].join(" ");

  return {
    requiredSkills: [...skills],
    suggestedMaterials: [...materials],
    productionNotes: [...notes, `Artisan capability needed: ${productFit}.`],
    missingInfo: missing,
    summary,
  };
}
