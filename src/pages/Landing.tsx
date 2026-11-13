import { api } from "@/convex/_generated/api";
import { Mandala } from "@/components/art/Ornaments";
import { GarmentArt } from "@/components/art/garments";
import { Motif } from "@/components/art/Motif";
import { ArtisanCard } from "@/components/marketplace/ArtisanCard";
import { PublicShell } from "@/components/public/PublicShell";
import { useAuth } from "@/hooks/use-auth";
import { CRAFT_SKILLS, CRAFT_TRADITIONS, REQUEST_CATEGORIES, formatInr } from "@/lib/marketplace";
import { MOTIFS } from "@/lib/crafts";
import type { CanvasState } from "@/lib/design-types";
import { useQuery } from "convex/react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Compass,
  FileText,
  Hand,
  Handshake,
  Layers3,
  Lock,
  Map,
  MapPin,
  MessageSquare,
  PackageCheck,
  PenLine,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

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
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const JOURNEY = [
  {
    number: "01",
    title: "Imagine",
    body: "Begin with a memory, a material or a half-formed idea. No design vocabulary required.",
    icon: Sparkles,
  },
  {
    number: "02",
    title: "Visualise",
    body: "Shape it on the Studio canvas with motifs, colour, lettering and craft references.",
    icon: PenLine,
  },
  {
    number: "03",
    title: "Match",
    body: "CraftFit connects the brief to real skills, materials, capacity, location and budget.",
    icon: Compass,
  },
  {
    number: "04",
    title: "Collaborate",
    body: "Agree the concept, quote, timeline and — when needed — a multi-artisan KalaCollab plan.",
    icon: Handshake,
  },
  {
    number: "05",
    title: "Create",
    body: "The maker works by hand. Progress, approvals and material decisions enter KalaProof.",
    icon: Hand,
  },
  {
    number: "06",
    title: "Deliver",
    body: "Review the finished piece, confirm handover and keep its story in a KalaPassport.",
    icon: PackageCheck,
  },
];

const WHY = [
  {
    icon: Users,
    title: "The maker is not anonymous",
    body: "Every profile names the artisan, their city, craft and terms. Portfolio work is theirs, shown with permission.",
  },
  {
    icon: FileText,
    title: "Every promise is visible",
    body: "Quotes break down materials, labour and finishing. Concepts are uploaded by the maker before work begins.",
  },
  {
    icon: Lock,
    title: "Payment has a sequence",
    body: "Production follows confirmed payment and an approved concept. Payout does not jump ahead of delivery.",
  },
  {
    icon: BadgeCheck,
    title: "Trust is stated precisely",
    body: "Verification means documents were reviewed — not that handmade work is risk-free. We never invent badges.",
  },
];

const PALETTES = [
  { name: "Madder & bone", fabric: "#E9DFD0", accent: "#7A302A", ink: "#28231F" },
  { name: "Forest & gold", fabric: "#34483E", accent: "#D8A65B", ink: "#F7F2E8" },
  { name: "Indigo study", fabric: "#3E4558", accent: "#D8A65B", ink: "#F7F2E8" },
  { name: "Terracotta", fabric: "#7A302A", accent: "#E9DFD0", ink: "#F7F2E8" },
];

const MOTIF_OPTIONS = MOTIFS.filter((motif) => ["mandala", "lotus", "peacock", "paisley"].includes(motif.id));

