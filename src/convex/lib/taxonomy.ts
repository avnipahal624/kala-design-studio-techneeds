/**
 * Single source of truth for marketplace taxonomy (server-side).
 * The frontend mirrors the option lists in `src/lib/marketplace.ts`.
 */

export const CRAFT_SKILLS = [
  "Hand Painting",
  "Mandala Painting",
  "Madhubani Painting",
  "Embroidery",
  "Chikankari",
  "Kantha",
  "Phulkari",
  "Block Printing",
  "Fabric Painting",
  "Tailoring",
  "Textile Dyeing",
  "Leather Craft",
  "Woodwork",
  "Decorative Finishing",
  "Surface Preparation",
  "Protective Finishing",
  "Beadwork",
  "Zardozi",
] as const;

export const PRODUCT_CAPABILITIES = [
  "Footwear",
  "Jackets",
  "Jeans",
  "Kurtas",
  "Sarees",
  "Tote Bags",
  "Handbags",
  "Wallets",
  "Home Decor",
  "Furniture",
  "Accessories",
  "Gifts",
  "Other",
] as const;

export const MATERIALS = [
  "Canvas",
  "Cotton",
  "Denim",
  "Leather",
  "Wood",
  "Silk",
  "Wool",
  "Fabric Blends",
  "Metal",
  "Other",
] as const;

export const REQUEST_CATEGORIES = [
  "Footwear",
  "Clothing",
  "Bags",
  "Accessories",
  "Home Decor",
  "Furniture",
  "Gifts",
  "Other Custom Products",
] as const;

/** Category → product capability names an artisan must offer to be a fit. */
export const CATEGORY_PRODUCT_MAP: Record<string, string[]> = {
  Footwear: ["Footwear"],
  Clothing: ["Jackets", "Jeans", "Kurtas", "Sarees"],
  Bags: ["Tote Bags", "Handbags"],
  Accessories: ["Wallets", "Accessories"],
  "Home Decor": ["Home Decor"],
  Furniture: ["Furniture"],
  Gifts: ["Gifts"],
  "Other Custom Products": ["Other"],
};

export const CRAFT_SKILL_MAP: Record<string, string> = {
  hand_painting: "Hand Painting",
  mandala: "Mandala Painting",
  madhubani: "Madhubani Painting",
  embroidery: "Embroidery",
  chikankari: "Chikankari",
  kantha: "Kantha",
  phulkari: "Phulkari",
  block_printing: "Block Printing",
  fabric_painting: "Fabric Painting",
  tailoring: "Tailoring",
  dyeing: "Textile Dyeing",
  leather: "Leather Craft",
  woodwork: "Woodwork",
  zardozi: "Zardozi",
};

/** Reference traditions shown in the craft library and used for matching copy. */
export const CRAFT_TRADITIONS = [
  { id: "madhubani", name: "Madhubani", region: "Mithila, Bihar", skill: "Madhubani Painting" },
  { id: "phulkari", name: "Phulkari", region: "Punjab", skill: "Phulkari" },
  { id: "kalamkari", name: "Kalamkari", region: "Andhra Pradesh", skill: "Block Printing" },
  { id: "chikankari", name: "Chikankari", region: "Lucknow", skill: "Chikankari" },
  { id: "ajrakh", name: "Ajrakh", region: "Kutch, Gujarat", skill: "Block Printing" },
  { id: "bandhani", name: "Bandhani", region: "Gujarat & Rajasthan", skill: "Textile Dyeing" },
  { id: "warli", name: "Warli", region: "Maharashtra", skill: "Hand Painting" },
  { id: "gond", name: "Gond Painting", region: "Central India", skill: "Hand Painting" },
  { id: "kantha", name: "Kantha", region: "West Bengal", skill: "Kantha" },
  { id: "pattachitra", name: "Pattachitra", region: "Odisha", skill: "Hand Painting" },
  { id: "zardozi", name: "Zardozi", region: "Lucknow & Delhi", skill: "Zardozi" },
  { id: "kashmiri", name: "Kashmiri Embroidery", region: "Kashmir Valley", skill: "Embroidery" },
] as const;

export const LANGUAGES = [
  "Hindi",
  "English",
  "Hinglish",
  "Bengali",
  "Gujarati",
  "Marathi",
  "Punjabi",
  "Tamil",
  "Telugu",
  "Odia",
  "Urdu",
  "Kannada",
] as const;

export const VERIFICATION_LABELS: Record<string, string> = {
  not_submitted: "Not submitted",
  pending: "Pending review",
  verified: "Verified",
  info_required: "More information required",
  rejected: "Rejected",
  suspended: "Suspended",
};

export const PLATFORM_FEE_PERCENT = 8;

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
