import { Mandala } from "@/components/art/Ornaments";
import { PublicShell } from "@/components/public/PublicShell";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  GitBranch,
  Handshake,
  Layers3,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { Link } from "react-router";

const STEPS = [
  {
    number: "01",
    title: "Decompose the brief",
    body: "CRAFT DNA reads the skills already stored on the request. Deterministic rules propose the craft tasks — tailoring, embroidery, painting, finishing — with dependencies.",
    icon: Layers3,
  },
  {
    number: "02",
    title: "Match each task",
    body: "CraftFit scores real artisans for each task using skills, product and material fit, availability, budget, delivery and portfolio relevance. Every score is explainable.",
    icon: Sparkles,
  },
  {
    number: "03",
    title: "See one proposal",
    body: "Tasks, proposed artisans, dependencies, individual task amounts and the combined planned budget appear together before anyone commits.",
    icon: Boxes,
  },
  {
    number: "04",
    title: "Approve with people",
    body: "Each artisan must accept their task. The customer approves the complete collaboration plan. No artisan is silently assigned; no work starts from an unconfirmed plan.",
    icon: Handshake,
  },
  {
    number: "05",
    title: "Coordinate the making",
    body: "The shared workspace tracks task ownership, dependency order, progress notes and completion approvals. Every contribution stays attached to the piece.",
    icon: GitBranch,
  },
  {
    number: "06",
    title: "Record the contribution",
    body: "Each completed task records the maker, scope and approval. The finished project can carry that history into its KalaPassport.",
    icon: CheckCircle2,
  },
];

