import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { PortalShell } from "@/components/portal/PortalShell";
import { StatCard } from "@/components/marketplace/Bits";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, formatDateTime, formatInr, statusLabel } from "@/lib/marketplace";
import { useMutation, useQuery } from "convex/react";
import {
  BadgeCheck, Gavel, Loader2, ShieldCheck, Wallet,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

function AdminGuard({ section }: { section: string }) {
  const { user } = useAuth();
  const claim = useMutation(api.admin.claimAdmin);
  const [busy, setBusy] = useState(false);

  if (!user) return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading account…</div>;
  if (user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-parchment px-4">
        <div className="max-w-[520px] rounded-2xl border border-maroon/20 bg-card p-6 text-center">
          <ShieldCheck className="mx-auto size-9 text-maroon/40" />
          <h1 className="mt-3 font-display text-2xl font-semibold text-maroon">Administration is restricted.</h1>
          <p className="mt-2 text-xs leading-relaxed text-ink/60">Roles are checked on the server. If this is a fresh deployment with no administrator yet, the first verified account can claim the seat. This is recorded in the audit log.</p>
          <Button className="mt-4 rounded-full bg-maroon text-ivory" disabled={busy} onClick={async () => { setBusy(true); try { const result = await claim({}); toast.success(result.promoted ? "Admin seat claimed." : "You are already an admin."); } catch (error) { toast.error(error instanceof Error ? error.message.replace(/^[A-Z_]+:\s*/, "") : "Could not claim admin."); } finally { setBusy(false); } }}>{busy ? <Loader2 className="size-4 animate-spin" /> : null} Claim first admin seat</Button>
          <Link to="/" className="mt-3 block text-[11px] font-semibold text-teal-deep">Back to KALकारी</Link>
        </div>
      </div>
    );
  }
  return <AdminBody section={section} />;
}

function AdminBody({ section }: { section: string }) {
  return (
    <PortalShell role="admin" title={section === "dashboard" ? "Admin overview" : section === "verifications" ? "Verification queue" : section === "reports" ? "Reports & risk" : section === "disputes" ? "Disputes" : section === "transactions" ? "Transactions & payouts" : section === "users" ? "People" : "Audit log"} hindi="प्रशासन" subtitle="Review evidence, record decisions and keep the marketplace honest.">
      {section === "dashboard" && <Overview />}
      {section === "verifications" && <Verifications />}
      {section === "reports" && <Reports />}
      {section === "disputes" && <Disputes />}
      {section === "transactions" && <Transactions />}
      {section === "users" && <UsersAdmin />}
      {section === "audit" && <Audit />}
    </PortalShell>
  );
}

