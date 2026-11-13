import { PublicShell } from "@/components/public/PublicShell";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { formatInr } from "@/lib/marketplace";
import type { CanvasState } from "@/lib/design-types";
import { useQuery } from "convex/react";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  ClipboardCheck,
  GitBranch,
  IndianRupee,
  MapPin,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { lazy, Suspense } from "react";
import { Link } from "react-router";

const Garment3DPreview = lazy(() => import("@/components/studio/Garment3DPreview"));

const DEMO_CANVAS: CanvasState = {
  productType: "jacket",
  silhouette: "Open-front jacket",
  fabricColor: "#7a302a",
  patternId: "none",
  layers: [
    { id: "demo-lotus", kind: "motif", motifId: "lotus", x: 450, y: 390, size: 360, rotation: 0, color: "#d8a65b", opacity: 1 },
    { id: "demo-border", kind: "motif", motifId: "border", x: 450, y: 705, size: 260, rotation: 0, color: "#f7f2e8", opacity: 0.9 },
  ],
};

const STATUS_LABELS: Record<string, string> = {
  approved: "Approved",
  accepted: "Accepted",
  in_progress: "In progress",
  submitted: "Submitted",
  invited: "Invited",
  proposed: "Proposed",
  declined: "Declined",
};

function Chip({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "gold" | "green" | "neutral" }) {
  const styles =
    tone === "green"
      ? "border-emerald/25 bg-emerald/[0.08] text-emerald"
      : tone === "gold"
        ? "border-gold/45 bg-gold/[0.12] text-[#7a4f10]"
        : "border-maroon/15 bg-parchment/70 text-ink/60";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${styles}`}>
      {children}
    </span>
  );
}

export default function DemoLive() {
  const data = useQuery(api.demo.showcase);

  return (
    <PublicShell>
      <main className="min-h-screen bg-parchment">
        <section className="border-b border-maroon/10 bg-[radial-gradient(circle_at_18%_0%,rgba(216,166,91,0.2),transparent_42%),linear-gradient(180deg,#f7f2e8,#efe4d2)]">
          <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 lg:py-20">
            <Chip tone="gold"><Sparkles className="size-3" /> Demo environment · sample records</Chip>
            <div className="mt-5 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
              <div>
                <h1 className="max-w-[14ch] font-display text-4xl font-semibold leading-[0.98] tracking-tight text-maroon sm:text-5xl lg:text-6xl">
                  A living craft marketplace, ready to explore.
                </h1>
                <p className="mt-5 max-w-[62ch] text-sm leading-relaxed text-ink/65 md:text-base">
                  Every profile, brief, quote, production stage and passport below is a persisted
                  Convex record created by the demo seed. It is clearly labelled sample data — not a
                  claim of real users, verification or payments.
                </p>
              </div>
              <div className="rounded-2xl border border-maroon/15 bg-card/80 p-4 backdrop-blur">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-maroon/55">Prepared demo dataset</p>
                <p className="mt-2 font-display text-2xl text-maroon">Phase 3 · seeded and idempotent</p>
                <p className="mt-1 text-xs leading-relaxed text-ink/55">
                  Seeded through an admin-protected mutation. Repeat runs create no duplicates, and
                  reset removes only the recorded demo entities.
                </p>
              </div>
            </div>

            <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                [data?.counts.artisanUser ?? "—", "artisan profiles"],
                [data?.counts.portfolio ?? "—", "portfolio pieces"],
                [data?.counts.projects ?? "—", "projects"],
                [data?.counts.reviews ?? "—", "reviews"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-maroon/12 bg-card/70 p-4">
                  <p className="font-display text-3xl font-semibold text-maroon">{value}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-ink/50">{label}</p>
                  <p className="mt-2 text-[9px] uppercase tracking-[0.14em] text-gold">Sample figures</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl space-y-16 px-5 py-12 sm:px-8 lg:py-16">
          <section>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">Discover the makers</p>
                <h2 className="mt-1 font-display text-3xl font-semibold text-maroon">A marketplace with real depth</h2>
                <p className="mt-2 max-w-[60ch] text-sm text-ink/55">
                  Every card opens a full profile with skills, materials, availability and portfolio work.
                </p>
              </div>
              <Link to="/explore-artisans" className="inline-flex items-center gap-2 text-sm font-semibold text-maroon underline decoration-gold/60 underline-offset-4">
                Open artisan discovery <ArrowRight className="size-4" />
              </Link>
            </div>

            {!data ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((item) => <div key={item} className="h-80 animate-pulse rounded-2xl bg-maroon/[0.06]" />)}
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.artisans.slice(0, 6).map((artisan, index) => (
                  <Link
                    key={artisan.id}
                    to={`/artisans/${artisan.id}`}
                    className="group overflow-hidden rounded-2xl border border-maroon/15 bg-card transition hover:-translate-y-0.5 hover:border-maroon/35 hover:shadow-[0_18px_45px_-30px_rgba(70,17,38,0.55)]"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-parchment">
                      {artisan.previewUrl ? (
                        <img src={artisan.previewUrl} alt={`Sample ${artisan.headline}`} className="size-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                      ) : (
                        <div className="grid size-full place-items-center font-display text-4xl text-maroon/30">{artisan.displayName.charAt(0)}</div>
                      )}
                      <span className="absolute left-3 top-3 rounded-full bg-ivory/90 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-maroon shadow-sm">
                        Demo profile
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-display text-xl font-semibold leading-tight text-maroon">{artisan.displayName}</p>
                          <p className="mt-1 text-[11px] font-medium text-ink/55">{artisan.headline}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1 text-xs font-semibold text-maroon">
                          <Star className="size-3.5 fill-gold text-gold" />
                          {(artisan.averageRating ?? 5).toFixed(1)}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-ink/50">
                        <span className="inline-flex items-center gap-1"><MapPin className="size-3" /> {artisan.city}</span>
                        <span className="size-1 rounded-full bg-maroon/20" />
                        <span className="capitalize">{artisan.availability}</span>
                        <span className="size-1 rounded-full bg-maroon/20" />
                        <span>{artisan.completedProjects} demo projects</span>
                      </div>
                      <p className="mt-3 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">{artisan.sampleLabel}</p>
                      {index === 0 && <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-emerald">Not verified · fictional demo maker</p>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {data?.makerWorkspace && (
            <section id="maker-workspace" className="overflow-hidden rounded-3xl border border-maroon/15 bg-card scroll-mt-24">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-maroon/10 bg-[#fbf5e9] px-5 py-5 sm:px-7">
                <div className="flex items-center gap-3">
                  <span className="grid size-12 place-items-center rounded-full bg-maroon font-display text-xl text-ivory">{data.makerWorkspace.name.charAt(0)}</span>
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-gold">Artisan workspace preview · read-only sample</p>
                    <h2 className="mt-0.5 font-display text-2xl font-semibold text-maroon">{data.makerWorkspace.name}</h2>
                    <p className="text-[11px] text-ink/50">{data.makerWorkspace.headline} · {data.makerWorkspace.city}</p>
                  </div>
                </div>
                <Link to="/auth?returnTo=%2Fartisan%2Fdashboard" className="inline-flex items-center gap-2 rounded-full border border-maroon/20 bg-card px-4 py-2 text-[10px] font-semibold text-maroon hover:bg-parchment">
                  Sign in for the live workspace <ArrowRight className="size-3.5" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4 sm:p-7">
                {([
                  [formatInr(data.makerWorkspace.confirmedEarningsInr), "confirmed earnings", Wallet],
                  [String(data.makerWorkspace.activeProjects), "active projects", Clock3],
                  [String(data.makerWorkspace.completedProjects), "completed", CheckCircle2],
                  [data.makerWorkspace.averageRating ? `${data.makerWorkspace.averageRating} ★` : "New", `${data.makerWorkspace.reviewCount} sample reviews`, Star],
                ] as [string, string, LucideIcon][]).map(([value, label, Icon]) => (
                  <div key={String(label)} className="rounded-xl border border-maroon/10 bg-parchment/50 p-3">
                    <Icon className="size-3.5 text-gold" />
                    <p className="mt-2 font-display text-xl font-semibold text-maroon">{value}</p>
                    <p className="text-[9px] uppercase tracking-wide text-ink/45">{label}</p>
                  </div>
                ))}
              </div>
              <div className="grid gap-4 border-t border-maroon/10 p-5 sm:p-7 lg:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-maroon/60"><TrendingUp className="size-3.5 text-gold" /> Recommended opportunities</p>
                    <span className="text-[9px] text-ink/40">Live CraftFit scores</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {data.makerWorkspace.matches.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-maroon/20 p-4 text-xs text-ink/50">No eligible open briefs for this profile today. The live workspace shows a useful empty state instead of invented work.</p>
                    ) : data.makerWorkspace.matches.map((match) => (
                      <div key={match.id} className="rounded-xl border border-maroon/12 bg-parchment/40 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold text-maroon">{match.title}</p>
                            <p className="mt-0.5 text-[10px] text-ink/50">{formatInr(match.budgetInr)} · {match.city} · due {match.deadline ?? "open"}</p>
                          </div>
                          <span className="shrink-0 rounded-full bg-emerald/10 px-2.5 py-1 text-[10px] font-bold text-emerald">{match.matchScore}% match</span>
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-[10px] leading-relaxed text-ink/55">{match.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-maroon/60"><ClipboardCheck className="size-3.5 text-gold" /> Work already in the workspace</p>
                  <div className="mt-3 rounded-xl border border-maroon/12 bg-parchment/40 p-4">
                    <p className="text-xs leading-relaxed text-ink/60">This preview is calculated from the seeded projects, quotations, payouts and reviews for <strong>{data.makerWorkspace.name}</strong>. It is not another user's private account, and it cannot perform approvals or payments.</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-ink/55">
                      <span className="rounded-lg bg-card px-2.5 py-2">{data.makerWorkspace.pendingQuotes} pending quotations</span>
                      <span className="rounded-lg bg-card px-2.5 py-2">{data.makerWorkspace.invitations} collaboration invitations</span>
                      <span className="rounded-lg bg-card px-2.5 py-2">{data.makerWorkspace.portfolioCount} portfolio pieces</span>
                      <span className="rounded-lg bg-card px-2.5 py-2">{formatInr(data.makerWorkspace.pendingEarningsInr)} pending payout</span>
                    </div>
                    <p className="mt-3 text-[9px] leading-relaxed text-muted-foreground">{data.makerWorkspace.sampleLabel} Confirmed earnings are platform-recorded sandbox amounts, not live transfers.</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">The studio · live WebGL preview</p>
              <h2 className="mt-1 max-w-[14ch] font-display text-3xl font-semibold leading-tight text-maroon">Turn the product. The motif stays on the cloth.</h2>
              <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-ink/55">
                This is a real interactive 3D preview of the sample jacket, with fabric colour and
                surface-attached motifs. Drag to orbit, scroll to zoom and switch to the back view.
                Open the Studio to edit placement, change the base product and save a version.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button asChild className="rounded-full bg-maroon px-5 text-ivory hover:bg-maroon-deep">
                  <Link to="/studio">Open the Design Studio <ArrowRight className="size-4" /></Link>
                </Button>
                <span className="inline-flex items-center rounded-full border border-maroon/15 bg-card px-3 py-2 text-[10px] font-medium text-ink/50">
                  Sign-in is required to save a private design
                </span>
              </div>
              <p className="mt-4 text-[9px] leading-relaxed text-muted-foreground">
                Studio availability: jacket, T-shirt and tote use procedural original meshes. Other
                products use the working 2D placement editor rather than a misleading 3D button.
              </p>
            </div>
            <Suspense fallback={<div className="grid min-h-[420px] place-items-center rounded-xl border border-maroon/20 bg-[#fbf6eb] text-xs text-maroon/55">Preparing 3D preview…</div>}>
              <Garment3DPreview canvas={DEMO_CANVAS} />
            </Suspense>
          </section>

          <section className="rounded-3xl border border-maroon/15 bg-[#fbf5e9] p-5 sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">KalaCollab · real persisted stages</p>
                <h2 className="mt-1 font-display text-3xl font-semibold text-maroon">One jacket, three makers</h2>
                <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-ink/55">
                  These production stages come from the seeded collaboration records. Dependencies,
                  artisan assignments and approval states are real data — the plan is not advanced by
                  animation alone.
                </p>
              </div>
              <Link to="/kalacollab" className="inline-flex items-center gap-2 rounded-full border border-maroon/20 bg-card px-4 py-2 text-xs font-semibold text-maroon hover:bg-parchment">
                How KalaCollab works <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {data?.plans.map((plan) => (
                <article key={plan.id} className="rounded-2xl border border-maroon/12 bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gold">{plan.label.replace(/_/g, " ")}</p>
                      <h3 className="mt-1 font-display text-xl font-semibold leading-tight text-maroon">{plan.title}</h3>
                    </div>
                    <Chip tone={plan.status === "completed" ? "green" : plan.status === "ready" ? "gold" : "neutral"}>
                      {plan.status.replace(/_/g, " ")}
                    </Chip>
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-ink/55">
                    <IndianRupee className="size-3.5" /> {formatInr(plan.combinedBudgetInr)} <span className="font-normal text-ink/40">combined sample budget</span>
                  </p>
                  <div className="mt-4 space-y-0">
                    {plan.stages.map((stage, index) => (
                      <div key={stage.position} className="relative flex gap-3 pb-4 last:pb-0">
                        {index < plan.stages.length - 1 && <span className="absolute left-[13px] top-7 h-[calc(100%-1rem)] w-px bg-maroon/15" />}
                        <span className={`relative z-10 grid size-7 shrink-0 place-items-center rounded-full border text-[10px] font-bold ${stage.status === "approved" ? "border-emerald/40 bg-emerald/10 text-emerald" : stage.status === "in_progress" ? "border-gold bg-gold/20 text-[#7a4f10]" : "border-maroon/20 bg-parchment text-maroon/50"}`}>
                          {stage.status === "approved" ? <CheckCircle2 className="size-3.5" /> : stage.position}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-ink">{stage.title}</p>
                          <p className="mt-0.5 truncate text-[10px] text-ink/50">{stage.artisanName} · {stage.role}</p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${stage.status === "approved" ? "bg-emerald/10 text-emerald" : stage.status === "in_progress" ? "bg-gold/15 text-[#7a4f10]" : "bg-maroon/[0.06] text-ink/50"}`}>
                              {STATUS_LABELS[stage.status] ?? stage.status}
                            </span>
                            <span className="text-[9px] text-ink/40">{formatInr(stage.amountInr)}</span>
                            {stage.dependsOnPositions.length > 0 && <span className="inline-flex items-center gap-1 text-[9px] text-ink/40"><GitBranch className="size-2.5" /> after {stage.dependsOnPositions.join(", ")}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-3xl border border-maroon/15 bg-card p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">KalaPassport · public demo records</p>
              <h2 className="mt-1 font-display text-3xl font-semibold text-maroon">Open a finished story</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink/55">
                Public sharing is explicitly enabled only for these sample completed projects. Each
                passport shows the known design direction, artisan attribution, craft techniques and
                production timeline.
              </p>
              <div className="mt-5 space-y-2">
                {data?.passports.map((passport) => (
                  <Link
                    key={passport.token}
                    to={`/passport/${passport.token}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-maroon/12 bg-parchment/60 px-4 py-3 transition hover:border-maroon/30 hover:bg-parchment"
                  >
                    <span>
                      <span className="block text-sm font-semibold text-maroon">{passport.projectTitle}</span>
                      <span className="mt-0.5 flex items-center gap-1 text-[10px] text-ink/45"><BadgeCheck className="size-3" /> Sample passport · public link enabled</span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-maroon/50" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-maroon p-6 text-ivory">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">Judge route</p>
              <h2 className="mt-2 font-display text-3xl font-semibold leading-tight">Explore the product, not a slideshow.</h2>
              <p className="mt-3 text-sm leading-relaxed text-ivory/70">
                The marketplace, profiles, collaboration states and passport all read from persisted
                records. Signed-in actions still use the real Convex permissions.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="rounded-full bg-ivory px-5 text-maroon hover:bg-parchment">
                  <Link to="/explore-artisans">Explore artisans <ArrowRight className="size-4" /></Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full border-ivory/30 bg-transparent px-5 text-ivory hover:bg-ivory/10">
                  <Link to="/demo">Open walkthrough</Link>
                </Button>
              </div>
              <div className="mt-7 grid grid-cols-3 gap-2 border-t border-ivory/15 pt-4 text-[10px] text-ivory/65">
                <span className="inline-flex items-center gap-1.5"><Users className="size-3 text-gold" /> 22 makers</span>
                <span className="inline-flex items-center gap-1.5"><Clock3 className="size-3 text-gold" /> 3 live states</span>
                <span className="inline-flex items-center gap-1.5"><Sparkles className="size-3 text-gold" /> Sample only</span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </PublicShell>
  );
}
