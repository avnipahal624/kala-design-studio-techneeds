import { AppShell } from "@/components/app/AppShell";
import { GarmentArt } from "@/components/art/garments";
import { Mandala } from "@/components/art/Ornaments";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import {
  buildCanvas,
  buildConcept,
  complexityFromSignals,
  suggestCrafts,
} from "@/lib/craft-engine";
import { CRAFT_BY_ID, PRODUCT_BY_ID, PRODUCT_TYPES, type ProductTypeId } from "@/lib/crafts";
import type { Concept, InspirationAnalysis } from "@/lib/design-types";
import { analyseImage, validateImageFile, type ImageSignals } from "@/lib/image-analysis";
import { useAction, useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Camera,
  Check,
  CircleAlert,
  ImagePlus,
  Loader2,
  ScanLine,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

type NarrativeState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; narrative: string; craftNotes: string; caution: string; model: string }
  | { status: "unavailable"; reason: string };

function analysisTimestamp() {
  return Date.now();
}

function Badge({
  children,
  tone = "teal",
}: {
  children: React.ReactNode;
  tone?: "teal" | "maroon" | "gold" | "ink";
}) {
  const tones = {
    teal: "border-teal/30 bg-teal/8 text-teal",
    maroon: "border-maroon/25 bg-maroon/6 text-maroon",
    gold: "border-gold/40 bg-gold/10 text-[#8a6a31]",
    ink: "border-ink/15 bg-ink/5 text-ink/70",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function SignalBar({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-medium text-ink/80">{label}</span>
        <span className="font-display text-sm font-semibold text-maroon">{value}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-maroon/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal to-maroon"
          style={{ width: `${Math.min(100, Math.max(3, value))}%` }}
        />
      </div>
      <p className="mt-1 text-[10px] leading-snug text-muted-foreground">{hint}</p>
    </div>
  );
}

export default function KalaVision() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedId = searchParams.get("inspiration");

  const inspirations = useQuery(api.inspirations.list);
  const aiStatus = useQuery(api.aiStatus.status);
  const generateUploadUrl = useMutation(api.inspirations.generateUploadUrl);
  const createInspiration = useMutation(api.inspirations.create);
  const setConceptMutation = useMutation(api.inspirations.setConcept);
  const createDesign = useMutation(api.designs.create);
  const generateNarrative = useAction(api.ai.generateConceptNarrative);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [productType, setProductType] = useState<ProductTypeId>("jacket");
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [savedImageUrl, setSavedImageUrl] = useState<string | null>(null);
  const [signals, setSignals] = useState<ImageSignals | null>(null);
  const [analysis, setAnalysis] = useState<InspirationAnalysis | null>(null);
  const [concept, setConcept] = useState<Concept | null>(null);
  const [craftId, setCraftId] = useState<string | null>(null);
  const [inspirationId, setInspirationId] = useState<Id<"inspirations"> | null>(null);
  const [existingDesignId, setExistingDesignId] = useState<Id<"designs"> | null>(null);
  const [narrative, setNarrative] = useState<NarrativeState>({ status: "idle" });
  const [isOpening, setIsOpening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Reopen a saved inspiration from the dashboard.
  useEffect(() => {
    if (!selectedId || !inspirations) return;
    const row = inspirations.find((item) => item._id === selectedId);
    if (!row) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const saved = row.analysis as InspirationAnalysis;
      setAnalysis(saved);
      setSignals({
        palette: saved.palette,
        brightness: saved.brightness,
        saturation: saved.saturation,
        contrast: saved.contrast,
        edgeDensity: saved.edgeDensity,
        symmetry: saved.symmetry,
        aspectRatio: saved.aspectRatio,
        dominantWarmth: saved.dominantWarmth,
      });
      setConcept((row.concept as Concept) ?? null);
      setCraftId(row.craftId ?? (row.concept as Concept | null)?.craftId ?? null);
      setSavedImageUrl(row.imageUrl);
      setInspirationId(row._id as Id<"inspirations">);
      setExistingDesignId((row.designId as Id<"designs"> | undefined) ?? null);
      setProductType(row.productType as ProductTypeId);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedId, inspirations]);

  const craftOptions = useMemo(() => {
    if (!analysis) return [];
    return suggestCrafts(
      analysis.palette.map((color) => color.hex),
      productType,
      3,
    );
  }, [analysis, productType]);

  function resetResults() {
    setSignals(null);
    setAnalysis(null);
    setConcept(null);
    setCraftId(null);
    setInspirationId(null);
    setExistingDesignId(null);
    setSavedImageUrl(null);
    setNarrative({ status: "idle" });
  }

  function acceptFile(next: File | null) {
    if (!next) return;
    const error = validateImageFile(next);
    if (error) {
      toast.error("That image can't be used", { description: error });
      return;
    }
    resetResults();
    setFile(next);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(next));
  }

  function buildSignalsAnalysis(
    measured: ImageSignals,
    type: ProductTypeId,
    generatedAt: number,
    chosenCraftId?: string,
  ) {
    const ranked = suggestCrafts(
      measured.palette.map((color) => color.hex),
      type,
      3,
    );
    const chosen = chosenCraftId ?? ranked[0]?.craft.id ?? "madhubani";
    const craft = CRAFT_BY_ID[chosen];
    const complexity = complexityFromSignals(
      measured.edgeDensity,
      measured.palette.length,
      measured.symmetry,
    );

    const analysisPayload: InspirationAnalysis = {
      method: "image-signals+craft-rules",
      palette: measured.palette,
      brightness: measured.brightness,
      saturation: measured.saturation,
      contrast: measured.contrast,
      edgeDensity: measured.edgeDensity,
      symmetry: measured.symmetry,
      aspectRatio: measured.aspectRatio,
      complexityScore: complexity,
      dominantWarmth: measured.dominantWarmth,
      suggestedCraftId: chosen,
      suggestedCraftConfidence: ranked.find((r) => r.craft.id === chosen)?.confidence ?? 55,
      alternativeCraftIds: ranked.filter((r) => r.craft.id !== chosen).map((r) => r.craft.id),
      suggestedMotifIds: craft?.motifs.slice(0, 3) ?? [],
      suggestedPlacement: "Centre-front motif with paired accents",
      suggestedProductType: type,
      notes: [
        `Palette measured from ${measured.palette.length} dominant colour clusters.`,
        `${measured.edgeDensity}% edge density suggests a ${
          complexity > 68 ? "densely worked" : complexity > 38 ? "balanced" : "open"
        } composition.`,
        `${measured.dominantWarmth} colour temperature across the sampled pixels.`,
      ],
      limitations: [
        "Craft and motif suggestions are rule-based, not visual identification of the actual object.",
        "Material composition cannot be determined from an image alone.",
        "Headwear, jewellery or background details are not interpreted.",
      ],
      generatedAt,
    };

    return {
      analysisPayload,
      concept: buildConcept({
        palette: measured.palette.map((color) => color.hex),
        craftId: chosen,
        productType: type,
        complexityScore: complexity,
        seed: `${file?.name ?? "inspiration"}-${type}`,
      }),
    };
  }

  async function handleAnalyse() {
    if (!file) {
      toast.error("Add an inspiration image first");
      return;
    }
    setIsAnalysing(true);
    setNarrative({ status: "idle" });
    try {
      const measured = await analyseImage(file);
      const { analysisPayload, concept: nextConcept } = buildSignalsAnalysis(
        measured,
        productType,
        analysisTimestamp(),
      );
      setSignals(measured);
      setAnalysis(analysisPayload);
      setConcept(nextConcept);
      setCraftId(nextConcept.craftId);

      // Persist the upload and the analysis together.
      let storedId: Id<"inspirations"> | null = null;
      try {
        const uploadUrl = await generateUploadUrl();
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!response.ok) throw new Error("Upload failed");
        const { storageId } = (await response.json()) as { storageId: Id<"_storage"> };
        storedId = await createInspiration({
          storageId,
          fileName: file.name,
          productType,
          palette: analysisPayload.palette.map((color) => color.hex),
          analysis: { ...analysisPayload, mimeType: file.type, byteSize: file.size },
          concept: nextConcept,
          craftId: nextConcept.craftId,
          title: nextConcept.title,
        });
        setInspirationId(storedId);
        setSavedImageUrl(URL.createObjectURL(file));
        toast.success("Inspiration analysed and saved");
      } catch {
        toast.warning("Analysis is ready but could not be saved", {
          description: "You can still open the concept in the studio.",
        });
      }

      void requestNarrative(nextConcept, measured.dominantWarmth);
    } catch (error) {
      toast.error("Couldn't analyse that image", {
        description: error instanceof Error ? error.message : "Try another file.",
      });
    } finally {
      setIsAnalysing(false);
    }
  }

  async function requestNarrative(nextConcept: Concept, warmth: string) {
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
        craftId: nextConcept.craftId,
        productType: nextConcept.productType,
        palette: nextConcept.palette,
        motifIds: nextConcept.motifIds,
        complexityScore: nextConcept.complexityScore,
        dominantWarmth: warmth,
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
        reason: "The AI narrative service could not be reached right now.",
      });
    }
  }

  async function chooseCraft(nextCraftId: string) {
    if (!signals) return;
    setCraftId(nextCraftId);
    const { analysisPayload, concept: nextConcept } = buildSignalsAnalysis(
      signals,
      productType,
      analysisTimestamp(),
      nextCraftId,
    );
    setAnalysis(analysisPayload);
    setConcept(nextConcept);
    if (inspirationId) {
      try {
        await setConceptMutation({
          inspirationId,
          craftId: nextCraftId,
          concept: nextConcept,
        });
      } catch {
        toast.error("Couldn't update the saved concept");
      }
    }
    void requestNarrative(nextConcept, signals.dominantWarmth);
  }

  async function openInStudio() {
    if (!concept) return;
    setIsOpening(true);
    try {
      if (existingDesignId) {
        navigate(`/studio/${existingDesignId}`);
        return;
      }
      const canvas = buildCanvas(concept);
      const designId = await createDesign({
        title: concept.title,
        productType: concept.productType,
        craftId: concept.craftId,
        palette: concept.palette,
        canvas,
        inspirationId: inspirationId ?? undefined,
        note: "Created from KalaVision concept",
      });
      setExistingDesignId(designId);
      navigate(`/studio/${designId}`);
    } catch (error) {
      toast.error("Couldn't open the studio", {
        description: error instanceof Error ? error.message : "Try again in a moment.",
      });
    } finally {
      setIsOpening(false);
    }
  }

  const craft = craftId ? CRAFT_BY_ID[craftId] : null;
  const product = PRODUCT_BY_ID[productType];
  const showResults = Boolean(analysis && concept);

  return (
    <AppShell
      title="KalaVision"
      hindi="कलाविज़न"
      subtitle="Measure an inspiration image, then shape a real design concept"
      actions={
        <div className="hidden items-center gap-2 sm:flex">
          <Badge tone={aiStatus?.configured ? "teal" : "ink"}>
            <span className={`size-1.5 rounded-full ${aiStatus?.configured ? "bg-teal" : "bg-ink/40"}`} />
            {aiStatus?.configured ? "AI brief available" : "Rule-based only"}
          </Badge>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        {/* ----------------------------------------------------------- input */}
        <section className="space-y-5">
          <div className="rounded-2xl border border-maroon/18 bg-card p-5">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-maroon text-xs font-semibold text-ivory">1</span>
              <h2 className="font-display text-lg font-semibold text-maroon">Your inspiration</h2>
            </div>

            <div
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                acceptFile(event.dataTransfer.files?.[0] ?? null);
              }}
              className={`mt-4 overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
                isDragging ? "border-teal bg-teal/5" : "border-maroon/20 bg-parchment/60"
              }`}
            >
              {previewUrl ? (
                <div className="relative">
                  <img src={previewUrl} alt="Your uploaded inspiration" className="max-h-[300px] w-full object-cover" />
                  <button
                    type="button"
                    aria-label="Remove image"
                    onClick={() => {
                      setFile(null);
                      if (previewUrl) URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                      resetResults();
                    }}
                    className="absolute right-2 top-2 rounded-full bg-ink/70 p-1.5 text-ivory transition-colors hover:bg-ink"
                  >
                    <X className="size-3.5" />
                  </button>
                  <span className="absolute bottom-2 left-2 rounded-full bg-parchment/90 px-2 py-1 text-[10px] font-medium text-ink/70">
                    {file?.name}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center gap-2 px-4 py-10 text-center"
                >
                  <span className="flex size-12 items-center justify-center rounded-full bg-maroon/8 text-maroon">
                    <ImagePlus className="size-5" />
                  </span>
                  <span className="text-sm font-medium text-ink">Drop an image, or browse</span>
                  <span className="text-[11px] text-muted-foreground">PNG, JPG, WebP or AVIF · up to 8 MB</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
                className="hidden"
                onChange={(event) => acceptFile(event.target.files?.[0] ?? null)}
              />
            </div>

            <div className="mt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                What are we making?
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {PRODUCT_TYPES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setProductType(item.id);
                      if (signals) {
                        const { analysisPayload, concept: nextConcept } = buildSignalsAnalysis(
                          signals,
                          item.id,
                          analysisTimestamp(),
                          craftId ?? undefined,
                        );
                        setAnalysis(analysisPayload);
                        setConcept(nextConcept);
                      }
                    }}
                    className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                      productType === item.id
                        ? "border-maroon bg-maroon text-ivory"
                        : "border-maroon/20 bg-parchment text-ink/70 hover:border-maroon/45"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleAnalyse}
              disabled={!file || isAnalysing}
              className="mt-5 w-full gap-2 bg-maroon py-5 text-ivory hover:bg-maroon-deep"
            >
              {isAnalysing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Measuring your image…
                </>
              ) : (
                <>
                  <ScanLine className="size-4" />
                  Analyse & build concept
                </>
              )}
            </Button>
            <p className="mt-2 text-center text-[10px] leading-relaxed text-muted-foreground">
              Palette and composition are measured in your browser. Files are stored privately to
              your account.
            </p>
          </div>

          <div className="rounded-2xl border border-maroon/15 bg-maroon/[0.04] p-5">
            <div className="flex items-center gap-2 text-maroon">
              <Sparkles className="size-4" />
              <h3 className="text-sm font-semibold">What KalaVision can and can't do</h3>
            </div>
            <ul className="mt-3 space-y-2 text-[11px] leading-relaxed text-ink/70">
              <li className="flex gap-2">
                <Check className="mt-0.5 size-3.5 shrink-0 text-teal" />
                Reads real colour, contrast, edge density and mirror symmetry from your file.
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 size-3.5 shrink-0 text-teal" />
                Proposes a craft direction with the reasoning written out.
              </li>
              <li className="flex gap-2">
                <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-vermilion" />
                Does not visually identify the object, fabric or exact technique — no vision model
                is configured.
              </li>
            </ul>
          </div>

          {inspirations && inspirations.length > 0 && (
            <div className="rounded-2xl border border-maroon/15 bg-card p-5">
              <h3 className="text-sm font-semibold text-maroon">Saved inspirations</h3>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {inspirations.slice(0, 6).map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => navigate(`/kalavision?inspiration=${item._id}`)}
                    className={`group relative overflow-hidden rounded-lg border text-left ${
                      inspirationId === item._id ? "border-maroon" : "border-maroon/15 hover:border-maroon/40"
                    }`}
                  >
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="aspect-square w-full object-cover" />
                    ) : (
                      <span className="flex aspect-square items-center justify-center bg-parchment text-muted-foreground">
                        <Camera className="size-4" />
                      </span>
                    )}
                    <span className="absolute inset-x-0 bottom-0 bg-ink/60 px-1.5 py-1 text-[9px] font-medium text-ivory">
                      {PRODUCT_BY_ID[item.productType]?.label ?? item.productType}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* --------------------------------------------------------- results */}
        <section className="min-w-0 space-y-5">
          <AnimatePresence mode="wait">
            {!showResults ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative flex min-h-[520px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-maroon/15 bg-card px-6 py-16 text-center"
              >
                <Mandala className="pointer-events-none absolute -right-24 -top-24 size-[380px] opacity-[0.14]" />
                <div className="relative">
                  <span className="mx-auto flex size-16 items-center justify-center rounded-full border border-maroon/20 bg-parchment">
                    <Camera className="size-7 text-maroon" />
                  </span>
                  <h2 className="mt-5 font-display text-2xl font-semibold text-maroon">
                    Your concept starts with a photograph
                  </h2>
                  <p className="mx-auto mt-2 max-w-[44ch] text-sm leading-relaxed text-ink/60">
                    Add an image on the left. You'll get the palette measured from that exact
                    file, a craft direction with reasons, and a design you can keep editing.
                  </p>
                  <div className="mx-auto mt-7 grid max-w-md gap-2 text-left">
                    {[
                      ["Measured", "palette, contrast, edge density, symmetry"],
                      ["Rule-based", "craft direction, motif families, production outline"],
                      ["AI-assisted", "a short narrative — only when a model is configured"],
                    ].map(([label, body]) => (
                      <div key={label} className="flex items-start gap-3 rounded-lg border border-maroon/12 bg-parchment/70 px-3 py-2.5">
                        <Badge tone={label === "AI-assisted" ? "gold" : label === "Measured" ? "teal" : "maroon"}>
                          {label}
                        </Badge>
                        <span className="text-[11px] leading-relaxed text-ink/65">{body}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                {/* measured analysis */}
                <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
                  <div className="rounded-2xl border border-maroon/18 bg-card p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Badge tone="teal">Measured from your image</Badge>
                        <h2 className="mt-2 font-display text-xl font-semibold text-maroon">
                          Colour & composition
                        </h2>
                      </div>
                      {savedImageUrl && (
                        <img
                          src={savedImageUrl}
                          alt="Inspiration reference"
                          className="size-16 rounded-lg border border-maroon/15 object-cover"
                        />
                      )}
                    </div>

                    <div className="mt-4 flex overflow-hidden rounded-lg ring-1 ring-ink/10">
                      {analysis!.palette.map((color) => (
                        <div key={color.hex} className="group relative h-12 flex-1" style={{ background: color.hex }}>
                          <span className="absolute inset-x-0 bottom-0 hidden bg-ink/65 px-1 py-0.5 text-center text-[8px] text-ivory group-hover:block">
                            {color.hex}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                      {analysis!.palette.map((color) => (
                        <span key={color.hex} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <span className="size-2 rounded-full ring-1 ring-ink/10" style={{ background: color.hex }} />
                          {color.name} · {Math.round(color.share * 100)}%
                        </span>
                      ))}
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <SignalBar
                        label="Brightness"
                        value={analysis!.brightness}
                        hint="Mean luminance of the sampled pixels."
                      />
                      <SignalBar
                        label="Saturation"
                        value={analysis!.saturation}
                        hint="How strongly the colours read."
                      />
                      <SignalBar
                        label="Contrast"
                        value={analysis!.contrast}
                        hint="Spread of light to dark."
                      />
                      <SignalBar
                        label="Edge density"
                        value={analysis!.edgeDensity}
                        hint="How densely worked the surface appears."
                      />
                      <SignalBar
                        label="Mirror symmetry"
                        value={analysis!.symmetry}
                        hint="Left/right balance across the frame."
                      />
                      <SignalBar
                        label="Complexity index"
                        value={analysis!.complexityScore}
                        hint="Derived from the measurements above."
                      />
                    </div>

                    <div className="mt-4 rounded-lg border border-ink/10 bg-parchment/70 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-maroon/70">
                        Limitations
                      </p>
                      <ul className="mt-1.5 space-y-1 text-[10px] leading-relaxed text-muted-foreground">
                        {analysis!.limitations.map((note) => (
                          <li key={note}>· {note}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* craft direction */}
                  <div className="rounded-2xl border border-maroon/18 bg-card p-5">
                    <Badge tone="maroon">Rule-based suggestion</Badge>
                    <h2 className="mt-2 font-display text-xl font-semibold text-maroon">
                      Craft direction
                    </h2>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      Ranked by palette affinity and product fit — not by identifying the object.
                    </p>

                    <div className="mt-4 space-y-2">
                      {craftOptions.map((option) => {
                        const active = craftId === option.craft.id;
                        return (
                          <button
                            key={option.craft.id}
                            type="button"
                            onClick={() => chooseCraft(option.craft.id)}
                            className={`w-full rounded-xl border p-3 text-left transition-colors ${
                              active
                                ? "border-maroon bg-maroon/[0.05]"
                                : "border-maroon/15 hover:border-maroon/40"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="flex items-baseline gap-2">
                                <span className="font-display text-sm font-semibold text-ink">
                                  {option.craft.name}
                                </span>
                                <span className="font-hindi text-[11px] text-teal">{option.craft.hindi}</span>
                              </span>
                              <span className="flex items-center gap-1.5">
                                <span className="text-[10px] text-muted-foreground">{option.confidence}% fit</span>
                                <span
                                  className={`flex size-4 items-center justify-center rounded-full border ${
                                    active ? "border-maroon bg-maroon text-ivory" : "border-maroon/25"
                                  }`}
                                >
                                  {active && <Check className="size-2.5" />}
                                </span>
                              </span>
                            </div>
                            <p className="mt-1 text-[10px] text-muted-foreground">{option.craft.region}</p>
                            <p className="mt-1.5 text-[11px] leading-relaxed text-ink/65">
                              {option.reasons[0] ?? "Palette affinity within the measured range."}
                            </p>
                          </button>
                        );
                      })}
                    </div>

                    {craft && (
                      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-maroon/12 pt-3">
                        <div>
                          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                            Motif families
                          </p>
                          <p className="mt-1 text-[11px] leading-relaxed text-ink/75">
                            {concept?.motifIds.map((id) => id).join(" · ")}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                            Hand-work window
                          </p>
                          <p className="mt-1 text-[11px] text-ink/75">
                            {craft.handworkDays[0]}–{craft.handworkDays[1]} days / panel
                          </p>
                        </div>
                      </div>
                    )}
                    <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
                      Choosing a different tradition rebuilds the concept. It is saved to your
                      inspiration automatically.
                    </p>
                  </div>
                </div>

                {/* concept */}
                <div className="overflow-hidden rounded-2xl border border-maroon/20 bg-card">
                  <div className="grid gap-0 lg:grid-cols-[1fr_1.05fr]">
                    <div className="relative bg-[radial-gradient(circle_at_50%_35%,#fff8ec,#f0dcc0)]">
                      <GarmentArt canvas={buildCanvas(concept!)} className="h-auto w-full" />
                      <span className="absolute left-3 top-3 rounded-full border border-teal/30 bg-teal/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-teal">
                        Concept preview · {product?.label}
                      </span>
                    </div>

                    <div className="flex flex-col p-5 md:p-6">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="maroon">Concept</Badge>
                        <Badge tone="ink">{concept!.complexity}</Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {concept!.complexityScore}/100 complexity index
                        </span>
                      </div>
                      <h2 className="mt-3 font-display text-2xl font-semibold leading-tight text-maroon md:text-3xl">
                        {concept!.title}
                      </h2>
                      <p className="mt-2 text-sm leading-relaxed text-ink/70">{concept!.summary}</p>

                      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div>
                          <dt className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                            Placement
                          </dt>
                          <dd className="mt-0.5 text-[11px] leading-relaxed text-ink/75">
                            {concept!.placement}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                            Materials
                          </dt>
                          <dd className="mt-0.5 text-[11px] leading-relaxed text-ink/75">
                            {concept!.materials.join(", ")}
                          </dd>
                        </div>
                      </dl>

                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {concept!.palette.map((hex) => (
                          <span
                            key={hex}
                            className="size-6 rounded-full ring-1 ring-ink/10"
                            style={{ background: hex }}
                            title={hex}
                          />
                        ))}
                      </div>

                      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                        <Button
                          onClick={openInStudio}
                          disabled={isOpening}
                          className="flex-1 gap-2 bg-maroon py-5 text-ivory hover:bg-maroon-deep"
                        >
                          {isOpening ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
                          Open in Design Studio
                          <ArrowRight className="size-4" />
                        </Button>
                        <Button
                          variant="outline"
                          className="gap-2 border-maroon/25 py-5 text-maroon"
                          onClick={() => {
                            if (concept) void requestNarrative(concept, signals?.dominantWarmth ?? "neutral");
                          }}
                          disabled={narrative.status === "loading"}
                        >
                          <Sparkles className="size-4" />
                          AI brief
                        </Button>
                      </div>
                      {existingDesignId && (
                        <p className="mt-2 text-[10px] text-teal">
                          A studio version of this concept already exists — opening it now.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* production outline */}
                  <div className="border-t border-maroon/12 bg-parchment/50 px-5 py-4 md:px-6">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-maroon/70">
                      Rule-based production outline · not a quote
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {concept!.stages.map((stage, index) => (
                        <div key={stage.name} className="relative rounded-lg border border-maroon/12 bg-card p-3">
                          <span className="text-[9px] font-semibold text-maroon/50">0{index + 1}</span>
                          <p className="mt-0.5 text-[11px] font-semibold text-ink">{stage.name}</p>
                          <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{stage.detail}</p>
                          <p className="mt-1.5 text-[10px] font-medium text-teal">
                            ≈ {stage.days} {stage.days === 1 ? "day" : "days"}
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
                      Missing information: {concept!.missingInfo.join(" · ")}. An artisan must confirm
                      materials, feasibility and price before anything is produced.
                    </p>
                  </div>
                </div>

                {/* AI narrative */}
                <div className="rounded-2xl border border-gold/40 bg-[#fdf6e6] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-gold" />
                      <h3 className="font-display text-base font-semibold text-maroon">
                        AI-assisted design narrative
                      </h3>
                      <Badge tone="gold">
                        {narrative.status === "ok" ? "AI-generated" : "Optional"}
                      </Badge>
                    </div>
                    {narrative.status === "ok" && (
                      <span className="text-[10px] text-muted-foreground">via {narrative.model}</span>
                    )}
                  </div>

                  {narrative.status === "idle" && (
                    <p className="mt-2 text-xs leading-relaxed text-ink/65">
                      Optional: ask a language model for a short concept description. The craft,
                      palette and production outline above stay rule-based either way.
                    </p>
                  )}
                  {narrative.status === "loading" && (
                    <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="size-3.5 animate-spin" />
                      Asking the model for a short narrative…
                    </p>
                  )}
                  {narrative.status === "unavailable" && (
                    <div className="mt-3 rounded-lg border border-vermilion/30 bg-vermilion/[0.06] p-3">
                      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-vermilion">
                        <CircleAlert className="size-3.5" />
                        AI narrative unavailable
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-ink/65">
                        {narrative.reason} Everything above was produced without a model, so nothing
                        here is fabricated AI output.
                      </p>
                    </div>
                  )}
                  {narrative.status === "ok" && (
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <p className="text-sm leading-relaxed text-ink/80">{narrative.narrative}</p>
                      <div className="space-y-2">
                        <p className="rounded-lg border border-gold/30 bg-card/70 p-2.5 text-[11px] leading-relaxed text-ink/70">
                          <span className="font-semibold text-maroon">Craft notes: </span>
                          {narrative.craftNotes}
                        </p>
                        <p className="rounded-lg border border-vermilion/20 bg-card/70 p-2.5 text-[11px] leading-relaxed text-ink/70">
                          <span className="font-semibold text-vermilion">Caution: </span>
                          {narrative.caution}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      {!user && (
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Sign in to keep your inspirations and designs.
        </p>
      )}
    </AppShell>
  );
}
