import { Motif as MotifGlyph } from "@/components/art/Motif";
import { CornerFlourish, Divider, Mandala, Peacock, VineBorder } from "@/components/art/Ornaments";
import { GarmentArt } from "@/components/art/garments";
import { BrandLockup, Wordmark } from "@/components/brand/Logo";
import { useAuth } from "@/hooks/use-auth";
import { CRAFTS, MOTIFS } from "@/lib/crafts";
import { buildCanvas } from "@/lib/craft-engine";
import type { Concept } from "@/lib/design-types";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Camera,
  Download,
  Layers,
  Palette,
  PenTool,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

const heroConcept: Concept = {
  title: "Marigold Madhubani Jacket",
  summary: "Open-front jacket with a fish-pair centre and marigold accents.",
  craftId: "madhubani",
  productType: "jacket",
  palette: ["#7b2040", "#f2a33a", "#087f83", "#fff4de", "#292322"],
  motifIds: ["fish", "marigold", "border"],
  placement: "Centre-front with paired chest motifs",
  rationale: [],
  materials: [],
  stages: [],
  complexity: "Considered",
  complexityScore: 54,
  confidence: 70,
  missingInfo: [],
  caveats: [],
  source: "rules",
};

const heroCanvas = buildCanvas(heroConcept);

const HERO_CHIPS = [
  { label: "Palette extracted", value: "5 colours", color: "#087f83" },
  { label: "Craft suggestion", value: "Madhubani", color: "#7b2040" },
  { label: "Motif families", value: "3", color: "#d94b39" },
];

const steps = [
  {
    icon: Camera,
    title: "Show us the spark",
    hindi: "प्रेरणा",
    body: "Upload a fabric photo, a scroll-stopping outfit, a family heirloom. We measure its palette, contrast and pattern density on your device — no guesswork about what the image contains.",
  },
  {
    icon: Wand2,
    title: "Get a real concept",
    hindi: "कल्पना",
    body: "The craft engine turns those measurements into a craft direction, motif set and placement plan. Every suggestion is labelled as a suggestion, with its own reasoning.",
  },
  {
    icon: PenTool,
    title: "Make it yours",
    hindi: "रचना",
    body: "Open the design studio: move motifs, recolour, add type, flip fabrics, save versions. What you export is the exact artwork you see.",
  },
];

const studioFeatures = [
  { icon: Layers, title: "Layered canvas", body: "Motifs and type as movable, stackable layers." },
  { icon: Palette, title: "Fabric & palette", body: "Six fabric grounds with woven pattern overlays." },
  { icon: Sparkles, title: "Craft-aware guidance", body: "Rule-based notes on hand-work, materials and stages." },
  { icon: Download, title: "Export a preview", body: "Download your artwork as a clean 1200px PNG." },
];

