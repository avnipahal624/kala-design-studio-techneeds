import { api } from "@/convex/_generated/api";
import { CRAFT_BY_ID, MOTIF_BY_ID, PRODUCT_BY_ID } from "@/lib/crafts";
import type { CanvasState } from "@/lib/design-types";
import { useAction, useQuery } from "convex/react";
import { AlertTriangle, CircleAlert, Loader2, Ruler, Scissors, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { assessCraftFeasibility, FeasibilityPanel } from "./FeasibilityPanel";

type Narrative =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; narrative: string; craftNotes: string; caution: string; model: string }
  | { status: "unavailable"; reason: string };

export function StudioBrief({
  canvas,
  craftId,
  title,
}: {
  canvas: CanvasState;
  craftId?: string;
  title: string;
}) {
  const craft = craftId ? CRAFT_BY_ID[craftId] : undefined;
  const aiStatus = useQuery(api.aiStatus.status);
  const generateNarrative = useAction(api.ai.generateConceptNarrative);
  const [narrative, setNarrative] = useState<Narrative>({ status: "idle" });

  const motifIds = Array.from(
    new Set(canvas.layers.filter((layer) => layer.kind === "motif").map((layer) => layer.motifId ?? "mandala")),
  );
  const textLayers = canvas.layers.filter((layer) => layer.kind === "text");

  const layerWeight = canvas.layers.length;
  const complexity =
    canvas.layers.length === 0
      ? 0
      : Math.min(96, 18 + layerWeight * 9 + motifIds.length * 7 + (canvas.patternId && canvas.patternId !== "none" ? 8 : 0));
  const complexityLabel = complexity > 68 ? "Intricate" : complexity > 38 ? "Considered" : complexity === 0 ? "Empty" : "Simple";

  const handworkDays = craft
    ? [
        Math.max(1, Math.round(craft.handworkDays[0] * (0.6 + complexity / 100))),
        Math.max(2, Math.round(craft.handworkDays[1] * (0.6 + complexity / 100))),
      ]
    : null;
  const feasibility = useMemo(
    () =>
      assessCraftFeasibility({
        canvas,
        craftId,
        hasReference: true,
      }),
    [canvas, craftId],
  );

  async function requestNarrative() {
    if (!craft) return;
    if (aiStatus && !aiStatus.configured) {
      setNarrative({
        status: "unavailable",
        reason: "No language-model key is configured for this deployment.",
      });
      return;
    }
    setNarrative({ status: "loading" });
    try {
      const result = await generateNarrative({
        craftId: craft.id,
        productType: canvas.productType,
        palette: [canvas.fabricColor, ...canvas.layers.map((layer) => layer.color)].slice(0, 5),
        motifIds,
        complexityScore: complexity,
        dominantWarmth: "neutral",
      });
      if (result.status === "ok") {
        setNarrative({
          status: "ok",
          narrative: result.narrative,
          craftNotes: result.craftNotes,
          caution: result.caution,
          model: result.model,
        });
      } else {
        setNarrative({ status: "unavailable", reason: result.reason });
      }
    } catch {
      setNarrative({
        status: "unavailable",
        reason: "The narrative service could not be reached.",
      });
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-maroon/12 px-4 py-3">
        <div className="flex items-center gap-2">
          <Scissors className="size-4 text-teal" />
          <h2 className="font-display text-sm font-semibold text-maroon">Design intelligence</h2>
        </div>
        <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
          Feasibility, craft direction and production guidance — never a final quote.
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <FeasibilityPanel result={feasibility} compact className="border-maroon/12" />

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-maroon/15 bg-parchment/60 p-2.5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Complexity</p>
            <p className="mt-0.5 font-display text-lg font-semibold text-maroon">{complexityLabel}</p>
            <p className="text-[9px] text-muted-foreground">{complexity}/100 index</p>
          </div>
          <div className="rounded-lg border border-teal/25 bg-mint/40 p-2.5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-teal">Hand-work</p>
            <p className="mt-0.5 font-display text-lg font-semibold text-teal">
              {handworkDays ? `${handworkDays[0]}–${handworkDays[1]}d` : "—"}
            </p>
            <p className="text-[9px] text-teal/70">per panel, indicative</p>
          </div>
        </div>

        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Craft direction
          </p>
          {craft ? (
            <div className="mt-1.5">
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-sm font-semibold text-ink">{craft.name}</span>
                <span className="font-hindi text-[10px] text-teal">{craft.hindi}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">{craft.region}</p>
              <p className="mt-1.5 text-[10px] leading-relaxed text-ink/65">
                {craft.techniques.slice(0, 2).join(" · ")}
              </p>
            </div>
          ) : (
            <p className="mt-1 text-[10px] text-muted-foreground">
              No tradition is attached to this canvas yet.
            </p>
          )}
        </div>

        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Materials to confirm
          </p>
          <ul className="mt-1.5 space-y-1">
            {(craft?.materials ?? ["Fabric ground to be chosen with the artisan"]).slice(0, 4).map((material) => (
              <li key={material} className="flex gap-1.5 text-[10px] leading-relaxed text-ink/70">
                <span className="mt-1 size-1 shrink-0 rounded-full bg-gold" />
                {material}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Composition
          </p>
          <dl className="mt-1.5 space-y-1 text-[10px]">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Piece</dt>
              <dd className="text-right text-ink/75">
                {PRODUCT_BY_ID[canvas.productType]?.label ?? canvas.productType}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Motif families</dt>
              <dd className="text-right text-ink/75">
                {motifIds.length === 0
                  ? "None yet"
                  : motifIds.map((id) => MOTIF_BY_ID[id]?.label ?? id).join(", ")}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Text layers</dt>
              <dd className="text-right text-ink/75">{textLayers.length}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Fabric</dt>
              <dd className="flex items-center gap-1.5 text-right text-ink/75">
                <span className="size-2.5 rounded-full ring-1 ring-ink/15" style={{ background: canvas.fabricColor }} />
                {canvas.fabricColor.toUpperCase()}
              </dd>
            </div>
          </dl>
        </div>

        {craft && (
          <div className="rounded-lg border border-gold/40 bg-[#fdf6e6] p-3">
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8a6a31]">
              Attribution note
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-ink/70">
              This concept references {craft.name} technique notes from {craft.region}. Traditional
              motifs are shared cultural material — recorded here, not claimed as exclusive.
            </p>
          </div>
        )}

        <div className="space-y-1.5">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Before production
          </p>
          {[
            "Confirm finished measurements and size chart",
            "Agree quantity and delivery window with an artisan",
            "Artisan validates materials, feasibility and price",
          ].map((item, index) => (
            <div key={item} className="flex items-start gap-1.5 text-[10px] leading-relaxed text-ink/70">
              <span className="mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-full border border-maroon/25 text-[8px] text-maroon">
                {index + 1}
              </span>
              {item}
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-gold/40 bg-[#fdf6e6] p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-gold" />
              <p className="text-[10px] font-semibold text-maroon">AI design note</p>
            </div>
            <Badge variant="outline" className="border-gold/50 text-[8px] uppercase tracking-wide text-[#8a6a31]">
              {narrative.status === "ok" ? "AI" : "Optional"}
            </Badge>
          </div>

          {narrative.status === "idle" && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-2 h-7 w-full border-maroon/25 text-[10px] text-maroon"
              onClick={requestNarrative}
              disabled={!craft}
            >
              {craft ? "Generate a short brief" : "Attach a craft first"}
            </Button>
          )}
          {narrative.status === "loading" && (
            <p className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Loader2 className="size-3 animate-spin" /> Asking the model…
            </p>
          )}
          {narrative.status === "unavailable" && (
            <div className="mt-2">
              <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-vermilion">
                <CircleAlert className="mt-0.5 size-3 shrink-0" />
                Unavailable: {narrative.reason}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-2 h-7 w-full border-maroon/25 text-[10px] text-maroon"
                onClick={requestNarrative}
              >
                Try again
              </Button>
            </div>
          )}
          {narrative.status === "ok" && (
            <div className="mt-2 space-y-2">
              <p className="text-[11px] leading-relaxed text-ink/75">{narrative.narrative}</p>
              <p className="text-[10px] leading-relaxed text-ink/60">{narrative.craftNotes}</p>
              <p className="flex items-start gap-1 text-[10px] leading-relaxed text-vermilion/90">
                <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                {narrative.caution}
              </p>
              <p className="text-[9px] text-muted-foreground">via {narrative.model}</p>
            </div>
          )}
        </div>

        <p className="flex items-start gap-1.5 text-[9px] leading-relaxed text-muted-foreground">
          <Ruler className="mt-0.5 size-3 shrink-0" />
          {title} · estimates exclude shipping, packaging and revisions.
        </p>
      </div>
    </div>
  );
}
