import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { LogoMark, Wordmark } from "@/components/brand/Logo";
import { PortalShell } from "@/components/portal/PortalShell";
import { PublicShell } from "@/components/public/PublicShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, formatDateTime } from "@/lib/marketplace";
import { UploadImages, type UploadedImage } from "@/components/marketplace/UploadImages";
import { useMutation, useQuery } from "convex/react";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Check,
  Copy,
  FileText,
  Globe2,
  Eye,
  EyeOff,
  History,
  Loader2,
  LockKeyhole,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";

type PassportRecord = {
  projectTitle: string;
  category: string;
  craftPreference: string | null;
  craftTradition: string | null;
  heritageRegion: string | null;
  productionLocation: string | null;
  productionLocationShared: boolean;
  materialsOrigin: string | null;
  techniques: string[];
  materials: string[];
  approvedConceptTitle: string | null;
  approvedConceptApprovedAt: number | null;
  completedAt: number | null;
  sampleLabel?: string | null;
  artisans: {
    name: string;
    city: string;
    craft: string;
    verification: string;
    skills: string[];
    role?: string;
  }[];
  timeline: {
    title: string;
    actorRole: string;
    type: string;
    createdAt: number;
  }[];
  recordedFrom: "KalaProof";
  independentlyVerified: false;
  verification: {
    status: string;
    label: string;
    reviewerName: string | null;
    reviewedAt: number | null;
    scope: string | null;
    limitations: string | null;
    note: string | null;
    revokedAt: number | null;
    revocationReason: string | null;
    basis: string;
    independentAuthentication: false;
  };
  evidence: {
    summary: string | null;
    fileCount: number;
    submittedAt: number | null;
  };
  privacy: string;
};

function verificationTone(status: string) {
  if (status === "verified") return "border-emerald/35 bg-emerald/[0.07] text-emerald";
  if (status === "under_review" || status === "evidence_submitted") return "border-gold/50 bg-gold/10 text-[#74572c]";
  if (status === "rejected" || status === "revoked") return "border-vermilion/30 bg-vermilion/[0.06] text-vermilion";
  return "border-maroon/20 bg-parchment text-ink/50";
}

