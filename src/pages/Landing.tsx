import { api } from "@/convex/_generated/api";
import { CornerFlourish, Divider, Mandala, Peacock, VineBorder } from "@/components/art/Ornaments";
import { BrandLockup, Wordmark } from "@/components/brand/Logo";
import { ArtisanCard } from "@/components/marketplace/ArtisanCard";
import { PublicShell } from "@/components/public/PublicShell";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { CRAFT_SKILLS, CRAFT_TRADITIONS, REQUEST_CATEGORIES, formatInr } from "@/lib/marketplace";
import { useQuery } from "convex/react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  CheckCircle2,
  FileText,
  Hammer,
  Hand,
  Handshake,
  Languages,
  Lock,
  MessageSquare,
  PackageCheck,
  PenLine,
  PlayCircle,
  ScanText,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
} from "lucide-react";
import { Link } from "react-router";

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const CUSTOMER_STEPS = [
  { icon: PenLine, title: "Describe it", body: "Add the product, budget, deadline, references and the parts that must not change. KalaVision turns a messy note into a structured brief — you approve every field." },
  { icon: Users, title: "Choose the maker", body: "CraftFit matches the brief to skills, materials and capacity. Compare quotes, timelines and portfolios, then invite anyone you like. No pay-to-rank." },
  { icon: Handshake, title: "Approve before making", body: "Your artisan uploads their own concept. You request changes or approve it. Work only starts after the concept is agreed." },
];

const ARTISAN_STEPS = [
  { icon: ScanText, title: "Build a CraftFit profile", body: "Skills, crafts, materials, languages, capacity and rates. Your portfolio is never used to train AI, and nothing is published without your say." },
  { icon: Hammer, title: "Quote matched work", body: "See briefs that genuinely fit your craft. Send a clear quote: making, materials, timeline, revisions. You are paid for quoted work." },
  { icon: PackageCheck, title: "Make and document", body: "Upload progress to KalaProof, get milestones approved, hand over the piece. Payout is released after customer confirmation." },
];

const PROTECTIONS = [
  { icon: Lock, title: "Protected payments", body: "Payments are held against a project state machine. Payout is released only after handover and customer confirmation — or an admin decision." },
  { icon: BadgeCheck, title: "Honest verification", body: "“Verified” means documents were checked. Unverified and sample profiles say so. We never invent badges, reviews or completed order counts." },
  { icon: FileText, title: "KalaProof timeline", body: "Concepts, approvals, payments, progress and handover are recorded as append-only evidence. No quiet edits." },
  { icon: ShieldCheck, title: "A real dispute path", body: "Open a dispute with evidence. Both sides respond. A person reviews it and records a decision you can appeal." },
];

