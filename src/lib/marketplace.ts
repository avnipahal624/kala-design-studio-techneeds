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

export const CRAFT_TRADITIONS = [
  { id: "madhubani", name: "Madhubani", region: "Mithila, Bihar", note: "Double-outline linework, fish and lotus motifs, flat colour fills." },
  { id: "phulkari", name: "Phulkari", region: "Punjab", note: "Darning-stitch florals on khaddar, often worked from the reverse." },
  { id: "kalamkari", name: "Kalamkari", region: "Andhra Pradesh", note: "Pen-drawn and block-printed narratives in natural dyes." },
  { id: "chikankari", name: "Chikankari", region: "Lucknow", note: "Fine white-on-white shadow work, jali and murri stitches." },
  { id: "ajrakh", name: "Ajrakh", region: "Kutch, Gujarat", note: "Resist-dyed geometric grids in indigo and madder." },
  { id: "bandhani", name: "Bandhani", region: "Gujarat & Rajasthan", note: "Tie-resist dotted fields, tied by hand before dyeing." },
  { id: "warli", name: "Warli", region: "Maharashtra", note: "Rice-paste line figures and spirals on mud walls." },
  { id: "gond", name: "Gond Painting", region: "Central India", note: "Dot-and-line infill inside bold contours." },
  { id: "kantha", name: "Kantha", region: "West Bengal", note: "Running-stitch quilting that gives old cloth a second life." },
  { id: "pattachitra", name: "Pattachitra", region: "Odisha", note: "Bold outlines and flat pigment on cloth or tussar." },
  { id: "zardozi", name: "Zardozi", region: "Lucknow & Delhi", note: "Metal-thread couching and beadwork on silk or velvet." },
  { id: "kashmiri", name: "Kashmiri Embroidery", region: "Kashmir Valley", note: "Sozni outlining and dense satin stitching on pashmina." },
] as const;

export const REUSE_PERMISSIONS = [
  { value: "display_only", label: "Display on KALकारी only" },
  { value: "portfolio_and_promotion", label: "Portfolio and KALकारी promotion" },
  { value: "reuse_with_credit", label: "Reuse with credit (discuss first)" },
] as const;

export const PLATFORM_FEE_PERCENT = 8;

export function formatInr(amount: number | null | undefined) {
  if (amount === null || amount === undefined) return "—";
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

export function formatDate(value: number | string | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(value: number | string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function relativeTime(value: number) {
  const diff = Date.now() - value;
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}

const REQUEST_LABELS: Record<string, string> = {
  draft: "Draft",
  open: "Open for quotes",
  quote_selected: "Quote selected",
  closed: "Closed",
  cancelled: "Cancelled",
};

const QUOTE_LABELS: Record<string, string> = {
  submitted: "Quote submitted",
  accepted: "Accepted",
  declined: "Not selected",
  withdrawn: "Withdrawn",
  expired: "Expired",
};

const PROJECT_LABELS: Record<string, string> = {
  awaiting_payment: "Awaiting payment",
  funded: "Funded · concept stage",
  in_production: "In production",
  review_pending: "Final review",
  delivered: "Approved · delivery",
  completed: "Completed",
  disputed: "Disputed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const PAYMENT_LABELS: Record<string, string> = {
  awaiting_payment: "Awaiting payment",
  pending: "Payment pending",
  confirmed: "Payment confirmed",
  settled: "Settled",
  refunded: "Refunded",
  failed: "Payment failed",
};

const VERIFICATION_LABELS: Record<string, string> = {
  not_submitted: "Not verified",
  pending: "Verification pending",
  verified: "Verified artisan",
  info_required: "More information required",
  rejected: "Verification rejected",
  suspended: "Suspended",
};

const DISPUTE_LABELS: Record<string, string> = {
  open: "Dispute open",
  awaiting_response: "Awaiting response",
  under_review: "Under review",
  resolved: "Decision recorded",
  appealed: "Under appeal",
  closed: "Closed",
};

export function statusLabel(
  kind: "request" | "quote" | "project" | "payment" | "verification" | "dispute",
  status: string,
) {
  const map =
    kind === "request"
      ? REQUEST_LABELS
      : kind === "quote"
        ? QUOTE_LABELS
        : kind === "project"
          ? PROJECT_LABELS
          : kind === "payment"
            ? PAYMENT_LABELS
            : kind === "verification"
              ? VERIFICATION_LABELS
              : DISPUTE_LABELS;
  return map[status] ?? status.split("_").join(" ");
}

export function statusTone(status: string) {
  if (["open", "in_production", "funded", "confirmed", "submitted", "sent"].includes(status)) {
    return "border-teal/30 bg-teal/10 text-teal-deep";
  }
  if (["quote_selected", "accepted", "completed", "verified", "settled", "resolved"].includes(status)) {
    return "border-emerald/30 bg-emerald/10 text-emerald";
  }
  if (["awaiting_payment", "pending", "review_pending", "under_review", "info_required", "limited"].includes(status)) {
    return "border-saffron/50 bg-saffron/15 text-[#8a5a12]";
  }
  if (["disputed", "appealed", "rejected", "suspended", "failed", "cancelled"].includes(status)) {
    return "border-vermilion/35 bg-vermilion/10 text-vermilion";
  }
  if (["closed", "withdrawn", "declined", "refunded", "delivered"].includes(status)) {
    return "border-ink/15 bg-ink/5 text-ink/60";
  }
  return "border-gold/40 bg-gold/10 text-ink/70";
}

export function feeBreakdown(totalInr: number) {
  const total = Math.max(0, Math.round(totalInr));
  const platformFeeInr = Math.round((total * PLATFORM_FEE_PERCENT) / 100);
  return {
    totalInr: total,
    feePercent: PLATFORM_FEE_PERCENT,
    platformFeeInr,
    netPayoutInr: Math.max(0, total - platformFeeInr),
  };
}

export function initials(name: string) {
  return name
    .replace(/[^\p{L}\s]/gu, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function roleHome(role: string | undefined, hasArtisanProfile: boolean) {
  if (role === "admin") return "/admin/dashboard";
  if (role === "artisan" && hasArtisanProfile) return "/artisan/dashboard";
  return "/customer/dashboard";
}
