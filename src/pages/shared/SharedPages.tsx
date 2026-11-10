import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { PortalShell } from "@/components/portal/PortalShell";
import { MessagesPanel } from "@/components/marketplace/MessagesPanel";
import { UploadImages, type UploadedImage } from "@/components/marketplace/UploadImages";
import { KalaSaathiChat } from "@/components/kalasaathi/KalaSaathiPanel";
import { StatusPill } from "@/components/marketplace/Bits";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { formatDateTime, relativeTime, roleHome } from "@/lib/marketplace";
import { useMutation, useQuery } from "convex/react";
import {
  BadgeCheck, Bell, CheckCheck, ChevronLeft, CircleHelp, FileText, Gavel,
  Loader2, MessageSquare, RotateCcw, ShieldCheck, Sparkles, Upload, UserCog, XCircle,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";

export function MessagesPage() {
  const { user } = useAuth();
  const role = user?.role === "admin" ? "customer" : user?.role === "artisan" ? "artisan" : "customer";
  return (
    <PortalShell role={role} title="Messages" hindi="बातचीत" subtitle="Keep scope, revisions and delivery questions attached to the work.">
      <MessagesPanel role={role} />
      <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">Messages are private to the customer and artisan on that request or project. Admins can review a conversation only as part of a report or dispute. Never move payment off the platform.</p>
    </PortalShell>
  );
}

export function NotificationsPage() {
  const { user } = useAuth();
  const role = user?.role === "admin" ? "admin" : user?.role === "artisan" ? "artisan" : "customer";
  const data = useQuery(api.notifications.list);
  const markRead = useMutation(api.notifications.markRead);
  const markAll = useMutation(api.notifications.markAllRead);

  return (
    <PortalShell role={role} title="Notifications" hindi="सूचनाएँ" subtitle="Quote, concept, payment and delivery updates." actions={data && data.unread > 0 ? <Button size="sm" variant="outline" className="rounded-full border-maroon/25" onClick={() => void markAll({})}><CheckCheck className="size-3.5" /> Mark all read</Button> : undefined}>
      <div className="mx-auto max-w-[900px]">
        {data === undefined ? <div className="h-64 animate-pulse rounded-2xl bg-card" /> : data.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-maroon/25 bg-card/60 p-12 text-center"><Bell className="mx-auto size-8 text-maroon/25" /><p className="mt-2 font-display text-xl text-maroon">Nothing yet.</p><p className="mx-auto mt-1 max-w-[46ch] text-xs text-ink/55">Activity on your briefs, quotes and projects will appear here. We do not send invented “someone viewed your profile” notices.</p></div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-maroon/15 bg-card">
            {data.items.map((item) => (
              <Link key={item._id} to={item.href ?? "/notifications"} onClick={() => { if (!item.readAt) void markRead({ notificationId: item._id }); }} className={`block border-b border-maroon/8 px-4 py-3 last:border-0 ${!item.readAt ? "bg-saffron/[0.06]" : ""}`}>
                <div className="flex items-start gap-2">
                  {!item.readAt && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-vermilion" />}
                  <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-ink">{item.title}</p><p className="mt-0.5 text-[11px] leading-relaxed text-ink/60">{item.body}</p><p className="mt-1 text-[9px] uppercase tracking-wide text-muted-foreground">{relativeTime(item.createdAt)} · {item.type}</p></div>
                </div>
              </Link>
            ))}
          </div>
        )}
        <p className="mt-3 text-[10px] text-muted-foreground">Notifications are records, not a marketing channel. Payment and dispute notices cannot be switched off while a project is active.</p>
      </div>
    </PortalShell>
  );
}

export function KalaSaathiPage() {
  const { user } = useAuth();
  const role = user?.role === "admin" ? "admin" : user?.role === "artisan" ? "artisan" : "customer";
  return (
    <PortalShell role={role} title="KalaSaathi" hindi="कला साथी" subtitle="Help understanding briefs, craft terms and next steps — in Hindi, English or Hinglish.">
      <div className="mx-auto grid max-w-[1100px] gap-5 lg:grid-cols-[1fr_330px]">
        <div className="overflow-hidden rounded-2xl border border-maroon/15 bg-card"><KalaSaathiChat role={role} /></div>
        <aside className="space-y-4">
          <div className="rounded-2xl border border-gold/40 bg-ivory/70 p-4">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-maroon"><Sparkles className="size-3.5" /> What it can do</p>
            <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-ink/60">
              <li>· Explain a brief, quote or production stage</li>
              <li>· Translate between Hindi, English and Hinglish</li>
              <li>· Suggest what is missing from a brief</li>
              <li>· Describe a craft technique in plain language</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-vermilion/20 bg-vermilion/[0.04] p-4">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-vermilion"><XCircle className="size-3.5" /> What it cannot do</p>
            <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-ink/60">
              <li>· Generate artwork or concepts</li>
              <li>· Accept a quote or approve a design</li>
              <li>· Make or release a payment</li>
              <li>· Decide a dispute</li>
            </ul>
          </div>
          <p className="text-[10px] leading-relaxed text-muted-foreground">Replies may use AI. Provider availability affects answers; the deterministic brief tools still work when AI is not configured. Never share passwords, card numbers or identity documents in chat.</p>
        </aside>
      </div>
    </PortalShell>
  );
}

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const role = user?.role === "admin" ? "admin" : user?.role === "artisan" ? "artisan" : "customer";
  const profiles = useQuery(api.account.profiles);
  const update = useMutation(api.account.updateContact);
  const requestVerification = useMutation(api.artisans.submitVerification);
  const requestDeletion = useMutation(api.account.requestDeletion);
  const [form, setForm] = useState({ name: user?.name ?? "", city: (user as { city?: string })?.city ?? "", phone: "", language: "English" });
  const [busy, setBusy] = useState<string | null>(null);
  const [deletionReason, setDeletionReason] = useState("");
  const [showDeletion, setShowDeletion] = useState(false);

  async function save() {
    setBusy("save");
    try { await update({ name: form.name, city: form.city || undefined, phone: form.phone || undefined, language: form.language }); toast.success("Contact details updated."); } catch (error) { toast.error(error instanceof Error ? error.message.replace(/^[A-Z_]+:\s*/, "") : "Could not save."); } finally { setBusy(null); }
  }

  return (
    <PortalShell role={role} title="Settings" hindi="सेटिंग्स" subtitle="Your account, contact details, verification and data requests.">
      <div className="mx-auto max-w-[900px] space-y-4">
        <section className="rounded-2xl border border-maroon/15 bg-card p-5">
          <div className="flex items-center gap-2"><UserCog className="size-5 text-maroon/55" /><h2 className="font-display text-xl font-semibold text-maroon">Account & contact</h2></div>
          <p className="mt-1 text-[11px] text-ink/50">Signed in as {user?.email ?? "—"} · role: {user?.role ?? "user"}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block"><span className="text-[11px] font-semibold text-ink/70">Name</span><input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-maroon/20 bg-parchment px-3 text-sm" /></label>
            <label className="block"><span className="text-[11px] font-semibold text-ink/70">City</span><input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-maroon/20 bg-parchment px-3 text-sm" /></label>
            <label className="block"><span className="text-[11px] font-semibold text-ink/70">Phone <span className="font-normal text-muted-foreground">(optional)</span></span><input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+91…" className="mt-1 h-10 w-full rounded-lg border border-maroon/20 bg-parchment px-3 text-sm" /></label>
            <label className="block"><span className="text-[11px] font-semibold text-ink/70">Preferred language</span><select value={form.language} onChange={(e) => setForm((p) => ({ ...p, language: e.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-maroon/20 bg-parchment px-2.5 text-sm"><option>English</option><option>Hindi</option><option>Hinglish</option></select></label>
          </div>
          <Button size="sm" className="mt-3 rounded-full bg-maroon text-ivory" disabled={busy !== null} onClick={() => void save()}>{busy === "save" ? <Loader2 className="size-3.5 animate-spin" /> : null} Save contact details</Button>
          <p className="mt-2 text-[10px] text-muted-foreground">Your phone is never shown publicly. Documents are handled separately from the profile.</p>
        </section>

        <section className="rounded-2xl border border-maroon/15 bg-card p-5">
          <div className="flex items-center gap-2"><ShieldCheck className="size-5 text-teal" /><h2 className="font-display text-xl font-semibold text-maroon">Verification</h2></div>
          {profiles?.artisan ? (
            <>
              <div className="mt-2 flex flex-wrap items-center gap-2"><StatusPill kind="verification" status={profiles.artisan.verificationStatus} /><span className="text-[11px] text-ink/55">{profiles.artisan.displayName}</span></div>
              <p className="mt-2 text-[11px] leading-relaxed text-ink/60">Verification is a document review by a person. It confirms identity and craft information — not a guarantee of quality. Your portfolio must have at least one real piece before you can request review.</p>
              {profiles.artisan.verificationStatus === "not_submitted" && <Button size="sm" className="mt-3 rounded-full bg-teal text-ivory" disabled={busy !== null} onClick={async () => { setBusy("verify"); try { await requestVerification({}); toast.success("Verification requested. An admin will review it."); } catch (error) { toast.error(error instanceof Error ? error.message.replace(/^[A-Z_]+:\s*/, "") : "Could not request verification."); } finally { setBusy(null); } }}><BadgeCheck className="size-3.5" /> Request verification</Button>}
              {profiles.artisan.verificationStatus === "pending" && <p className="mt-2 rounded-lg bg-saffron/10 px-3 py-2 text-[11px] text-[#8a5a12]">Your request is in the review queue. You will be notified when a decision is recorded.</p>}
              {profiles.artisan.verificationStatus === "info_required" && <p className="mt-2 rounded-lg bg-saffron/10 px-3 py-2 text-[11px] text-[#8a5a12]">The review team needs more information. Check notifications and update your profile, then contact support.</p>}
              {profiles.artisan.verificationStatus === "rejected" && <p className="mt-2 rounded-lg bg-vermilion/10 px-3 py-2 text-[11px] text-vermilion">The last verification request was not approved. The reason is in your notifications.</p>}
              <Link to="/artisan/portfolio" className="mt-2 inline-block text-[10px] font-semibold text-teal-deep">Manage portfolio →</Link>
            </>
          ) : <p className="mt-2 text-[11px] text-ink/55">Verification is available to artisan profiles. Build CraftFit first to apply.</p>}
        </section>

        <section className="rounded-2xl border border-maroon/15 bg-card p-5">
          <div className="flex items-center gap-2"><CircleHelp className="size-5 text-maroon/55" /><h2 className="font-display text-xl font-semibold text-maroon">Privacy & data</h2></div>
          <p className="mt-1 text-[11px] leading-relaxed text-ink/60">Requesting deletion flags the account for review. It does not erase project, payment, dispute or KalaProof records that a counterparty or reviewer may need. You can ask us what data we hold and why.</p>
          {!showDeletion ? <button type="button" onClick={() => setShowDeletion(true)} className="mt-2 text-[11px] font-semibold text-vermilion">Request account deletion →</button> : (
            <div className="mt-2 rounded-xl border border-vermilion/25 bg-vermilion/[0.04] p-3">
              <p className="text-[11px] font-semibold text-vermilion">This flags your account; it does not immediately delete records.</p>
              <textarea value={deletionReason} onChange={(e) => setDeletionReason(e.target.value)} rows={2} placeholder="Why are you requesting deletion? (optional)" className="mt-2 w-full rounded-lg border border-maroon/20 bg-card px-2.5 py-1.5 text-xs" />
              <div className="mt-2 flex gap-2"><Button size="sm" variant="outline" className="rounded-full border-maroon/25" onClick={() => setShowDeletion(false)}>Cancel</Button><Button size="sm" className="rounded-full bg-vermilion text-white" disabled={busy !== null} onClick={async () => { setBusy("delete"); try { await requestDeletion({ reason: deletionReason || undefined }); toast.success("Deletion request recorded. Support will review it."); setShowDeletion(false); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not submit."); } finally { setBusy(null); } }}>Submit request</Button></div>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-4 text-[11px]">
            <Link to="/trust-and-safety" className="font-semibold text-teal-deep">Trust & safety policy →</Link>
            <Link to="/why-kalkaari" className="font-semibold text-teal-deep">How AI is used →</Link>
            <button type="button" onClick={() => void signOut()} className="font-semibold text-maroon">Sign out</button>
          </div>
        </section>
      </div>
    </PortalShell>
  );
}

const DISPUTE_CATEGORIES = [
  ["payment_issue", "Payment issue"],
  ["work_not_started", "Work not started"],
  ["missed_deadline", "Missed deadline"],
  ["not_as_approved", "Not as approved"],
  ["damaged", "Damaged"],
  ["lost", "Lost in transit"],
  ["incomplete", "Incomplete work"],
  ["excessive_revisions", "Excessive revisions"],
  ["shipping_problem", "Shipping problem"],
  ["misrepresentation", "Misrepresentation"],
  ["other", "Something else"],
] as const;

export function DisputePage() {
  const { projectId } = useParams();
  const projects = useQuery(api.projects.mine);
  const detail = useQuery(api.projects.detail, projectId ? { projectId: projectId as Id<"projects"> } : "skip");
  const disputes = useQuery(api.disputes.forProject, projectId ? { projectId: projectId as Id<"projects"> } : "skip");
  const open = useMutation(api.disputes.open);
  const respond = useMutation(api.disputes.respond);
  const appeal = useMutation(api.disputes.appeal);
  const { user } = useAuth();
  const [category, setCategory] = useState<(typeof DISPUTE_CATEGORIES)[number][0]>("not_as_approved");
  const [description, setDescription] = useState("");
  const [outcome, setOutcome] = useState("");
  const [evidence, setEvidence] = useState<UploadedImage[]>([]);
  const [response, setResponse] = useState("");
  const [appealNote, setAppealNote] = useState("");
  const [busy, setBusy] = useState(false);

  const thisProject = (projects ?? []).find((project) => project._id === projectId);
  const role = user?.role === "admin" ? "admin" : detail?.viewer.role ?? (thisProject?.role ?? "customer");
  const shellRole = role === "admin" ? "admin" : role === "artisan" ? "artisan" : "customer";
  const backHref = `/${shellRole}/projects/${projectId}`;

  if (!projectId) return null;
  if (detail === undefined || disputes === undefined) return <PortalShell role={shellRole} title="Dispute"><div className="h-64 animate-pulse rounded-2xl bg-card" /></PortalShell>;
  if (!detail) return <PortalShell role={shellRole} title="Dispute"><p className="text-sm text-ink/60">This project is not available.</p></PortalShell>;

  const active = disputes.find((row) => !["closed"].includes(row.status));
  const latest = disputes[0];
  const canRespond = latest && latest.againstId === user?._id && ["open", "awaiting_response", "under_review"].includes(latest.status);

  async function doOpen() {
    setBusy(true);
    try {
      await open({ projectId: projectId as Id<"projects">, category, description, desiredOutcome: outcome, evidence: evidence.map((img) => ({ storageId: img.storageId, name: img.name, contentType: img.contentType, size: img.size })) });
      toast.success("Dispute opened. The other party and admin reviewers have been notified.");
      setDescription(""); setOutcome(""); setEvidence([]);
    } catch (error) { toast.error(error instanceof Error ? error.message.replace(/^[A-Z_]+:\s*/, "") : "Could not open dispute."); } finally { setBusy(false); }
  }

  return (
    <PortalShell role={shellRole} title="Dispute & help" hindi="सहायता" subtitle={detail.project.title}>
      <div className="mx-auto max-w-[900px] space-y-4">
        <Link to={backHref} className="inline-flex items-center gap-1 text-xs font-semibold text-teal-deep"><ChevronLeft className="size-4" /> Back to project</Link>
        <div className="rounded-2xl border border-gold/40 bg-ivory/70 p-4">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-maroon"><Gavel className="size-3.5" /> How this works</p>
          <p className="mt-1 text-[11px] leading-relaxed text-ink/60">A dispute pauses payout release while a person reviews the approved concept and KalaProof evidence. Both sides can add a response and images. An admin records a decision; either party can appeal once.</p>
        </div>

        {active && (
          <section className="rounded-2xl border border-vermilion/25 bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-vermilion">Active case</p><h2 className="font-display text-xl font-semibold text-maroon">{active.category.split("_").join(" ")}</h2></div><StatusPill kind="dispute" status={active.status} /></div>
            <p className="mt-2 whitespace-pre-line text-[12px] leading-relaxed text-ink/65">{active.description}</p>
            <div className="mt-2 rounded-lg bg-parchment/60 p-2.5 text-[11px]"><strong>Outcome requested:</strong> {active.desiredOutcome}</div>
            {active.evidence.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{active.evidence.map((file) => file.url && <a key={file.storageId} href={file.url} target="_blank" rel="noreferrer"><img src={file.url} alt="Evidence" className="size-20 rounded-lg border border-maroon/15 object-cover" /></a>)}</div>}
            {active.response && <div className="mt-3 rounded-lg border border-teal/20 bg-teal/[0.04] p-2.5"><p className="text-[9px] font-semibold uppercase text-teal">Response from the other side</p><p className="mt-0.5 text-[11px] leading-relaxed text-ink/65">{active.response}</p></div>}
            {canRespond && (
              <div className="mt-3 border-t border-maroon/10 pt-3">
                <p className="text-[11px] font-semibold text-ink/70">Your response</p>
                <textarea value={response} onChange={(e) => setResponse(e.target.value)} rows={3} placeholder="What happened from your side? Reference the agreed concept and progress records." className="mt-1 w-full rounded-lg border border-maroon/20 bg-parchment px-2.5 py-2 text-xs" />
                <Button size="sm" className="mt-2 rounded-full bg-teal text-ivory" disabled={busy || response.trim().length < 20} onClick={async () => { setBusy(true); try { await respond({ disputeId: active._id, response }); toast.success("Response recorded."); setResponse(""); } catch (error) { toast.error(error instanceof Error ? error.message.replace(/^[A-Z_]+:\s*/, "") : "Could not respond."); } finally { setBusy(false); } }}>Submit response</Button>
              </div>
            )}
            {active.decisionNote && <div className="mt-3 rounded-lg border border-gold/50 bg-saffron/[0.08] p-3"><p className="text-[9px] font-semibold uppercase text-[#8a5a12]">Decision</p><p className="mt-0.5 text-[11px] text-ink/70">{active.decisionNote}</p></div>}
            {active.status === "awaiting_response" && active.openedBy === user?._id && <p className="mt-2 text-[10px] text-muted-foreground">Waiting for the other party to respond. Admin review begins after that, or after the response window.</p>}
          </section>
        )}

        {latest && (latest.status === "resolved" || latest.status === "closed") && (
          <section className="rounded-2xl border border-maroon/15 bg-card p-5">
            <div className="flex items-center justify-between gap-2"><h2 className="font-display text-xl font-semibold text-maroon">Decision</h2><StatusPill kind="dispute" status={latest.status} /></div>
            {latest.decisionNote && <p className="mt-2 text-[12px] leading-relaxed text-ink/65">{latest.decisionNote}</p>}
            <p className="mt-1 text-[10px] text-muted-foreground">Decided {latest.decidedAt ? formatDateTime(latest.decidedAt) : ""}. {latest.appealNote ? "An appeal has been recorded." : "You may appeal once if you believe the decision missed evidence."}</p>
            {!latest.appealNote && (
              <div className="mt-2"><textarea value={appealNote} onChange={(e) => setAppealNote(e.target.value)} rows={2} placeholder="Grounds for appeal — what evidence was missed?" className="w-full rounded-lg border border-maroon/20 bg-parchment px-2.5 py-1.5 text-xs" /><Button size="sm" variant="outline" className="mt-2 rounded-full border-maroon/25" disabled={busy || appealNote.trim().length < 20} onClick={async () => { setBusy(true); try { await appeal({ disputeId: latest._id, appealNote }); toast.success("Appeal recorded."); setAppealNote(""); } catch (error) { toast.error(error instanceof Error ? error.message.replace(/^[A-Z_]+:\s*/, "") : "Could not appeal."); } finally { setBusy(false); } }}><RotateCcw className="size-3.5" /> Appeal decision</Button></div>
            )}
          </section>
        )}

        {!active && (
          <section className="rounded-2xl border border-maroon/15 bg-card p-5">
            <h2 className="font-display text-xl font-semibold text-maroon">Open a dispute</h2>
            <p className="mt-1 text-[11px] text-ink/55">Try a project message or revision request first. A dispute is for a real failure to deliver what was approved.</p>
            <div className="mt-3 space-y-3">
              <label className="block"><span className="text-[11px] font-semibold text-ink/70">Category</span><select value={category} onChange={(e) => setCategory(e.target.value as typeof category)} className="mt-1 h-10 w-full rounded-lg border border-maroon/20 bg-parchment px-2.5 text-sm">{DISPUTE_CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="block"><span className="text-[11px] font-semibold text-ink/70">What happened?</span><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Be specific: what was agreed, what was delivered, and when." className="mt-1 w-full rounded-lg border border-maroon/20 bg-parchment px-3 py-2 text-sm" /><span className="text-[10px] text-muted-foreground">{description.trim().length}/30 minimum</span></label>
              <label className="block"><span className="text-[11px] font-semibold text-ink/70">Outcome you are asking for</span><textarea value={outcome} onChange={(e) => setOutcome(e.target.value)} rows={2} placeholder="e.g. Rework the placement to match the approved concept, or a partial refund of ₹…" className="mt-1 w-full rounded-lg border border-maroon/20 bg-parchment px-3 py-2 text-sm" /></label>
              <UploadImages value={evidence} onChange={setEvidence} max={4} label="Evidence (optional)" hint="Photos of the received item, packaging or the approved concept." />
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[10px] text-muted-foreground">Both sides and admin reviewers will see this case and its evidence.</p><Button size="sm" className="rounded-full bg-vermilion text-white" disabled={busy || description.trim().length < 30 || outcome.trim().length < 10} onClick={() => void doOpen()}>{busy ? <Loader2 className="size-3.5 animate-spin" /> : <Gavel className="size-3.5" />} Open dispute</Button></div>
            </div>
          </section>
        )}
      </div>
    </PortalShell>
  );
}

export function ProjectKalaProofPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const detail = useQuery(api.projects.detail, projectId ? { projectId: projectId as Id<"projects"> } : "skip");
  const proof = useQuery(api.projects.kalaProof, projectId ? { projectId: projectId as Id<"projects"> } : "skip");
  const viewerRole = detail?.viewer.role;
  const role: "customer" | "artisan" | "admin" = viewerRole === "artisan" || viewerRole === "admin" ? viewerRole : user?.role === "admin" ? "admin" : "customer";
  return (
    <PortalShell role={role} title="KalaProof" hindi="प्रमाण" subtitle="The append-only evidence record for this project.">
      <div className="mx-auto max-w-[860px]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><Link to={role === "admin" ? "/admin/dashboard" : `/${role}/projects/${projectId}`} className="inline-flex items-center gap-1 text-xs font-semibold text-teal-deep"><ChevronLeft className="size-4" /> Back to project</Link><span className="rounded-full border border-teal/25 bg-teal/[0.05] px-3 py-1 text-[10px] font-medium text-teal-deep">Read-only · corrections are new events</span></div>
        {proof === undefined ? <div className="h-48 animate-pulse rounded-2xl bg-card" /> : proof.events.length === 0 ? <div className="rounded-2xl border border-dashed border-maroon/25 bg-card/60 p-10 text-center"><FileText className="mx-auto size-8 text-maroon/25" /><p className="mt-2 font-display text-xl text-maroon">No evidence yet.</p><p className="mt-1 text-xs text-ink/55">Events appear as the project moves through payment, concept approval, making and delivery.</p></div> : (
          <div className="rounded-2xl border border-maroon/15 bg-card p-5"><KalaProofTimeline events={proof.events} /></div>
        )}
        <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">KalaProof records actions and attachments. It never stores card numbers, credentials or private identity documents. Each event has an actor role and timestamp. No event can be edited in place.</p>
      </div>
    </PortalShell>
  );
}

import { KalaProofTimeline } from "@/components/marketplace/KalaProofTimeline";
