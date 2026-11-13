import type { CanvasState } from "@/lib/design-types";
import { CRAFT_BY_ID, PRODUCT_BY_ID } from "@/lib/crafts";
import { CircleAlert, CircleCheck, CircleHelp, Ruler, ShieldQuestion } from "lucide-react";
import { cn } from "@/lib/utils";

export type FeasibilityStatus = "pass" | "review" | "risk";

export type FeasibilityCheck = {
  key: string;
  label: string;
  status: FeasibilityStatus;
  detail: string;
};

export type FeasibilityResult = {
  verdict: "likely_feasible" | "needs_artisan_review" | "potentially_impractical";
  headline: string;
  summary: string;
  checks: FeasibilityCheck[];
  missingInfo: string[];
  complexityScore: number;
  complexityLabel: string;
  indicativeDays: [number, number] | null;
};

export type FeasibilityInput = {
  canvas?: CanvasState;
  craftId?: string;
  category?: string;
  budgetInr?: number;
  deadline?: string;
  materialsKnown?: string;
  customerSuppliesProduct?: boolean;
  hasReference?: boolean;
};

const CATEGORY_PRODUCTS: Record<string, string[]> = {
  Clothing: ["jacket", "kurta", "stole"],
  Bags: ["tote"],
  Accessories: ["tote", "cushion"],
  "Home Decor": ["cushion"],
  Gifts: ["cushion", "tote"],
};

function complexityOf(canvas: CanvasState) {
  const motifIds = new Set(
    canvas.layers.filter((layer) => layer.kind === "motif").map((layer) => layer.motifId ?? "mandala"),
  );
  const textLayers = canvas.layers.filter((layer) => layer.kind === "text").length;
  const pattern = canvas.patternId && canvas.patternId !== "none" ? 8 : 0;
  const score =
    canvas.layers.length === 0
      ? 0
      : Math.min(96, 18 + canvas.layers.length * 9 + motifIds.size * 7 + textLayers * 3 + pattern);
  return {
    score,
    label: score > 68 ? "Intricate" : score > 38 ? "Considered" : score === 0 ? "Empty" : "Simple",
  };
}

function daysBetween(deadline?: string) {
  if (!deadline) return null;
  const due = new Date(deadline).getTime();
  if (!Number.isFinite(due)) return null;
  return Math.floor((due - Date.now()) / 86_400_000);
}

/**
 * Deterministic production-feasibility guidance.
 *
 * It evaluates only what is in the brief. It never pretends to measure a photo,
 * quote a final price or replace an artisan's professional judgement.
 */
