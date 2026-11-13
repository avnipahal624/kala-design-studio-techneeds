import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ProjectWorkspace } from "@/components/marketplace/ProjectWorkspace";
import { QuoteBreakdown } from "@/components/marketplace/QuoteBreakdown";
import { assessCraftFeasibility, FeasibilityPanel } from "@/components/studio/FeasibilityPanel";
import { CRAFTS } from "@/lib/crafts";
import { StatusPill, StatCard } from "@/components/marketplace/Bits";
import { UploadImages, type UploadedImage } from "@/components/marketplace/UploadImages";
import { ArtisanCard } from "@/components/marketplace/ArtisanCard";
import { KalaCollabPanel } from "@/components/marketplace/KalaCollabPanel";
import { GarmentArt } from "@/components/art/garments";
import { PortalShell } from "@/components/portal/PortalShell";
import { Button } from "@/components/ui/button";
import {
  CRAFT_SKILLS, MATERIALS, REQUEST_CATEGORIES,
  feeBreakdown, formatDate, formatDateTime, formatInr, statusLabel,
} from "@/lib/marketplace";
import { useAuth } from "@/hooks/use-auth";
import { demoRequest } from "@/lib/demoScenario";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  ArrowRight, Ban, BriefcaseBusiness, CheckCircle2, ChevronLeft,
  ChevronRight, FileText, Handshake, ImagePlus, IndianRupee, Loader2,
  Package, Palette, Plus, ReceiptText, ShieldCheck, Sparkles, Users, Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";