function Overview() {
  const stats = useQuery(api.admin.stats);
  const seed = useMutation(api.admin.createSampleArtisans);
  const seedDemoData = useMutation(api.demo.seedAsAdmin);
  const resetDemoData = useMutation(api.demo.resetAsAdmin);
  const demoStatus = useQuery(api.demo.adminStatus);
  const [busy, setBusy] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);
  if (stats === undefined) return <div className="h-64 animate-pulse rounded-2xl bg-card" />;
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Members" value={stats.users.total} hint={`${stats.users.artisans} artisan profiles · ${stats.users.sampleArtisans} sample`} tone="maroon" />
        <StatCard label="Open briefs" value={stats.requests.open} hint={`${stats.requests.total} total`} tone="teal" />
        <StatCard label="Active projects" value={stats.projects.active} hint={`${stats.projects.completed} completed`} tone="saffron" />
        <StatCard label="Needs review" value={stats.disputes + stats.reports + stats.payoutsPending} hint={`${stats.disputes} disputes · ${stats.reports} reports · ${stats.payoutsPending} payouts`} tone="rani" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Link to="/admin/verifications" className="rounded-2xl border border-maroon/15 bg-card p-5 hover:border-maroon/40"><BadgeCheck className="size-5 text-teal" /><p className="mt-2 font-display text-xl font-semibold text-maroon">{stats.verifications.pending} pending</p><p className="text-[11px] text-ink/55">Verification requests · {stats.verifications.verified} verified</p></Link>
        <Link to="/admin/disputes" className="rounded-2xl border border-maroon/15 bg-card p-5 hover:border-maroon/40"><Gavel className="size-5 text-vermilion" /><p className="mt-2 font-display text-xl font-semibold text-maroon">{stats.disputes} open</p><p className="text-[11px] text-ink/55">Disputes requiring a human decision</p></Link>
        <Link to="/admin/transactions" className="rounded-2xl border border-maroon/15 bg-card p-5 hover:border-maroon/40"><Wallet className="size-5 text-emerald" /><p className="mt-2 font-display text-xl font-semibold text-maroon">{formatInr(stats.payments.confirmedLiveInr)}</p><p className="text-[11px] text-ink/55">Confirmed live payments · {formatInr(stats.payments.confirmedSandboxInr)} sandbox</p></Link>
      </div>
      <section className="rounded-2xl border border-saffron/40 bg-saffron/[0.06] p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a5a12]">Demo data</p>
        <p className="mt-1 text-[11px] leading-relaxed text-ink/60">Sample artisans are clearly labelled, have no login, no verification badge and no reviews. They are excluded from matching unless a real artisan updates a profile. Do not use sample data to imply real supply.</p>
        <Button size="sm" variant="outline" className="mt-2 rounded-full border-maroon/25" disabled={busy} onClick={async () => { setBusy(true); try { const result = await seed({}); toast.success(`${result.created ?? "Sample"} artisans created.`); } catch (error) { toast.error(error instanceof Error ? error.message.replace(/^[A-Z_]+:\s*/, "") : "Could not create sample data."); } finally { setBusy(false); } }}>{busy ? <Loader2 className="size-3.5 animate-spin" /> : null} Seed labelled sample artisans</Button>
      </section>
      <section className="rounded-2xl border border-maroon/15 bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-maroon/55">Phase 3 demo environment</p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink/60">
              22 fictional artisans, 52 portfolio pieces, 20 briefs, 24 quotes, 15 projects, 3 KalaCollab scenarios, 20 reviews and 5 public sample passports. All records are labelled and tracked for reset. This does not modify genuine users or trigger payments.
            </p>
            <p className="mt-1 text-[10px] font-semibold text-emerald">
              {demoStatus?.populated ? `Seeded · ${demoStatus.counts.artisanUser ?? 0} artisan accounts · ${demoStatus.counts.project ?? 0} projects` : "Not currently seeded"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="rounded-full bg-maroon text-ivory" disabled={demoBusy || demoStatus?.populated} onClick={async () => { setDemoBusy(true); try { const result = await seedDemoData({}); toast.success(result.seeded ? "Demo marketplace seeded." : result.reason ?? "Demo data already present."); } catch (error) { toast.error(error instanceof Error ? error.message.replace(/^[A-Z_]+:\s*/, "") : "Could not seed demo data."); } finally { setDemoBusy(false); } }}>{demoBusy ? <Loader2 className="size-3.5 animate-spin" /> : null} Seed full demo marketplace</Button>
            <Button size="sm" variant="outline" className="rounded-full border-vermilion/30 text-vermilion" disabled={demoBusy || !demoStatus?.populated} onClick={async () => { if (!window.confirm("Reset only the Phase 3 demo records? Genuine users and projects are not touched.")) return; setDemoBusy(true); try { const result = await resetDemoData({}); toast.success(`${result.removed} demo records removed.`); } catch (error) { toast.error(error instanceof Error ? error.message.replace(/^[A-Z_]+:\s*/, "") : "Could not reset demo data."); } finally { setDemoBusy(false); } }}>Reset demo records</Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Verifications() {
  const queue = useQuery(api.admin.verificationQueue);
  const passportQueue = useQuery(api.passport.reviewQueue);
  const decide = useMutation(api.admin.decideVerification);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  async function act(requestId: Id<"verificationRequests">, decision: "verified" | "info_required" | "rejected" | "suspended") {
    const note = notes[requestId] ?? "";
    if (note.trim().length < 10) { toast.error("Record a reviewer note of at least 10 characters."); return; }
    setBusy(requestId);
    try { await decide({ requestId, decision, reviewerNote: note }); toast.success(`Decision recorded: ${decision.split("_").join(" ")}.`); } catch (error) { toast.error(error instanceof Error ? error.message.replace(/^[A-Z_]+:\s*/, "") : "Could not record decision."); } finally { setBusy(null); }
  }

  return (
    <div>
      <p className="mb-3 text-[11px] leading-relaxed text-ink/55">Verification means identity and craft documents were reviewed. It is not a guarantee. Record a specific note — the artisan sees it.</p>
      {queue === undefined ? <div className="h-48 animate-pulse rounded-2xl bg-card" /> : queue.length === 0 ? <div className="rounded-2xl border border-dashed border-maroon/25 bg-card/60 p-10 text-center"><BadgeCheck className="mx-auto size-8 text-maroon/25" /><p className="mt-2 font-display text-xl text-maroon">Queue is clear.</p><p className="mt-1 text-xs text-ink/55">No pending verification requests.</p></div> : (
        <div className="space-y-3">
          {queue.map((request) => (
            <article key={request._id} className="rounded-2xl border border-maroon/15 bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-display text-lg font-semibold text-ink">{request.profile?.displayName ?? request.email ?? "Applicant"}</p><p className="text-[10px] text-ink/50">{request.email ?? "no email"} · {request.city ?? "city not set"} · requested {formatDate(request.submittedAt)}</p></div><span className="rounded-full border border-saffron/50 bg-saffron/10 px-2.5 py-1 text-[10px] font-semibold text-[#8a5a12]">{statusLabel("verification", request.status)}</span></div>
              {request.profile && <p className="mt-2 text-[11px] text-ink/60">{request.profile.craftHeadline} · {request.profile.yearsExperience} years · {request.profile.skills.join(", ")}</p>}
              {request.profile?.sampleLabel && <p className="mt-1 text-[10px] font-semibold text-rani">This is a sample profile. Do not verify demo data.</p>}
              <div className="mt-2 flex flex-wrap gap-2">{request.portfolio.map((item) => item.url && <a key={item._id} href={item.url} target="_blank" rel="noreferrer"><img src={item.url} alt={item.title} className="size-20 rounded-lg border border-maroon/15 object-cover" /></a>)}</div>
              <textarea value={notes[request._id] ?? ""} onChange={(e) => setNotes((prev) => ({ ...prev, [request._id]: e.target.value }))} rows={2} placeholder="Reviewer note (specific, factual, at least 10 characters)" className="mt-2 w-full rounded-lg border border-maroon/20 bg-parchment px-2.5 py-1.5 text-xs" />
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" className="rounded-full bg-emerald text-ivory" disabled={busy !== null || Boolean(request.profile?.sampleLabel)} onClick={() => void act(request._id, "verified")}>Approve verification</Button>
                <Button size="sm" variant="outline" className="rounded-full border-saffron/50 text-[#8a5a12]" disabled={busy !== null} onClick={() => void act(request._id, "info_required")}>Request info</Button>
                <Button size="sm" variant="outline" className="rounded-full border-vermilion/30 text-vermilion" disabled={busy !== null} onClick={() => void act(request._id, "rejected")}>Reject</Button>
                <Button size="sm" variant="outline" className="rounded-full border-vermilion/30 text-vermilion" disabled={busy !== null} onClick={() => void act(request._id, "suspended")}>Suspend</Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <section className="mt-8 border-t border-maroon/10 pt-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="label-caps text-[8px] text-teal">KalaPassport verification</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-maroon">Craft evidence reviews</h2>
            <p className="mt-1 max-w-[64ch] text-[10px] leading-relaxed text-ink/50">Open a passport to inspect private evidence and record a named decision. A badge is only issued after a completed review, with explicit scope and limitations.</p>
          </div>
        </div>
        {passportQueue === undefined ? <div className="mt-3 h-24 animate-pulse rounded-xl bg-card" /> : passportQueue.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-maroon/20 p-5 text-xs text-ink/50">No passport evidence has been submitted yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {passportQueue.map((passport) => (
              <Link key={passport._id} to={`/projects/${passport.projectId}/passport`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-maroon/12 bg-card p-3 transition hover:border-maroon/30">
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-semibold text-maroon">{passport.projectTitle}</p>
                  <p className="mt-0.5 text-[9px] text-ink/45">{passport.reviewerName ?? "No reviewer yet"} · submitted {formatDate(passport.submittedAt)}{passport.demoLabel ? " · sample record" : ""}</p>
                </div>
                <span className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.08em] text-[#74572c]">{passport.reviewStatus.replace(/_/g, " ")}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Reports() {
  const reports = useQuery(api.admin.reports);
  const risk = useQuery(api.admin.riskSignals);
  const resolve = useMutation(api.admin.resolveReport);
  const review = useMutation(api.admin.reviewRiskSignal);
  const [notes, setNotes] = useState<Record<string, string>>({});

  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
      <section>
        <h2 className="font-display text-xl font-semibold text-maroon">Moderation reports</h2>
        {reports === undefined ? <div className="mt-2 h-32 animate-pulse rounded-xl bg-card" /> : reports.length === 0 ? <p className="mt-2 rounded-xl border border-dashed border-maroon/20 p-5 text-xs text-ink/50">No reports filed.</p> : (
          <div className="mt-2 space-y-3">
            {reports.map((report) => (
              <article key={report._id} className="rounded-xl border border-maroon/15 bg-card p-4">
                <div className="flex items-start justify-between gap-2"><div><p className="text-sm font-semibold text-ink">{report.reason.split("_").join(" ")}</p><p className="text-[10px] text-ink/50">{report.reporterName} · {formatDateTime(report.createdAt)} · target {report.subjectType}</p></div><span className="rounded-full border border-maroon/15 px-2 py-0.5 text-[9px] font-medium capitalize text-ink/60">{report.status}</span></div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-ink/65">{report.detail}</p>
                <textarea value={notes[report._id] ?? ""} onChange={(e) => setNotes((p) => ({ ...p, [report._id]: e.target.value }))} rows={2} placeholder="Admin note (at least 10 characters)" className="mt-2 w-full rounded-lg border border-maroon/20 bg-parchment px-2.5 py-1.5 text-xs" />
                <div className="mt-2 flex gap-2">{(["reviewing", "resolved", "dismissed"] as const).map((status) => <Button key={status} size="sm" variant="outline" className="rounded-full border-maroon/20 text-[10px]" onClick={async () => { try { await resolve({ reportId: report._id, status, adminNote: notes[report._id] ?? "" }); toast.success("Report updated."); } catch (error) { toast.error(error instanceof Error ? error.message.replace(/^[A-Z_]+:\s*/, "") : "Could not update."); } }}>{status}</Button>)}</div>
              </article>
            ))}
          </div>
        )}
      </section>
      <section>
        <h2 className="font-display text-xl font-semibold text-maroon">Risk signals</h2>
        <p className="mt-1 text-[10px] text-ink/50">Signals support human review. They never auto-ban.</p>
        {risk === undefined ? <div className="mt-2 h-24 animate-pulse rounded-xl bg-card" /> : risk.length === 0 ? <p className="mt-2 rounded-xl border border-dashed border-maroon/20 p-5 text-xs text-ink/50">No signals.</p> : (
          <div className="mt-2 space-y-2">{risk.map((signal) => <article key={signal._id} className="rounded-xl border border-maroon/15 bg-card p-3"><div className="flex items-start justify-between gap-2"><p className="text-xs font-semibold text-ink">{signal.kind.split("_").join(" ")}</p>{signal.reviewedAt ? <span className="text-[9px] text-emerald">reviewed</span> : <span className="text-[9px] font-semibold text-vermilion">new</span>}</div><p className="mt-0.5 text-[10px] text-ink/55">{signal.userName} · {signal.severity}</p><p className="mt-1 text-[10px] text-ink/50">{signal.detail}</p>{!signal.reviewedAt && <button type="button" onClick={async () => { try { await review({ signalId: signal._id }); toast.success("Marked reviewed."); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not review."); } }} className="mt-1 text-[10px] font-semibold text-teal-deep">Mark reviewed</button>}</article>)}</div>
        )}
      </section>
    </div>
  );
}

function Disputes() {
  const disputes = useQuery(api.admin.disputes);
  const decide = useMutation(api.admin.decideDispute);
  const refund = useMutation(api.admin.markRefundComplete);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [refs, setRefs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  return (
    <div>
      <p className="mb-3 text-[11px] leading-relaxed text-ink/55">Decisions must reference the approved concept and KalaProof evidence. Refund decisions only record approval — the project stays disputed until the provider refund is completed.</p>
      {disputes === undefined ? <div className="h-64 animate-pulse rounded-2xl bg-card" /> : disputes.length === 0 ? <div className="rounded-2xl border border-dashed border-maroon/25 bg-card/60 p-10 text-center"><Gavel className="mx-auto size-8 text-maroon/25" /><p className="mt-2 font-display text-xl text-maroon">No disputes.</p><p className="mt-1 text-xs text-ink/55">Nothing needs a decision.</p></div> : (
        <div className="space-y-3">
          {disputes.map((dispute) => (
            <article key={dispute._id} className="rounded-2xl border border-maroon/15 bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-display text-lg font-semibold text-ink">{dispute.projectTitle}</p><p className="text-[10px] text-ink/50">{dispute.openerName} vs {dispute.respondentName} · {formatInr(dispute.projectAmountInr)} · {formatDateTime(dispute.createdAt)}</p></div><span className="rounded-full border border-vermilion/25 bg-vermilion/[0.06] px-2.5 py-1 text-[10px] font-medium text-vermilion">{statusLabel("dispute", dispute.status)}</span></div>
              <p className="mt-2 text-[12px] leading-relaxed text-ink/65">{dispute.description}</p>
              <p className="mt-1 text-[11px] text-ink/55"><strong>Requested:</strong> {dispute.desiredOutcome}</p>
              {dispute.response && <div className="mt-2 rounded-lg bg-teal/[0.04] p-2.5 text-[11px] text-ink/65"><strong>Response:</strong> {dispute.response}</div>}
              {dispute.evidence.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{dispute.evidence.map((file) => file.url && <a key={file.storageId} href={file.url} target="_blank" rel="noreferrer"><img src={file.url} alt="Evidence" className="size-16 rounded-lg object-cover" /></a>)}</div>}
              {dispute.decision && <p className="mt-2 text-[10px] text-muted-foreground">Decision: {dispute.decision.split("_").join(" ")} · {dispute.decisionNote}</p>}
              {!["resolved", "closed"].includes(dispute.status) ? (
                <>
                  <textarea value={notes[dispute._id] ?? ""} onChange={(e) => setNotes((p) => ({ ...p, [dispute._id]: e.target.value }))} rows={2} placeholder="Reasoning for decision (at least 20 characters)" className="mt-2 w-full rounded-lg border border-maroon/20 bg-parchment px-2.5 py-1.5 text-xs" />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(["rework", "partial_refund", "full_refund", "release_payment", "cancellation", "no_action"] as const).map((decision) => (
                      <Button key={decision} size="sm" variant="outline" className="rounded-full border-maroon/20 text-[10px]" disabled={busy !== null} onClick={async () => { setBusy(dispute._id); try { await decide({ disputeId: dispute._id, decision, decisionNote: notes[dispute._id] ?? "" }); toast.success(`Decision recorded: ${decision.split("_").join(" ")}.`); } catch (error) { toast.error(error instanceof Error ? error.message.replace(/^[A-Z_]+:\s*/, "") : "Could not decide."); } finally { setBusy(null); } }}>{decision.split("_").join(" ")}</Button>
                    ))}
                  </div>
                </>
              ) : (dispute.decision === "full_refund" || dispute.decision === "partial_refund") && dispute.status !== "closed" ? (
                <div className="mt-2 rounded-lg border border-saffron/40 bg-saffron/[0.06] p-2.5"><p className="text-[10px] font-semibold text-[#8a5a12]">Refund approved but not completed at provider.</p><input value={refs[dispute._id] ?? ""} onChange={(e) => setRefs((p) => ({ ...p, [dispute._id]: e.target.value }))} placeholder="Provider refund reference" className="mt-1 h-8 w-full rounded border border-maroon/20 bg-card px-2 text-xs" /><Button size="sm" className="mt-1 rounded-full bg-vermilion text-white" disabled={busy !== null || (refs[dispute._id] ?? "").trim().length < 3} onClick={async () => { setBusy(dispute._id); try { await refund({ disputeId: dispute._id, providerReference: refs[dispute._id] ?? "", note: "Refund recorded by admin." }); toast.success("Refund recorded; project marked refunded."); } catch (error) { toast.error(error instanceof Error ? error.message.replace(/^[A-Z_]+:\s*/, "") : "Could not record refund."); } finally { setBusy(null); } }}>Record completed refund</Button></div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Transactions() {
  const orders = useQuery(api.admin.transactions);
  const payouts = useQuery(api.admin.payouts);
  const release = useMutation(api.admin.releasePayout);
  const [refs, setRefs] = useState<Record<string, string>>({});
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section>
        <h2 className="font-display text-xl font-semibold text-maroon">Payment orders</h2>
        <p className="mt-1 text-[10px] text-ink/50">A paid order must have a verified provider event, not just a frontend success callback.</p>
        {orders === undefined ? <div className="mt-2 h-32 animate-pulse rounded-xl bg-card" /> : orders.length === 0 ? <p className="mt-2 rounded-xl border border-dashed border-maroon/20 p-5 text-xs text-ink/50">No payment orders.</p> : <div className="mt-2 space-y-2">{orders.map((order) => <div key={order._id} className="rounded-xl border border-maroon/15 bg-card p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-semibold text-ink">{order.projectTitle}</p><p className="text-[10px] text-ink/50">{order.mode} · {formatDateTime(order.createdAt)} · {order.provider}</p></div><div className="text-right"><p className="text-sm font-semibold text-ink">{formatInr(order.amountInr)}</p><p className="text-[9px] uppercase text-ink/50">{order.status}</p></div></div>{order.transactions.length > 0 && <p className="mt-1 text-[9px] text-muted-foreground">{order.transactions.length} transaction record{order.transactions.length === 1 ? "" : "s"} · provider ids not shown here</p>}</div>)}</div>}
      </section>
      <section>
        <h2 className="font-display text-xl font-semibold text-maroon">Payouts</h2>
        <p className="mt-1 text-[10px] text-ink/50">Mark paid only after an actual transfer. The reference is your reconciliation record.</p>
        {payouts === undefined ? <div className="mt-2 h-32 animate-pulse rounded-xl bg-card" /> : payouts.length === 0 ? <p className="mt-2 rounded-xl border border-dashed border-maroon/20 p-5 text-xs text-ink/50">No payouts.</p> : <div className="mt-2 space-y-2">{payouts.map((payout) => <div key={payout._id} className="rounded-xl border border-maroon/15 bg-card p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-xs font-semibold text-ink">{payout.artisanName} · {payout.projectTitle}</p><p className="text-[10px] text-ink/50">fee {formatInr(payout.platformFeeInr)} · {formatDate(payout.createdAt)} · {payout.status}</p></div><p className="text-sm font-semibold text-emerald">{formatInr(payout.amountInr)}</p></div>{payout.status !== "paid" && <div className="mt-2 flex gap-1.5"><input value={refs[payout._id] ?? ""} onChange={(e) => setRefs((p) => ({ ...p, [payout._id]: e.target.value }))} placeholder="Transfer reference" className="h-8 min-w-0 flex-1 rounded border border-maroon/20 bg-parchment px-2 text-xs" /><Button size="sm" className="rounded-full bg-emerald text-ivory" disabled={(refs[payout._id] ?? "").trim().length < 3} onClick={async () => { try { await release({ payoutId: payout._id, providerReference: refs[payout._id] ?? "" }); toast.success("Payout recorded as paid."); } catch (error) { toast.error(error instanceof Error ? error.message.replace(/^[A-Z_]+:\s*/, "") : "Could not release."); } }}>Release</Button></div>}</div>)}</div>}
      </section>
    </div>
  );
}

function UsersAdmin() {
  const users = useQuery(api.admin.users);
  const suspend = useMutation(api.admin.suspendUser);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  return (
    <div>
      <h2 className="font-display text-xl font-semibold text-maroon">People</h2>
      <p className="mt-1 text-[10px] text-ink/50">Suspension requires a reason and is audited. Sample artisan accounts are labelled and cannot be verified.</p>
      {users === undefined ? <div className="mt-2 h-40 animate-pulse rounded-xl bg-card" /> : (
        <div className="mt-2 overflow-x-auto rounded-xl border border-maroon/15 bg-card">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="border-b border-maroon/10 text-[9px] uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-2">Member</th><th className="px-3 py-2">Role</th><th className="px-3 py-2">Artisan</th><th className="px-3 py-2">Joined</th><th className="px-3 py-2">Action</th></tr></thead>
            <tbody className="divide-y divide-maroon/8">
              {users.map((user) => (
                <tr key={user._id}>
                  <td className="px-3 py-2"><p className="font-medium text-ink">{user.name}</p><p className="text-[10px] text-muted-foreground">{user.email ?? "no email"} {user.verifiedEmail ? "· verified" : ""}</p></td>
                  <td className="px-3 py-2 capitalize text-ink/65">{user.role}</td>
                  <td className="px-3 py-2">{user.artisan ? <><p className="text-ink/70">{user.artisan.verificationStatus}{user.artisan.sampleLabel ? " · sample" : ""}</p><p className="text-[10px] text-muted-foreground">{user.artisan.completedProjects} completed</p></> : <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-3 py-2 text-ink/55">{formatDate(user.createdAt)}</td>
                  <td className="px-3 py-2">{user.suspendedAt ? <span className="text-[10px] font-medium text-vermilion">Suspended</span> : <div className="flex items-center gap-1"><input value={reasons[user._id] ?? ""} onChange={(e) => setReasons((p) => ({ ...p, [user._id]: e.target.value }))} placeholder="Reason" className="h-7 w-24 rounded border border-maroon/20 bg-parchment px-1.5 text-[10px]" /><button type="button" onClick={async () => { try { await suspend({ userId: user._id, suspend: true, reason: reasons[user._id] ?? "" }); toast.success("User suspended."); } catch (error) { toast.error(error instanceof Error ? error.message.replace(/^[A-Z_]+:\s*/, "") : "Could not suspend."); } }} className="text-[10px] font-semibold text-vermilion">Suspend</button></div>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Audit() {
  const rows = useQuery(api.admin.auditLog);
  return (
    <div>
      <h2 className="font-display text-xl font-semibold text-maroon">Audit log</h2>
      <p className="mt-1 text-[10px] text-ink/50">Server-recorded actions, newest first. This is an operational log, not a public feed.</p>
      {rows === undefined ? <div className="mt-2 h-40 animate-pulse rounded-xl bg-card" /> : rows.length === 0 ? <p className="mt-2 rounded-xl border border-dashed border-maroon/20 p-5 text-xs text-ink/50">No audit events yet.</p> : (
        <div className="mt-2 divide-y divide-maroon/8 overflow-hidden rounded-xl border border-maroon/15 bg-card">
          {rows.map((row) => (
            <div key={row._id} className="flex flex-wrap items-start justify-between gap-2 px-3 py-2.5">
              <div><p className="text-xs font-medium text-ink">{row.action.split(".").join(" · ")}</p><p className="text-[10px] text-muted-foreground">{row.actorName} ({row.actorRole}) · {row.subjectType} {row.subjectId}</p>{row.detail && <p className="mt-0.5 text-[10px] text-ink/50">{row.detail}</p>}</div>
              <time className="text-[9px] uppercase tracking-wide text-muted-foreground">{formatDateTime(row._creationTime)}</time>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() { return <AdminGuard section="dashboard" />; }
export function AdminVerifications() { return <AdminGuard section="verifications" />; }
export function AdminReports() { return <AdminGuard section="reports" />; }
export function AdminDisputes() { return <AdminGuard section="disputes" />; }
export function AdminTransactions() { return <AdminGuard section="transactions" />; }
export function AdminUsers() { return <AdminGuard section="users" />; }
export function AdminAudit() { return <AdminGuard section="audit" />; }