export function assessCraftFeasibility(input: FeasibilityInput): FeasibilityResult {
  const { canvas } = input;
  const craft = input.craftId ? CRAFT_BY_ID[input.craftId] : undefined;
  const product = canvas ? PRODUCT_BY_ID[canvas.productType] : undefined;
  const productLabel = product?.label.toLowerCase() ?? input.category?.toLowerCase() ?? "piece";
  const complexity = canvas ? complexityOf(canvas) : { score: 0, label: "Not scored" };
  const layerCount = canvas?.layers.length ?? 0;
  const checks: FeasibilityCheck[] = [];
  const missing: string[] = [];

  if (!canvas) {
    checks.push({
      key: "composition",
      label: "Design composition",
      status: "review",
      detail: "No Studio composition is attached yet. The artisan will interpret the written brief and your reference; a visual direction can make the conversation sharper.",
    });
    missing.push("A visual composition or clear reference for the artisan");
  } else if (layerCount === 0) {
    checks.push({
      key: "composition",
      label: "Design composition",
      status: "review",
      detail: "No motif or lettering layer has been placed yet. The product and brief are clear, but there is no visual composition to assess.",
    });
    missing.push("At least one placed motif or text layer");
  } else {
    checks.push({
      key: "composition",
      label: "Design composition",
      status: complexity.score > 82 ? "review" : "pass",
      detail:
        complexity.score > 82
          ? `${layerCount} layers produce an intricate composition. Detail density may need simplifying for the chosen technique.`
          : `${layerCount} layer${layerCount === 1 ? "" : "s"} form a ${complexity.label.toLowerCase()} composition that can be discussed with a maker.`,
    });
  }

  if (craft) {
    const compatible = canvas
      ? craft.productFit.includes(canvas.productType as never)
      : (CATEGORY_PRODUCTS[input.category ?? ""] ?? []).some((id) => craft.productFit.includes(id as never));
    checks.push({
      key: "craft",
      label: "Craft & product compatibility",
      status: compatible ? "pass" : "review",
      detail: compatible
        ? `${craft.name} reference notes are compatible with a ${productLabel}. The artisan still confirms the exact technique.`
        : `${craft.name} is usually worked on ${craft.productFit.map((id) => PRODUCT_BY_ID[id]?.label.toLowerCase() ?? id).join(", ")}. Applying it to a ${productLabel} needs artisan review.`,
    });
  } else {
    checks.push({
      key: "craft",
      label: "Craft direction",
      status: "review",
      detail: "No craft tradition is attached yet. A maker can propose a technique, or you can choose one in the Studio.",
    });
    missing.push("A preferred craft or an open request for the artisan to propose one");
  }

  if (input.materialsKnown?.trim()) {
    checks.push({
      key: "material",
      label: "Material compatibility",
      status: "pass",
      detail: `The brief names ${input.materialsKnown.trim()}. Surface preparation and finish must still be tested on the actual piece.`,
    });
  } else {
    checks.push({
      key: "material",
      label: "Material compatibility",
      status: "review",
      detail: "The base material is not confirmed. Paint, dye, thread and finishing choices depend on it.",
    });
    missing.push("The base material of the product");
  }

  if (input.customerSuppliesProduct === false) {
    checks.push({
      key: "base",
      label: "Base product sourcing",
      status: "review",
      detail: "The artisan is expected to source the base product. Size, quality and lead time need a separate agreement.",
    });
  }

  const minimumDays: [number, number] | null = craft
    ? [
        Math.max(1, Math.round(craft.handworkDays[0] * (0.6 + complexity.score / 100))),
        Math.max(2, Math.round(craft.handworkDays[1] * (0.6 + complexity.score / 100))),
      ]
    : null;
  const available = daysBetween(input.deadline);
  if (available !== null && minimumDays) {
    checks.push({
      key: "deadline",
      label: "Deadline",
      status: available < minimumDays[0] ? "risk" : available < minimumDays[0] + 4 ? "review" : "pass",
      detail:
        available < minimumDays[0]
          ? `${available} day${available === 1 ? "" : "s"} remain, while the reference hand-work range starts at ${minimumDays[0]} days before drying, finishing and delivery.`
          : `${available} days remain against an indicative ${minimumDays[0]}–${minimumDays[1]} days of hand-work. Buffer for drying, finishing and delivery is still needed.`,
    });
  } else if (input.deadline) {
    checks.push({
      key: "deadline",
      label: "Deadline",
      status: "review",
      detail: "A target date is set, but no craft is attached, so a hand-work range cannot be estimated.",
    });
  } else {
    checks.push({
      key: "deadline",
      label: "Deadline",
      status: "review",
      detail: "No target date is set. The artisan will propose a realistic production window.",
    });
    missing.push("A target date or a flexible delivery window");
  }

  if (typeof input.budgetInr === "number" && input.budgetInr > 0) {
    const referenceFloor = 1800 + layerCount * 240 + complexity.score * 18;
    checks.push({
      key: "budget",
      label: "Budget suitability",
      status: input.budgetInr < referenceFloor ? "review" : "pass",
      detail:
        input.budgetInr < referenceFloor
          ? `The ₹${input.budgetInr.toLocaleString("en-IN")} ceiling is below the platform's rough hand-work reference for this density. It is not a quote; ask the maker before assuming it is impossible.`
          : `The ₹${input.budgetInr.toLocaleString("en-IN")} ceiling can accommodate this density in principle. Only an artisan quote is binding.`,
    });
  } else {
    checks.push({
      key: "budget",
      label: "Budget suitability",
      status: "review",
      detail: "No budget ceiling is available in the Studio. A maker quote is needed before this can be assessed.",
    });
  }

  if (input.hasReference === false) {
    missing.push("A clear reference or product photograph");
  }

  const risk = checks.filter((check) => check.status === "risk").length;
  const review = checks.filter((check) => check.status === "review").length;
  const verdict =
    risk > 0 ? "potentially_impractical" : review > 0 ? "needs_artisan_review" : "likely_feasible";

  return {
    verdict,
    headline:
      verdict === "likely_feasible"
        ? "Likely feasible"
        : verdict === "needs_artisan_review"
          ? "Needs artisan review"
          : "Potentially impractical",
    summary:
      verdict === "likely_feasible"
        ? "The current details appear compatible with known craft requirements. This is guidance, not an artisan's approval."
        : verdict === "needs_artisan_review"
          ? "The idea has a credible path, but information or professional confirmation is still needed."
          : "One or more constraints may prevent production as currently described. A maker may still propose an alternative.",
    checks,
    missingInfo: Array.from(new Set(missing)),
    complexityScore: complexity.score,
    complexityLabel: complexity.label,
    indicativeDays: minimumDays,
  };
}