function EmptyState({ icon: Icon, title, body, action }: { icon: typeof FileText; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-maroon/25 bg-card/60 px-6 py-12 text-center">
      <Icon className="mx-auto size-8 text-maroon/30" />
      <p className="mt-3 font-display text-xl text-maroon">{title}</p>
      <p className="mx-auto mt-2 max-w-[52ch] text-xs leading-relaxed text-ink/55">{body}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function CustomerDashboard() {
  const { user } = useAuth();
  const requests = useQuery(api.requests.listMine);
  const projects = useQuery(api.projects.mine);
  const quotes = useQuery(api.quotes.forCustomer);
  const profile = useQuery(api.account.profiles);
  const designs = useQuery(api.designs.list);
  const collaborations = useQuery(api.collaboration.mine);
  const activeCollabs = (collaborations ?? []).filter((plan) => !["completed", "cancelled"].includes(plan.status));

  const myProjects = (projects ?? []).filter((project) => project.role === "customer");
  const active = myProjects.filter((p) => !["completed", "cancelled", "refunded"].includes(p.status));
  const actionNeeded = {
    quotes: (quotes ?? []).filter((quote) => quote.status === "submitted").length,
    concepts: myProjects.filter((p) => p.status === "funded").length,
    review: myProjects.filter((p) => p.status === "delivered").length,
    pay: myProjects.filter((p) => p.status === "awaiting_payment").length,
  };

  return (
    <PortalShell
      role="customer"
      title={`नमस्ते${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`}
      hindi="ग्राहक"
      subtitle="Your briefs, quotes and projects in one place."
      actions={<Link to="/customer/create-request" className="hidden items-center gap-1.5 rounded-full bg-maroon px-4 py-2 text-xs font-semibold text-ivory sm:inline-flex"><Plus className="size-3.5" /> New brief</Link>}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open briefs" value={(requests ?? []).filter((r) => r.status === "open").length} hint="Accepting quotes" tone="teal" />
        <StatCard label="Quotes to review" value={actionNeeded.quotes} hint="From matched artisans" tone="saffron" />
        <StatCard label="Active projects" value={active.length} hint="Funded or in making" tone="maroon" />
        <StatCard label="Completed" value={myProjects.filter((p) => p.status === "completed").length} hint="Your craft archive" tone="emerald" />
      </div>

      {(actionNeeded.concepts > 0 || actionNeeded.review > 0 || actionNeeded.pay > 0) && (
        <section className="mt-4 rounded-2xl border border-saffron/45 bg-saffron/[0.08] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a5a12]">Needs you</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {actionNeeded.pay > 0 && <Link to="/customer/projects" className="rounded-full bg-maroon px-3 py-1.5 text-[11px] font-semibold text-ivory">{actionNeeded.pay} project{actionNeeded.pay > 1 ? "s" : ""} awaiting payment</Link>}
            {actionNeeded.concepts > 0 && <Link to="/customer/projects" className="rounded-full bg-teal px-3 py-1.5 text-[11px] font-semibold text-ivory">{actionNeeded.concepts} concept{actionNeeded.concepts > 1 ? "s" : ""} to approve</Link>}
            {actionNeeded.review > 0 && <Link to="/customer/projects" className="rounded-full bg-emerald px-3 py-1.5 text-[11px] font-semibold text-ivory">{actionNeeded.review} delivery{actionNeeded.review > 1 ? "ies" : ""} to confirm</Link>}
          </div>
        </section>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-2xl border border-maroon/15 bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-maroon">Active projects</h2>
            <Link to="/customer/projects" className="text-[11px] font-semibold text-teal-deep">View all →</Link>
          </div>
          {projects === undefined ? (
            <div className="mt-3 h-32 animate-pulse rounded-xl bg-parchment" />
          ) : active.length === 0 ? (
            <div className="mt-3">
              <EmptyState icon={Package} title="No project in motion yet." body="Post a brief to start. Once you accept a quote and pay, the artisan can upload a concept for your approval." action={<Link to="/customer/create-request" className="rounded-full bg-maroon px-4 py-2 text-xs font-semibold text-ivory">Start a brief</Link>} />
            </div>
          ) : (
            <div className="mt-3 divide-y divide-maroon/10">
              {active.slice(0, 5).map((project) => (
                <Link key={project._id} to={`/customer/projects/${project._id}`} className="flex items-center gap-3 py-3 first:pt-1">
                  {project.imageUrl ? <img src={project.imageUrl} alt="" className="size-12 rounded-lg object-cover" /> : <span className="flex size-12 items-center justify-center rounded-lg bg-maroon/[0.06]"><Package className="size-5 text-maroon/40" /></span>}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{project.title}</p>
                    <p className="text-[11px] text-ink/55">{project.counterpartName} · {formatInr(project.amountInr)}</p>
                  </div>
                  <StatusPill kind="project" status={project.status} />
                  <ChevronRight className="size-4 text-maroon/30" />
                </Link>
              ))}
            </div>
          )}
        </section>

        <div className="space-y-4">
          <section className="rounded-2xl border border-maroon/15 bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-maroon">Your briefs</h2>
              <Link to="/customer/requests" className="text-[10px] font-semibold text-teal-deep">All →</Link>
            </div>
            {requests === undefined ? <div className="mt-2 h-20 animate-pulse rounded-lg bg-parchment" /> : requests.length === 0 ? <p className="mt-2 text-[11px] text-ink/50">No briefs yet.</p> : (
              <div className="mt-2 space-y-2">
                {requests.slice(0, 3).map((request) => (
                  <Link key={request._id} to={`/customer/requests/${request._id}`} className="block rounded-lg border border-maroon/10 bg-parchment/60 p-2.5">
                    <p className="truncate text-xs font-medium text-ink">{request.title}</p>
                    <p className="mt-0.5 text-[10px] text-ink/50">{request.quoteCount} quote{request.quoteCount === 1 ? "" : "s"} · {formatInr(request.budgetInr)} budget</p>
                  </Link>
                ))}
              </div>
            )}
          </section>
          <section className="rounded-2xl border border-maroon/15 bg-card p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-1.5 font-display text-lg font-semibold text-maroon"><Handshake className="size-4 text-teal" /> KalaCollab</h2>
              <Link to="/customer/requests" className="text-[10px] font-semibold text-teal-deep">Open plans →</Link>
            </div>
            {collaborations === undefined ? <div className="mt-2 h-12 animate-pulse bg-parchment" /> : activeCollabs.length === 0 ? (
              <p className="mt-2 text-[10px] leading-relaxed text-ink/50">No multi-maker plan yet. Open a brief to decompose it into craft tasks and coordinate more than one artisan.</p>
            ) : (
              <div className="mt-2 space-y-1.5">
                {activeCollabs.slice(0, 3).map((plan) => (
                  <Link key={plan._id} to={`/customer/requests/${plan.requestId}`} className="block border border-maroon/10 bg-parchment/55 p-2.5">
                    <p className="truncate text-[11px] font-medium text-ink/70">{plan.title}</p>
                    <p className="mt-0.5 text-[9px] uppercase tracking-[0.08em] text-muted-foreground">{plan.taskCount} tasks · {plan.acceptedCount} accepted · {plan.status.replace(/_/g, " ")}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-maroon/15 bg-card p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-1.5 font-display text-lg font-semibold text-maroon"><Palette className="size-4 text-teal" /> Saved designs</h2>
              <Link to="/creations" className="text-[10px] font-semibold text-teal-deep">Studio →</Link>
            </div>
            {designs === undefined ? <div className="mt-2 h-12 animate-pulse bg-parchment" /> : designs.length === 0 ? (
              <p className="mt-2 text-[10px] leading-relaxed text-ink/50">Your studio canvases will appear here. Every save keeps an immutable version.</p>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {designs.slice(0, 2).map((design) => (
                  <Link key={design._id} to={`/studio/${design._id}`} className="overflow-hidden border border-maroon/12 bg-parchment/45 transition hover:border-maroon/35">
                    <div className="bg-[#efe5d6]"><GarmentArt canvas={design.canvas} className="h-auto w-full" /></div>
                    <p className="truncate border-t border-maroon/10 px-2 py-1.5 text-[9px] font-medium text-ink/65">{design.title}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-gold/35 bg-ivory/70 p-4">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-maroon"><ShieldCheck className="size-3.5" /> Your protection</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-ink/60">Payments are tied to project states. A concept must be approved before production, and payout waits for your delivery confirmation.</p>
            <Link to="/trust-and-safety" className="mt-2 inline-block text-[10px] font-semibold text-teal-deep">Read the full policy →</Link>
          </section>
          {profile && !profile.customer && <p className="text-[10px] text-muted-foreground">Your customer profile is created automatically with your first brief.</p>}
        </div>
      </div>
    </PortalShell>
  );
}

export function CustomerRequests() {
  const requests = useQuery(api.requests.listMine);
  const [filter, setFilter] = useState("all");
  const filtered = (requests ?? []).filter((request) => filter === "all" || request.status === filter);

  return (
    <PortalShell role="customer" title="My requests" hindi="मेरी कल्पनाएँ" subtitle="Every brief you have posted, and where it stands." actions={<Link to="/customer/create-request" className="inline-flex items-center gap-1.5 rounded-full bg-maroon px-4 py-2 text-xs font-semibold text-ivory"><Plus className="size-3.5" /> New brief</Link>}>
      <div className="flex flex-wrap gap-1.5">
        {["all", "open", "quote_selected", "closed", "cancelled"].map((status) => (
          <button key={status} type="button" onClick={() => setFilter(status)} className={`rounded-full border px-3 py-1.5 text-[11px] font-medium capitalize ${filter === status ? "border-maroon bg-maroon text-ivory" : "border-maroon/20 bg-card text-ink/60"}`}>{status === "all" ? "All briefs" : statusLabel("request", status)}</button>
        ))}
      </div>
      {requests === undefined ? <div className="mt-4 h-48 animate-pulse rounded-2xl bg-card/70" /> : filtered.length === 0 ? (
        <div className="mt-4"><EmptyState icon={FileText} title="No briefs here." body="A brief is where it starts: the product, the idea, the budget and the deadline. It takes a few minutes and costs nothing." action={<Link to="/customer/create-request" className="rounded-full bg-maroon px-5 py-2.5 text-xs font-semibold text-ivory">Create a brief</Link>} /></div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {filtered.map((request) => (
            <Link key={request._id} to={`/customer/requests/${request._id}`} className="group overflow-hidden rounded-2xl border border-maroon/15 bg-card transition hover:border-maroon/40">
              <div className="flex gap-3 p-4">
                {request.imageUrl ? <img src={request.imageUrl} alt="" className="size-20 shrink-0 rounded-xl object-cover" /> : <span className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-maroon/[0.05]"><ImagePlus className="size-6 text-maroon/30" /></span>}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-sm font-semibold text-ink">{request.title}</p>
                    <StatusPill kind="request" status={request.status} />
                  </div>
                  <p className="mt-1 text-[11px] text-ink/55">{request.category} · {request.city}</p>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-ink/50">
                    <span>{formatInr(request.budgetInr)} budget</span>
                    <span>{request.quoteCount} quote{request.quoteCount === 1 ? "" : "s"}</span>
                    {request.bestQuoteInr ? <span>best {formatInr(request.bestQuoteInr)}</span> : null}
                    {request.deadline && <span>by {formatDate(request.deadline)}</span>}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PortalShell>
  );
}

export function CustomerRequestDetail() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const detail = useQuery(api.requests.getMine, requestId ? { requestId: requestId as Id<"customerRequests"> } : "skip");
  const matches = useQuery(api.artisans.matchesForRequest, requestId ? { requestId: requestId as Id<"customerRequests"> } : "skip");
  const invite = useMutation(api.requests.inviteArtisans);
  const accept = useMutation(api.quotes.accept);
  const decline = useMutation(api.quotes.decline);
  const close = useMutation(api.requests.close);
  const [busy, setBusy] = useState<string | null>(null);
  const [invited, setInvited] = useState<string[]>([]);

  if (!requestId) return null;
  if (detail === undefined) return <PortalShell role="customer" title="Brief"><div className="h-64 animate-pulse rounded-2xl bg-card" /></PortalShell>;
  if (detail === null) return <PortalShell role="customer" title="Brief not found"><p className="text-sm text-ink/60">This brief may have been removed.</p></PortalShell>;

  const { request, quotes, invitations, project } = detail;
  const activeQuotes = quotes.filter((quote) => quote.status === "submitted");

  async function run(key: string, fn: () => Promise<unknown>, success: string) {
    setBusy(key);
    try {
      await fn();
      toast.success(success);
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^[A-Z_]+:\s*/, "") : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <PortalShell role="customer" title={request.title} hindi="ब्रीफ" subtitle={`${request.category} · posted ${formatDate(request.createdAt)}`} actions={<Link to="/customer/requests" className="hidden items-center gap-1 text-xs font-semibold text-teal-deep sm:inline-flex"><ChevronLeft className="size-4" /> All briefs</Link>}>
      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-4">
          <section className="rounded-2xl border border-maroon/15 bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal">The brief</p>
                <h2 className="font-display text-xl font-semibold text-maroon">{request.title}</h2>
              </div>
              <StatusPill kind="request" status={request.status} />
            </div>
            <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-ink/70">{request.description}</p>
            {request.specialInstructions && <div className="mt-3 rounded-lg bg-saffron/[0.08] p-3 text-[11px] text-ink/65"><strong>Must keep:</strong> {request.specialInstructions}</div>}
            {request.images.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {request.images.map((image) => image.url && <a key={image.storageId} href={image.url} target="_blank" rel="noreferrer"><img src={image.url} alt="Reference" className="size-24 rounded-lg border border-maroon/15 object-cover" /></a>)}
              </div>
            )}
            <dl className="mt-4 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
              {[
                ["Budget ceiling", formatInr(request.budgetInr)],
                ["Deadline", request.deadline ? formatDate(request.deadline) : "Flexible"],
                ["Fulfilment", request.fulfilment === "shipping" ? "Shipping" : "Local handoff"],
                ["City", request.city],
              ].map(([label, value]) => <div key={label} className="rounded-lg bg-parchment/70 p-2"><dt className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-0.5 font-medium text-ink">{value}</dd></div>)}
            </dl>
            <div className="mt-4 rounded-xl border border-teal/20 bg-teal/[0.04] p-3">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-teal"><Sparkles className="size-3.5" /> CRAFT DNA · rule-based brief structure</p>
              <div className="mt-2 grid gap-2 text-[11px] sm:grid-cols-2">
                <div><p className="text-muted-foreground">Skills the work needs</p><p className="mt-0.5 font-medium text-ink/75">{request.requiredSkills.join(", ") || "To be confirmed with the artisan"}</p></div>
                <div><p className="text-muted-foreground">Likely materials</p><p className="mt-0.5 font-medium text-ink/75">{request.suggestedMaterials.join(", ") || "Not stated"}</p></div>
              </div>
              {request.productionNotes.length > 0 && <ul className="mt-2 space-y-0.5 text-[10px] text-ink/55">{request.productionNotes.slice(0, 3).map((note) => <li key={note}>· {note}</li>)}</ul>}
            </div>
            {request.status === "open" && <button type="button" disabled={busy !== null} onClick={() => void run("close", () => close({ requestId: request._id }), "Brief closed")} className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-semibold text-vermilion"><Ban className="size-3" /> Close this brief</button>}
          </section>

          <KalaCollabPanel requestId={request._id} requestStatus={request.status} />

          <section className="rounded-2xl border border-maroon/15 bg-card p-5">
            <div className="flex items-center justify-between">
              <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal">Quotes</p><h2 className="font-display text-xl font-semibold text-maroon">{activeQuotes.length} open · {quotes.length} total</h2></div>
              <ReceiptText className="size-5 text-maroon/35" />
            </div>
            {quotes.length === 0 ? (
              <p className="mt-3 rounded-lg border border-dashed border-maroon/20 px-4 py-6 text-center text-xs text-ink/50">No quotes yet. Invite artisans below, or wait for matched makers to respond.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {quotes.map((quote) => (
                  <article key={quote._id} className={`rounded-xl border p-4 ${quote.status === "accepted" ? "border-emerald/40 bg-emerald/[0.04]" : "border-maroon/15"}`}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-ink">{quote.artisanName}</p>
                        <p className="text-[10px] text-ink/55">{quote.artisanCity} · {quote.artisanSkills.slice(0, 2).join(" · ")}</p>
                      </div>
                      <StatusPill kind="quote" status={quote.status} />
                    </div>
                    <div className="mt-2"><QuoteBreakdown quote={quote} compact /></div>
                    {quote.note && <p className="mt-2 rounded-lg bg-parchment/60 p-2 text-[11px] text-ink/65">{quote.note}</p>}
                    {quote.status === "submitted" && request.status === "open" && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" className="rounded-full bg-maroon text-ivory hover:bg-maroon-deep" disabled={busy !== null} onClick={() => void run(quote._id, async () => { const result = await accept({ quoteId: quote._id }); navigate(`/customer/projects/${result.projectId}`); }, "Quote accepted — project created")}>
                          {busy === quote._id ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />} Accept quote
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-full border-maroon/20" disabled={busy !== null} onClick={() => void run(`decline-${quote._id}`, () => decline({ quoteId: quote._id }), "Quote declined")}>Not this one</Button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
            {project && <Link to={`/customer/projects/${project._id}`} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald">Open the project <ArrowRight className="size-3.5" /></Link>}
          </section>

          <section className="rounded-2xl border border-maroon/15 bg-card p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal">CraftFit matches</p>
            <h2 className="font-display text-xl font-semibold text-maroon">Artisans who fit this work</h2>
            <p className="mt-1 text-[11px] text-ink/55">Ranked by craft, materials, budget, capacity, city and lead time. Scores are explainable; nobody paid for placement.</p>
            {matches === undefined ? <div className="mt-3 h-32 animate-pulse rounded-xl bg-parchment" /> : matches.length === 0 ? (
              <p className="mt-3 rounded-lg border border-dashed border-maroon/20 px-4 py-5 text-xs text-ink/50">No eligible profiles yet. You can still invite artisans from the directory.</p>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {matches.slice(0, 6).map((artisan) => (
                  <div key={artisan.id} className="space-y-2">
                    <ArtisanCard artisan={artisan} showMatch />
                    <Button size="sm" variant="outline" className="w-full rounded-full border-teal/30 text-teal-deep" disabled={busy !== null || invitations.some((i) => i.artisanId === artisan.id)} onClick={() => void run(`invite-${artisan.id}`, async () => { await invite({ requestId: request._id, artisanIds: [artisan.id as Id<"users">] }); setInvited((prev) => [...prev, artisan.id]); }, "Invitation sent")}>
                      {invitations.some((i) => i.artisanId === artisan.id) || invited.includes(artisan.id) ? "Invited" : "Invite to quote"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {invitations.length > 0 && <p className="mt-3 text-[10px] text-ink/50">Invitations sent: {invitations.length}. Invited artisans see the brief in KalaJobs.</p>}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-gold/35 bg-ivory/70 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-maroon">What happens next</p>
            <ol className="mt-2 space-y-2 text-[11px] leading-relaxed text-ink/60">
              <li>1. Accept a quote. A project is created and the amount is reserved for payment.</li>
              <li>2. Pay into the project. The artisan sees it is funded.</li>
              <li>3. The artisan uploads a concept. You approve or request changes.</li>
              <li>4. Making starts. Progress is documented in KalaProof.</li>
              <li>5. You confirm delivery, then the payout is released.</li>
            </ol>
          </section>
          <section className="rounded-2xl border border-maroon/15 bg-card p-4">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-maroon"><Users className="size-3.5" /> Invite anyone</p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink/55">CraftFit is a starting point. Browse the full directory and invite an artisan whose work fits, even if they are not in the list.</p>
            <Link to={`/explore-artisans?craft=${encodeURIComponent(request.requiredSkills[0] ?? "")}`} className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-teal-deep">Open directory <ArrowRight className="size-3" /></Link>
          </section>
          <section className="rounded-2xl border border-maroon/15 bg-card p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Brief details</p>
            <dl className="mt-2 space-y-1.5 text-[11px]">
              <div className="flex justify-between gap-2"><dt className="text-ink/50">Product supplied by</dt><dd className="text-right text-ink/75">{request.customerSuppliesProduct ? "You" : "Artisan"}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-ink/50">Craft preference</dt><dd className="text-right text-ink/75">{request.craftPreference || "Open"}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-ink/50">Colours</dt><dd className="text-right text-ink/75">{request.colours || "Not specified"}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-ink/50">Placement</dt><dd className="text-right text-ink/75">{request.placement || "Not specified"}</dd></div>
            </dl>
          </section>
        </aside>
      </div>
    </PortalShell>
  );
}

type KalaInsight = {
  craftStyle: string;
  likelyMaterials: string[];
  requiredSkills: string[];
  clarifyingQuestions: string[];
  uncertainties: string[];
  confidence: string;
};

type AnalysisState = {
  status: string;
  reason?: string;
  insight?: KalaInsight;
  fallback?: KalaInsight;
  visionUsed?: boolean;
};

const EMPTY_FORM = {
  title: "",
  category: "Clothing",
  productDescription: "",
  conditionNotes: "",
  description: "",
  craftPreference: "",
  colours: "",
  placement: "",
  materialsKnown: "",
  specialInstructions: "",
  budgetInr: 7000,
  deadline: "",
  city: "",
  fulfilment: "shipping" as "shipping" | "local_handoff",
  customerSuppliesProduct: true,
  ownershipConfirmed: false,
};

export function CreateRequest() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const create = useMutation(api.requests.create);
  const analyze = useAction(api.kalavision.analyzeDraft);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ ...EMPTY_FORM, category: params.get("category") ?? EMPTY_FORM.category, craftPreference: params.get("craft") ?? "" });
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisState | null>(null);
  const [analysing, setAnalysing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [minDeadline] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10));

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function loadSneakerExample() {
    setForm((prev) => ({
      ...prev,
      title: demoRequest.title,
      category: demoRequest.category,
      productDescription: demoRequest.productDescription,
      description: demoRequest.description,
      craftPreference: demoRequest.craftPreference,
      colours: demoRequest.colours,
      placement: demoRequest.placement,
      materialsKnown: demoRequest.materialsKnown,
      budgetInr: demoRequest.budgetInr,
      deadline: demoRequest.deadline,
      city: demoRequest.city,
      fulfilment: demoRequest.fulfilment,
      customerSuppliesProduct: true,
      ownershipConfirmed: false,
    }));
    toast.success("Sneaker example loaded. Add your own product photo to publish it.");
  }

  const budgetFee = feeBreakdown(form.budgetInr);
  const insight = analysis?.insight ?? analysis?.fallback;
  const inferredCraft = useMemo(
    () =>
      CRAFTS.find((craft) => {
        const needle = form.craftPreference.trim().toLowerCase();
        if (!needle) return false;
        return craft.name.toLowerCase().includes(needle) || needle.includes(craft.name.toLowerCase());
      }),
    [form.craftPreference],
  );
  const feasibility = useMemo(
    () =>
      assessCraftFeasibility({
        category: form.category,
        craftId: inferredCraft?.id,
        budgetInr: form.budgetInr,
        deadline: form.deadline || undefined,
        materialsKnown: form.materialsKnown,
        customerSuppliesProduct: form.customerSuppliesProduct,
        hasReference: images.length > 0,
      }),
    [form.category, form.budgetInr, form.deadline, form.materialsKnown, form.customerSuppliesProduct, images.length, inferredCraft?.id],
  );

  async function runAnalysis() {
    setAnalysing(true);
    try {
      const result = await analyze({
        category: form.category,
        description: form.description,
        craftPreference: form.craftPreference || undefined,
        materialsKnown: form.materialsKnown || undefined,
        placement: form.placement || undefined,
        colours: form.colours || undefined,
        deadline: form.deadline || undefined,
        budgetInr: Number(form.budgetInr),
        customerSuppliesProduct: form.customerSuppliesProduct,
        imageCount: images.length,
      });
      setAnalysis(result as AnalysisState);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "KalaVision could not run.");
    } finally {
      setAnalysing(false);
    }
  }

  const canContinue =
    step === 1
      ? form.title.trim().length >= 5 && form.productDescription.trim().length >= 12 && images.length > 0
      : step === 2
        ? form.description.trim().length >= 20 && (form.customerSuppliesProduct || form.description.trim().length >= 40) && form.ownershipConfirmed
        : step === 4
          ? form.budgetInr >= 500 && form.city.trim().length >= 2
          : true;

  async function submit() {
    setSubmitting(true);
    try {
      const result = await create({
        title: form.title,
        category: form.category,
        productDescription: form.productDescription,
        conditionNotes: form.conditionNotes || undefined,
        ownershipConfirmed: form.ownershipConfirmed,
        description: form.description,
        craftPreference: form.craftPreference || undefined,
        colours: form.colours || undefined,
        placement: form.placement || undefined,
        materialsKnown: form.materialsKnown || undefined,
        specialInstructions: form.specialInstructions || undefined,
        budgetInr: Number(form.budgetInr),
        deadline: form.deadline || undefined,
        city: form.city,
        fulfilment: form.fulfilment,
        customerSuppliesProduct: form.customerSuppliesProduct,
        images: images.map((image) => ({ storageId: image.storageId, name: image.name, contentType: image.contentType, size: image.size })),
      });
      toast.success(`Brief published — ${result.eligibleMatches} eligible artisan${result.eligibleMatches === 1 ? "" : "s"} matched.`);
      navigate(`/customer/requests/${result.requestId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^[A-Z_]+:\s*/, "") : "Could not publish the brief.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PortalShell role="customer" title="New customisation brief" hindi="नई कल्पना" subtitle="One idea, clearly told. You can invite artisans after it goes live.">
      <div className="mx-auto max-w-[900px]">
        <ol className="mb-4 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
          {["Product", "The story", "Direction", "Budget & timing", "KalaVision", "Review"].map((label, index) => (
            <li key={label} className={`rounded-lg border px-2 py-2 text-center ${step === index + 1 ? "border-maroon bg-maroon text-ivory" : step > index + 1 ? "border-emerald/30 bg-emerald/[0.06] text-emerald" : "border-maroon/15 bg-card text-ink/45"}`}>
              <span className="block text-[9px] font-bold">0{index + 1}</span>
              <span className="text-[10px] font-medium">{label}</span>
            </li>
          ))}
        </ol>

        <div className="rounded-2xl border border-maroon/15 bg-card p-5 md:p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="font-display text-2xl font-semibold text-maroon">What are we customising?</h2><p className="mt-1 text-xs text-ink/55">The base product, a clear title and at least one photo. Photos are visible only to you and artisans you invite or who match.</p></div><button type="button" onClick={loadSneakerExample} className="rounded-full border border-saffron/50 bg-saffron/[0.1] px-3 py-1.5 text-[10px] font-semibold text-[#7a4f10]">Load white-sneaker example</button></div>
              <label className="block"><span className="text-[11px] font-semibold text-ink/70">Brief title</span><input value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={100} placeholder="e.g. Paint my grandfather’s denim jacket" className="mt-1 h-10 w-full rounded-lg border border-maroon/20 bg-parchment px-3 text-sm" /><span className="mt-0.5 block text-[10px] text-muted-foreground">At least 5 characters. This is what artisans see first.</span></label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block"><span className="text-[11px] font-semibold text-ink/70">Category</span><select value={form.category} onChange={(e) => set("category", e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-maroon/20 bg-parchment px-2.5 text-sm">{REQUEST_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
                <label className="block"><span className="text-[11px] font-semibold text-ink/70">Who supplies the product?</span><select value={form.customerSuppliesProduct ? "me" : "artisan"} onChange={(e) => set("customerSuppliesProduct", e.target.value === "me")} className="mt-1 h-10 w-full rounded-lg border border-maroon/20 bg-parchment px-2.5 text-sm"><option value="me">I already own it</option><option value="artisan">The artisan makes/sources it</option></select></label>
              </div>
              <label className="block"><span className="text-[11px] font-semibold text-ink/70">Describe the base product</span><textarea value={form.productDescription} onChange={(e) => set("productDescription", e.target.value)} rows={3} maxLength={1200} placeholder="Brand, size, material, fit, current condition, what you like about it…" className="mt-1 w-full rounded-lg border border-maroon/20 bg-parchment px-3 py-2 text-sm" /></label>
              <label className="block"><span className="text-[11px] font-semibold text-ink/70">Condition or repair notes <span className="font-normal text-muted-foreground">(optional)</span></span><textarea value={form.conditionNotes} onChange={(e) => set("conditionNotes", e.target.value)} rows={2} placeholder="Stains, tears, fading, previous alterations…" className="mt-1 w-full rounded-lg border border-maroon/20 bg-parchment px-3 py-2 text-sm" /></label>
              <UploadImages value={images} onChange={setImages} max={4} label="Photos of the product" hint="At least one clear photo. Up to 4 images, 8 MB each." />
              <label className="flex items-start gap-2 rounded-lg border border-maroon/15 bg-parchment/60 p-3 text-[11px] text-ink/65"><input type="checkbox" checked={form.ownershipConfirmed} onChange={(e) => set("ownershipConfirmed", e.target.checked)} className="mt-0.5 size-4 accent-[#7b2040]" /> I own this product or have permission to have it customised, and the photos are mine to share.</label>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div><h2 className="font-display text-2xl font-semibold text-maroon">Tell the maker what you see.</h2><p className="mt-1 text-xs text-ink/55">Write like you would explain it to a person. KalaVision will structure the brief; it will not draw the design.</p></div>
              <label className="block"><span className="text-[11px] font-semibold text-ink/70">The customisation you want</span><textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={5} maxLength={4000} placeholder={form.customerSuppliesProduct ? "What should change? Colours, motifs, words, placement, finish, the feeling you want…" : "Describe the piece you want made, including size, use, materials and finish."} className="mt-1 w-full rounded-lg border border-maroon/20 bg-parchment px-3 py-2 text-sm" /><span className="text-[10px] text-muted-foreground">{form.description.trim().length}/20 characters minimum</span></label>
              <label className="block"><span className="text-[11px] font-semibold text-ink/70">Must-keep details or boundaries <span className="font-normal text-muted-foreground">(optional)</span></span><textarea value={form.specialInstructions} onChange={(e) => set("specialInstructions", e.target.value)} rows={3} placeholder="e.g. Keep the original stitching; no text; must be washable; finish by 12 December." className="mt-1 w-full rounded-lg border border-maroon/20 bg-parchment px-3 py-2 text-sm" /></label>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div><h2 className="font-display text-2xl font-semibold text-maroon">Give the maker a direction.</h2><p className="mt-1 text-xs text-ink/55">All optional. If you do not know the craft or material, say what feeling or reference you have — the artisan can propose the technique.</p></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block"><span className="text-[11px] font-semibold text-ink/70">Craft preference</span><input list="craft-list" value={form.craftPreference} onChange={(e) => set("craftPreference", e.target.value)} placeholder="e.g. Hand painting, Chikankari" className="mt-1 h-10 w-full rounded-lg border border-maroon/20 bg-parchment px-3 text-sm" /><datalist id="craft-list">{CRAFT_SKILLS.map((skill) => <option key={skill} value={skill} />)}</datalist></label>
                <label className="block"><span className="text-[11px] font-semibold text-ink/70">Material (if known)</span><input list="material-list" value={form.materialsKnown} onChange={(e) => set("materialsKnown", e.target.value)} placeholder="e.g. Denim, leather, cotton" className="mt-1 h-10 w-full rounded-lg border border-maroon/20 bg-parchment px-3 text-sm" /><datalist id="material-list">{MATERIALS.map((material) => <option key={material} value={material} />)}</datalist></label>
                <label className="block"><span className="text-[11px] font-semibold text-ink/70">Placement</span><input value={form.placement} onChange={(e) => set("placement", e.target.value)} placeholder="e.g. Centre back, left chest, full front" className="mt-1 h-10 w-full rounded-lg border border-maroon/20 bg-parchment px-3 text-sm" /></label>
                <label className="block"><span className="text-[11px] font-semibold text-ink/70">Colours</span><input value={form.colours} onChange={(e) => set("colours", e.target.value)} placeholder="e.g. Indigo, rust, gold — keep the base" className="mt-1 h-10 w-full rounded-lg border border-maroon/20 bg-parchment px-3 text-sm" /></label>
              </div>
              <div className="rounded-xl border border-gold/40 bg-ivory/60 p-3 text-[11px] leading-relaxed text-ink/60"><strong className="text-maroon">Direction is not a design.</strong> It helps matching and gives the artisan a starting point. The artisan will propose their own concept for your approval; no AI artwork is generated.</div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div><h2 className="font-display text-2xl font-semibold text-maroon">Budget, deadline and handover.</h2><p className="mt-1 text-xs text-ink/55">The budget is a ceiling. Artisans cannot quote above it, and the platform fee is disclosed in every quote.</p></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block"><span className="text-[11px] font-semibold text-ink/70">Maximum budget (₹)</span><input type="number" min={500} max={1000000} value={form.budgetInr} onChange={(e) => set("budgetInr", Number(e.target.value))} className="mt-1 h-10 w-full rounded-lg border border-maroon/20 bg-parchment px-3 text-sm" /><span className="mt-0.5 block text-[10px] text-muted-foreground">At ₹{form.budgetInr.toLocaleString("en-IN")}, the 8% platform fee would be {formatInr(budgetFee.platformFeeInr)} if fully used.</span></label>
                <label className="block"><span className="text-[11px] font-semibold text-ink/70">Needed by <span className="font-normal text-muted-foreground">(optional)</span></span><input type="date" value={form.deadline} min={minDeadline} onChange={(e) => set("deadline", e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-maroon/20 bg-parchment px-3 text-sm" /></label>
                <label className="block"><span className="text-[11px] font-semibold text-ink/70">Your city</span><input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="e.g. Pune" className="mt-1 h-10 w-full rounded-lg border border-maroon/20 bg-parchment px-3 text-sm" /></label>
                <label className="block"><span className="text-[11px] font-semibold text-ink/70">Handover</span><select value={form.fulfilment} onChange={(e) => set("fulfilment", e.target.value as "shipping" | "local_handoff")} className="mt-1 h-10 w-full rounded-lg border border-maroon/20 bg-parchment px-2.5 text-sm"><option value="shipping">Shipping</option><option value="local_handoff">Local handoff</option></select></label>
              </div>
              <div className="rounded-xl border border-gold/40 bg-ivory/60 p-3 text-[11px] leading-relaxed text-ink/60"><strong className="text-maroon">What happens after you publish:</strong> matched artisans can quote. Quotes include making, materials, time and revisions. You choose — no obligation to accept any quote. You can invite artisans from the directory.</div>
              <FeasibilityPanel result={feasibility} />
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div><h2 className="font-display text-2xl font-semibold text-maroon">Let KalaVision check the brief.</h2><p className="mt-1 text-xs text-ink/55">Text-only analysis. It can spot missing details and suggest production skills; it cannot see your photos or create a design.</p></div>
              <div className="rounded-xl border border-teal/25 bg-teal/[0.04] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div><p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-teal"><Sparkles className="size-3.5" /> KalaVision</p><p className="mt-0.5 text-[11px] text-ink/55">Rule-based fallback works even when no AI provider is configured.</p></div>
                  <Button type="button" size="sm" variant="outline" className="rounded-full border-teal/35 text-teal-deep" disabled={analysing || form.description.trim().length < 20} onClick={() => void runAnalysis()}>{analysing ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />} {analysis ? "Run again" : "Structure my brief"}</Button>
                </div>
                {!analysis && <p className="mt-3 rounded-lg border border-dashed border-teal/25 bg-card/60 px-3 py-4 text-center text-[11px] text-ink/50">Optional. You can continue without it — the brief works on its own.</p>}
                {analysis && (
                  <div className="mt-3 space-y-2 text-[11px]">
                    {analysis.status !== "ok" && <p className="rounded bg-saffron/15 px-2 py-1.5 text-[10px] text-[#8a5a12]">{analysis.reason ?? "AI unavailable — using the rule-based brief."}</p>}
                    {insight && (
                      <>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div className="rounded-lg bg-card p-2.5"><p className="text-[9px] font-semibold uppercase text-muted-foreground">Craft direction</p><p className="mt-0.5 font-medium text-ink">{insight.craftStyle}</p><p className="mt-1 text-[9px] text-muted-foreground">Confidence: {insight.confidence}</p></div>
                          <div className="rounded-lg bg-card p-2.5"><p className="text-[9px] font-semibold uppercase text-muted-foreground">Likely skills</p><p className="mt-0.5 text-ink/75">{insight.requiredSkills.join(" · ") || "None inferred"}</p></div>
                        </div>
                        {insight.likelyMaterials.length > 0 && <div className="rounded-lg bg-card p-2.5"><p className="text-[9px] font-semibold uppercase text-muted-foreground">Materials to confirm</p><p className="mt-0.5 text-ink/75">{insight.likelyMaterials.join(" · ")}</p></div>}
                        {insight.clarifyingQuestions.length > 0 && <div className="rounded-lg bg-card p-2.5"><p className="text-[9px] font-semibold uppercase text-muted-foreground">Worth clarifying in your brief</p><ul className="mt-1 space-y-0.5 text-ink/65">{insight.clarifyingQuestions.slice(0, 3).map((q) => <li key={q}>· {q}</li>)}</ul><p className="mt-1 text-[9px] text-muted-foreground">Add these on the story step if they matter.</p></div>}
                        {insight.uncertainties.length > 0 && <p className="text-[10px] text-muted-foreground">{insight.uncertainties[0]}</p>}
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="rounded-xl border border-gold/40 bg-ivory/60 p-3 text-[11px] leading-relaxed text-ink/60"><strong className="text-maroon">No artwork is generated here.</strong> KalaVision helps you write a clearer brief; the artisan creates the concept you review later.</div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <div><h2 className="font-display text-2xl font-semibold text-maroon">Ready to go live?</h2><p className="mt-1 text-xs text-ink/55">Check the brief. You can still close it later, but published text is part of the record.</p></div>
              <div className="rounded-xl border border-maroon/15 bg-parchment/50 p-4">
                <div className="flex items-start justify-between gap-3"><div><p className="text-[9px] uppercase tracking-wide text-muted-foreground">{form.category} · {form.city}</p><h3 className="font-display text-xl font-semibold text-maroon">{form.title}</h3></div><p className="font-display text-lg font-semibold text-maroon">{formatInr(form.budgetInr)}</p></div>
                <p className="mt-2 text-[12px] leading-relaxed text-ink/65">{form.productDescription}</p>
                <p className="mt-2 whitespace-pre-line text-[12px] leading-relaxed text-ink/65">{form.description}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-ink/55">
                  <span className="rounded-full bg-card px-2 py-1">{form.customerSuppliesProduct ? "You supply the product" : "Artisan supplies product"}</span>
                  {form.craftPreference && <span className="rounded-full bg-card px-2 py-1">{form.craftPreference}</span>}
                  {form.deadline && <span className="rounded-full bg-card px-2 py-1">By {formatDate(form.deadline)}</span>}
                  <span className="rounded-full bg-card px-2 py-1">{form.fulfilment === "shipping" ? "Shipping" : "Local handoff"}</span>
                  <span className="rounded-full bg-card px-2 py-1">{images.length} photo{images.length === 1 ? "" : "s"}</span>
                </div>
                {images.length > 0 && <div className="mt-3 flex gap-2">{images.map((image) => <img key={image.storageId} src={image.previewUrl} alt="" className="size-16 rounded-lg object-cover" />)}</div>}
              </div>
              <label className="flex items-start gap-2 text-[11px] text-ink/65"><input type="checkbox" checked={form.ownershipConfirmed} onChange={(e) => set("ownershipConfirmed", e.target.checked)} className="mt-0.5 size-4 accent-[#7b2040]" /> I confirm the details, that I own or have permission for the product and photos, and that I understand KALकारी holds payment against agreed project stages.</label>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-maroon/10 pt-4">
            <Button type="button" variant="outline" className="rounded-full border-maroon/25" disabled={step === 1} onClick={() => setStep((s) => Math.max(1, s - 1))}><ChevronLeft className="size-4" /> Back</Button>
            <div className="flex items-center gap-2">
              {step < 6 ? (
                <Button type="button" className="rounded-full bg-maroon px-5 text-ivory hover:bg-maroon-deep" disabled={!canContinue} onClick={() => setStep((s) => Math.min(6, s + 1))}>Continue <ChevronRight className="size-4" /></Button>
              ) : (
                <Button type="button" className="rounded-full bg-maroon px-6 text-ivory hover:bg-maroon-deep" disabled={submitting || !form.ownershipConfirmed} onClick={() => void submit()}>{submitting ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Publish brief</Button>
              )}
            </div>
          </div>
        </div>
        <p className="mt-3 text-center text-[10px] text-muted-foreground">Your photos stay private to your account and the artisans involved. No AI analyses the images. <Link to="/trust-and-safety" className="font-semibold text-teal-deep">Privacy and protection →</Link></p>
      </div>
    </PortalShell>
  );
}

export function CustomerQuotes() {
  const quotes = useQuery(api.quotes.forCustomer);
  const [status, setStatus] = useState("submitted");
  const filtered = (quotes ?? []).filter((quote) => status === "all" || quote.status === status);

  return (
    <PortalShell role="customer" title="Quotes" hindi="कोटेशन" subtitle="Every breakdown, timeline and revision term in one place.">
      <div className="flex flex-wrap gap-1.5">
        {["submitted", "accepted", "declined", "all"].map((value) => <button key={value} type="button" onClick={() => setStatus(value)} className={`rounded-full border px-3 py-1.5 text-[11px] font-medium ${status === value ? "border-maroon bg-maroon text-ivory" : "border-maroon/20 bg-card text-ink/60"}`}>{value === "all" ? "All" : statusLabel("quote", value)}</button>)}
      </div>
      {quotes === undefined ? <div className="mt-4 h-40 animate-pulse rounded-2xl bg-card/70" /> : filtered.length === 0 ? <div className="mt-4"><EmptyState icon={ReceiptText} title="No quotes in this view." body="Quotes arrive after you publish a brief. Each one shows making, materials, packaging, delivery and the platform fee separately." action={<Link to="/customer/requests" className="rounded-full bg-maroon px-4 py-2 text-xs font-semibold text-ivory">See my briefs</Link>} /></div> : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {filtered.map((quote) => (
            <article key={quote._id} className="rounded-2xl border border-maroon/15 bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div><p className="text-sm font-semibold text-ink">{quote.artisanName}</p><p className="text-[10px] text-ink/50">{quote.requestTitle}</p></div>
                <StatusPill kind="quote" status={quote.status} />
              </div>
              <div className="mt-2"><QuoteBreakdown quote={quote} compact /></div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground"><span>Version {quote.version} · expires {formatDate(quote.expiresAt)}</span><Link to={`/customer/requests/${quote.requestId}`} className="font-semibold text-teal-deep">Open brief →</Link></div>
            </article>
          ))}
        </div>
      )}
    </PortalShell>
  );
}

export function CustomerProjects() {
  const projects = useQuery(api.projects.mine);
  const mine = (projects ?? []).filter((project) => project.role === "customer");
  const [filter, setFilter] = useState("active");
  const filtered = mine.filter((project) => filter === "all" || (filter === "active" ? !["completed", "cancelled", "refunded"].includes(project.status) : project.status === filter));

  return (
    <PortalShell role="customer" title="Projects" hindi="परियोजनाएँ" subtitle="Concept approval, payments, making and delivery.">
      <div className="flex flex-wrap gap-1.5">
        {["active", "awaiting_payment", "completed", "cancelled", "all"].map((value) => <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-full border px-3 py-1.5 text-[11px] font-medium ${filter === value ? "border-maroon bg-maroon text-ivory" : "border-maroon/20 bg-card text-ink/60"}`}>{value === "all" ? "All" : value === "active" ? "Active" : statusLabel("project", value)}</button>)}
      </div>
      {projects === undefined ? <div className="mt-4 h-48 animate-pulse rounded-2xl bg-card/70" /> : filtered.length === 0 ? <div className="mt-4"><EmptyState icon={BriefcaseBusiness} title="No projects here." body="A project starts when you accept an artisan’s quote. Then you pay, approve the concept and follow the making." action={<Link to="/customer/requests" className="rounded-full bg-maroon px-4 py-2 text-xs font-semibold text-ivory">My briefs</Link>} /></div> : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {filtered.map((project) => (
            <Link key={project._id} to={`/customer/projects/${project._id}`} className="group flex gap-3 rounded-2xl border border-maroon/15 bg-card p-4 transition hover:border-maroon/40">
              {project.imageUrl ? <img src={project.imageUrl} alt="" className="size-20 shrink-0 rounded-xl object-cover" /> : <span className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-maroon/[0.05]"><Package className="size-7 text-maroon/30" /></span>}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2"><p className="line-clamp-2 text-sm font-semibold text-ink">{project.title}</p><StatusPill kind="project" status={project.status} /></div>
                <p className="mt-1 text-[11px] text-ink/55">{project.counterpartName}</p>
                <p className="mt-2 text-[10px] text-ink/50">{formatInr(project.amountInr)} · updated {formatDate(project.updatedAt)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PortalShell>
  );
}

export function CustomerProjectDetail() {
  const { projectId } = useParams();
  if (!projectId) return null;
  return (
    <PortalShell role="customer" title="Project workspace" hindi="कार्यक्षेत्र" subtitle="Everything agreed, paid and made.">
      <ProjectWorkspace projectId={projectId as Id<"projects">} />
    </PortalShell>
  );
}

export function CustomerPayments() {
  const orders = useQuery(api.payments.myPaymentHistory);
  const projects = useQuery(api.projects.mine);
  const paid = (orders ?? []).filter((order) => order.status === "paid");
  const total = paid.reduce((sum, order) => sum + order.amountInr, 0);

  return (
    <PortalShell role="customer" title="Payments" hindi="भुगतान" subtitle="What you paid, what it was for, and the current state.">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Confirmed payments" value={formatInr(total)} hint={`${paid.length} order${paid.length === 1 ? "" : "s"}`} tone="emerald" />
        <StatCard label="Awaiting payment" value={(projects ?? []).filter((p) => p.role === "customer" && p.status === "awaiting_payment").length} hint="Open the project to pay" tone="saffron" />
        <StatCard label="Active projects" value={(projects ?? []).filter((p) => p.role === "customer" && !["completed", "cancelled", "refunded"].includes(p.status)).length} hint="In making or review" tone="maroon" />
      </div>
      <section className="mt-5 rounded-2xl border border-maroon/15 bg-card p-5">
        <h2 className="font-display text-xl font-semibold text-maroon">Payment history</h2>
        <p className="mt-1 text-[11px] text-ink/55">No card numbers or payment credentials are stored in KalaProof. A successful redirect alone does not mark a payment paid; the provider signature is verified.</p>
        {orders === undefined ? <div className="mt-3 h-32 animate-pulse rounded-xl bg-parchment" /> : orders.length === 0 ? <div className="mt-3"><EmptyState icon={Wallet} title="No payments yet." body="Payment only happens after you accept a quote. The amount and fee are shown before you pay." /></div> : (
          <div className="mt-3 divide-y divide-maroon/10">
            {orders.map((order) => (
              <div key={order._id} className="flex flex-wrap items-center gap-2 py-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-maroon/[0.06]"><IndianRupee className="size-4 text-maroon/60" /></span>
                <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-ink">{order.projectTitle}</p><p className="text-[10px] text-muted-foreground">{formatDateTime(order.createdAt)} · {order.mode === "sandbox" ? "Sandbox — no real money" : "Live payment"}</p></div>
                <p className="text-sm font-semibold text-ink">{formatInr(order.amountInr)}</p>
                <StatusPill kind="payment" status={order.status} />
              </div>
            ))}
          </div>
        )}
      </section>
      <div className="mt-4 rounded-xl border border-saffron/40 bg-saffron/[0.07] px-4 py-3 text-[11px] leading-relaxed text-ink/65"><strong>Sandbox note:</strong> if payment keys are not configured, the project offers a clearly labelled sandbox payment for testing. Sandbox orders never represent real money and cannot be mistaken for live settlement.</div>
    </PortalShell>
  );
}
