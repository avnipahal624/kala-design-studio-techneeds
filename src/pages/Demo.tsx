import { PublicShell } from "@/components/public/PublicShell";
import { Button } from "@/components/ui/button";
import {
  demoMatches,
  demoMaterials,
  demoNotes,
  demoProofEvents,
  demoQuote,
  demoRequest,
  demoSkills,
  demoTrustStages,
} from "@/lib/demoScenario";
import { formatDate, formatInr } from "@/lib/marketplace";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronRight,
  FileText,
  Hammer,
  IndianRupee,
  Info,
  Lock,
  MapPin,
  Quote,
  Scissors,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { QRCodeSVG } from "qrcode.react";

const SCREENS = [
  { label: "Homepage", short: "Imagine" },
  { label: "Sneaker brief", short: "Brief" },
  { label: "Matching", short: "Match" },
  { label: "KalaJobs", short: "Quote" },
  { label: "KalaProof", short: "Track" },
  { label: "KalaCollab", short: "Collaborate" },
  { label: "KalaPassport", short: "Passport" },
];

const DEMO_COLLAB = [
  { number: "01", role: "Tailor", task: "Garment construction", maker: "Sample maker · tailoring", amount: "₹2,100", dependency: "Starts first", status: "Accepted" },
  { number: "02", role: "Embroidery artisan", task: "Kantha surface work", maker: "Sample maker · embroidery", amount: "₹1,900", dependency: "After construction", status: "Accepted" },
  { number: "03", role: "Painting artisan", task: "Finishing details", maker: "Sample maker · hand painting", amount: "₹1,300", dependency: "After surface work", status: "Accepted" },
];

const DEMO_NOTE = "Preloaded demonstration data — not a real customer, artisan, order or payment.";

function DemoBadge({ children = "Demonstration" }: { children?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-saffron/50 bg-saffron/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7a4f10]">
      <Sparkles className="size-3" /> {children}
    </span>
  );
}