const STATUS_STYLES = {
  pass: {
    icon: CircleCheck,
    className: "border-emerald/25 bg-emerald/[0.05] text-emerald",
    dot: "bg-emerald",
  },
  review: {
    icon: CircleHelp,
    className: "border-saffron/40 bg-saffron/[0.08] text-[#7d5a24]",
    dot: "bg-saffron",
  },
  risk: {
    icon: CircleAlert,
    className: "border-vermilion/30 bg-vermilion/[0.06] text-vermilion",
    dot: "bg-vermilion",
  },
} as const;

export function FeasibilityPanel({
  result,
  compact = false,
  className,
}: {
  result: FeasibilityResult;
  compact?: boolean;
  className?: string;
}) {
  const verdictStyle =
    result.verdict === "likely_feasible"
      ? "border-emerald/25 bg-emerald/[0.055]"
      : result.verdict === "needs_artisan_review"
        ? "border-saffron/45 bg-saffron/[0.07]"
        : "border-vermilion/30 bg-vermilion/[0.055]";

  return (
    <section className={cn("border bg-card", verdictStyle, className)}>
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-maroon/12 p-4">
        <div>
          <p className="label-caps text-[9px] text-teal">Craft feasibility · rule-based</p>
          <h3 className="mt-1 font-display text-xl font-semibold text-ink">{result.headline}</h3>
          <p className="mt-1 max-w-[52ch] text-[10px] leading-relaxed text-ink/55">{result.summary}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full border border-maroon/15 bg-card">
            {result.verdict === "likely_feasible" ? (
              <CircleCheck className="size-4 text-emerald" />
            ) : result.verdict === "needs_artisan_review" ? (
              <ShieldQuestion className="size-4 text-[#8a6427]" />
            ) : (
              <CircleAlert className="size-4 text-vermilion" />
            )}
          </span>
          <div className="text-right">
            <p className="font-display text-lg font-semibold leading-none text-maroon">{result.complexityLabel}</p>
            <p className="text-[8px] uppercase tracking-[0.13em] text-muted-foreground">{result.complexityScore}/100 complexity</p>
          </div>
        </div>
      </div>

      <div className={cn("grid gap-2 p-4", compact ? "sm:grid-cols-1" : "sm:grid-cols-2")}>
        {result.checks.map((check) => {
          const style = STATUS_STYLES[check.status];
          return (
            <div key={check.key} className="border border-maroon/10 bg-card/70 p-3">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold text-ink/75">
                <span className={cn("size-1.5 rounded-full", style.dot)} /> {check.label}
              </p>
              <p className="mt-1 text-[10px] leading-[1.65] text-ink/55">{check.detail}</p>
            </div>
          );
        })}
      </div>

      {(result.missingInfo.length > 0 || result.indicativeDays) && (
        <div className="border-t border-maroon/12 px-4 py-3">
          {result.missingInfo.length > 0 && (
            <div className="flex items-start gap-2">
              <CircleHelp className="mt-0.5 size-3.5 shrink-0 text-maroon/45" />
              <p className="text-[10px] leading-relaxed text-ink/55">
                <span className="font-semibold text-ink/70">Worth clarifying:</span>{" "}
                {result.missingInfo.slice(0, 4).join(" · ")}
              </p>
            </div>
          )}
          {result.indicativeDays && (
            <p className="mt-1.5 flex items-center gap-1.5 text-[9px] text-muted-foreground">
              <Ruler className="size-3" /> Reference hand-work {result.indicativeDays[0]}–{result.indicativeDays[1]} days.
              Excludes drying, revisions, packaging and delivery.
            </p>
          )}
          <p className="mt-2 text-[9px] leading-relaxed text-muted-foreground">
            This is deterministic guidance from the brief — not a price, deadline, certification or
            artisan approval. The maker can override it with a documented explanation.
          </p>
        </div>
      )}
    </section>
  );
}