export default function KalaCollabPage() {
  const { isAuthenticated } = useAuth();
  const start = isAuthenticated ? "/customer/create-request" : "/auth?returnTo=%2Fcustomer%2Fcreate-request";

  return (
    <PublicShell>
      <section className="relative overflow-hidden border-b border-maroon/10">
        <div className="pointer-events-none absolute inset-0 craft-paper" />
        <Mandala className="pointer-events-none absolute -right-48 -top-44 size-[620px] opacity-[0.06]" />
        <div className="relative mx-auto grid max-w-[1360px] gap-12 px-4 py-16 md:px-8 md:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-gold/70" />
              <span className="label-caps text-[9px] text-teal">KalaCollab · multiple hands, one creation</span>
            </div>
            <h1 className="mt-6 max-w-[12ch] font-display text-5xl font-medium leading-[0.88] tracking-[-0.03em] text-ink sm:text-7xl">
              Some ideas need more than one pair of hands.
            </h1>
            <p className="mt-6 max-w-[54ch] text-sm leading-[1.85] text-ink/60">
              A tailored jacket might need a tailor, an embroiderer and a painter. KalaCollab
              coordinates those contributions inside one customer brief — with explicit artisan
              acceptance, dependencies and a single human-approved plan.
            </p>
            <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
              <Link to={start} className="inline-flex items-center justify-center gap-2 rounded-full bg-maroon px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-ivory transition hover:bg-maroon-deep">
                Start a collaboration brief <ArrowRight className="size-3.5" />
              </Link>
              <Link to="/explore-artisans" className="inline-flex items-center justify-center gap-2 rounded-full border border-maroon/25 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-maroon transition hover:border-maroon/60">
                Explore makers
              </Link>
            </div>
            <p className="mt-4 max-w-[50ch] text-[9px] leading-relaxed text-muted-foreground">
              KalaCollab is a coordination plan, not an automatic payroll. Task amounts are
              proposals; funds are never split, released or transferred by this feature.
            </p>
          </div>

          <div className="relative border border-maroon/20 bg-[#fcf9f2] p-5 shadow-[0_28px_60px_-45px_rgba(45,25,19,0.65)] sm:p-7">
            <div className="flex items-center justify-between gap-2 border-b border-maroon/12 pb-3">
              <div>
                <p className="label-caps text-[8px] text-teal">Collaboration proposal</p>
                <p className="mt-1 font-display text-2xl font-semibold text-ink">The Heirloom Jacket</p>
              </div>
              <span className="border border-saffron/45 bg-saffron/[0.08] px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.08em] text-[#7d5a24]">Draft</span>
            </div>
            <div className="mt-4 space-y-2">
              {[
                ["01", "Tailor", "Garment construction", "₹2,400 planned", "No dependency"],
                ["02", "Embroidery artisan", "Kantha surface work", "₹1,800 planned", "After construction"],
                ["03", "Painting artisan", "Finishing details", "₹1,100 planned", "After surface work"],
              ].map(([number, role, task, amount, dependency]) => (
                <div key={number} className="grid grid-cols-[24px_1fr_auto] gap-3 border border-maroon/12 bg-parchment/55 p-3">
                  <span className="font-display text-xs italic text-maroon/40">{number}</span>
                  <div>
                    <p className="text-[10px] font-semibold text-ink/75">{role}</p>
                    <p className="text-[9px] text-ink/45">{task} · {dependency}</p>
                  </div>
                  <p className="text-right text-[9px] font-medium text-maroon">{amount}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-maroon/12 pt-3">
              <div>
                <p className="label-caps text-[8px] text-muted-foreground">Combined planned budget</p>
                <p className="mt-0.5 font-display text-2xl font-semibold text-maroon">₹5,300</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] uppercase tracking-[0.1em] text-teal">3 makers · 1 plan</p>
                <p className="text-[8px] text-muted-foreground">Payments remain separate</p>
              </div>
            </div>
            <p className="mt-3 flex items-start gap-1.5 border border-gold/35 bg-ivory/60 p-2.5 text-[9px] leading-relaxed text-ink/55">
              <ShieldCheck className="mt-0.5 size-3 shrink-0 text-maroon/50" />
              Illustrative plan. Real task amounts are proposed by each artisan after accepting their
              invitation. No funds move until the existing payment flow is completed.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1360px] px-4 py-20 md:px-8 md:py-24">
        <div className="max-w-[620px]">
          <p className="label-caps text-teal">A coordinated making system</p>
          <h2 className="mt-3 font-display text-4xl font-medium leading-none tracking-[-0.02em] text-ink md:text-5xl">
            Built around the work, not a group chat.
          </h2>
          <p className="mt-4 text-sm leading-[1.8] text-ink/55">
            KalaCollab extends the existing request, match, quote and evidence models. Single-artisan
            projects stay exactly as they are.
          </p>
        </div>

        <div className="mt-10 grid gap-px overflow-hidden border border-maroon/15 bg-maroon/15 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step) => (
            <article key={step.number} className="bg-[#fcf9f2] p-5 md:p-6">
              <div className="flex items-start justify-between">
                <span className="font-display text-[11px] italic text-maroon/40">{step.number}</span>
                <step.icon className="size-4 text-teal/65" />
              </div>
              <h3 className="mt-7 font-display text-xl font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-[10px] leading-[1.75] text-ink/55">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-maroon/10 bg-[#efe6d8] py-16 md:py-20">
        <div className="mx-auto grid max-w-[1360px] gap-8 px-4 md:px-8 lg:grid-cols-3">
          {[
            {
              icon: Users,
              title: "Explicit participation",
              body: "A match is a proposal, not an assignment. Each artisan reviews the scope, amount and dependency before accepting.",
            },
            {
              icon: Wallet,
              title: "No invisible money movement",
              body: "Planned task amounts are labelled. There are no automatic splits, transfers or releases until provider-supported payout rules exist and are tested.",
            },
            {
              icon: ShieldCheck,
              title: "Existing protections stay",
              body: "Single-project quotes, concept approval, payment verification, KalaProof and disputes remain the source of truth.",
            },
          ].map((item) => (
            <div key={item.title}>
              <item.icon className="size-5 text-maroon/55" />
              <h3 className="mt-4 font-display text-xl font-semibold text-ink">{item.title}</h3>
              <p className="mt-2 text-[11px] leading-[1.75] text-ink/55">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1360px] px-4 py-20 md:px-8 md:py-24">
        <div className="relative overflow-hidden border border-maroon/20 bg-maroon px-6 py-14 text-center text-ivory md:px-12 md:py-20">
          <Mandala className="pointer-events-none absolute -right-24 -top-28 size-[400px] opacity-10" />
          <Mandala className="pointer-events-none absolute -bottom-32 -left-24 size-[360px] opacity-10" />
          <p className="relative label-caps text-[9px] text-gold">One brief, several traditions</p>
          <h2 className="relative mx-auto mt-4 max-w-[16ch] font-display text-4xl font-medium leading-[0.95] tracking-[-0.02em] md:text-6xl">
            Let the making meet in one place.
          </h2>
          <p className="relative mx-auto mt-4 max-w-[48ch] text-sm leading-relaxed text-ivory/65">
            Start with a brief. KalaCollab will show whether the work needs more than one maker, and
            what each contribution asks for.
          </p>
          <Link to={start} className="relative mt-7 inline-flex items-center gap-2 rounded-full bg-[#f7f2e8] px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-maroon transition hover:bg-white">
            Start a brief <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