const demoCanvas = (() => {
  const concept: Concept = {
    ...heroConcept,
    craftId: "phulkari",
    palette: ["#d94b39", "#f2a33a", "#e66a99", "#fff4de", "#292322"],
    motifIds: ["marigold", "mirror", "sprig"],
    productType: "tote",
  };
  return buildCanvas(concept);
})();

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 22 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Landing() {
  const { isAuthenticated, user } = useAuth();
  const [activeCraft, setActiveCraft] = useState(0);
  const craft = CRAFTS[activeCraft];

  return (
    <div className="min-h-screen bg-parchment text-ink">
      {/* ---------------------------------------------------------------- nav */}
      <header className="sticky top-0 z-40 border-b border-gold/25 bg-parchment/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-3 md:px-8">
          <BrandLockup size="md" />
          <nav className="hidden items-center gap-7 text-sm text-ink/70 md:flex">
            <a href="#crafts" className="transition-colors hover:text-maroon">Crafts</a>
            <a href="#journey" className="transition-colors hover:text-maroon">How it works</a>
            <a href="#studio" className="transition-colors hover:text-maroon">The Studio</a>
            <a href="#ethos" className="transition-colors hover:text-maroon">Our ethos</a>
          </nav>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-maroon px-4 py-2 text-sm font-medium text-ivory transition-colors hover:bg-maroon-deep"
              >
                {user?.name ? `नमस्ते, ${user.name.split(" ")[0]}` : "Your studio"}
                <ArrowRight className="size-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="hidden rounded-full px-4 py-2 text-sm font-medium text-maroon transition-colors hover:bg-maroon/5 sm:inline-flex"
                >
                  Sign in
                </Link>
                <Link
                  to="/auth?returnTo=%2Fdashboard"
                  className="inline-flex items-center gap-1.5 rounded-full bg-maroon px-4 py-2 text-sm font-medium text-ivory transition-colors hover:bg-maroon-deep"
                >
                  Start creating
                  <ArrowRight className="size-4" />
                </Link>
              </>
            )}
          </div>
        </div>
        <VineBorder className="h-2 w-full opacity-60" />
      </header>

      {/* --------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 craft-paper" />
        <div className="pointer-events-none absolute -right-40 -top-32 opacity-[0.14]">
          <Mandala className="size-[620px]" />
        </div>
        <div className="pointer-events-none absolute -left-52 top-64 opacity-[0.08]">
          <Mandala className="size-[520px]" colors={["#343e87", "#f2a33a", "#7b2040", "#087f83", "#c49a55"]} />
        </div>

        <div className="relative mx-auto grid max-w-[1280px] items-center gap-10 px-4 pb-14 pt-10 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pb-24 lg:pt-16">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-teal/25 bg-teal/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-teal">
                <span className="size-1.5 rounded-full bg-vermilion" />
                AI-guided Indian craft studio
              </span>
            </Reveal>

            <Reveal delay={0.08}>
              <h1 className="mt-5 max-w-[15ch] font-display text-[2.6rem] font-semibold leading-[1.02] tracking-tight text-maroon sm:text-6xl lg:text-[4.4rem]">
                Your imagination.
                <br />
                <span className="text-vermilion">Their craft.</span>
                <br />
                One extraordinary
                <br />
                creation.
              </h1>
            </Reveal>

            <Reveal delay={0.16}>
              <p className="mt-6 max-w-[52ch] text-[15px] leading-relaxed text-ink/70 md:text-base">
                Design something uniquely yours. Upload an inspiration image, capture its
                colour story, and shape a real design concept on a canvas built for Indian
                craft — <span lang="hi" className="font-medium text-ink">अनेक हाथों की कारीगरी, सिर्फ़ आपके लिए।</span>
              </p>
            </Reveal>

            <Reveal delay={0.24}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  to={isAuthenticated ? "/kalavision" : "/auth?returnTo=%2Fkalavision"}
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-maroon px-6 py-3.5 text-sm font-semibold text-ivory transition-all hover:bg-maroon-deep"
                >
                  Upload an inspiration
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <a
                  href="#crafts"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-maroon/25 bg-card px-6 py-3.5 text-sm font-semibold text-maroon transition-colors hover:border-maroon/50 hover:bg-ivory"
                >
                  Explore the craft library
                </a>
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <ShieldCheck className="size-3.5" />
                Your uploads stay private to your account. No credit card needed.
              </p>
            </Reveal>

            <Reveal delay={0.32}>
              <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-maroon/12 pt-6">
                {[
                  ["12", "craft traditions"],
                  ["12", "original motifs"],
                  ["5", "garment formats"],
                ].map(([value, label]) => (
                  <div key={label}>
                    <dt className="font-display text-2xl font-semibold text-maroon">{value}</dt>
                    <dd className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          {/* hero artwork */}
          <Reveal delay={0.2} className="relative">
            <div className="relative mx-auto max-w-[520px]">
              <div className="absolute -inset-6 rounded-[2rem] border border-gold/30 bg-gradient-to-br from-peach/60 via-ivory to-mint/50" />
              <CornerFlourish className="absolute -left-2 -top-2 z-20 size-14" />
              <CornerFlourish className="absolute -bottom-2 -right-2 z-20 size-14 rotate-180" />

              <div className="relative overflow-hidden rounded-[1.6rem] border border-maroon/20 bg-[#fdf1dc]">
                <div className="flex items-center justify-between border-b border-maroon/12 px-4 py-2.5">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-maroon/70">
                    Design studio · preview
                  </span>
                  <span className="flex gap-1.5">
                    <span className="size-2 rounded-full bg-vermilion/60" />
                    <span className="size-2 rounded-full bg-saffron/70" />
                    <span className="size-2 rounded-full bg-teal/60" />
                  </span>
                </div>
                <div className="relative bg-[radial-gradient(circle_at_50%_30%,#fff7e8_0%,#f1dfc3_100%)]">
                  <GarmentArt canvas={heroCanvas} className="h-auto w-full" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-2">
                    <div className="rounded-lg border border-maroon/15 bg-parchment/95 px-3 py-2 backdrop-blur">
                      <p className="font-display text-sm font-semibold text-maroon">Marigold Madhubani Jacket</p>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Concept · v1</p>
                    </div>
                    <div className="flex gap-1.5 rounded-full border border-maroon/15 bg-parchment/95 p-1.5">
                      {heroConcept.palette.slice(0, 4).map((hex) => (
                        <span key={hex} className="size-5 rounded-full ring-1 ring-ink/10" style={{ background: hex }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <motion.div
                animate={{ y: [0, -7, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -left-4 top-1/3 z-10 hidden w-[168px] rounded-xl border border-teal/25 bg-ivory p-3 sm:block"
              >
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-teal">Measured palette</p>
                <div className="mt-2 flex gap-1">
                  {heroConcept.palette.map((hex) => (
                    <span key={hex} className="h-7 flex-1 rounded-sm ring-1 ring-ink/10" style={{ background: hex }} />
                  ))}
                </div>
                <p className="mt-2 text-[10px] leading-snug text-muted-foreground">Extracted from your reference on-device.</p>
              </motion.div>

              <div className="absolute -right-3 bottom-24 z-10 hidden w-[150px] rounded-xl border border-saffron/40 bg-ivory p-3 sm:block">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-maroon">Rule-based note</p>
                <p className="mt-1 font-display text-sm leading-tight text-ink">Fish-pair motif · centre chest</p>
                <p className="mt-1 text-[10px] text-muted-foreground">6–14 days hand-work estimate</p>
              </div>

              <Peacock className="absolute -bottom-14 -left-10 size-36 opacity-90 sm:size-44" />
            </div>
          </Reveal>
        </div>

        <div className="border-y border-maroon/10 bg-maroon/[0.03] py-3">
          <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 text-center md:px-8">
            {CRAFTS.slice(0, 8).map((c, index) => (
              <span key={c.id} className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-maroon/60">
                <span className="font-hindi text-[13px] text-teal normal-case">{c.hindi}</span>
                {c.name}
                {index < 7 && <span className="ml-4 hidden size-1 rounded-full bg-gold/60 sm:block" />}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ journey */}
      <section id="journey" className="relative mx-auto max-w-[1280px] px-4 py-16 md:px-8 md:py-24">
        <Reveal className="flex flex-col items-center text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-teal">The v1 journey</span>
          <h2 className="mt-3 max-w-[22ch] font-display text-4xl font-semibold leading-tight text-maroon md:text-5xl">
            Inspiration in. A real design out.
          </h2>
          <p className="mt-4 max-w-[58ch] text-sm leading-relaxed text-ink/65">
            Three deliberate steps, all working today. No black-box magic, no invented
            artisans, no fake AI receipts.
          </p>
          <Divider className="mt-6 h-8 w-64" />
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <Reveal key={step.title} delay={index * 0.08}>
              <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-maroon/15 bg-card p-6 transition-colors hover:border-maroon/35">
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-maroon/8 text-maroon">
                    <step.icon className="size-5" />
                  </span>
                  <span className="font-display text-4xl font-semibold text-maroon/12">0{index + 1}</span>
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold text-ink">{step.title}</h3>
                <p className="font-hindi text-xs text-teal">{step.hindi}</p>
                <p className="mt-3 text-sm leading-relaxed text-ink/65">{step.body}</p>
                <div className="mt-5 h-px w-full bg-gradient-to-r from-gold/50 to-transparent" />
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- studio */}
      <section id="studio" className="relative overflow-hidden bg-indigo/[0.04] py-16 md:py-24">
        <div className="absolute inset-x-0 top-0"><VineBorder className="h-3 w-full" color="#343e87" /></div>
        <div className="mx-auto grid max-w-[1280px] items-center gap-10 px-4 md:px-8 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div className="relative rounded-[1.5rem] border border-indigo/20 bg-gradient-to-br from-ivory via-peach/40 to-mint/40 p-3">
              <div className="overflow-hidden rounded-[1.1rem] border border-indigo/15 bg-[#fbf3e2]">
                <div className="flex items-center justify-between border-b border-indigo/12 px-4 py-2">
                  <span className="text-[10px] uppercase tracking-[0.16em] text-indigo/70">Motif mixer → canvas</span>
                  <span className="rounded-full bg-teal/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-teal">
                    Working studio
                  </span>
                </div>
                <div className="grid grid-cols-[72px_1fr] gap-2 p-3">
                  <div className="flex flex-col gap-2">
                    {MOTIFS.slice(0, 4).map((motif, i) => (
                      <span
                        key={motif.id}
                        className={`flex aspect-square items-center justify-center rounded-lg border ${
                          i === 0 ? "border-maroon/35 bg-ivory" : "border-maroon/12 bg-ivory/60"
                        }`}
                        style={{ color: ["#d94b39", "#7b2040", "#087f83", "#343e87"][i] }}
                      >
                        <svg viewBox="-50 -50 100 100" className="size-9">
                          <MotifGlyph id={motif.id} />
                        </svg>
                      </span>
                    ))}
                  </div>
                  <div className="rounded-lg bg-[radial-gradient(circle_at_50%_30%,#fff8ec,#efdcc0)]">
                    <GarmentArt canvas={demoCanvas} className="h-full w-full" />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-indigo/12 px-3 py-2">
                  <div className="flex gap-1.5">
                    {demoCanvas.layers.map((layer) => (
                      <span key={layer.id} className="rounded border border-indigo/15 bg-ivory px-1.5 py-0.5 text-[9px] text-indigo/70">
                        {layer.motifId}
                      </span>
                    ))}
                  </div>
                  <span className="text-[9px] uppercase tracking-wide text-muted-foreground">v3 saved</span>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo">The flagship screen</span>
            <h2 className="mt-3 font-display text-4xl font-semibold leading-[1.08] text-indigo md:text-5xl">
              A studio that behaves like a studio.
            </h2>
            <p className="mt-4 max-w-[52ch] text-sm leading-relaxed text-ink/70">
              Drag, rotate, recolour, re-order. Save a version each time. Export the exact
              artwork on screen — not a mock-up of one.
            </p>
            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
              {studioFeatures.map((feature) => (
                <li key={feature.title} className="rounded-xl border border-indigo/15 bg-card/80 p-4">
                  <feature.icon className="size-4 text-teal" />
                  <p className="mt-2 text-sm font-semibold text-ink">{feature.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{feature.body}</p>
                </li>
              ))}
            </ul>
            <Link
              to={isAuthenticated ? "/kalavision" : "/auth?returnTo=%2Fkalavision"}
              className="group mt-7 inline-flex items-center gap-2 rounded-full bg-indigo px-5 py-3 text-sm font-semibold text-ivory transition-colors hover:bg-indigo/90"
            >
              Try it with your image
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------- crafts */}
      <section id="crafts" className="mx-auto max-w-[1280px] px-4 py-16 md:px-8 md:py-24">
        <Reveal className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-vermilion">Craft library</span>
            <h2 className="mt-3 max-w-[20ch] font-display text-4xl font-semibold leading-tight text-maroon md:text-5xl">
              Twelve traditions. One canvas.
            </h2>
          </div>
          <p className="max-w-[38ch] text-sm leading-relaxed text-ink/65">
            Reference notes on region, materials and technique. Traditions are shared
            heritage — the studio records attribution rather than claiming ownership.
          </p>
        </Reveal>

        <div className="mt-9 grid gap-5 lg:grid-cols-[1.25fr_1fr]">
          <div className="relative overflow-hidden rounded-2xl border border-maroon/20 bg-maroon p-6 text-ivory md:p-8">
            <Mandala className="pointer-events-none absolute -right-16 -top-16 size-72 opacity-25" />
            <div className="relative">
              <div className="flex items-center gap-2">
                <span className="font-hindi text-lg text-saffron">{craft.hindi}</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-ivory/60">{craft.region}</span>
              </div>
              <h3 className="mt-2 font-display text-4xl font-semibold md:text-5xl">{craft.name}</h3>
              <p className="mt-4 max-w-[46ch] text-sm leading-relaxed text-ivory/80">{craft.blurb}</p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-saffron">Materials</p>
                  <ul className="mt-2 space-y-1 text-xs text-ivory/75">
                    {craft.materials.slice(0, 3).map((material) => (
                      <li key={material}>{material}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-saffron">Techniques</p>
                  <ul className="mt-2 space-y-1 text-xs text-ivory/75">
                    {craft.techniques.slice(0, 3).map((technique) => (
                      <li key={technique}>{technique}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {craft.motifs.map((motifId) => (
                  <span key={motifId} className="flex items-center gap-2 rounded-full border border-ivory/20 bg-ivory/5 px-2.5 py-1 text-[11px] text-ivory/85">
                    <svg viewBox="-50 -50 100 100" className="size-4" style={{ color: "#f2a33a" }}>
                      <MotifGlyph id={motifId} />
                    </svg>
                    {MOTIFS.find((m) => m.id === motifId)?.label ?? motifId}
                  </span>
                ))}
              </div>

              <div className="mt-7 flex gap-1.5">
                {craft.palette.map((hex) => (
                  <span key={hex} className="h-8 w-8 rounded-full ring-1 ring-ivory/30" style={{ background: hex }} />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
            {CRAFTS.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveCraft(index)}
                aria-pressed={index === activeCraft}
                className={`group relative overflow-hidden rounded-xl border p-3 text-left transition-all ${
                  index === activeCraft
                    ? "border-maroon/45 bg-card"
                    : "border-maroon/15 bg-card/60 hover:border-maroon/35 hover:bg-card"
                }`}
              >
                <div className="flex items-start justify-between">
                  <svg viewBox="-50 -50 100 100" className="size-9 transition-transform duration-500 group-hover:scale-110" style={{ color: item.accent }}>
                    <MotifGlyph id={item.motifs[0]} />
                  </svg>
                  <span className="font-hindi text-[10px] text-muted-foreground">{item.hindi}</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-ink">{item.name}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">{item.region}</p>
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={craft.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 text-center text-xs text-muted-foreground"
          >
            Showing reference notes for <span className="font-medium text-maroon">{craft.name}</span> ·{" "}
            {craft.region}
          </motion.p>
        </AnimatePresence>
      </section>

      {/* --------------------------------------------------------------- ethos */}
      <section id="ethos" className="relative overflow-hidden border-y border-gold/25 bg-[#fdf3e3] py-16 md:py-24">
        <div className="pointer-events-none absolute right-0 top-1/2 hidden -translate-y-1/2 opacity-90 lg:block">
          <Peacock className="size-[420px]" />
        </div>
        <div className="mx-auto max-w-[1280px] px-4 md:px-8">
          <div className="max-w-[600px]">
            <Reveal>
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-teal">Our ethos</span>
              <h2 className="mt-3 font-display text-4xl font-semibold leading-[1.1] text-maroon md:text-[3.2rem]">
                Crafted by Many.
                <br />
                <span className="font-hindi-display text-vermilion">सिर्फ़ आपके लिए।</span>
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="mt-5 rounded-xl border border-gold/45 bg-card/60 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal">
                  The name
                </p>
                <p className="mt-1.5 font-display text-base leading-relaxed text-ink/75">
                  <span lang="hi" className="font-hindi-display text-[1.2em] leading-none text-vermilion">
                    कला
                  </span>{" "}
                  is art;{" "}
                  <span lang="hi" className="font-hindi-display text-[1.2em] leading-none text-vermilion">
                    कारी
                  </span>{" "}
                  is the making of it. Together they name what this studio exists for:{" "}
                  <span className="font-semibold text-maroon">artistry</span>.
                </p>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-ink/70 md:text-base">
                Every motif in this studio is drawn for KALAकारी. Where a pattern belongs to a
                living tradition, we name the tradition, record the artisan contribution and
                keep a permissions trail. AI proposes; people decide.
              </p>
              <div className="mt-7 grid gap-4 sm:grid-cols-3">
                {[
                  ["Attribution, always", "Craft and motif provenance travels with each design."],
                  ["Suggestions, labelled", "Rule-based, AI-assisted and verified data look different."],
                  ["Human sign-off", "Nothing is sent to production without an artisan."],
                ].map(([title, body]) => (
                  <div key={title} className="border-l-2 border-gold/60 pl-3">
                    <p className="text-xs font-semibold text-maroon">{title}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{body}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- final CTA */}
      <section className="mx-auto max-w-[1280px] px-4 py-16 md:px-8 md:py-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-maroon/30 bg-[linear-gradient(120deg,#7b2040_0%,#651a34_55%,#343e87_100%)] px-6 py-12 text-center text-ivory md:px-12 md:py-16">
            <Mandala className="pointer-events-none absolute -left-24 -top-24 size-80 opacity-20" />
            <Mandala className="pointer-events-none absolute -bottom-28 -right-24 size-80 opacity-20" />
            <div className="relative mx-auto max-w-[620px]">
              <p className="font-hindi-display text-sm text-saffron">आपकी कल्पना, उनकी कारीगरी</p>
              <h2 className="mt-3 font-display text-4xl font-semibold leading-tight md:text-5xl">
                Bring one image. Leave with a creation.
              </h2>
              <p className="mx-auto mt-4 max-w-[48ch] text-sm leading-relaxed text-ivory/80">
                Start with an inspiration and a product format. The studio handles the rest —
                and tells you honestly what it does not know.
              </p>
              <Link
                to={isAuthenticated ? "/kalavision" : "/auth?returnTo=%2Fkalavision"}
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-saffron px-6 py-3.5 text-sm font-semibold text-maroon-deep transition-colors hover:bg-marigold"
              >
                Start creating
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* -------------------------------------------------------------- footer */}
      <footer className="border-t border-gold/30 bg-[#fdf3e3]">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <Wordmark size="sm" />
            <p className="mt-2 max-w-[38ch] text-[11px] leading-relaxed text-muted-foreground">
              KALAकारी · Crafted by Many. Made for You. An AI-guided Indian craft studio, in
              its first version.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-ink/60">
            <a href="#crafts" className="hover:text-maroon">Craft library</a>
            <a href="#journey" className="hover:text-maroon">How it works</a>
            <a href="#studio" className="hover:text-maroon">Design studio</a>
            <Link to="/auth" className="hover:text-maroon">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
