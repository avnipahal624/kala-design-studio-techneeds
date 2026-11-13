import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { LogoMark, Wordmark } from "@/components/brand/Logo";
import { PortalShell } from "@/components/portal/PortalShell";
import { PublicShell } from "@/components/public/PublicShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { formatDate } from "@/lib/marketplace";
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
  Loader2,
  LockKeyhole,
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
  techniques: string[];
  materials: string[];
  approvedConceptTitle: string | null;
  approvedConceptApprovedAt: number | null;
  completedAt: number | null;
  artisans: {
    name: string;
    city: string;
    craft: string;
    verification: string;
    skills: string[];
  }[];
  timeline: {
    title: string;
    actorRole: string;
    type: string;
    createdAt: number;
  }[];
  recordedFrom: "KalaProof";
  independentlyVerified: false;
  privacy: string;
};

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
                      <p className="mt-1 text-[9px] text-ink/50">{artisan.craft} · {artisan.city}</p>
                      <p className="mt-1 flex items-center gap-1 text-[8px] uppercase tracking-[0.08em] text-teal">
                        <BadgeCheck className="size-2.5" /> {artisan.verification === "verified" ? "Documents verified" : "Verification not claimed"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <p className="label-caps text-[8px] text-muted-foreground">Craft & materials</p>
              <p className="mt-2 text-[11px] leading-relaxed text-ink/65">
                {record.techniques.length > 0 ? record.techniques.join(" · ") : "Techniques recorded with the artisan."}
              </p>
              <p className="mt-1.5 text-[10px] leading-relaxed text-ink/45">
                {record.materials.length > 0 ? record.materials.slice(0, 3).join(" · ") : "Materials recorded in the brief."}
              </p>
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
  const [busy, setBusy] = useState<string | null>(null);

  const role = detail?.viewer.role === "artisan" ? "artisan" : detail?.viewer.role === "admin" ? "admin" : user?.role === "artisan" ? "artisan" : "customer";
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
                <Button className="mt-5 rounded-full bg-maroon px-6 text-ivory hover:bg-maroon-deep" disabled={busy !== null} onClick={() => void create()}>
                  {busy === "create" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Create my KalaPassport
                </Button>
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
                  <Button size="sm" variant="outline" className="rounded-full border-maroon/25 text-[10px] text-maroon" disabled={busy !== null} onClick={() => void toggle()}>
                    {busy === "share" ? <Loader2 className="size-3.5 animate-spin" /> : passport.passport.publicEnabled ? <LockKeyhole className="size-3.5" /> : <Globe2 className="size-3.5" />}
                    {passport.passport.publicEnabled ? "Turn off public sharing" : "Share public summary"}
                  </Button>
                </>
              }
            />
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
                  and customer identity. Turn it off at any time.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </PortalShell>
  );
}
