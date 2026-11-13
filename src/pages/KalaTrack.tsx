import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { UploadImages, type UploadedImage } from "@/components/marketplace/UploadImages";
import { PortalShell } from "@/components/portal/PortalShell";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { formatDate, formatDateTime, formatInr, relativeTime, statusLabel } from "@/lib/marketplace";
import { useMutation, useQuery } from "convex/react";
import {
  AlertTriangle, ArrowLeft, ArrowUpRight, Camera, Check, CheckCircle2,
  Clock3, ExternalLink, Image as ImageIcon, Loader2, MessageSquare, Package,
  ShieldCheck, Truck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";

const STAGES = [
  { key: "confirmed", label: "Order confirmed" },
  { key: "production", label: "In production" },
  { key: "review", label: "Final review" },
  { key: "handover", label: "Handover / shipping" },
  { key: "complete", label: "Complete" },
] as const;

function stageFor(status: string) {
  if (status === "completed") return 4;
  if (status === "delivered") return 3;
  if (status === "review_pending") return 2;
  if (status === "in_production") return 1;
  if (status === "funded") return 0;
  return -1;
}

function isStopped(status: string) {
  return status === "cancelled" || status === "refunded" || status === "disputed";
}

function statusTone(status: string) {
  if (status === "completed") return "border-emerald/30 bg-emerald/8 text-emerald";
  if (status === "disputed") return "border-vermilion/30 bg-vermilion/8 text-vermilion";
  if (status === "cancelled" || status === "refunded") return "border-ink/20 bg-ink/5 text-ink/55";
  if (status === "delivered" || status === "review_pending") return "border-saffron/40 bg-saffron/10 text-[#7d5a24]";
  return "border-teal/25 bg-teal/8 text-teal";
}

function plannedDeadlinePassed(deadline: string | undefined, status: string) {
  if (!deadline || status === "completed" || status === "cancelled" || status === "refunded") return false;
  const planned = Date.parse(deadline);
  return Number.isFinite(planned) && planned < Date.now();
}

export function KalaTrackList() {
  const { user } = useAuth();
  const role: "customer" | "artisan" | "admin" = user?.role === "admin" ? "admin" : user?.role === "artisan" ? "artisan" : "customer";
  const projects = useQuery(api.projects.mine);
  const [filter, setFilter] = useState<"active" | "delivered" | "closed" | "all">("active");

  const rows = useMemo(() => {
    if (!projects) return [];
    return projects.filter((project) => {
      if (filter === "all") return true;
      if (filter === "active") return ["funded", "in_production", "review_pending"].includes(project.status);
      if (filter === "delivered") return project.status === "delivered";
      return ["completed", "disputed", "cancelled", "refunded"].includes(project.status);
    });
  }, [projects, filter]);

  return (
    <PortalShell role={role} title="KalaTrack" subtitle="A dated production record for every active order.">
      <div className="mx-auto max-w-[1180px] px-4 py-8 md:px-8 md:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-maroon/10 pb-6">
          <div>
            <p className="label-caps text-[9px] text-teal">KalaTrack · production transparency</p>
            <h1 className="mt-2 font-display text-4xl font-medium text-maroon md:text-5xl">Follow the work, not just the status.</h1>
            <p className="mt-3 max-w-[62ch] text-[12px] leading-relaxed text-ink/55">
              Milestones, dated KalaProof updates, quality checkpoints and manual shipping details, drawn from the same project record used by the artisan and customer workspaces.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full border-maroon/25 text-maroon">
            <Link to={role === "artisan" ? "/artisan/projects" : "/customer/projects"}>Open project workspace <ArrowUpRight className="size-3.5" /></Link>
          </Button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {(["active", "delivered", "closed", "all"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-full border px-3.5 py-1.5 text-[10px] font-semibold capitalize transition ${
                filter === value ? "border-maroon bg-maroon text-ivory" : "border-maroon/20 bg-card text-maroon hover:border-maroon/40"
              }`}
            >
              {value === "active" ? "In progress" : value}
            </button>
          ))}
        </div>

        {projects === undefined ? (
          <div className="mt-10 flex items-center justify-center gap-2 py-20 text-[12px] text-ink/45"><Loader2 className="size-4 animate-spin text-maroon" /> Reading project records…</div>
        ) : rows.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-maroon/25 bg-card/60 p-10 text-center">
            <Package className="mx-auto size-8 text-maroon/35" />
            <p className="mt-3 font-display text-2xl text-maroon">Nothing in this view yet.</p>
            <p className="mx-auto mt-2 max-w-[44ch] text-[11px] leading-relaxed text-ink/50">
              KalaTrack appears once a quote is accepted and a project exists. It does not create orders or change payment state.
            </p>
            <Button asChild className="mt-4 rounded-full bg-maroon text-ivory hover:bg-maroon-deep"><Link to="/customer/projects">View projects</Link></Button>
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            {rows.map((project) => {
              const stage = stageFor(project.status);
              const stopped = isStopped(project.status);
              return (
                <Link
                  key={project._id}
                  to={`/track/${project._id}`}
                  className="group grid gap-4 rounded-2xl border border-maroon/15 bg-card p-4 transition hover:-translate-y-0.5 hover:border-maroon/35 hover:shadow-[0_22px_45px_-35px_rgba(66,32,24,0.5)] md:grid-cols-[1fr_220px_auto] md:items-center"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-maroon/15 bg-[#efe2ca]">
                      {project.imageUrl ? <img src={project.imageUrl} alt="" className="size-full object-cover" /> : <Package className="size-5 text-maroon/40" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate font-display text-xl font-semibold text-maroon">{project.title}</h2>
                        <span className={`rounded-full border px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.08em] ${statusTone(project.status)}`}>
                          {statusLabel("project", project.status)}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] text-ink/50">
                        {project.role === "customer" ? "With" : "For"} {project.counterpartName} · {formatInr(project.amountInr)} · updated {relativeTime(project.updatedAt)}
                      </p>
                      <p className="mt-1 line-clamp-1 text-[10px] text-ink/40">{project.demoLabel ?? project.title}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex h-1.5 overflow-hidden rounded-full bg-maroon/10">
                      {STAGES.map((item, index) => (
                        <span key={item.key} className={`flex-1 border-r border-card last:border-0 ${stopped ? (index <= stage ? "bg-vermilion/50" : "bg-ink/10") : index <= stage ? "bg-maroon" : "bg-maroon/10"}`} />
                      ))}
                    </div>
                    <p className="mt-1.5 text-[8px] uppercase tracking-[0.1em] text-ink/40">
                      {stopped ? statusLabel("project", project.status) : STAGES[Math.max(0, stage)]?.label}
                    </p>
                  </div>

                  <span className="flex items-center gap-1 text-[10px] font-semibold text-maroon">Open KalaTrack <ArrowUpRight className="size-3.5 transition group-hover:translate-x-0.5" /></span>
                </Link>
              );
            })}
          </div>
        )}

        <p className="mt-6 flex items-start gap-2 rounded-xl border border-gold/25 bg-[#fdf6e6] p-3 text-[9px] leading-relaxed text-ink/50">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[#8a6a31]" />
          KalaTrack is a presentation of your existing project record. Timestamps come from server-recorded events; manual carrier links are not live GPS or guaranteed delivery estimates.
        </p>
      </div>
    </PortalShell>
  );
}

export function KalaTrackDetail() {
  const { user } = useAuth();
  const shellRole: "customer" | "artisan" | "admin" = user?.role === "admin" ? "admin" : user?.role === "artisan" ? "artisan" : "customer";
  const { projectId } = useParams();
  const id = projectId as Id<"projects"> | undefined;
  const data = useQuery(api.projects.detail, id ? { projectId: id } : "skip");
  const addProgress = useMutation(api.projects.addProgress);
  const addShipping = useMutation(api.projects.addShipping);
  const [note, setNote] = useState("");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [now] = useState(() => Date.now());

  if (!id) return <PortalShell role={shellRole} title="KalaTrack" subtitle="A dated production record for every active order."><p className="p-10 text-sm text-ink/55">Project not found.</p></PortalShell>;
  if (data === undefined) return <PortalShell role={shellRole} title="KalaTrack" subtitle="A dated production record for every active order."><div className="flex items-center justify-center gap-2 py-24 text-sm text-ink/45"><Loader2 className="size-4 animate-spin text-maroon" /> Loading KalaTrack…</div></PortalShell>;
  if (data === null) return <PortalShell role={shellRole} title="KalaTrack" subtitle="A dated production record for every active order."><p className="p-10 text-sm text-ink/55">This project is not available to your account.</p></PortalShell>;

  const { project, viewer, request, artisan, milestones, events, disputes, reviews } = data;
  const shipment = project.shipment;
  const stage = stageFor(project.status);
  const stopped = isStopped(project.status);
  const deadline = request?.deadline;
  const late = plannedDeadlinePassed(deadline, project.status);
  const isArtisan = viewer.role === "artisan";
  const canProgress = isArtisan && project.status === "in_production";
  const canShip = isArtisan && project.status === "delivered" && !shipment;
  const latestEvent = events[events.length - 1];

  async function submitProgress() {
    if (!note.trim()) { toast.error("Describe what changed."); return; }
    if (images.length === 0) { toast.error("Attach at least one progress photo."); return; }
    setBusy(true);
    try {
      await addProgress({
        projectId: id!,
        note: note.trim(),
        images: images.map((image) => ({ storageId: image.storageId, name: image.name, contentType: image.contentType, size: image.size })),
      });
      setNote("");
      setImages([]);
      toast.success("Progress recorded in KalaProof");
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^.*?: /, "") : "Could not add progress");
    } finally { setBusy(false); }
  }

  async function submitShipping() {
    if (!carrier.trim() || !trackingNumber.trim()) { toast.error("Add the carrier and tracking number."); return; }
    setBusy(true);
    try {
      await addShipping({
        projectId: id!,
        carrier: carrier.trim(),
        trackingNumber: trackingNumber.trim(),
        trackingUrl: trackingUrl.trim() || undefined,
      });
      setCarrier(""); setTrackingNumber(""); setTrackingUrl("");
      toast.success("Manual shipping details recorded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^.*?: /, "") : "Could not save shipping details");
    } finally { setBusy(false); }
  }

  return (
    <PortalShell role={shellRole} title="KalaTrack" subtitle="A dated production record for every active order.">
      <div className="mx-auto max-w-[1180px] px-4 py-7 md:px-8 md:py-9">
        <Link to="/track" className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-maroon/65 hover:text-maroon"><ArrowLeft className="size-3.5" /> KalaTrack</Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4 border-b border-maroon/10 pb-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.1em] ${statusTone(project.status)}`}>{statusLabel("project", project.status)}</span>
              {project.demoLabel && <span className="rounded-full border border-rani/25 bg-rani/8 px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.08em] text-rani">Sample record</span>}
              {late && <span className="rounded-full border border-vermilion/30 bg-vermilion/8 px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.08em] text-vermilion">Past planned date</span>}
            </div>
            <h1 className="mt-2 max-w-[24ch] font-display text-4xl font-medium leading-tight text-maroon md:text-5xl">{project.title}</h1>
            <p className="mt-2 text-[11px] text-ink/50">
              {viewer.role === "artisan" ? `Customer: ${data.customerName}` : `Artisan: ${artisan?.displayName ?? "Assigned artisan"}`} · {formatInr(project.amountInr)} · {request?.category ?? "Crafted order"}
            </p>
            {project.demoLabel && <p className="mt-1 max-w-[70ch] text-[9px] text-rani/70">{project.demoLabel}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            {request && <Button asChild variant="outline" className="rounded-full border-maroon/25 text-[10px] text-maroon"><Link to={viewer.role === "artisan" ? `/artisan/projects/${project._id}` : `/customer/projects/${project._id}`}>Project workspace</Link></Button>}
            <Button asChild variant="outline" className="rounded-full border-maroon/25 text-[10px] text-maroon"><Link to={`/projects/${project._id}/proof`}>Full KalaProof</Link></Button>
          </div>
        </div>

        {stopped && (
          <div className="mt-4 flex flex-wrap items-start gap-3 rounded-2xl border border-vermilion/25 bg-vermilion/[0.05] p-4">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-vermilion" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-maroon">{project.status === "disputed" ? "This project is under dispute." : project.status === "refunded" ? "This project was refunded." : "This project was cancelled."}</p>
              <p className="mt-1 text-[10px] leading-relaxed text-ink/55">
                KalaTrack keeps the recorded history visible. {project.status === "disputed" ? "Payment and delivery actions remain paused while the case is reviewed." : "No new production progress can be added from this tracker."}
              </p>
            </div>
            {project.status === "disputed" && <Button asChild size="sm" variant="outline" className="border-vermilion/30 text-[10px] text-vermilion"><Link to={`/projects/${project._id}/dispute`}>Open dispute</Link></Button>}
          </div>
        )}

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.55fr_0.9fr]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-maroon/15 bg-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-semibold text-maroon">Production journey</h2>
                <span className="text-[9px] text-ink/40">Updated {latestEvent ? relativeTime(latestEvent.createdAt) : relativeTime(project.updatedAt)}</span>
              </div>
              <div className="mt-5 grid grid-cols-5 gap-1">
                {STAGES.map((item, index) => {
                  const complete = !stopped && index < stage;
                  const active = !stopped && index === stage;
                  return (
                    <div key={item.key} className="min-w-0">
                      <div className={`flex h-7 items-center justify-center rounded-full border text-[8px] font-semibold ${complete ? "border-maroon bg-maroon text-ivory" : active ? "border-maroon bg-gold/30 text-maroon" : "border-maroon/15 bg-[#fbf5e8] text-ink/30"}`}>
                        {complete ? <Check className="size-3" /> : index + 1}
                      </div>
                      <p className={`mt-2 text-center text-[8px] leading-tight ${active ? "font-semibold text-maroon" : "text-ink/45"}`}>{item.label}</p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 grid gap-2 rounded-xl bg-[#fbf5e8] p-3 text-[10px] text-ink/55 sm:grid-cols-3">
                <p><span className="block text-[8px] uppercase tracking-[0.1em] text-ink/35">Planned deadline</span>{deadline ? formatDate(deadline) : "Not stated in brief"}</p>
                <p><span className="block text-[8px] uppercase tracking-[0.1em] text-ink/35">Current stage</span>{stopped ? statusLabel("project", project.status) : STAGES[Math.max(0, stage)]?.label}</p>
                <p><span className="block text-[8px] uppercase tracking-[0.1em] text-ink/35">Payment</span>{statusLabel("payment", project.paymentStatus)}</p>
              </div>
            </section>

            {canProgress && (
              <section className="rounded-2xl border border-teal/25 bg-card p-5">
                <div className="flex items-center gap-2"><Camera className="size-4 text-teal" /><h2 className="font-display text-xl font-semibold text-maroon">Add a dated progress update</h2></div>
                <p className="mt-1 text-[10px] leading-relaxed text-ink/50">Artisan-only. This writes to the existing KalaProof record and notifies the customer; it cannot change project status.</p>
                <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="What was completed, what changed, and what comes next…" className="mt-3 w-full resize-y rounded-xl border border-maroon/15 bg-[#fffaf0] p-3 text-[11px] leading-relaxed outline-none focus:border-maroon/45" />
                <div className="mt-3"><UploadImages value={images} onChange={setImages} max={4} label="Attach progress photos" /></div>
                <Button onClick={submitProgress} disabled={busy} className="mt-3 w-full rounded-full bg-maroon text-ivory hover:bg-maroon-deep">
                  {busy ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />} Record progress
                </Button>
              </section>
            )}

            <section className="rounded-2xl border border-maroon/15 bg-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-semibold text-maroon">Dated record</h2>
                <span className="text-[9px] uppercase tracking-[0.1em] text-ink/35">{events.length} events</span>
              </div>
              {events.length === 0 ? (
                <p className="mt-4 rounded-xl border border-dashed border-maroon/20 p-4 text-[10px] text-ink/50">No KalaProof events have been recorded yet.</p>
              ) : (
                <ol className="mt-4 space-y-0">
                  {[...events].reverse().map((event, index) => (
                    <li key={event._id} className="relative flex gap-3 pb-5 last:pb-0">
                      {index < events.length - 1 && <span className="absolute left-[7px] top-4 h-full w-px bg-maroon/12" />}
                      <span className={`relative mt-1.5 size-3.5 shrink-0 rounded-full border-2 ${index === 0 ? "border-maroon bg-gold" : "border-maroon/30 bg-card"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="text-[11px] font-semibold text-maroon">{event.title}</p>
                          <time className="text-[9px] text-ink/35">{formatDateTime(event.createdAt)}</time>
                        </div>
                        {event.note && <p className="mt-1 whitespace-pre-line text-[10px] leading-relaxed text-ink/55">{event.note}</p>}
                        <p className="mt-1 text-[8px] uppercase tracking-[0.09em] text-ink/30">{event.actorRole} · recorded by the platform</p>
                        {event.attachments.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {event.attachments.filter((item) => item.url).map((item) => (
                              <a key={item.storageId} href={item.url!} target="_blank" rel="noreferrer" className="group relative size-20 overflow-hidden rounded-lg border border-maroon/15 bg-[#efe2ca]">
                                <img src={item.url!} alt={`Evidence attached to ${event.title}`} className="size-full object-cover transition group-hover:opacity-85" />
                                <span className="absolute bottom-1 right-1 rounded bg-ink/60 p-1 text-ivory"><ImageIcon className="size-2.5" /></span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>

          <div className="space-y-4">
            <section className="rounded-2xl border border-maroon/15 bg-card p-4">
              <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-maroon"><Truck className="size-4 text-maroon/60" /> Shipping</h2>
              {shipment ? (
                <div className="mt-3 rounded-xl border border-teal/20 bg-teal/[0.04] p-3">
                  <p className="text-[11px] font-semibold text-maroon">{shipment.carrier}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-ink/60">{shipment.trackingNumber}</p>
                  {shipment.note && <p className="mt-1 text-[9px] leading-relaxed text-ink/45">{shipment.note}</p>}
                  <p className="mt-2 text-[8px] uppercase tracking-[0.08em] text-ink/35">Recorded manually {formatDate(shipment.recordedAt)}</p>
                  {shipment.trackingUrl && <a href={shipment.trackingUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[9px] font-semibold text-teal underline decoration-teal/30 underline-offset-2">Open carrier link <ExternalLink className="size-3" /></a>}
                </div>
              ) : (
                <p className="mt-2 text-[10px] leading-relaxed text-ink/50">No manual tracking number has been recorded. KalaTrack does not invent a carrier, GPS position or delivery estimate.</p>
              )}

              {canShip && (
                <div className="mt-3 space-y-2 border-t border-maroon/10 pt-3">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-ink/40">Artisan: record shipment</p>
                  <input value={carrier} onChange={(event) => setCarrier(event.target.value)} placeholder="Carrier, e.g. India Post" className="h-9 w-full rounded-lg border border-maroon/15 bg-[#fffaf0] px-2.5 text-[10px] outline-none focus:border-maroon/40" />
                  <input value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} placeholder="Tracking number" className="h-9 w-full rounded-lg border border-maroon/15 bg-[#fffaf0] px-2.5 font-mono text-[10px] outline-none focus:border-maroon/40" />
                  <input value={trackingUrl} onChange={(event) => setTrackingUrl(event.target.value)} placeholder="Optional https:// carrier link" className="h-9 w-full rounded-lg border border-maroon/15 bg-[#fffaf0] px-2.5 text-[10px] outline-none focus:border-maroon/40" />
                  <Button onClick={submitShipping} disabled={busy} className="w-full rounded-full bg-maroon text-[10px] text-ivory hover:bg-maroon-deep">{busy ? <Loader2 className="size-3.5 animate-spin" /> : <Truck className="size-3.5" />} Save manual tracking</Button>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-maroon/15 bg-card p-4">
              <h2 className="font-display text-xl font-semibold text-maroon">Milestones</h2>
              {milestones.length === 0 ? <p className="mt-2 text-[10px] text-ink/45">No milestones have been set.</p> : (
                <ul className="mt-3 space-y-2">
                  {milestones.map((milestone) => {
                    const overdue = milestone.status === "pending" && milestone.dueAt && milestone.dueAt < now;
                    return (
                      <li key={milestone._id} className="rounded-xl border border-maroon/10 bg-[#fbf5e8] p-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[10px] font-semibold text-maroon">{milestone.title}</p>
                          <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[7px] font-semibold uppercase ${milestone.status === "released" || milestone.status === "approved" ? "bg-emerald/10 text-emerald" : overdue ? "bg-vermilion/10 text-vermilion" : "bg-maroon/8 text-maroon/50"}`}>{milestone.status}</span>
                        </div>
                        <p className="mt-0.5 text-[9px] text-ink/40">{formatInr(milestone.amountInr)}{milestone.dueAt ? ` · planned ${formatDate(milestone.dueAt)}` : ""}{milestone.approvedAt ? ` · approved ${formatDate(milestone.approvedAt)}` : ""}</p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-maroon/15 bg-card p-4">
              <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-maroon"><MessageSquare className="size-4 text-maroon/60" /> Support & quality</h2>
              <div className="mt-2 space-y-2 text-[10px] leading-relaxed text-ink/55">
                <p className="flex items-start gap-2"><ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-teal" /> {reviews.length ? `${reviews.length} review${reviews.length === 1 ? "" : "s"} attached to this project.` : "No review yet — reviews open after completion."}</p>
                <p className="flex items-start gap-2"><AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-gold" /> {disputes.length ? `${disputes.length} support case${disputes.length === 1 ? "" : "s"} on record.` : "No dispute or support case on record."}</p>
                <p className="flex items-start gap-2"><Clock3 className="mt-0.5 size-3.5 shrink-0 text-maroon/45" /> Dates labelled “planned” come from the brief or milestone; event timestamps are recorded by the server, not estimated.</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm" className="border-maroon/20 text-[9px] text-maroon"><Link to={`/projects/${project._id}/dispute`}>Get help</Link></Button>
                {viewer.role === "customer" && project.status === "delivered" && <Button asChild size="sm" className="bg-maroon text-[9px] text-ivory hover:bg-maroon-deep"><Link to={`/customer/projects/${project._id}`}>Confirm delivery</Link></Button>}
              </div>
            </section>

            <section className="rounded-2xl bg-[#7a302a] p-4 text-ivory">
              <p className="label-caps text-[8px] text-gold">What this record is</p>
              <p className="mt-1.5 text-[10px] leading-relaxed text-ivory/70">
                KalaTrack reuses KalaProof, project status, collaboration tasks and order data. It is not a live courier feed, and a manual tracking number is not proof of delivery.
              </p>
              <Link to={`/projects/${project._id}/passport`} className="mt-2 inline-flex items-center gap-1 text-[9px] font-semibold text-gold">View KalaPassport <ArrowUpRight className="size-3" /></Link>
            </section>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