const FAQS = [
  ["Does KALकारी generate the artwork with AI?", "No. AI is used to understand your brief, describe craft skills, match artisans, translate, explain pricing and plan production. Every concept you approve is made and uploaded by an artisan — not generated, and never presented as handmade."],
  ["Will my uploaded photos be used to train AI?", "No. References are used for your brief and shared only with artisans you choose. Portfolios are never used for model training without explicit permission."],
  ["What does “verified artisan” actually mean?", "That identity and craft documents were reviewed by an admin. It is not a guarantee of outcomes or a quality rating. Profiles that are pending or unverified are labelled that way everywhere they appear."],
  ["When does the artisan get paid?", "The customer pays into the project first. The artisan sees the project is funded before starting. Payout is created on completion and transferred after the review window — the platform fee is shown before anyone commits."],
  ["Can I choose an artisan who wasn’t matched to me?", "Yes. Browse the directory and invite any artisan whose craft fits. Matching is a starting point, not a gate."],
  ["What if the piece isn’t what was approved?", "Request a revision first. If that fails, open a dispute with the approved concept and KalaProof evidence attached. Payment release pauses while it is reviewed."],
];

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const artisans = useQuery(api.artisans.directory, { limit: 3 });
  const requestCta = isAuthenticated ? "/customer/create-request" : "/auth?returnTo=%2Fcustomer%2Fcreate-request";
  const artisanCta = isAuthenticated ? "/artisan/jobs" : "/auth?returnTo=%2Fartisan%2Fonboarding";

  return (
    <PublicShell>
      {/* hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 craft-paper" />
        <div className="pointer-events-none absolute -right-40 -top-40 opacity-[0.12]">
          <Mandala className="size-[620px]" />
        </div>
        <div className="pointer-events-none absolute -left-48 top-80 opacity-[0.07]">
          <Mandala className="size-[500px]" colors={["#343e87", "#f2a33a", "#7b2040", "#087f83", "#c49a55"]} />
        </div>

        <div className="relative mx-auto grid max-w-[1320px] items-center gap-12 px-4 pb-14 pt-10 md:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16 lg:pb-24 lg:pt-16">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-teal/25 bg-teal/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-teal">
                <span className="size-1.5 rounded-full bg-vermilion" />
                An artisan-first customisation marketplace
              </span>
            </Reveal>
            <Reveal delay={0.06}>
              <h1 className="mt-5 max-w-[13ch] font-display text-[2.75rem] font-semibold leading-[0.98] tracking-tight text-maroon sm:text-6xl lg:text-[4.5rem]">
                Your Imagination.
                <br />
                <span className="text-vermilion">Their Craftsmanship.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-6 max-w-[50ch] text-[15px] leading-relaxed text-ink/70 md:text-base">
                One-of-one pieces should not begin with a chatbot drawing. They begin with your idea,
                a real artisan, and an agreement both sides can see. KALकारी connects the two — and
                documents every step from first sketch to final handover.
              </p>
            </Reveal>
            <Reveal delay={0.18}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to={requestCta} className="group inline-flex items-center justify-center gap-2 rounded-full bg-maroon px-6 py-3.5 text-sm font-semibold text-ivory transition hover:bg-maroon-deep">
                  Start Customising <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link to="/demo" className="inline-flex items-center justify-center gap-2 rounded-full border border-saffron/50 bg-saffron/[0.1] px-6 py-3.5 text-sm font-semibold text-[#7a4f10] transition hover:border-saffron hover:bg-saffron/20">
                  <PlayCircle className="size-4" /> 30-second judge demo
                </Link>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
                <Link to={artisanCta} className="inline-flex items-center gap-1.5 font-semibold text-teal-deep hover:underline">
                  <Hand className="size-3.5" /> Find Craft Work
                </Link>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5" /> No AI artwork. No hidden fees. Your idea stays yours.
                </span>
              </div>
            </Reveal>
            <Reveal delay={0.24}>
              <dl className="mt-9 grid max-w-lg grid-cols-3 gap-3 border-t border-maroon/12 pt-5">
                {[
                  ["1:1", "artisan per piece"],
                  ["8%", "platform fee, shown upfront"],
                  ["0", "AI-generated concepts"],
                ].map(([value, label]) => (
                  <div key={label}>
                    <dt className="font-display text-2xl font-semibold text-maroon">{value}</dt>
                    <dd className="mt-0.5 text-[10px] leading-snug tracking-wide text-muted-foreground uppercase">{label}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          {/* hero interface preview: a brief, not generated artwork */}
          <Reveal delay={0.16} className="relative">
            <div className="relative mx-auto max-w-[540px]">
              <div className="absolute -inset-5 rounded-[2rem] border border-gold/35 bg-gradient-to-br from-peach/60 via-ivory to-mint/50" />
              <CornerFlourish className="absolute -left-2 -top-2 z-20 size-14" />
              <CornerFlourish className="absolute -bottom-2 -right-2 z-20 size-14 rotate-180" />
              <div className="relative overflow-hidden rounded-[1.5rem] border border-maroon/20 bg-[#fdf2de] shadow-[0_30px_70px_-40px_rgba(70,17,38,0.5)]">
                <div className="flex items-center justify-between border-b border-maroon/12 px-4 py-2.5">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-maroon/60">Customisation brief · illustrative preview</span>
                  <span className="rounded-full bg-teal/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-teal">Draft</span>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-xl font-semibold leading-tight text-maroon">Painting my grandfather’s denim jacket</p>
                      <p className="mt-1 text-[11px] text-ink/55">Denim jacket · keep the original stitching · wear by December</p>
                    </div>
                    <span className="font-hindi text-xs text-teal">कपड़े पर कहानी</span>
                  </div>

                  <div className="mt-4 grid grid-cols-[1.15fr_0.85fr] gap-2.5">
                    <div className="rounded-xl border border-maroon/15 bg-ivory/70 p-3">
                      <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-maroon/60">
                        <Camera className="size-3" /> Your reference
                      </p>
                      <div className="mt-2 flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-gold/60 bg-[radial-gradient(circle_at_40%_30%,#fff8ec,#f0dcc0)]">
                        <div className="text-center">
                          <Camera className="mx-auto size-6 text-maroon/30" />
                          <p className="mt-1 text-[10px] font-medium text-maroon/50">Upload your own photo</p>
                          <p className="text-[9px] text-muted-foreground">Not a generated image</p>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-1.5">
                        {["#3f4f6b", "#7b2040", "#f2a33a", "#087f83", "#e9e0cf"].map((hex) => (
                          <span key={hex} className="h-4 flex-1 rounded-sm ring-1 ring-ink/10" style={{ background: hex }} />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="rounded-lg border border-teal/20 bg-teal/[0.05] p-2.5">
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-teal">KalaVision read</p>
                        <p className="mt-1 text-[10px] leading-snug text-ink/65">Wearable denim, hand-painted, sentimental value. Prefers visible brushwork over a printed look.</p>
                      </div>
                      <div className="rounded-lg border border-gold/40 bg-card p-2.5">
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-maroon">Budget & timeline</p>
                        <p className="mt-1 text-sm font-semibold text-maroon">₹6,000–9,000</p>
                        <p className="text-[10px] text-muted-foreground">3–4 weeks · flexible by 5 days</p>
                      </div>
                      <div className="rounded-lg border border-emerald/25 bg-emerald/[0.05] p-2.5">
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-emerald">3 artisans matched</p>
                        <p className="mt-1 text-[10px] leading-snug text-ink/60">Explainable fit — craft, material, capacity.</p>
                      </div>
                    </div>
                  </div>

                  <p className="mt-2 text-[8px] leading-relaxed text-muted-foreground">Illustrative interface — not a real order, artisan match or AI result.</p>
                  <div className="mt-2 rounded-xl border border-maroon/12 bg-card p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-maroon/60">Protection before making</p>
                      <Lock className="size-3 text-teal" />
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-[9px] text-ink/55">
                      {["Brief", "Quote", "Concept approval", "Making", "Handover"].map((stage, index) => (
                        <div key={stage} className="flex flex-1 items-center gap-1">
                          <span className={`flex size-4 shrink-0 items-center justify-center rounded-full text-[8px] font-bold ${index === 0 ? "bg-maroon text-ivory" : "bg-maroon/10 text-maroon/50"}`}>{index + 1}</span>
                          <span className="truncate">{stage}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -right-3 bottom-20 z-10 hidden w-[158px] rounded-xl border border-saffron/45 bg-ivory p-3 shadow-sm sm:block">
                <p className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-maroon"><Sparkles className="size-3" /> CraftFit match</p>
                <p className="mt-1 font-display text-sm leading-tight text-ink">Hand painting on denim</p>
                <p className="mt-1 text-[10px] text-muted-foreground">Skills 30% · material 20% · capacity 15%</p>
              </div>
              <Peacock className="absolute -bottom-16 -left-12 size-36 opacity-90 sm:size-44" />
            </div>
          </Reveal>
        </div>

        <div className="border-y border-maroon/10 bg-maroon/[0.03] py-3">
          <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-center gap-x-5 gap-y-2 px-4 text-center md:px-8">
            {CRAFT_SKILLS.slice(0, 10).map((skill, index) => (
              <span key={skill} className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.13em] text-maroon/60">
                {skill}
                {index < 9 && <span className="ml-3 hidden size-1 rounded-full bg-gold/60 sm:block" />}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* two journeys */}
      <section className="mx-auto max-w-[1320px] px-4 py-16 md:px-8 md:py-24">
        <Reveal className="flex flex-col items-center text-center">
          <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-teal">Two sides. One agreement.</span>
          <h2 className="mt-3 max-w-[22ch] font-display text-4xl font-semibold leading-tight text-maroon md:text-5xl">A better deal for the person making it.</h2>
          <p className="mt-4 max-w-[60ch] text-sm leading-relaxed text-ink/65">
            Most customisation platforms begin with a customer and end with a transaction. KALकारी
            begins with the craftsperson: paid quoted work, agreed concepts, and a record of their labour.
          </p>
          <Divider className="mt-6 h-8 w-64" />
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {[
            { label: "If you have an idea", hindi: "ग्राहक", steps: CUSTOMER_STEPS, cta: { to: requestCta, label: "Start a customisation brief" }, tone: "maroon" },
            { label: "If you have the craft", hindi: "कारीगर", steps: ARTISAN_STEPS, cta: { to: artisanCta, label: "See matched craft work" }, tone: "teal" },
          ].map((column, columnIndex) => (
            <Reveal key={column.label} delay={columnIndex * 0.08}>
              <div className={`h-full rounded-2xl border p-6 md:p-7 ${column.tone === "maroon" ? "border-maroon/20 bg-card" : "border-teal/25 bg-teal/[0.04]"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-hindi text-xs text-teal">{column.hindi}</p>
                    <h3 className="font-display text-2xl font-semibold text-ink">{column.label}</h3>
                  </div>
                  {column.tone === "maroon" ? <PenLine className="size-6 text-maroon/40" /> : <Hammer className="size-6 text-teal/50" />}
                </div>
                <ol className="mt-5 space-y-4">
                  {column.steps.map((step, index) => (
                    <li key={step.title} className="flex gap-3">
                      <span className={`flex size-9 shrink-0 items-center justify-center rounded-full border ${column.tone === "maroon" ? "border-maroon/20 bg-maroon/[0.06] text-maroon" : "border-teal/30 bg-teal/10 text-teal-deep"}`}>
                        <step.icon className="size-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-ink"><span className="mr-1.5 text-[10px] text-muted-foreground">0{index + 1}</span>{step.title}</p>
                        <p className="mt-0.5 text-[12px] leading-relaxed text-ink/60">{step.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <Link to={column.cta.to} className={`mt-6 inline-flex items-center gap-1.5 text-xs font-semibold ${column.tone === "maroon" ? "text-maroon" : "text-teal-deep"}`}>
                  {column.cta.label} <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* categories */}
      <section className="border-y border-gold/25 bg-[#fcf1de] py-14">
        <div className="mx-auto max-w-[1320px] px-4 md:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-vermilion">Start somewhere</span>
              <h2 className="mt-2 font-display text-3xl font-semibold text-maroon md:text-4xl">What would you like made yours?</h2>
            </div>
            <p className="max-w-[36ch] text-[12px] leading-relaxed text-ink/55">A jacket that already fits. A bag with a story. A gift nobody else can buy. If it can be crafted, it can be briefed.</p>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {REQUEST_CATEGORIES.map((category) => (
              <Link
                key={category}
                to={`${requestCta}${requestCta.includes("?") ? "&" : "?"}category=${encodeURIComponent(category)}`}
                className="group flex items-center justify-between rounded-xl border border-maroon/15 bg-card/70 px-4 py-3.5 transition hover:border-maroon/40 hover:bg-card"
              >
                <span className="text-[13px] font-medium text-ink/75 group-hover:text-maroon">{category}</span>
                <ArrowRight className="size-3.5 text-maroon/35 transition-transform group-hover:translate-x-0.5 group-hover:text-maroon" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* artisans */}
      <section className="mx-auto max-w-[1320px] px-4 py-16 md:px-8 md:py-24">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-teal">The directory</span>
            <h2 className="mt-2 font-display text-4xl font-semibold text-maroon md:text-5xl">Meet the hands behind the work.</h2>
          </div>
          <Link to="/explore-artisans" className="inline-flex items-center gap-1.5 text-xs font-semibold text-maroon hover:text-vermilion">
            Explore all artisans <ArrowRight className="size-3.5" />
          </Link>
        </div>
        {artisans === undefined ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((key) => <div key={key} className="h-72 animate-pulse rounded-2xl border border-maroon/10 bg-card/60" />)}
          </div>
        ) : artisans.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-maroon/25 bg-card/60 px-6 py-12 text-center">
            <Users className="mx-auto size-8 text-maroon/30" />
            <p className="mt-3 font-display text-xl text-maroon">The artisan directory is opening.</p>
            <p className="mx-auto mt-2 max-w-[46ch] text-xs leading-relaxed text-ink/55">
              Profiles appear here only when artisans create them. We won’t pad this page with invented
              makers, reviews or earnings. Are you a craftsperson? Your CraftFit profile is the first step.
            </p>
            <Link to={artisanCta} className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-teal px-4 py-2 text-xs font-semibold text-ivory">Create a CraftFit profile <ArrowRight className="size-3.5" /></Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {artisans.map((artisan) => <ArtisanCard key={artisan.id} artisan={artisan} />)}
          </div>
        )}
        <p className="mt-3 text-[10px] text-muted-foreground">
          Some early profiles may be labelled sample data. Ratings and completed-project counts appear only from real, completed work.
        </p>
      </section>

      {/* traditions */}
      <section className="relative overflow-hidden bg-maroon py-16 text-ivory md:py-24">
        <Mandala className="pointer-events-none absolute -right-32 -top-32 size-[520px] opacity-15" />
        <div className="relative mx-auto max-w-[1320px] px-4 md:px-8">
          <div className="max-w-[640px]">
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-saffron">Craft, with attribution</span>
            <h2 className="mt-3 font-display text-4xl font-semibold leading-tight md:text-5xl">Traditions are not a trend cycle.</h2>
            <p className="mt-4 max-w-[56ch] text-sm leading-relaxed text-ivory/70">
              Every craft has a region, a technique and people who carry it. KALकारी records that
              context on the profile and the brief. AI can explain a craft; it cannot own one.
            </p>
          </div>
          <div className="mt-8 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {CRAFT_TRADITIONS.map((craft) => (
              <Link key={craft.id} to={`/crafts?craft=${craft.id}`} className="group rounded-xl border border-ivory/15 bg-ivory/[0.04] p-4 transition hover:border-saffron/50 hover:bg-ivory/[0.08]">
                <p className="text-[9px] uppercase tracking-[0.15em] text-saffron/80">{craft.region}</p>
                <p className="mt-1 font-display text-lg font-semibold">{craft.name}</p>
                <p className="mt-1 text-[11px] leading-snug text-ivory/60">{craft.note}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-[10px] text-ivory/40 group-hover:text-saffron">Reference notes <ArrowRight className="size-3" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* protection */}
      <section className="mx-auto max-w-[1320px] px-4 py-16 md:px-8 md:py-24">
        <Reveal className="flex flex-col items-center text-center">
          <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-teal">KalaTrust</span>
          <h2 className="mt-3 max-w-[24ch] font-display text-4xl font-semibold leading-tight text-maroon md:text-5xl">Trust is a process, not a badge.</h2>
          <p className="mt-4 max-w-[58ch] text-sm leading-relaxed text-ink/65">
            We can’t promise that handmade work is risk-free. We can make the agreement explicit,
            hold the payment, and keep evidence both sides can rely on.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {PROTECTIONS.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.05}>
              <div className="flex h-full gap-4 rounded-2xl border border-maroon/15 bg-card p-5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-maroon/[0.07] text-maroon"><item.icon className="size-5" /></span>
                <div>
                  <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
                  <p className="mt-1 text-[12px] leading-relaxed text-ink/60">{item.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-gold/40 bg-ivory/70 px-4 py-3 text-[10px] text-maroon/70">
          <span className="flex items-center gap-1.5"><BadgeCheck className="size-3.5" /> Documented verification</span>
          <span className="flex items-center gap-1.5"><Lock className="size-3.5" /> State-machine payments</span>
          <span className="flex items-center gap-1.5"><FileText className="size-3.5" /> Append-only KalaProof</span>
          <span className="flex items-center gap-1.5"><Languages className="size-3.5" /> Hindi · English · Hinglish</span>
          <Link to="/trust-and-safety" className="ml-auto font-semibold text-maroon hover:text-vermilion">How protection works →</Link>
        </div>
      </section>

      {/* AI manifesto */}
      <section className="border-y border-gold/25 bg-[#fdf3e3] py-16 md:py-24">
        <div className="mx-auto grid max-w-[1320px] gap-10 px-4 md:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal>
            <p className="font-hindi-display text-sm text-vermilion">AI जोड़ता है, कारीगर बनाते हैं</p>
            <h2 className="mt-3 font-display text-4xl font-semibold leading-[1.06] text-maroon md:text-5xl">We use AI to get you to a person faster.</h2>
            <p className="mt-4 max-w-[46ch] text-sm leading-relaxed text-ink/65">
              Not to replace the person. KalaVision organises a brief. KalaSaathi helps you say what
              you mean. CraftFit finds hands that can do the work. The work itself is human.
            </p>
            <Link to="/why-kalkaari" className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-maroon/30 bg-card px-5 py-2.5 text-xs font-semibold text-maroon transition hover:border-maroon/60">
              Read what AI does and doesn’t do <ArrowRight className="size-3.5" />
            </Link>
          </Reveal>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald/25 bg-emerald/[0.04] p-5">
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald"><CheckCircle2 className="size-4" /> AI is used for</p>
              <ul className="mt-3 space-y-2 text-[12px] text-ink/70">
                {["Understanding a written brief and flagging missing details", "Describing craft skills, materials and finish options", "Explainable matching between briefs and artisan capacity", "Hindi, English and Hinglish translation support", "Explaining a quote and production plan", "Fraud and quality support for human reviewers"].map((line) => (
                  <li key={line} className="flex gap-2"><span className="mt-1.5 size-1 shrink-0 rounded-full bg-emerald" />{line}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-vermilion/25 bg-vermilion/[0.04] p-5">
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-vermilion"><ShieldCheck className="size-4" /> Never used for</p>
              <ul className="mt-3 space-y-2 text-[12px] text-ink/70">
                {["Generating finished artwork or craft concepts", "Training on portfolios without permission", "Presenting AI output as handmade", "Auto-accepting quotes or approving work", "Fabricating reviews, orders or earnings", "A final decision on a dispute"].map((line) => (
                  <li key={line} className="flex gap-2"><span className="mt-1.5 size-1 shrink-0 rounded-full bg-vermilion" />{line}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-[980px] px-4 py-16 md:px-8 md:py-24">
        <Reveal className="text-center">
          <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-teal">Straight answers</span>
          <h2 className="mt-3 font-display text-4xl font-semibold text-maroon">The questions that matter.</h2>
        </Reveal>
        <div className="mt-8 divide-y divide-maroon/12 border-y border-maroon/12">
          {FAQS.map(([question, answer]) => (
            <details key={question} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-ink marker:hidden">
                {question}
                <span className="text-lg font-normal text-maroon/50 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 max-w-[76ch] text-[12px] leading-relaxed text-ink/60">{answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* final CTA */}
      <section className="mx-auto max-w-[1320px] px-4 pb-16 md:px-8 md:pb-24">
        <div className="relative overflow-hidden rounded-[2rem] border border-maroon/30 bg-[linear-gradient(120deg,#7b2040_0%,#651a34_55%,#343e87_100%)] px-6 py-12 text-center text-ivory md:px-12 md:py-16">
          <Mandala className="pointer-events-none absolute -left-24 -top-24 size-80 opacity-20" />
          <Mandala className="pointer-events-none absolute -bottom-28 -right-24 size-80 opacity-20" />
          <div className="relative mx-auto max-w-[620px]">
            <p className="font-hindi-display text-sm text-saffron">आपकी कल्पना, उनकी कारीगरी</p>
            <h2 className="mt-3 font-display text-4xl font-semibold leading-tight md:text-5xl">Start with an idea. End with something only you have.</h2>
            <p className="mx-auto mt-4 max-w-[50ch] text-sm leading-relaxed text-ivory/75">
              Post it as a brief. We’ll find the hands that fit — and keep the agreement honest from
              first quote to final handover.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to={requestCta} className="inline-flex items-center justify-center gap-2 rounded-full bg-saffron px-6 py-3.5 text-sm font-semibold text-maroon-deep transition hover:bg-marigold">
                Customise Something <ArrowRight className="size-4" />
              </Link>
              <Link to={artisanCta} className="inline-flex items-center justify-center gap-2 rounded-full border border-ivory/30 px-6 py-3.5 text-sm font-semibold text-ivory transition hover:bg-ivory/10">
                <Hand className="size-4" /> Find Craft Work
              </Link>
            </div>
            <p className="mt-4 text-[10px] text-ivory/45">Platform fee shown before commitment · {formatInr(0)} to post a brief</p>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