function StageTag({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
        active
          ? "border-maroon bg-maroon text-ivory"
          : done
            ? "border-emerald/30 bg-emerald/[0.08] text-emerald"
            : "border-maroon/15 bg-ivory/60 text-ink/45"
      }`}
    >
      {done ? <CheckCircle2 className="size-3" /> : <span className="size-1.5 rounded-full bg-current opacity-60" />}
      {label}
    </span>
  );
}

function ScreenOne({ next }: { next: () => void }) {
  return (
    <div className="grid items-center gap-8 lg:grid-cols-[1.02fr_0.98fr]">
      <div>
        <DemoBadge>Judge walkthrough · 3–4 minutes</DemoBadge>
        <h1 className="mt-4 max-w-[13ch] font-display text-[2.5rem] font-semibold leading-[1.02] tracking-tight text-maroon sm:text-5xl lg:text-6xl">
          Your Imagination.
          <br />
          <span className="text-vermilion">Their Craftsmanship.</span>
        </h1>
        <p className="mt-5 max-w-[54ch] text-sm leading-relaxed text-ink/65 md:text-base">
          One customer idea. One skilled Indian artisan. Rule-based CraftFit connects the two — the
          hands, the concept and the craft stay human. Follow the workflow below without signing in,
          typing or touching a payment screen.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={next} className="rounded-full bg-maroon px-6 py-6 text-sm font-semibold text-ivory hover:bg-maroon-deep">
            Start customising <ArrowRight className="size-4" />
          </Button>
          <Link
            to="/demo/live"
            className="inline-flex items-center gap-2 rounded-full border border-maroon/25 bg-card px-5 py-3 text-sm font-semibold text-maroon transition hover:border-maroon/55 hover:bg-parchment"
          >
            Explore the populated demo <ArrowRight className="size-4" />
          </Link>
          <Link
            to="/customer/create-request"
            className="inline-flex items-center gap-2 rounded-full border border-teal/35 bg-card px-5 py-3 text-sm font-semibold text-teal-deep transition hover:border-teal/70 hover:bg-mint/40"
          >
            Use the real flow
          </Link>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="size-3.5" /> No sign-in needed for this demo · no live AI call · no payment gateway
        </p>
        <dl className="mt-8 grid max-w-lg grid-cols-3 gap-3 border-t border-maroon/12 pt-5">
          {[
            ["1:1", "artisan per piece"],
            ["8%", "fee shown upfront"],
            ["0", "AI-generated concepts"],
          ].map(([value, label]) => (
            <div key={label}>
              <dt className="font-display text-2xl font-semibold text-maroon">{value}</dt>
              <dd className="mt-0.5 text-[10px] uppercase leading-snug tracking-wide text-muted-foreground">{label}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="relative mx-auto w-full max-w-[540px]">
        <div className="absolute -inset-4 rounded-[2rem] border border-gold/35 bg-gradient-to-br from-peach/60 via-ivory to-mint/50" />
        <div className="relative overflow-hidden rounded-[1.4rem] border border-maroon/20 bg-[#fdf2de] shadow-[0_30px_70px_-40px_rgba(70,17,38,0.5)]">
          <div className="flex items-center justify-between border-b border-maroon/12 px-4 py-2.5">
            <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-maroon/60">Customer brief · demo</span>
            <span className="rounded-full bg-teal/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-teal">Ready</span>
          </div>
          <img src="/demo-sneaker.svg" alt="Illustrative white sneakers with mandala artwork" className="aspect-[3/2] w-full object-cover" />
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-xl font-semibold leading-tight text-maroon">{demoRequest.title}</p>
                <p className="mt-1 text-[11px] text-ink/55">{demoRequest.productDescription}</p>
              </div>
              <p className="shrink-0 font-display text-xl font-semibold text-maroon">{formatInr(demoRequest.budgetInr)}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {demoSkills.slice(0, 3).map((skill) => (
                <span key={skill} className="rounded-full border border-teal/25 bg-teal/[0.06] px-2 py-1 text-[9px] font-semibold text-teal-deep">
                  {skill}
                </span>
              ))}
            </div>
            <p className="mt-2 text-[8px] leading-relaxed text-muted-foreground">{DEMO_NOTE}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScreenTwo({ next }: { next: () => void }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
      <section className="overflow-hidden rounded-2xl border border-maroon/15 bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-maroon/10 px-5 py-3">
          <div className="flex items-center gap-2">
            <DemoBadge>Preloaded customer request</DemoBadge>
            <span className="rounded-full border border-teal/25 bg-teal/[0.06] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-teal">
              Open for quotes
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground">Request DEMO-001</span>
        </div>
        <div className="grid gap-5 p-5 sm:grid-cols-[190px_1fr]">
          <div>
            <img src="/demo-sneaker.svg" alt="Uploaded product reference: white canvas sneakers" className="w-full rounded-xl border border-maroon/15 object-cover" />
            <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
              <Camera className="size-3" /> Illustrative product image
            </p>
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold leading-tight text-maroon">{demoRequest.title}</h2>
            <p className="mt-1 text-[11px] text-ink/55">{demoRequest.productDescription}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                { icon: IndianRupee, label: "Budget ceiling", value: formatInr(demoRequest.budgetInr) },
                { icon: CalendarDays, label: "Needed by", value: formatDate(demoRequest.deadline) },
                { icon: MapPin, label: "Delivery", value: `${demoRequest.city} · shipping` },
                { icon: Scissors, label: "Product supplied by", value: "Customer" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-lg bg-parchment/70 p-2.5">
                  <p className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-muted-foreground">
                    <Icon className="size-3" /> {label}
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold text-ink">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-maroon/10 px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal">What the customer wants</p>
          <p className="mt-2 text-[13px] leading-relaxed text-ink/70">{demoRequest.description}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[demoRequest.craftPreference, "Footwear customisation", demoRequest.materialsKnown, demoRequest.placement, demoRequest.colours].map((item) => (
              <span key={item} className="rounded-full border border-maroon/15 bg-ivory px-2.5 py-1 text-[10px] text-ink/60">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <section className="rounded-2xl border border-teal/25 bg-teal/[0.04] p-5">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-teal">
            <Sparkles className="size-3.5" /> CRAFT DNA · structured from the brief
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-ink/55">
            Deterministic rules read the description and suggest the skills the work needs. The customer
            still approves every field — no artwork is generated.
          </p>
          <div className="mt-3 space-y-2">
            <div className="rounded-lg bg-card p-2.5">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Skills identified</p>
              <p className="mt-0.5 text-[11px] font-medium text-ink">{demoSkills.join(" · ")}</p>
            </div>
            <div className="rounded-lg bg-card p-2.5">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Materials to confirm</p>
              <p className="mt-0.5 text-[11px] text-ink/75">{demoMaterials.slice(0, 2).join(" · ")}</p>
            </div>
            <div className="rounded-lg bg-card p-2.5">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Production note</p>
              <p className="mt-0.5 text-[11px] leading-snug text-ink/70">{demoNotes[0]}</p>
            </div>
          </div>
        </section>
        <section className="rounded-2xl border border-gold/40 bg-ivory/70 p-4">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-maroon">
            <Info className="size-3.5" /> Why this is safe to show
          </p>
          <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-ink/60">
            <li>· This request is preloaded demo data, labelled throughout.</li>
            <li>· No photo was uploaded; the image is an illustration.</li>
            <li>· The real flow requires ownership confirmation and a private upload.</li>
          </ul>
        </section>
        <Button onClick={next} className="w-full rounded-full bg-maroon px-5 py-6 text-sm font-semibold text-ivory hover:bg-maroon-deep">
          See the matching artisans <ArrowRight className="size-4" />
        </Button>
      </aside>
    </div>
  );
}

function ScreenThree({ next }: { next: () => void }) {
  const strong = demoMatches[0];
  const second = demoMatches[1];
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <DemoBadge>Rule-based matching · same helper as the live app</DemoBadge>
          <h2 className="mt-3 font-display text-3xl font-semibold text-maroon">The brief finds the hands.</h2>
          <p className="mt-1 max-w-[70ch] text-sm leading-relaxed text-ink/60">
            Skills, product, material, budget, availability, location and portfolio relevance are
            weighted. The explanation below is generated from those fields — not from an AI guess.
          </p>
        </div>
        <div className="rounded-xl border border-maroon/15 bg-card px-3 py-2 text-right">
          <p className="text-[9px] uppercase tracking-wide text-muted-foreground">Eligible profiles</p>
          <p className="font-display text-2xl font-semibold text-maroon">{demoMatches.filter((item) => item.match.eligible).length}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="overflow-hidden rounded-2xl border border-emerald/30 bg-card">
          <div className="relative aspect-[16/8] overflow-hidden bg-[radial-gradient(circle_at_30%_20%,#f7d5bb,#fff4de_55%,#d8f0e9)]">
            <img src="/demo-concept.svg" alt="Illustrative mandala concept sketch" className="size-full object-cover" />
            <span className="absolute left-3 top-3 rounded-full bg-emerald px-2.5 py-1 text-[10px] font-semibold text-ivory">
              {strong.match.score}% computed fit
            </span>
            <span className="absolute right-3 top-3 rounded-full border border-saffron/50 bg-ivory/95 px-2.5 py-1 text-[9px] font-semibold text-[#7a4f10]">
              {strong.sampleLabel}
            </span>
          </div>
          <div className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-display text-2xl font-semibold text-maroon">{strong.displayName}</h3>
                <p className="text-[11px] text-ink/55">{strong.headline}</p>
                <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <MapPin className="size-3" /> {strong.city} · ships nationwide · {strong.turnaroundDays}-day typical turnaround
                </p>
              </div>
              <span className="rounded-full border border-maroon/15 bg-parchment px-2.5 py-1 text-[10px] font-semibold text-maroon">
                Budget fit
              </span>
            </div>
            <div className="mt-3 rounded-xl border border-teal/20 bg-teal/[0.04] p-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-teal">Why this artisan fits</p>
              <ul className="mt-1.5 space-y-1">
                {strong.match.reasons.map((reason) => (
                  <li key={reason} className="flex gap-1.5 text-[11px] leading-snug text-ink/65">
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-saffron" /> {reason}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {strong.match.breakdown.map((row) => (
                <div key={row.key} className="rounded-lg bg-parchment/70 px-2 py-1.5">
                  <p className="text-[8px] uppercase tracking-wide text-muted-foreground">{row.label}</p>
                  <p className="text-[11px] font-semibold text-ink">{row.score}/100</p>
                </div>
              ))}
            </div>
          </div>
        </article>

        <div className="space-y-4">
          <article className="rounded-2xl border border-maroon/15 bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-display text-lg font-semibold text-maroon">{second.displayName}</h3>
                <p className="text-[10px] text-ink/55">{second.headline}</p>
              </div>
              <span className="rounded-full border border-maroon/15 bg-parchment px-2 py-0.5 text-[9px] font-semibold text-ink/50">
                {second.match.score}% computed fit
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-ink/60">
              {second.match.eligible
                ? "Eligible, but the craft and product fit are weaker. The customer can still invite this artisan."
                : second.match.blockedReason}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {second.skills.slice(0, 3).map((skill) => (
                <span key={skill} className="rounded-full bg-parchment px-2 py-0.5 text-[9px] text-ink/55">{skill}</span>
              ))}
            </div>
          </article>
          <section className="rounded-2xl border border-gold/40 bg-ivory/70 p-4">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-maroon">
              <ShieldCheck className="size-3.5" /> Honest matching
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-ink/60">
              Scores are a fit signal, not a promise. No one pays for placement. The live app excludes
              labelled sample profiles from real customer matching; this screen uses them only because
              it is explicitly a demonstration.
            </p>
          </section>
          <Button onClick={next} className="w-full rounded-full bg-teal px-5 py-6 text-sm font-semibold text-ivory hover:bg-teal-deep">
            Open the artisan's KalaJobs <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ScreenFour({ next }: { next: () => void }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
      <section>
        <DemoBadge>Artisan workspace · KalaJobs</DemoBadge>
        <h2 className="mt-3 font-display text-3xl font-semibold text-maroon">The same request, on the maker's side.</h2>
        <p className="mt-1 text-sm leading-relaxed text-ink/60">
          Meera sees the customer's brief, the computed fit and the budget ceiling. Nothing is duplicated
          in a separate dashboard — this is the same request record.
        </p>

        <article className="mt-4 overflow-hidden rounded-2xl border border-maroon/15 bg-card">
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-maroon/10 px-4 py-3">
            <div>
              <span className="rounded-full bg-teal/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-teal">New match</span>
              <p className="mt-1 font-display text-lg font-semibold text-ink">{demoRequest.title}</p>
              <p className="text-[10px] text-ink/50">Meera's fit: {demoMatches[0].match.score}% · {demoRequest.city} · shipping</p>
            </div>
            <p className="font-display text-lg font-semibold text-maroon">{formatInr(demoRequest.budgetInr)}</p>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-[150px_1fr]">
            <img src="/demo-sneaker.svg" alt="Customer product reference" className="w-full rounded-lg border border-maroon/15 object-cover" />
            <div>
              <p className="line-clamp-4 text-[11px] leading-relaxed text-ink/65">{demoRequest.description}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {demoSkills.map((skill) => (
                  <span key={skill} className="rounded-full border border-teal/25 bg-teal/[0.05] px-2 py-0.5 text-[9px] font-medium text-teal-deep">{skill}</span>
                ))}
              </div>
              <p className="mt-2 flex items-center gap-1 text-[10px] text-emerald">
                <CheckCircle2 className="size-3" /> Same request ID · customer cannot see Meera's quote yet
              </p>
            </div>
          </div>
        </article>

        <div className="mt-3 rounded-xl border border-maroon/15 bg-card p-3">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-teal">
            <Info className="size-3.5" /> Why this was matched
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-ink/60">{demoMatches[0].match.reasons.join(" ")}</p>
        </div>
      </section>

      <aside className="space-y-4">
        <section className="rounded-2xl border border-maroon/15 bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal">Artisan quote</p>
              <h3 className="font-display text-xl font-semibold text-maroon">Priced honestly, below the ceiling</h3>
            </div>
            <Quote className="size-5 text-maroon/30" />
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-ink/60">{demoQuote.terms}</p>
          <dl className="mt-3 space-y-1.5 text-[11px]">
            {[
              ["Materials", demoQuote.materialsInr],
              ["Labour", demoQuote.labourInr],
              ["Preparation", demoQuote.preparationInr],
              ["Finishing", demoQuote.finishingInr],
              ["Packaging", demoQuote.packagingInr],
              ["Delivery", demoQuote.deliveryInr],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex justify-between gap-3">
                <dt className="text-ink/55">{label}</dt>
                <dd className="font-medium text-ink">{formatInr(Number(value))}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-2 border-t border-maroon/10 pt-2">
            <div className="flex justify-between text-sm font-semibold text-maroon">
              <span>Total</span>
              <span>{formatInr(demoQuote.totalInr)}</span>
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
              <span>Platform fee 8%</span>
              <span>{formatInr(demoQuote.platformFeeInr)}</span>
            </div>
            <div className="mt-0.5 flex justify-between text-[10px] font-medium text-emerald">
              <span>Artisan payout</span>
              <span>{formatInr(demoQuote.netPayoutInr)} net</span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-emerald/10 px-2.5 py-1 text-[10px] font-semibold text-emerald">Quote accepted</span>
            <span className="rounded-full border border-maroon/15 px-2.5 py-1 text-[10px] text-ink/55">{demoQuote.timelineDays} days</span>
            <span className="rounded-full border border-maroon/15 px-2.5 py-1 text-[10px] text-ink/55">{demoQuote.revisionRounds} revision</span>
          </div>
        </section>
        <section className="rounded-2xl border border-teal/25 bg-teal/[0.04] p-4">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-teal">
            <Lock className="size-3.5" /> What is real here
          </p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-ink/60">
            The customer request, quote and project are one connected record in the live app. This
            walkthrough is preloaded, so no account or real payment is involved.
          </p>
        </section>
        <Button onClick={next} className="w-full rounded-full bg-maroon px-5 py-6 text-sm font-semibold text-ivory hover:bg-maroon-deep">
          Follow the project in KalaProof <ArrowRight className="size-4" />
        </Button>
      </aside>
    </div>
  );
}

function ScreenFive() {
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <DemoBadge>KalaTrust + KalaProof · demonstration timeline</DemoBadge>
          <h2 className="mt-3 font-display text-3xl font-semibold text-maroon">From an idea to evidence.</h2>
          <p className="mt-1 max-w-[72ch] text-sm leading-relaxed text-ink/60">
            The artisan creates the concept. The customer approves it. Production is documented. Payment
            and handover follow the agreed states — with no fake “paid” badge.
          </p>
        </div>
        <span className="rounded-full border border-emerald/30 bg-emerald/10 px-3 py-1.5 text-[10px] font-semibold text-emerald">
          Project completed
        </span>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-maroon/15 bg-card p-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-teal">KalaTrust state</p>
            <div className="flex flex-wrap gap-1.5">
              {demoTrustStages.map((stage, index) => (
                <StageTag key={stage} label={stage} active={index === demoTrustStages.length - 1} done={index < demoTrustStages.length - 1} />
              ))}
            </div>
            <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
              <Info className="size-3" /> This demo is not a real payment. The live app uses Razorpay when configured, otherwise a clearly labelled sandbox.
            </p>
          </div>

          <div className="rounded-2xl border border-maroon/15 bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal">KalaProof timeline</p>
              <span className="text-[9px] uppercase tracking-wide text-muted-foreground">Append-only evidence</span>
            </div>
            <ol className="mt-3 space-y-0">
              {demoProofEvents.map((event, index) => (
                <li key={event.key} className="relative flex gap-3 pb-4 last:pb-0">
                  <div className="flex flex-col items-center">
                    <span className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold ${index === demoProofEvents.length - 1 ? "border-emerald bg-emerald text-ivory" : "border-teal/30 bg-teal/[0.06] text-teal"}`}>
                      {index === demoProofEvents.length - 1 ? <CheckCircle2 className="size-3.5" /> : index + 1}
                    </span>
                    {index < demoProofEvents.length - 1 && <span className="mt-1 h-full w-px flex-1 bg-maroon/12" />}
                  </div>
                  <div className="min-w-0 flex-1 pb-1">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <p className="text-xs font-semibold text-ink">{event.title}</p>
                      <span className="text-[9px] uppercase tracking-wide text-muted-foreground">{event.day}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-ink/60">{event.note}</p>
                    <p className="mt-0.5 text-[9px] text-muted-foreground">Recorded by {event.actor}</p>
                    {event.image && (
                      <img src={event.image} alt="" className="mt-2 h-24 w-full max-w-[240px] rounded-lg border border-maroon/12 object-cover" />
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <aside className="space-y-4">
          <section className="relative overflow-hidden rounded-2xl border border-maroon/20 bg-[linear-gradient(120deg,#7b2040,#651a34,#4a1738)] p-5 text-ivory">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-saffron">The promise</p>
            <p className="mt-2 font-display text-2xl font-semibold leading-tight">CraftFit connects.<br />Artisans create.</p>
            <ul className="mt-3 space-y-2 text-[11px] leading-relaxed text-ivory/75">
              <li className="flex gap-1.5"><BadgeCheck className="mt-0.5 size-3.5 shrink-0 text-saffron" /> Concepts are made and uploaded by the artisan.</li>
              <li className="flex gap-1.5"><Hammer className="mt-0.5 size-3.5 shrink-0 text-saffron" /> Production starts only after payment and concept approval.</li>
              <li className="flex gap-1.5"><FileText className="mt-0.5 size-3.5 shrink-0 text-saffron" /> Every stage is evidence, not a marketing claim.</li>
              <li className="flex gap-1.5"><Truck className="mt-0.5 size-3.5 shrink-0 text-saffron" /> Payout waits for delivery confirmation.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-gold/40 bg-ivory/70 p-4">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-maroon">
              <Users className="size-3.5" /> The two-sided loop
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-ink/60">
              Customer brief → CRAFT DNA skills → matched artisans → quote → accepted project → artisan
              concept → KalaProof. One record, two workspaces.
            </p>
          </section>

          <div className="grid gap-2">
            <Link to="/customer/create-request" className="inline-flex items-center justify-center gap-1.5 rounded-full bg-maroon px-4 py-2.5 text-xs font-semibold text-ivory">
              Try the live customer flow <ChevronRight className="size-3.5" />
            </Link>
            <Link to="/for-artisans" className="inline-flex items-center justify-center gap-1.5 rounded-full border border-teal/35 bg-card px-4 py-2.5 text-xs font-semibold text-teal-deep">
              Explore the artisan offer <ChevronRight className="size-3.5" />
            </Link>
            <Link to="/" className="inline-flex items-center justify-center gap-1.5 rounded-full border border-maroon/20 px-4 py-2.5 text-xs font-semibold text-maroon">
              Back to KALकारी <ChevronRight className="size-3.5" />
            </Link>
          </div>
          <p className="text-[9px] leading-relaxed text-muted-foreground">{DEMO_NOTE}</p>
        </aside>
      </div>
    </div>
  );
}