function Certificate({
  record,
  shareUrl,
  publicView = false,
  actions,
}: {
  record: PassportRecord;
  shareUrl: string;
  publicView?: boolean;
  actions?: React.ReactNode;
}) {
  return (
    <article className="relative overflow-hidden border border-maroon/30 bg-[#fbf6eb] shadow-[0_30px_80px_-50px_rgba(45,25,19,0.55)]">
      <div className="h-2 block-print-border" />
      <div className="pointer-events-none absolute inset-4 border border-gold/35" />
      <div className="pointer-events-none absolute -right-28 -top-36 opacity-[0.06]">
        <LogoMark className="size-[430px]" />
      </div>

      <div className="relative px-5 py-8 sm:px-10 sm:py-12">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <LogoMark className="size-7" />
              <Wordmark size="sm" />
            </div>
            <p className="mt-4 label-caps text-[8px] text-teal">Digital product passport</p>
            <p className="mt-1 text-[8px] uppercase tracking-[0.18em] text-ink/35">Kalakari · KalaProof record</p>
          </div>
          <div className="text-right">
            <p className="font-display text-[11px] italic text-maroon/50">No. {record.completedAt ? new Date(record.completedAt).getFullYear() : "—"}</p>
            <p className="mt-1 text-[8px] uppercase tracking-[0.12em] text-ink/35">Completed {formatDate(record.completedAt)}</p>
          </div>
        </div>

        {record.sampleLabel && (
          <p className="mt-5 border border-gold/40 bg-gold/[0.08] px-3 py-2 text-center text-[9px] leading-relaxed text-[#7a4f10]">
            {record.sampleLabel}
          </p>
        )}

        <div className="mt-5 flex justify-center">
          <span className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-[8px] font-semibold uppercase tracking-[0.12em] ${verificationTone(record.verification.status)}`}>
            {record.verification.status === "verified" ? <ShieldCheck className="size-3" /> : record.verification.status === "revoked" || record.verification.status === "rejected" ? <ShieldAlert className="size-3" /> : <FileText className="size-3" />}
            {record.verification.label}
          </span>
        </div>

        <div className="mt-10 text-center">
          <p className="label-caps text-[8px] text-maroon/50">This is the recorded story of</p>
          <h1 className="mx-auto mt-3 max-w-[20ch] font-display text-4xl font-medium leading-[0.94] tracking-[-0.025em] text-ink sm:text-5xl">
            {record.projectTitle}
          </h1>
          <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-teal">
            {record.category}{record.craftPreference ? ` · ${record.craftPreference}` : ""}
          </p>
          <div className="mx-auto mt-5 h-px w-20 bg-gold/65" />
        </div>

        <div className="mt-10 grid gap-7 sm:grid-cols-[1fr_0.9fr]">
          <div className="space-y-6">
            <section>
              <p className="label-caps text-[8px] text-muted-foreground">The hands</p>
              <div className="mt-2 space-y-2">
                {record.artisans.length === 0 && (
                  <p className="border border-dashed border-maroon/20 px-3 py-3 text-[10px] text-muted-foreground">Artisan profile unavailable.</p>
                )}
                {record.artisans.map((artisan) => (
                  <div key={artisan.name} className="flex items-start gap-2.5 border border-maroon/12 bg-[#fcf9f2] p-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-ivory">
                      <UserRound className="size-3.5 text-maroon/60" />
                    </span>
                    <div>
                      <p className="font-display text-lg font-semibold leading-none text-ink">{artisan.name}</p>
                      <p className="mt-1 text-[9px] text-ink/50">{artisan.craft} · {artisan.city}{artisan.role ? ` · ${artisan.role}` : ""}</p>
                      <p className="mt-1 flex items-center gap-1 text-[8px] uppercase tracking-[0.08em] text-teal">
                        <BadgeCheck className="size-2.5" /> {artisan.verification === "verified" ? "Documents verified" : "Verification not claimed"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <p className="label-caps text-[8px] text-muted-foreground">Craft, place & materials</p>
              <div className="mt-2 space-y-1.5 text-[10px] leading-relaxed">
                <p className="text-[11px] text-ink/70"><span className="font-semibold text-maroon">{record.craftTradition ?? record.craftPreference ?? "Craft recorded in the brief"}</span>{record.heritageRegion ? ` · heritage reference: ${record.heritageRegion}` : ""}</p>
                <p className="text-ink/45">{record.techniques.length > 0 ? record.techniques.join(" · ") : "Techniques recorded with the artisan."}</p>
                <p className="text-ink/45">{record.materials.length > 0 ? record.materials.slice(0, 3).join(" · ") : "Materials recorded in the brief."}{record.materialsOrigin ? ` · origin: ${record.materialsOrigin}` : ""}</p>
                <p className="flex items-start gap-1.5 text-[9px] text-ink/40"><span className="shrink-0 uppercase tracking-[0.08em]">Production</span>{record.productionLocation ? record.productionLocation : "Production location is private or was not recorded."}</p>
                <p className="mt-2 border-l-2 border-gold/50 pl-2 text-[8px] leading-relaxed text-ink/35">Heritage region describes a tradition's documented regional association. It is not the same as the place where this item was made.</p>
              </div>
            </section>

            <section>
              <p className="label-caps text-[8px] text-muted-foreground">Design evolution</p>
              <p className="mt-2 font-display text-lg italic leading-tight text-maroon">
                {record.approvedConceptTitle ?? "Concept approved by the customer"}
              </p>
              <p className="mt-1 text-[9px] text-ink/40">Approved {formatDate(record.approvedConceptApprovedAt)} · uploaded by the artisan</p>
            </section>
          </div>

          <div className="border-t border-maroon/12 pt-5 sm:border-l sm:border-t-0 sm:pl-7 sm:pt-0">
            <p className="label-caps text-[8px] text-muted-foreground">Recorded milestones</p>
            <ol className="mt-3 space-y-0">
              {record.timeline.slice(-9).map((event, index) => (
                <li key={`${event.createdAt}-${event.title}`} className="relative flex gap-2.5 pb-3 last:pb-0">
                  {index < Math.min(record.timeline.slice(-9).length - 1, 8) && (
                    <span className="absolute left-[5px] top-3 h-full w-px bg-gold/25" />
                  )}
                  <span className="relative z-10 mt-1 size-2.5 shrink-0 rounded-full border border-gold/60 bg-ivory" />
                  <div>
                    <p className="text-[10px] font-medium leading-snug text-ink/70">{event.title}</p>
                    <p className="mt-0.5 text-[8px] uppercase tracking-[0.08em] text-muted-foreground">
                      {formatDate(event.createdAt)} · {event.actorRole}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <section className={`mt-8 border p-4 ${verificationTone(record.verification.status)}`}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em]"><ShieldCheck className="size-3" /> Verification status</p>
              <p className="mt-1 text-[10px] leading-relaxed opacity-80">
                {record.verification.status === "verified"
                  ? `Reviewed by ${record.verification.reviewerName ?? "a named Kalakari reviewer"} on ${formatDate(record.verification.reviewedAt)}. Scope: ${record.verification.scope ?? "recorded evidence and KalaProof"}.`
                  : record.verification.status === "under_review"
                    ? "A named reviewer is examining the submitted evidence. No verified badge is issued while the review is open."
                    : record.verification.status === "evidence_submitted"
                      ? "Evidence has been submitted. It has not yet been reviewed or verified."
                      : record.verification.status === "revoked"
                        ? `A previous verification was revoked on ${formatDate(record.verification.revokedAt)}. ${record.verification.revocationReason ?? ""}`
                        : record.verification.status === "rejected"
                          ? `The reviewer declined verification. ${record.verification.note ?? ""}`
                          : "No verification review has been completed. This passport is platform-recorded provenance, not a proof of authenticity."}
              </p>
            </div>
            <span className="text-[8px] uppercase tracking-[0.1em] opacity-60">Not independent authentication</span>
          </div>
          {record.verification.status === "verified" && record.verification.limitations && (
            <p className="mt-2 border-t border-current/15 pt-2 text-[9px] leading-relaxed opacity-75"><span className="font-semibold">Limitations.</span> {record.verification.limitations}</p>
          )}
          {record.evidence.summary && (
            <div className="mt-2 border-t border-current/15 pt-2">
              <p className="text-[8px] font-semibold uppercase tracking-[0.1em] opacity-70">Public evidence summary</p>
              <p className="mt-1 text-[9px] leading-relaxed opacity-75">{record.evidence.summary}</p>
              <p className="mt-1 text-[8px] opacity-50">Submitted {formatDate(record.evidence.submittedAt)} · {record.evidence.fileCount} private supporting file{record.evidence.fileCount === 1 ? "" : "s"} not included in the public view</p>
            </div>
          )}
        </section>

        <div className="mt-10 flex flex-wrap items-end justify-between gap-5 border-t border-maroon/15 pt-5">
          <div className="max-w-[48ch]">
            <p className="flex items-center gap-1.5 text-[8px] uppercase tracking-[0.15em] text-teal">
              <ShieldCheck className="size-3" /> Recorded from KalaProof
            </p>
            <p className="mt-1 text-[9px] leading-relaxed text-ink/45">
              This passport reflects platform-recorded events. It is not an independent authenticity
              certificate, appraisal or guarantee. {record.privacy}
            </p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="border border-maroon/15 bg-[#f7f2e8] p-2">
              <QRCodeSVG value={shareUrl} size={104} bgColor="#f7f2e8" fgColor="#28231f" level="M" />
            </div>
            <p className="text-[7px] uppercase tracking-[0.12em] text-muted-foreground">Scan to view</p>
          </div>
        </div>

        {actions && <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-maroon/12 pt-4">{actions}</div>}
        {publicView && (
          <p className="mt-6 text-center text-[8px] uppercase tracking-[0.16em] text-ink/30">
            A public record shared by the customer · Kalakari
          </p>
        )}
      </div>
    </article>
  );
}

export function KalaPassportPublic() {
  const { token } = useParams();
  const data = useQuery(api.passport.publicGet, token ? { token } : "skip");
  const shareUrl = typeof window === "undefined" ? "" : window.location.href;

  return (
    <PublicShell>
      <div className="mx-auto max-w-[880px] px-4 py-12 md:px-8 md:py-20">
        {data === undefined ? (
          <div className="flex h-80 items-center justify-center border border-maroon/15 bg-card">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : data === null ? (
          <div className="border border-dashed border-maroon/25 bg-card px-6 py-20 text-center">
            <LockKeyhole className="mx-auto size-8 text-maroon/30" />
            <p className="mt-3 font-display text-3xl text-maroon">This passport isn’t public.</p>
            <p className="mx-auto mt-2 max-w-[42ch] text-xs leading-relaxed text-ink/55">
              It may not exist, the project may not be complete, or the customer may have turned
              sharing off. A KalaPassport is only visible when its owner explicitly shares it.
            </p>
            <Link to="/" className="mt-5 inline-flex rounded-full bg-maroon px-5 py-2.5 text-xs font-semibold text-ivory">Return to Kalakari</Link>
          </div>
        ) : (
          <>
            <Certificate record={data.record as PassportRecord} shareUrl={shareUrl} publicView />
            <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
              <Link to="/" className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-maroon">
                <ArrowLeft className="size-3.5" /> Kalakari
              </Link>
              <Link to="/explore-artisans" className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-teal-deep">
                Explore artisans <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </>
        )}
      </div>
    </PublicShell>
  );
}

export function KalaPassportPrivate() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const detail = useQuery(api.projects.detail, projectId ? { projectId: projectId as Id<"projects"> } : "skip");
  const passport = useQuery(api.passport.getMine, projectId ? { projectId: projectId as Id<"projects"> } : "skip");
  const ensure = useMutation(api.passport.ensure);
  const setPublic = useMutation(api.passport.setPublic);
  const submitEvidence = useMutation(api.passport.submitEvidence);
  const setPrivacy = useMutation(api.passport.setPrivacy);
  const rotateShareToken = useMutation(api.passport.rotateShareToken);
  const startReview = useMutation(api.passport.startReview);
  const decideReview = useMutation(api.passport.decideReview);
  const revokeVerification = useMutation(api.passport.revokeVerification);
  const [busy, setBusy] = useState<string | null>(null);
  const [evidenceImages, setEvidenceImages] = useState<UploadedImage[]>([]);
  const [evidenceForm, setEvidenceForm] = useState({
    craftTradition: "", heritageRegion: "", productionLocation: "", materialsOrigin: "",
    publicEvidenceSummary: "", evidenceNotes: "",
  });
  const [reviewScope, setReviewScope] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [reviewLimitations, setReviewLimitations] = useState("Review covers the submitted evidence and KalaProof history; it does not independently authenticate the object.");
  const [revokeReason, setRevokeReason] = useState("");

  const role = detail?.viewer.role === "artisan" ? "artisan" : detail?.viewer.role === "admin" ? "admin" : user?.role === "artisan" ? "artisan" : "customer";
  const canManage = detail?.viewer.role === "customer";
  const isAdmin = detail?.viewer.role === "admin";
  const isArtisan = detail?.viewer.role === "artisan";
  const project = detail?.project;
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const shareUrl = passport ? `${origin}/passport/${passport.passport.shareToken}` : "";

  async function create() {
    if (!projectId) return;
    setBusy("create");
    try {
      await ensure({ projectId: projectId as Id<"projects"> });
      toast.success("KalaPassport created. Sharing is off until you enable it.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^[A-Z_]+:\s*/, "") : "Could not create the passport.");
    } finally {
      setBusy(null);
    }
  }

  async function toggle() {
    if (!projectId || !passport) return;
    setBusy("share");
    try {
      await setPublic({ projectId: projectId as Id<"projects">, enabled: !passport.passport.publicEnabled });
      toast.success(passport.passport.publicEnabled ? "Public sharing turned off." : "Public sharing turned on.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^[A-Z_]+:\s*/, "") : "Could not update sharing.");
    } finally {
      setBusy(null);
    }
  }

  async function copy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Public passport link copied.");
    } catch {
      toast.error("Could not copy the link.");
    }
  }

  async function saveEvidence() {
    if (!projectId) return;
    if (evidenceImages.length === 0) { toast.error("Attach at least one supporting file."); return; }
    setBusy("evidence");
    try {
      await submitEvidence({
        projectId: projectId as Id<"projects">,
        ...evidenceForm,
        evidenceFiles: evidenceImages.map((image) => ({ storageId: image.storageId, name: image.name, contentType: image.contentType, size: image.size })),
      });
      setEvidenceImages([]);
      toast.success("Evidence submitted for review. No verified badge is issued yet.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^[A-Z_]+:\s*/, "") : "Could not submit evidence.");
    } finally { setBusy(null); }
  }

  async function updatePrivacy(key: "shareProductionLocation" | "shareArtisanNames", value: boolean) {
    if (!projectId || !passport) return;
    const next = {
      shareProductionLocation: passport.passport.shareProductionLocation ?? false,
      shareArtisanNames: passport.passport.shareArtisanNames ?? true,
      [key]: value,
    };
    setBusy("privacy");
    try {
      await setPrivacy({ projectId: projectId as Id<"projects">, ...next });
      toast.success("Public privacy settings updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^[A-Z_]+:\s*/, "") : "Could not update privacy.");
    } finally { setBusy(null); }
  }

  async function revokeLink() {
    if (!projectId || !passport) return;
    if (!window.confirm("Revoke the current public link and turn sharing off? Anyone with the old QR or URL will lose access.")) return;
    setBusy("rotate");
    try {
      await rotateShareToken({ projectId: projectId as Id<"projects"> });
      toast.success("Old link revoked. Sharing is off.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^[A-Z_]+:\s*/, "") : "Could not revoke the link.");
    } finally { setBusy(null); }
  }

  async function beginReview() {
    if (!passport) return;
    setBusy("review-start");
    try {
      await startReview({ passportId: passport.passport._id, scope: reviewScope });
      toast.success("Review opened.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^[A-Z_]+:\s*/, "") : "Could not open review.");
    } finally { setBusy(null); }
  }

  async function decide(decision: "verified" | "rejected") {
    if (!passport) return;
    setBusy(decision);
    try {
      await decideReview({ passportId: passport.passport._id, decision, note: reviewNote, limitations: reviewLimitations });
      toast.success(decision === "verified" ? "Verification recorded with reviewer, scope and limitations." : "Review decision recorded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^[A-Z_]+:\s*/, "") : "Could not record the decision.");
    } finally { setBusy(null); }
  }

  async function revoke() {
    if (!passport) return;
    setBusy("revoke");
    try {
      await revokeVerification({ passportId: passport.passport._id, reason: revokeReason });
      toast.success("Verification revoked and public sharing stopped.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^[A-Z_]+:\s*/, "") : "Could not revoke verification.");
    } finally { setBusy(null); }
  }

  return (
    <PortalShell
      role={role}
      title="KalaPassport"
      hindi="पासपोर्ट"
      subtitle={detail?.project.title ?? "The recorded story of a completed creation."}
      actions={
        <Link to={role === "admin" ? "/admin/dashboard" : `/${role}/projects/${projectId}`} className="hidden items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-teal-deep sm:inline-flex">
          <ArrowLeft className="size-3.5" /> Back to project
        </Link>
      }
    >
      <div className="mx-auto max-w-[900px]">
        {detail === undefined || passport === undefined ? (
          <div className="flex h-72 items-center justify-center border border-maroon/15 bg-card"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
        ) : detail === null ? (
          <div className="border border-dashed border-maroon/25 bg-card px-6 py-16 text-center">
            <p className="font-display text-2xl text-maroon">This project is not available.</p>
          </div>
        ) : passport === null ? (
          <div className="border border-maroon/15 bg-card p-6 md:p-10">
            <div className="mx-auto max-w-[560px] text-center">
              <LogoMark className="mx-auto size-10" />
              <p className="mt-4 label-caps text-[9px] text-teal">KalaPassport</p>
              <h1 className="mt-2 font-display text-4xl font-medium leading-none text-ink">Keep the story of the making.</h1>
              <p className="mt-4 text-sm leading-relaxed text-ink/58">
                A certificate-style record of the approved design, the hands involved, the craft
                techniques, materials and milestones recorded in KalaProof.
              </p>
              <div className="mt-5 border border-gold/35 bg-ivory/65 p-4 text-left">
                <p className="flex items-start gap-2 text-[10px] leading-relaxed text-ink/60">
                  <LockKeyhole className="mt-0.5 size-3.5 shrink-0 text-maroon/45" />
                  A passport becomes available when the project is completed. It is private until
                  you explicitly enable its public summary. Conversations, addresses, payments and
                  private files are never included.
                </p>
              </div>
              {project?.status === "completed" ? (
                canManage ? (
                  <Button className="mt-5 rounded-full bg-maroon px-6 text-ivory hover:bg-maroon-deep" disabled={busy !== null} onClick={() => void create()}>
                    {busy === "create" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Create my KalaPassport
                  </Button>
                ) : (
                  <p className="mt-5 border border-dashed border-maroon/20 bg-parchment px-4 py-3 text-[10px] text-muted-foreground">
                    The customer creates and controls this passport. You can view it here once it exists.
                  </p>
                )
              ) : (
                <p className="mt-5 border border-dashed border-maroon/20 bg-parchment px-4 py-3 text-[10px] text-muted-foreground">
                  This project is currently <span className="font-semibold text-maroon">{project?.status.replace(/_/g, " ")}</span>. The passport opens after completion.
                </p>
              )}
            </div>
          </div>
        ) : (
          <>
            <Certificate
              record={passport.record as PassportRecord}
              shareUrl={shareUrl}
              actions={
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] ${passport.passport.publicEnabled ? "border-emerald/30 bg-emerald/[0.06] text-emerald" : "border-maroon/20 bg-parchment text-ink/55"}`}>
                      {passport.passport.publicEnabled ? <Globe2 className="size-3" /> : <LockKeyhole className="size-3" />}
                      {passport.passport.publicEnabled ? "Public summary on" : "Private"}
                    </span>
                    {passport.passport.publicEnabled && (
                      <button type="button" onClick={() => void copy()} className="inline-flex items-center gap-1.5 border border-maroon/20 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-maroon">
                        <Copy className="size-3" /> Copy link
                      </button>
                    )}
                  </div>
                  {canManage ? (
                    <>
                      <Button size="sm" variant="outline" className="rounded-full border-maroon/25 text-[10px] text-maroon" disabled={busy !== null} onClick={() => void toggle()}>
                        {busy === "share" ? <Loader2 className="size-3.5 animate-spin" /> : passport.passport.publicEnabled ? <LockKeyhole className="size-3.5" /> : <Globe2 className="size-3.5" />}
                        {passport.passport.publicEnabled ? "Turn off public sharing" : "Share public summary"}
                      </Button>
                      {passport.passport.publicEnabled && (
                        <button type="button" onClick={() => void revokeLink()} disabled={busy !== null} className="inline-flex items-center gap-1.5 border border-vermilion/25 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-vermilion disabled:opacity-50">
                          <History className="size-3" /> Revoke link & rotate
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="max-w-[300px] text-[9px] leading-relaxed text-muted-foreground">The customer controls whether this passport is public. Your view remains private to the project.</p>
                  )}
                </>
              }
            />

            {!isAdmin && (canManage || isArtisan) && passport.passport.reviewStatus !== "verified" && passport.passport.reviewStatus !== "under_review" && (
              <section className="mt-4 border border-maroon/15 bg-card p-4">
                <p className="label-caps text-[8px] text-teal">Evidence record · no badge until reviewed</p>
                <h2 className="mt-1 font-display text-2xl font-semibold text-maroon">Submit structured craft evidence</h2>
                <p className="mt-1 text-[10px] leading-relaxed text-ink/50">
                  Describe the tradition, heritage region, actual production place and materials origin separately. Supporting files stay private; only your public summary is shown in the shared passport. Submitting here replaces the current evidence draft.
                </p>
                {(passport.passport.craftTradition || passport.passport.heritageRegion) && (
                  <p className="mt-2 rounded-lg border border-gold/25 bg-gold/[0.06] p-2.5 text-[9px] leading-relaxed text-[#74572c]">
                    Current record: {passport.passport.craftTradition ?? "craft not set"} · {passport.passport.heritageRegion ?? "heritage region not set"} · production {passport.passport.productionLocation ?? "not recorded"} ({passport.passport.shareProductionLocation ? "public" : "private"}).
                  </p>
                )}
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {([
                    ["craftTradition", "Craft tradition", "e.g. Kantha embroidery"],
                    ["heritageRegion", "Heritage region", "e.g. Bengal"],
                    ["productionLocation", "Production city / region", "Kept private unless you opt in"],
                    ["materialsOrigin", "Materials & origin", "Only if known"],
                  ] as const).map(([key, label, placeholder]) => (
                    <label key={key} className="text-[9px] font-semibold uppercase tracking-[0.08em] text-ink/45">
                      {label}
                      <input
                        value={evidenceForm[key]}
                        onChange={(event) => setEvidenceForm((current) => ({ ...current, [key]: event.target.value }))}
                        placeholder={placeholder}
                        className="mt-1 h-9 w-full rounded-lg border border-maroon/15 bg-[#fffaf0] px-2.5 text-[10px] font-normal normal-case tracking-normal text-ink outline-none focus:border-maroon/40"
                      />
                    </label>
                  ))}
                </div>
                <label className="mt-2 block text-[9px] font-semibold uppercase tracking-[0.08em] text-ink/45">
                  Public evidence summary
                  <textarea value={evidenceForm.publicEvidenceSummary} onChange={(event) => setEvidenceForm((current) => ({ ...current, publicEvidenceSummary: event.target.value }))} rows={2} placeholder="What can be shown publicly about the evidence? Avoid addresses, IDs and private customer details." className="mt-1 w-full rounded-lg border border-maroon/15 bg-[#fffaf0] p-2.5 text-[10px] font-normal normal-case tracking-normal leading-relaxed text-ink outline-none focus:border-maroon/40" />
                </label>
                <label className="mt-2 block text-[9px] font-semibold uppercase tracking-[0.08em] text-ink/45">
                  Private note for the reviewer
                  <textarea value={evidenceForm.evidenceNotes} onChange={(event) => setEvidenceForm((current) => ({ ...current, evidenceNotes: event.target.value }))} rows={2} placeholder="What was submitted, how it relates to the object, and what the reviewer should check." className="mt-1 w-full rounded-lg border border-maroon/15 bg-[#fffaf0] p-2.5 text-[10px] font-normal normal-case tracking-normal leading-relaxed text-ink outline-none focus:border-maroon/40" />
                </label>
                <p className="mt-2 rounded-lg border border-maroon/10 bg-[#fbf5e8] p-2.5 text-[9px] leading-relaxed text-ink/50">
                  Public location and artisan-name visibility are controlled separately under <strong>Public summary controls</strong> below. Submitting evidence does not change those choices.
                </p>
                <div className="mt-3"><UploadImages value={evidenceImages} onChange={setEvidenceImages} max={6} label="Private evidence files" hint="Images only, stored privately. Visible to project participants and reviewers, never in the public certificate." /></div>
                {passport.evidenceFiles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {passport.evidenceFiles.map((file) => file.url ? <a key={file.storageId} href={file.url} target="_blank" rel="noreferrer" className="size-14 overflow-hidden rounded-lg border border-maroon/15"><img src={file.url} alt={file.name} className="size-full object-cover" /></a> : null)}
                  </div>
                )}
                <Button onClick={() => void saveEvidence()} disabled={busy !== null} className="mt-3 rounded-full bg-maroon text-[10px] text-ivory hover:bg-maroon-deep">
                  {busy === "evidence" ? <Loader2 className="size-3.5 animate-spin" /> : <FileText className="size-3.5" />} Submit evidence for review
                </Button>
              </section>
            )}

            {canManage && (
              <section className="mt-4 border border-maroon/15 bg-card p-4">
                <p className="label-caps text-[8px] text-teal">Public summary controls</p>
                <h2 className="mt-1 font-display text-xl font-semibold text-maroon">What the QR link may reveal</h2>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <label className="flex items-center justify-between gap-3 rounded-xl border border-maroon/10 bg-[#fbf5e8] p-3 text-[10px] text-ink/60">
                    <span className="flex items-center gap-2">{passport.passport.shareProductionLocation ? <Eye className="size-3.5 text-teal" /> : <EyeOff className="size-3.5 text-ink/35" />} Production location</span>
                    <input type="checkbox" checked={passport.passport.shareProductionLocation ?? false} disabled={busy !== null} onChange={(event) => void updatePrivacy("shareProductionLocation", event.target.checked)} className="accent-[#7a302a]" />
                  </label>
                  <label className="flex items-center justify-between gap-3 rounded-xl border border-maroon/10 bg-[#fbf5e8] p-3 text-[10px] text-ink/60">
                    <span className="flex items-center gap-2">{passport.passport.shareArtisanNames ?? true ? <Eye className="size-3.5 text-teal" /> : <EyeOff className="size-3.5 text-ink/35" />} Artisan names</span>
                    <input type="checkbox" checked={passport.passport.shareArtisanNames ?? true} disabled={busy !== null} onChange={(event) => void updatePrivacy("shareArtisanNames", event.target.checked)} className="accent-[#7a302a]" />
                  </label>
                </div>
                <p className="mt-2 text-[8px] leading-relaxed text-ink/40">The heritage region and craft tradition are always part of the record; exact production location and artisan identity are optional. Revoking the link rotates the token and turns sharing off.</p>
              </section>
            )}

            {isAdmin && (
              <section className="mt-4 border border-gold/40 bg-[#fdf8ec] p-4">
                <p className="label-caps flex items-center gap-1.5 text-[8px] text-[#8a6a31]"><ShieldCheck className="size-3" /> Reviewer workspace</p>
                <h2 className="mt-1 font-display text-2xl font-semibold text-maroon">Review evidence and record a decision</h2>
                <p className="mt-1 text-[10px] leading-relaxed text-ink/50">Current status: <strong>{passport.passport.reviewStatus ?? "unreviewed"}</strong>. A verified badge is issued only after this reviewed decision, and it states the reviewer, scope, date and limitations.</p>
                {passport.evidenceFiles.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">{passport.evidenceFiles.map((file) => file.url ? <a key={file.storageId} href={file.url} target="_blank" rel="noreferrer" className="size-20 overflow-hidden rounded-lg border border-maroon/15 bg-parchment"><img src={file.url} alt={file.name} className="size-full object-cover" /></a> : null)}</div>
                )}
                {passport.passport.publicEvidenceSummary && <p className="mt-3 rounded-lg bg-card p-3 text-[10px] leading-relaxed text-ink/60"><span className="font-semibold text-maroon">Public summary.</span> {passport.passport.publicEvidenceSummary}</p>}
                {passport.passport.reviewStatus === "under_review" ? (
                  <div className="mt-3 space-y-2">
                    <textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} rows={2} placeholder="Review basis: what evidence was checked and what it does and does not establish." className="w-full rounded-lg border border-maroon/15 bg-card p-2.5 text-[10px] leading-relaxed outline-none focus:border-maroon/40" />
                    <textarea value={reviewLimitations} onChange={(event) => setReviewLimitations(event.target.value)} rows={2} placeholder="Limitations shown with the badge." className="w-full rounded-lg border border-maroon/15 bg-card p-2.5 text-[10px] leading-relaxed outline-none focus:border-maroon/40" />
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => void decide("verified")} disabled={busy !== null} className="rounded-full bg-emerald text-[10px] text-ivory hover:bg-emerald/90">{busy === "verified" ? <Loader2 className="size-3.5 animate-spin" /> : <ShieldCheck className="size-3.5" />} Verify with limitations</Button>
                      <Button onClick={() => void decide("rejected")} disabled={busy !== null} variant="outline" className="rounded-full border-vermilion/30 text-[10px] text-vermilion">Reject</Button>
                    </div>
                  </div>
                ) : passport.passport.reviewStatus === "verified" ? (
                  <div className="mt-3 space-y-2 rounded-xl border border-vermilion/20 bg-vermilion/[0.04] p-3">
                    <p className="text-[10px] font-semibold text-vermilion">Revoke this verification</p>
                    <p className="text-[9px] leading-relaxed text-ink/50">Revocation is recorded in history and immediately turns public sharing off. Use it when evidence is withdrawn or a review error is found.</p>
                    <input value={revokeReason} onChange={(event) => setRevokeReason(event.target.value)} placeholder="Reason for revocation" className="h-9 w-full rounded-lg border border-maroon/15 bg-card px-2.5 text-[10px] outline-none focus:border-maroon/40" />
                    <Button onClick={() => void revoke()} disabled={busy !== null} variant="outline" className="rounded-full border-vermilion/30 text-[10px] text-vermilion">{busy === "revoke" ? <Loader2 className="size-3.5 animate-spin" /> : <ShieldAlert className="size-3.5" />} Revoke verification</Button>
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    <input value={reviewScope} onChange={(event) => setReviewScope(event.target.value)} placeholder="Scope of review, e.g. submitted process photos, material receipts and KalaProof timeline" className="h-9 w-full rounded-lg border border-maroon/15 bg-card px-2.5 text-[10px] outline-none focus:border-maroon/40" />
                    <Button onClick={() => void beginReview()} disabled={busy !== null || !passport.passport.evidenceSubmittedAt} className="rounded-full bg-maroon text-[10px] text-ivory hover:bg-maroon-deep">{busy === "review-start" ? <Loader2 className="size-3.5 animate-spin" /> : <FileText className="size-3.5" />} Start review</Button>
                  </div>
                )}
              </section>
            )}

            <div className="mt-4 border border-maroon/12 bg-card p-4">
              <p className="flex items-center gap-1.5 label-caps text-[8px] text-teal"><History className="size-3" /> Review & sharing history</p>
              {passport.history.length === 0 ? <p className="mt-2 text-[10px] text-ink/45">No review events yet.</p> : (
                <ol className="mt-2 space-y-1.5">
                  {[...passport.history].reverse().slice(0, 8).map((event) => (
                    <li key={event._id} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-maroon/8 pb-1.5 text-[9px] last:border-0">
                      <span className="text-ink/55"><strong className="font-semibold text-maroon">{event.action.replace(/_/g, " ")}</strong> · {event.actorName} ({event.actorRole})</span>
                      <span className="text-ink/35">{formatDateTime(event.createdAt)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="border border-maroon/12 bg-card p-4">
                <p className="flex items-center gap-1.5 label-caps text-[8px] text-teal"><FileText className="size-3" /> Recorded, not certified</p>
                <p className="mt-1.5 text-[10px] leading-relaxed text-ink/55">
                  KalaPassport is a view of platform history. It is not an independent appraisal,
                  authenticity certificate or legal title.
                </p>
              </div>
              <div className="border border-maroon/12 bg-card p-4">
                <p className="flex items-center gap-1.5 label-caps text-[8px] text-teal"><Check className="size-3" /> Privacy-safe by design</p>
                <p className="mt-1.5 text-[10px] leading-relaxed text-ink/55">
                  The public version excludes messages, addresses, payment references, private files
                  and customer identity. The customer controls sharing and can turn it off at any time.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </PortalShell>
  );
}