function StudioPreview({ studioHref }: { studioHref: string }) {
  const [motifId, setMotifId] = useState("mandala");
  const [paletteIndex, setPaletteIndex] = useState(0);
  const palette = PALETTES[paletteIndex];
  const canvas: CanvasState = {
    productType: "jacket",
    silhouette: "Open-front jacket",
    fabricColor: palette.fabric,
    layers: [
      {
        id: "hero-motif",
        kind: "motif",
        motifId,
        x: 450,
        y: 408,
        size: 300,
        rotation: 0,
        color: palette.accent,
        opacity: 0.96,
      },
      {
        id: "hero-text",
        kind: "text",
        text: "KALAKARI",
        fontFamily: "Cormorant Garamond, serif",
        x: 450,
        y: 690,
        size: 102,
        rotation: 0,
        color: palette.ink,
        opacity: 0.92,
      },
    ],
  };

  return (
    <div className="grid overflow-hidden rounded-[1.75rem] border border-maroon/18 bg-card lg:grid-cols-[1.25fr_0.75fr]">
      <div className="relative min-h-[380px] overflow-hidden bg-[#241f1b] p-4 sm:p-6 lg:min-h-[560px]">
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(247,242,232,0.2)_0.5px,transparent_0.5px)] [background-size:5px_5px]" />
        <div className="pointer-events-none absolute -right-24 -top-24 opacity-[0.08]">
          <Mandala className="size-[520px]" colors={["#D8A65B", "#F7F2E8", "#7A302A", "#34483E", "#B78A4E"]} />
        </div>
        <div className="relative flex items-center justify-between gap-3 text-[9px] uppercase tracking-[0.22em] text-ivory/55">
          <span>Atelier canvas · interactive study</span>
          <span className="rounded-full border border-ivory/20 px-2 py-1">Not an order</span>
        </div>
        <motion.div
          key={`${motifId}-${paletteIndex}`}
          initial={{ opacity: 0.3, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45 }}
          className="relative mx-auto mt-4 flex max-w-[430px] items-center justify-center"
        >
          <div className="absolute inset-x-6 bottom-3 h-8 rounded-full bg-black/30 blur-xl" />
          <GarmentArt canvas={canvas} className="relative h-auto w-full drop-shadow-[0_28px_40px_rgba(0,0,0,0.25)]" />
        </motion.div>
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 text-[9px] uppercase tracking-[0.16em] text-ivory/45 sm:left-6 sm:right-6">
          <span>Open-front jacket · studio illustration</span>
          <span>Drag, scale and version it in Studio</span>
        </div>
      </div>

      <div className="flex flex-col justify-between border-t border-maroon/15 p-5 lg:border-l lg:border-t-0 lg:p-7">
        <div>
          <p className="label-caps text-teal">The Kalakari Studio</p>
          <h3 className="mt-2 font-display text-3xl font-semibold leading-none text-maroon">
            Make the idea
            <br />
            <span className="italic">visible.</span>
          </h3>
          <p className="mt-3 text-xs leading-relaxed text-ink/60">
            A real design workspace with layers, motif libraries and craft-aware guidance. This
            preview is interactive; the full canvas saves every version to your account.
          </p>

          <div className="mt-6">
            <p className="label-caps text-[9px] text-muted-foreground">Choose a motif</p>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {MOTIF_OPTIONS.map((motif) => (
                <button
                  key={motif.id}
                  type="button"
                  aria-pressed={motifId === motif.id}
                  onClick={() => setMotifId(motif.id)}
                  title={motif.label}
                  className={`rounded-lg border p-2 transition ${
                    motifId === motif.id
                      ? "border-maroon bg-maroon/[0.06]"
                      : "border-maroon/12 hover:border-maroon/35"
                  }`}
                >
                  <svg viewBox="-50 -50 100 100" className="mx-auto size-8 text-maroon">
                    <Motif id={motif.id} />
                  </svg>
                  <span className="mt-1 block truncate text-[8px] text-ink/55">{motif.label.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="label-caps text-[9px] text-muted-foreground">Colour study</p>
            <div className="mt-2 space-y-1.5">
              {PALETTES.map((option, index) => (
                <button
                  key={option.name}
                  type="button"
                  aria-pressed={paletteIndex === index}
                  onClick={() => setPaletteIndex(index)}
                  className={`flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition ${
                    paletteIndex === index
                      ? "border-maroon/60 bg-maroon/[0.04]"
                      : "border-maroon/12 hover:border-maroon/30"
                  }`}
                >
                  <span className="flex overflow-hidden rounded-full ring-1 ring-ink/10">
                    {[option.fabric, option.accent, option.ink].map((hex) => (
                      <span key={hex} className="size-3.5" style={{ background: hex }} />
                    ))}
                  </span>
                  <span className="text-[10px] text-ink/65">{option.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-maroon/12 pt-4">
          <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.14em] text-teal">
            <Layers3 className="size-3" /> Layer 02 of 02 · version history on
          </div>
          <Link
            to={studioHref}
            className="mt-3 inline-flex w-full items-center justify-between gap-2 rounded-full bg-maroon px-4 py-2.5 text-xs font-semibold text-ivory transition hover:bg-maroon-deep"
          >
            Open the full Studio <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const artisans = useQuery(api.artisans.directory, { limit: 3 });
  const requestCta = isAuthenticated ? "/customer/create-request" : "/auth?returnTo=%2Fcustomer%2Fcreate-request";
  const artisanCta = isAuthenticated ? "/artisan/jobs" : "/auth?returnTo=%2Fartisan%2Fonboarding";
  const studioCta = isAuthenticated ? "/creations" : "/auth?returnTo=%2Fcreations";

  return (
    <PublicShell>
      {/* Editorial hero */}
      <section className="relative overflow-hidden border-b border-maroon/10">
        <div className="pointer-events-none absolute inset-0 craft-paper" />
        <div className="pointer-events-none absolute -left-56 top-24 opacity-[0.055]">
          <Mandala className="size-[620px]" />
        </div>
        <div className="relative mx-auto grid max-w-[1360px] items-center gap-12 px-4 pb-14 pt-10 md:px-8 lg:grid-cols-[0.94fr_1.06fr] lg:gap-14 lg:pb-24 lg:pt-16">
          <div>
            <Reveal>
              <div className="flex items-center gap-3">
                <span className="h-px w-10 bg-gold/70" />
                <span className="label-caps text-[9px] text-teal">India's atelier for one-of-one things</span>
              </div>
            </Reveal>
            <Reveal delay={0.06}>
              <h1 className="mt-6 max-w-[10ch] font-display text-[3.6rem] font-medium leading-[0.83] tracking-[-0.035em] text-ink sm:text-7xl lg:text-[6.15rem]">
                Crafted by
                <br />
                <span className="italic text-maroon">Heritage.</span>
                <br />
                Powered by
                <br />
                <span className="italic text-teal">Imagination.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-7 max-w-[54ch] text-[14px] leading-[1.8] text-ink/62 md:text-[15px]">
                Turn your imagination into something extraordinary. Design personalised creations
                and collaborate with skilled Indian artisans who bring them to life.
              </p>
            </Reveal>
            <Reveal delay={0.18}>
              <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
                <Link
                  to={requestCta}
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-maroon px-7 py-3.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-ivory transition hover:bg-maroon-deep"
                >
                  Start Creating <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/explore-artisans"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-maroon/25 px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-maroon transition hover:border-maroon/60 hover:bg-white/30"
                >
                  Explore Artisans
                </Link>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] text-ink/48">
                <Link to="/demo" className="inline-flex items-center gap-1.5 font-semibold text-teal-deep transition hover:text-maroon">
                  <PlayCircle className="size-3.5" /> 30-second judge demo
                </Link>
                <span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5" /> No AI artwork</span>
                <span className="flex items-center gap-1.5"><Lock className="size-3.5" /> Explicit approvals</span>
              </div>
            </Reveal>
            <Reveal delay={0.25}>
              <dl className="mt-10 grid max-w-[520px] grid-cols-3 gap-4 border-t border-maroon/12 pt-5">
                {[
                  ["01", "idea, one maker"],
                  ["08%", "fee, stated upfront"],
                  ["100%", "human-made concepts"],
                ].map(([value, label]) => (
                  <div key={label}>
                    <dt className="font-display text-[1.7rem] font-semibold leading-none text-maroon">{value}</dt>
                    <dd className="mt-1.5 text-[9px] uppercase leading-relaxed tracking-[0.13em] text-ink/45">{label}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          {/* Hero still-life: existing studio illustration, never stock artisans */}
          <Reveal delay={0.16} className="relative">
            <div className="relative mx-auto max-w-[560px]">
              <div className="pointer-events-none absolute -inset-3 rounded-[22rem_22rem_2rem_2rem] border border-gold/35" />
              <div className="relative overflow-hidden rounded-[20rem_20rem_1.5rem_1.5rem] bg-[#312722] px-4 pb-5 pt-9 shadow-[0_36px_80px_-50px_rgba(61,30,22,0.75)] sm:px-8 sm:pb-8 sm:pt-12">
                <div className="pointer-events-none absolute inset-0 opacity-[0.22] [background-image:radial-gradient(rgba(247,242,232,0.35)_0.5px,transparent_0.5px)] [background-size:5px_5px]" />
                <Mandala className="pointer-events-none absolute -right-24 -top-28 size-[380px] opacity-[0.12]" colors={["#D8A65B", "#F7F2E8", "#7A302A", "#34483E", "#B78A4E"]} />
                <div className="relative flex items-center justify-between text-[8px] uppercase tracking-[0.2em] text-ivory/55">
                  <span>Study no. 01</span>
                  <span>Hand-painted sneaker</span>
                </div>
                <img
                  src="/demo-concept.svg"
                  alt="Illustrated concept sheet for a hand-painted sneaker"
                  className="relative mx-auto mt-4 max-h-[420px] w-full object-contain"
                />
                <div className="relative mt-2 flex items-end justify-between gap-4 border-t border-ivory/15 pt-3">
                  <div>
                    <p className="font-display text-lg italic text-ivory">A canvas for the story you carry.</p>
                    <p className="mt-0.5 text-[8px] uppercase tracking-[0.15em] text-ivory/45">Existing Kalakari illustration · not a real order</p>
                  </div>
                  <span className="hidden size-10 shrink-0 items-center justify-center rounded-full border border-gold/50 text-gold sm:flex">
                    <Sparkles className="size-4" />
                  </span>
                </div>
              </div>
              <div className="absolute -left-4 bottom-24 hidden w-[150px] -rotate-2 border border-maroon/18 bg-[#fcf9f2] p-3 shadow-md sm:block">
                <p className="label-caps text-[8px] text-teal">CraftFit · explained</p>
                <p className="mt-1 font-display text-base leading-tight text-maroon">Skills meet capacity.</p>
                <div className="mt-2 space-y-1">
                  {["Skills 30", "Materials 20", "Availability 15"].map((line) => (
                    <p key={line} className="text-[8px] text-ink/50">{line}</p>
                  ))}
                </div>
              </div>
              <div className="absolute -right-3 top-16 hidden rotate-2 border border-gold/40 bg-[#fcf9f2] px-3 py-2 shadow-md md:block">
                <p className="flex items-center gap-1 text-[8px] uppercase tracking-[0.14em] text-maroon">
                  <BadgeCheck className="size-3" /> Human concept only
                </p>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="relative border-y border-maroon/10 bg-maroon/[0.025] py-3">
          <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-center gap-x-4 gap-y-1.5 px-4 md:px-8">
            {CRAFT_SKILLS.slice(0, 10).map((skill, index) => (
              <span key={skill} className="flex items-center gap-3 text-[8px] font-medium uppercase tracking-[0.18em] text-maroon/55">
                {skill}
                {index < 9 && <span className="size-0.5 rounded-full bg-gold/70" />}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-[1360px] px-4 py-20 md:px-8 md:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <Reveal>
            <div className="relative max-w-[470px]">
              <div className="overflow-hidden rounded-[1rem] border border-maroon/15 bg-[#e9dfd0]">
                <img
                  src="/demo-sneaker.svg"
                  alt="Illustrated white sneaker customisation study"
                  className="aspect-[4/5] w-full object-cover mix-blend-multiply"
                />
              </div>
              <div className="absolute -bottom-5 -right-4 max-w-[220px] border border-gold/50 bg-[#fcf9f2] p-4 shadow-sm sm:-right-8">
                <p className="font-hindi-display text-xs text-teal">हाथ से बनी, दिल से चुनी</p>
                <p className="mt-1.5 text-[10px] leading-relaxed text-ink/55">
                  The hand is not a production method. It is the point.
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="label-caps text-teal">The Art of Making</p>
            <h2 className="mt-3 max-w-[15ch] font-display text-4xl font-medium leading-[0.98] tracking-[-0.02em] text-ink md:text-6xl">
              A new way to imagine, collaborate and create.
            </h2>
            <div className="editorial-rule mt-7 max-w-[520px]" />
            <p className="mt-6 max-w-[56ch] text-sm leading-[1.85] text-ink/62">
              Kalakari brings the design studio and the artisan's workshop into one considered
              space. You shape the idea. A real maker interprets it in cloth, colour and thread.
              Nothing is pretended: not the concept, not the quote, not the provenance.
            </p>
            <p className="mt-4 max-w-[56ch] text-sm leading-[1.85] text-ink/62">
              We are here for the jacket that carries a grandfather's story, the bag made for one
              person, the gift that could not come from a shelf. The pieces that deserve a name
              attached to them.
            </p>
            <div className="mt-8 grid max-w-[540px] gap-3 sm:grid-cols-2">
              {[
                ["Made once", "No mass production, no endless catalogue."],
                ["Made by a person", "A profile, a city, a craft and agreed terms."],
                ["Made visible", "Concepts, milestones and contributions recorded."],
                ["Made to last", "A digital passport for the story after delivery."],
              ].map(([title, body]) => (
                <div key={title} className="border-l border-gold/50 pl-3">
                  <p className="font-display text-lg font-semibold text-maroon">{title}</p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-ink/50">{body}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Journey */}
      <section className="relative overflow-hidden border-y border-maroon/10 bg-[#efe6d8] py-20 md:py-28">
        <Mandala className="pointer-events-none absolute -right-40 top-10 size-[500px] opacity-[0.075]" />
        <div className="relative mx-auto max-w-[1360px] px-4 md:px-8">
          <Reveal className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="label-caps text-teal">How Kalakari works</p>
              <h2 className="mt-3 max-w-[18ch] font-display text-4xl font-medium leading-none tracking-[-0.02em] text-ink md:text-6xl">
                Six steps. One piece with a history.
              </h2>
            </div>
            <p className="max-w-[34ch] text-[11px] leading-relaxed text-ink/50">
              From a private idea to a documented handover. You can stop at any step; nothing is
              charged until you approve a quote.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-px overflow-hidden border border-maroon/15 bg-maroon/15 sm:grid-cols-2 lg:grid-cols-3">
            {JOURNEY.map((step, index) => (
              <Reveal key={step.title} delay={index * 0.04}>
                <article className="group relative h-full min-h-[210px] bg-[#f7f2e8] p-6 transition-colors hover:bg-[#fcf9f2] md:p-7">
                  <div className="flex items-start justify-between">
                    <span className="font-display text-[11px] italic text-maroon/45">{step.number}</span>
                    <step.icon className="size-5 text-maroon/50 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:text-maroon" />
                  </div>
                  <h3 className="mt-8 font-display text-2xl font-semibold text-ink">{step.title}</h3>
                  <p className="mt-2 max-w-[30ch] text-[11px] leading-[1.75] text-ink/55">{step.body}</p>
                  <span className="absolute bottom-0 left-0 h-px w-0 bg-gold transition-all duration-500 group-hover:w-full" />
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Crafts */}
      <section className="mx-auto max-w-[1360px] px-4 py-20 md:px-8 md:py-28">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
          <Reveal>
            <p className="label-caps text-teal">Explore Indian craftsmanship</p>
            <h2 className="mt-3 font-display text-4xl font-medium leading-[0.98] tracking-[-0.02em] text-ink md:text-5xl">
              Traditions with a place, a name and a hand.
            </h2>
            <p className="mt-5 max-w-[42ch] text-sm leading-[1.8] text-ink/58">
              Technique is not a moodboard. Each craft carries a region, materials and ways of
              working. Start with a tradition and let a maker take it somewhere new.
            </p>
            <Link to="/crafts" className="mt-6 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-maroon">
              Explore the craft library <ArrowRight className="size-3.5" />
            </Link>
            <div className="mt-10 hidden border-t border-maroon/12 pt-5 lg:block">
              <p className="font-hindi-display text-sm text-maroon/60">कला • कारीगरी • कहानी</p>
              <p className="mt-2 max-w-[32ch] text-[10px] leading-relaxed text-ink/45">
                Every craft note is reference material, not a claim of ownership over a shared
                cultural tradition.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-3 sm:grid-cols-2">
            {CRAFT_TRADITIONS.slice(0, 6).map((craft, index) => (
              <Reveal key={craft.id} delay={index * 0.035}>
                <Link
                  to={`/crafts?craft=${craft.id}`}
                  className="group relative flex h-full min-h-[150px] flex-col justify-between overflow-hidden border border-maroon/15 bg-[#fcf9f2] p-5 transition hover:border-maroon/40"
                >
                  <span className="absolute -right-8 -top-10 size-32 rounded-full border border-gold/20 transition-transform duration-700 group-hover:scale-110" />
                  <div className="relative flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[8px] uppercase tracking-[0.16em] text-teal">{craft.region}</p>
                      <h3 className="mt-2 font-display text-[1.55rem] font-semibold leading-none text-ink">{craft.name}</h3>
                    </div>
                    <ArrowUpRight className="size-4 text-maroon/30 transition group-hover:text-maroon" />
                  </div>
                  <p className="relative mt-4 max-w-[30ch] text-[10px] leading-relaxed text-ink/50">{craft.note}</p>
                </Link>
              </Reveal>
            ))}
            <Reveal className="sm:col-span-2">
              <Link
                to="/crafts"
                className="group flex items-center justify-between border border-maroon/15 bg-maroon px-5 py-4 text-ivory transition hover:bg-maroon-deep"
              >
                <span className="font-display text-xl italic">The full craft library</span>
                <span className="flex items-center gap-2 text-[9px] uppercase tracking-[0.18em] text-ivory/65">
                  Twelve living traditions <ArrowRight className="size-3.5" />
                </span>
              </Link>
            </Reveal>
          </div>
        </div>

        <div className="mt-16 border-t border-maroon/12 pt-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="label-caps text-[9px] text-ink/45">What can be made</p>
            <p className="text-[10px] text-ink/45">Eight product families · one-off, made to brief</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            {REQUEST_CATEGORIES.map((category) => (
              <Link
                key={category}
                to={`${requestCta}${requestCta.includes("?") ? "&" : "?"}category=${encodeURIComponent(category)}`}
                className="font-display text-xl text-ink/40 transition hover:text-maroon sm:text-2xl"
              >
                {category}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Makers */}
      <section className="border-y border-maroon/10 bg-[#fcf9f2] py-20 md:py-24">
        <div className="mx-auto max-w-[1360px] px-4 md:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="label-caps text-teal">Meet the makers</p>
              <h2 className="mt-3 max-w-[18ch] font-display text-4xl font-medium leading-none tracking-[-0.02em] text-ink md:text-5xl">
                The hands behind the work.
              </h2>
            </div>
            <div className="max-w-[36ch]">
              <p className="text-[11px] leading-relaxed text-ink/50">
                Real profiles, real portfolios and stated verification. We do not pad this
                directory with invented makers or reviews.
              </p>
              <Link to="/explore-artisans" className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-maroon">
                Explore the directory <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>

          {artisans === undefined ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[0, 1, 2].map((key) => <div key={key} className="h-80 animate-pulse border border-maroon/10 bg-parchment/70" />)}
            </div>
          ) : artisans.length === 0 ? (
            <div className="mt-8 flex flex-col items-center border border-dashed border-maroon/25 bg-parchment/70 px-6 py-14 text-center">
              <Hand className="size-7 text-maroon/30" />
              <p className="mt-3 font-display text-2xl text-maroon">The atelier is opening.</p>
              <p className="mt-2 max-w-[48ch] text-[11px] leading-relaxed text-ink/55">
                Profiles appear only when artisans publish them. Are you a craftsperson? Build a
                CraftFit profile and show the work you choose to share.
              </p>
              <Link to={artisanCta} className="mt-5 inline-flex items-center gap-2 rounded-full bg-teal px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-ivory">
                Build a CraftFit profile <ArrowRight className="size-3.5" />
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {artisans.map((artisan) => <ArtisanCard key={artisan.id} artisan={artisan} />)}
            </div>
          )}
          <p className="mt-4 text-[9px] leading-relaxed text-muted-foreground">
            Sample profiles are labelled as demonstration data and excluded from real matching.
            Ratings and completed-project counts only appear from real completed work.
          </p>
        </div>
      </section>

      {/* Studio preview */}
      <section className="mx-auto max-w-[1360px] px-4 py-20 md:px-8 md:py-28">
        <div className="mb-9 grid gap-4 md:grid-cols-[1fr_0.65fr] md:items-end">
          <Reveal>
            <p className="label-caps text-teal">The Kalakari Studio</p>
            <h2 className="mt-3 max-w-[18ch] font-display text-4xl font-medium leading-[0.98] tracking-[-0.02em] text-ink md:text-6xl">
              An atelier that fits in your browser.
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="max-w-[38ch] text-[11px] leading-[1.8] text-ink/52 md:ml-auto">
              Try a motif and a colour direction here. The real Studio adds drag-and-drop,
              typography, feasibility guidance, export and an immutable version history.
            </p>
          </Reveal>
        </div>
        <Reveal delay={0.06}>
          <StudioPreview studioHref={studioCta} />
        </Reveal>
      </section>

      {/* KalaAtlas and KalaTrack */}
      <section className="border-y border-maroon/10 bg-[#f6ecdc]">
        <div className="mx-auto grid max-w-[1360px] gap-px bg-maroon/10 md:grid-cols-2">
          <article className="bg-[#fbf5e8] p-6 md:p-10">
            <div className="flex items-center gap-2 text-teal"><Map className="size-4" /><p className="label-caps text-[9px]">KalaAtlas · craft geography</p></div>
            <h2 className="mt-4 max-w-[14ch] font-display text-3xl font-medium leading-[0.98] tracking-[-0.02em] text-ink md:text-5xl">Start with a place, not an empty search.</h2>
            <p className="mt-4 max-w-[44ch] text-[11px] leading-[1.8] text-ink/55">Explore an accurate, open state map; read source-linked notes on regional craft traditions; then meet the makers whose profiles are actually here.</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link to="/kala-atlas" className="inline-flex items-center gap-2 rounded-full bg-maroon px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-ivory transition hover:bg-maroon-deep">Open KalaAtlas <MapPin className="size-3.5" /></Link>
              <span className="text-[9px] text-ink/35">LGD-derived boundaries · CC0</span>
            </div>
          </article>
          <article className="bg-[#f8efe0] p-6 md:p-10">
            <div className="flex items-center gap-2 text-teal"><PackageCheck className="size-4" /><p className="label-caps text-[9px]">KalaTrack · production record</p></div>
            <h2 className="mt-4 max-w-[14ch] font-display text-3xl font-medium leading-[0.98] tracking-[-0.02em] text-ink md:text-5xl">Follow the making, one dated step at a time.</h2>
            <p className="mt-4 max-w-[44ch] text-[11px] leading-[1.8] text-ink/55">Milestones, artisan progress updates, final review and manual shipping details — all drawn from the same project record, never a second status system.</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link to="/track" className="inline-flex items-center gap-2 rounded-full border border-maroon/30 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-maroon transition hover:bg-maroon/5">Open KalaTrack <ArrowUpRight className="size-3.5" /></Link>
              <span className="text-[9px] text-ink/35">Sign in to view your own projects</span>
            </div>
          </article>
        </div>
      </section>

      {/* KalaCollab editorial band */}
      <section className="relative overflow-hidden bg-[#34483e] py-20 text-ivory md:py-24">
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:repeating-linear-gradient(45deg,rgba(247,242,232,0.7)_0_1px,transparent_1px_15px)]" />
        <Mandala className="pointer-events-none absolute -bottom-48 -right-24 size-[620px] opacity-10" colors={["#D8A65B", "#F7F2E8", "#7A302A", "#E9DFD0", "#B78A4E"]} />
        <div className="relative mx-auto grid max-w-[1360px] gap-10 px-4 md:px-8 lg:grid-cols-[1fr_0.8fr] lg:items-end">
          <div>
            <p className="label-caps text-gold">KalaCollab · multiple hands, one creation</p>
            <h2 className="mt-4 max-w-[14ch] font-display text-4xl font-medium leading-[0.94] tracking-[-0.025em] md:text-6xl">
              Some ideas need more than one pair of hands.
            </h2>
            <p className="mt-5 max-w-[52ch] text-sm leading-[1.85] text-ivory/65">
              A tailored jacket might need a tailor, an embroiderer and a painter. KalaCollab
              decomposes the brief into craft tasks, proposes matched makers, and keeps every
              contribution and approval in one coordinated plan.
            </p>
            <Link
              to="/kalacollab"
              className="mt-7 inline-flex items-center gap-2 rounded-full border border-ivory/30 px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-ivory transition hover:bg-ivory/10"
            >
              Discover KalaCollab <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid gap-px border border-ivory/15 bg-ivory/15 sm:grid-cols-3">
            {[
              ["Tailor", "Garment construction", "01"],
              ["Embroiderer", "Surface and motif", "02"],
              ["Painter", "Finishing details", "03"],
            ].map(([role, craft, number]) => (
              <div key={role} className="bg-[#34483e] p-4">
                <p className="font-display text-xs italic text-gold/70">{number}</p>
                <p className="mt-6 font-display text-lg font-semibold">{role}</p>
                <p className="mt-1 text-[9px] uppercase tracking-[0.14em] text-ivory/40">{craft}</p>
              </div>
            ))}
            <p className="bg-[#2b3b33] p-4 text-[9px] leading-relaxed text-ivory/50 sm:col-span-3">
              Illustrative roles. A real plan is generated from the brief and confirmed by the
              customer and each artisan. Payout splits are planned amounts — not automatic
              transfers.
            </p>
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="mx-auto max-w-[1360px] px-4 py-20 md:px-8 md:py-28">
        <div className="grid gap-10 lg:grid-cols-[0.68fr_1.32fr] lg:gap-20">
          <Reveal>
            <p className="label-caps text-teal">Why Kalakari</p>
            <h2 className="mt-3 max-w-[11ch] font-display text-4xl font-medium leading-[0.98] tracking-[-0.02em] text-ink md:text-5xl">
              A little more human by design.
            </h2>
            <p className="mt-5 max-w-[38ch] text-sm leading-[1.8] text-ink/55">
              Not a marketplace that hides the maker. Not an AI that draws over their name. A
              considered system for work that is made once, by someone.
            </p>
            <div className="mt-7 flex items-center gap-2 text-[9px] uppercase tracking-[0.15em] text-maroon/55">
              <ShieldCheck className="size-3.5" /> KalaTrust by default
            </div>
          </Reveal>
          <div className="grid gap-3 sm:grid-cols-2">
            {WHY.map((item, index) => (
              <Reveal key={item.title} delay={index * 0.05}>
                <article className="h-full border border-maroon/14 bg-[#fcf9f2] p-5">
                  <item.icon className="size-5 text-maroon/60" />
                  <h3 className="mt-7 font-display text-xl font-semibold text-ink">{item.title}</h3>
                  <p className="mt-2 text-[11px] leading-[1.75] text-ink/55">{item.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="mt-16 grid gap-3 border-y border-maroon/12 py-6 sm:grid-cols-3">
          {[
            [MessageSquare, "KalaSaathi", "Plain-language help with briefs and craft terms."],
            [Compass, "CraftFit", "Explainable matching, not paid placement."],
            [FileText, "KalaProof", "Append-only evidence from quote to handover."],
          ].map(([Icon, title, body]) => {
            const IconComponent = Icon as typeof MessageSquare;
            return (
              <div key={String(title)} className="flex items-start gap-3">
                <IconComponent className="mt-0.5 size-4 shrink-0 text-teal" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-maroon">{String(title)}</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-ink/50">{String(body)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Final */}
      <section className="mx-auto max-w-[1360px] px-4 pb-20 md:px-8 md:pb-28">
        <div className="relative overflow-hidden rounded-[1.25rem] border border-maroon/20 bg-[#e9dfd0] px-6 py-16 text-center md:px-12 md:py-24">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-2 block-print-border" />
          <Mandala className="pointer-events-none absolute -left-28 -top-32 size-[400px] opacity-[0.11]" />
          <Mandala className="pointer-events-none absolute -bottom-40 -right-20 size-[400px] opacity-[0.09]" />
          <div className="relative mx-auto max-w-[720px]">
            <p className="font-hindi-display text-sm text-teal">आपकी कल्पना, उनकी कारीगरी</p>
            <h2 className="mt-4 font-display text-4xl font-medium leading-[0.98] tracking-[-0.025em] text-ink md:text-6xl">
              Your imagination deserves to be handcrafted.
            </h2>
            <p className="mx-auto mt-5 max-w-[48ch] text-sm leading-[1.8] text-ink/58">
              Start with an idea. Meet the person who can make it. Keep the agreement, the making
              and the story visible from first sketch to final handover.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-2.5 sm:flex-row">
              <Link to={requestCta} className="inline-flex items-center justify-center gap-2 rounded-full bg-maroon px-7 py-3.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-ivory transition hover:bg-maroon-deep">
                Start Creating <ArrowRight className="size-3.5" />
              </Link>
              <Link to="/explore-artisans" className="inline-flex items-center justify-center gap-2 rounded-full border border-maroon/30 px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-maroon transition hover:border-maroon/60">
                Explore Artisans
              </Link>
            </div>
            <p className="mt-5 text-[9px] uppercase tracking-[0.12em] text-ink/40">
              {formatInr(0)} to post a brief · fee shown before commitment · no AI artwork
            </p>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