function ScreenSix() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="overflow-hidden rounded-2xl border border-maroon/15 bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-maroon/10 px-5 py-3">
          <div className="flex items-center gap-2"><DemoBadge>KalaCollab · illustrative plan</DemoBadge><span className="rounded-full border border-teal/25 bg-teal/[0.06] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-teal">Draft proposal</span></div>
          <span className="text-[10px] text-muted-foreground">3 makers · 3 tasks</span>
        </div>
        <div className="p-5">
          <h2 className="font-display text-3xl font-semibold leading-none text-maroon">The Heirloom Jacket</h2>
          <p className="mt-2 text-[11px] leading-relaxed text-ink/55">A tailored jacket, Kantha embroidery and a hand-painted finishing panel, coordinated as one plan. Each maker accepts their own scope before the customer approves the whole piece.</p>
          <div className="mt-5 space-y-2">
            {DEMO_COLLAB.map((task) => (
              <article key={task.number} className="grid gap-2 border border-maroon/12 bg-[#fcf9f2] p-3 sm:grid-cols-[28px_1fr_auto]">
                <span className="font-display text-sm italic text-maroon/40">{task.number}</span>
                <div><p className="text-[11px] font-semibold text-ink/75">{task.role} · {task.task}</p><p className="mt-0.5 text-[9px] text-ink/45">{task.maker} · {task.dependency}</p><p className="mt-1 text-[9px] text-teal">Amount proposed by the maker: {task.amount}</p></div>
                <span className="self-start border border-emerald/30 bg-emerald/[0.06] px-2 py-1 text-center text-[8px] font-semibold uppercase tracking-wide text-emerald">{task.status}</span>
              </article>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-maroon/12 pt-4">
            <div><p className="text-[9px] uppercase tracking-wide text-muted-foreground">Combined proposed budget</p><p className="font-display text-2xl font-semibold text-maroon">₹5,300</p></div>
            <p className="max-w-[32ch] text-right text-[9px] leading-relaxed text-muted-foreground">3/3 artisans accepted. Customer approval is still required. No funds are split or transferred.</p>
          </div>
        </div>
      </section>
      <aside className="space-y-4">
        <section className="rounded-2xl border border-teal/25 bg-teal/[0.04] p-5">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-teal"><Users className="size-3.5" /> Human approval, not auto-assignment</p>
          <ul className="mt-3 space-y-2 text-[11px] leading-relaxed text-ink/60">
            <li>· A task match is an invitation. Each maker accepts or declines.</li>
            <li>· The customer approves the complete plan and its total.</li>
            <li>· Dependencies are enforced: finishing waits for surface work.</li>
            <li>· Progress notes and completion approvals stay with the task.</li>
          </ul>
        </section>
        <section className="rounded-2xl border border-gold/40 bg-ivory/70 p-4">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-maroon"><Lock className="size-3.5" /> Payment boundary</p>
          <p className="mt-2 text-[11px] leading-relaxed text-ink/60">KalaCollab coordinates scope and approvals. It does not initiate payouts. Task amounts remain proposals until a separate, verified payment arrangement exists.</p>
        </section>
        <div className="grid gap-2">
          <Link to="/kalacollab" className="inline-flex items-center justify-center gap-1.5 rounded-full bg-maroon px-4 py-2.5 text-xs font-semibold text-ivory">How KalaCollab works <ChevronRight className="size-3.5" /></Link>
          <Link to="/customer/create-request" className="inline-flex items-center justify-center gap-1.5 rounded-full border border-teal/35 bg-card px-4 py-2.5 text-xs font-semibold text-teal-deep">Start a real brief <ChevronRight className="size-3.5" /></Link>
        </div>
        <p className="text-[9px] leading-relaxed text-muted-foreground">{DEMO_NOTE}</p>
      </aside>
    </div>
  );
}

function ScreenSeven() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <article className="relative overflow-hidden border border-maroon/30 bg-[#fbf6eb] p-5 shadow-[0_25px_60px_-45px_rgba(45,25,19,0.5)] sm:p-8">
        <div className="pointer-events-none absolute inset-3 border border-gold/35" />
        <div className="relative">
          <div className="flex items-start justify-between gap-3"><div><p className="font-display text-lg font-semibold text-maroon">KALकारी</p><p className="mt-1 text-[8px] uppercase tracking-[0.16em] text-teal">Digital product passport · demo</p></div><p className="text-right text-[8px] uppercase tracking-wide text-ink/35">KalaProof record</p></div>
          <div className="mt-8 text-center"><p className="text-[8px] uppercase tracking-[0.16em] text-maroon/50">The recorded story of</p><h2 className="mt-2 font-display text-4xl font-medium leading-none text-ink">The Heirloom Jacket</h2><p className="mt-2 text-[9px] uppercase tracking-[0.14em] text-teal">Clothing · Kantha embroidery</p></div>
          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <div><p className="text-[8px] uppercase tracking-[0.12em] text-muted-foreground">The hands</p><p className="mt-2 text-[11px] font-semibold text-ink/75">Sample tailor</p><p className="text-[9px] text-ink/45">Delhi · garment construction</p><p className="mt-2 text-[11px] font-semibold text-ink/75">Sample embroidery artisan</p><p className="text-[9px] text-ink/45">Lucknow · Kantha surface work</p><p className="mt-2 text-[11px] font-semibold text-ink/75">Sample painting artisan</p><p className="text-[9px] text-ink/45">Jaipur · hand-painted finishing</p></div>
            <div><p className="text-[8px] uppercase tracking-[0.12em] text-muted-foreground">Recorded milestones</p><ol className="mt-2 space-y-2">{["Plan approved by customer", "Construction approved", "Surface work approved", "Finishing approved", "Project completed"].map((item) => <li key={item} className="flex items-start gap-1.5 text-[9px] leading-snug text-ink/60"><CheckCircle2 className="mt-0.5 size-3 shrink-0 text-emerald" />{item}</li>)}</ol></div>
          </div>
          <div className="mt-7 flex items-end justify-between gap-3 border-t border-maroon/15 pt-4"><p className="max-w-[44ch] text-[8px] leading-relaxed text-ink/45"><ShieldCheck className="mr-1 inline size-3" />Recorded from KalaProof. Not an independent authenticity certificate, appraisal or guarantee.</p><div className="border border-maroon/15 bg-[#f7f2e8] p-1.5"><QRCodeSVG value="https://kalakari.freebuff.app/" size={64} bgColor="#f7f2e8" fgColor="#28231f" level="M" /></div></div>
        </div>
      </article>
      <aside className="space-y-4">
        <section className="rounded-2xl border border-teal/25 bg-teal/[0.04] p-5">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-teal"><ShieldCheck className="size-3.5" /> Provenance with a privacy boundary</p>
          <ul className="mt-3 space-y-2 text-[11px] leading-relaxed text-ink/60">
            <li>· The customer owns the record and explicitly turns public sharing on.</li>
            <li>· Artisans are credited by name, craft and city.</li>
            <li>· Conversations, addresses, payments and private files are excluded.</li>
            <li>· The QR opens the public summary only when sharing is enabled.</li>
          </ul>
        </section>
        <div className="grid gap-2">
          <Link to="/explore-artisans" className="inline-flex items-center justify-center gap-1.5 rounded-full bg-maroon px-4 py-2.5 text-xs font-semibold text-ivory">Explore the makers <ChevronRight className="size-3.5" /></Link>
          <Link to="/" className="inline-flex items-center justify-center gap-1.5 rounded-full border border-maroon/20 px-4 py-2.5 text-xs font-semibold text-maroon">Back to KALकारी <ChevronRight className="size-3.5" /></Link>
        </div>
        <p className="text-[9px] leading-relaxed text-muted-foreground">{DEMO_NOTE} The passport illustration is not a real completed order.</p>
      </aside>
    </div>
  );
}

export default function Demo() {
  const [screen, setScreen] = useState(0);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") setScreen((value) => Math.min(SCREENS.length - 1, value + 1));
      if (event.key === "ArrowLeft") setScreen((value) => Math.max(0, value - 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <PublicShell>
      <div className="min-h-[calc(100vh-88px)] bg-parchment">
        <div className="border-b border-gold/25 bg-[#fcf1de]">
          <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
            <div className="flex items-center gap-2">
              <DemoBadge>Judge demo · 3–4 minutes</DemoBadge>
              <span className="hidden text-[10px] text-muted-foreground sm:inline">No sign-in · no typing · no payment</span>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {SCREENS.map((item, index) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setScreen(index)}
                  className={`rounded-full px-2.5 py-1.5 text-[10px] font-semibold transition ${
                    screen === index ? "bg-maroon text-ivory" : "text-ink/50 hover:bg-maroon/5 hover:text-maroon"
                  }`}
                  aria-current={screen === index ? "step" : undefined}
                >
                  <span className="mr-1 opacity-60">{index + 1}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sm:hidden">{item.short}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1240px] px-4 py-6 md:px-8 md:py-8">
          {screen === 0 && <ScreenOne next={() => setScreen(1)} />}
          {screen === 1 && <ScreenTwo next={() => setScreen(2)} />}
          {screen === 2 && <ScreenThree next={() => setScreen(3)} />}
          {screen === 3 && <ScreenFour next={() => setScreen(4)} />}
          {screen === 4 && <ScreenFive />}
          {screen === 5 && <ScreenSix />}
          {screen === 6 && <ScreenSeven />}
        </div>

        <div className="sticky bottom-0 border-t border-gold/25 bg-parchment/95 backdrop-blur">
          <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-3 px-4 py-3 md:px-8">
            <Button
              variant="outline"
              className="rounded-full border-maroon/25"
              disabled={screen === 0}
              onClick={() => setScreen((value) => Math.max(0, value - 1))}
            >
              <ArrowLeft className="size-4" /> Back
            </Button>
            <p className="hidden text-[10px] text-muted-foreground sm:block">
              Screen {screen + 1} of {SCREENS.length} · use arrow keys or the buttons
            </p>
            {screen < SCREENS.length - 1 ? (
              <Button onClick={() => setScreen((value) => Math.min(SCREENS.length - 1, value + 1))} className="rounded-full bg-maroon px-5 text-ivory hover:bg-maroon-deep">
                Next <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Link to="/" className="inline-flex items-center gap-1.5 rounded-full bg-teal px-5 py-2 text-xs font-semibold text-ivory">
                <Star className="size-3.5" /> Back to home
              </Link>
            )}
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
