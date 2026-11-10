import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, formatInr, statusLabel } from "@/lib/marketplace";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  Hammer,
  Loader2,
  MessageSquare,
  PackageCheck,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Truck,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusPill } from "./Bits";
import { UploadImages, type UploadedImage } from "./UploadImages";
import { QuoteBreakdown } from "./QuoteBreakdown";
import { KalaProofTimeline } from "./KalaProofTimeline";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function Panel({
  title,
  eyebrow,
  children,
  action,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-maroon/15 bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          {eyebrow && <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal">{eyebrow}</p>}
          <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
        </div>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function ProjectWorkspace({ projectId }: { projectId: Id<"projects"> }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const detail = useQuery(api.projects.detail, { projectId });
  const payments = useQuery(api.payments.forProject, { projectId });
  const paymentConfig = useQuery(api.payments.config);
  const sandboxOrder = useMutation(api.payments.createSandboxOrder);
  const confirmSandbox = useMutation(api.payments.confirmSandbox);
  const createLiveOrder = useAction(api.paymentsNode.createOrder);
  const verifyCheckout = useAction(api.paymentsNode.verifyCheckout);
  const uploadConcept = useMutation(api.projects.uploadConcept);
  const approveConcept = useMutation(api.projects.approveConcept);
  const requestConceptRevision = useMutation(api.projects.requestConceptRevision);
  const startProduction = useMutation(api.projects.startProduction);
  const addProgress = useMutation(api.projects.addProgress);
  const submitFinalWork = useMutation(api.projects.submitFinalWork);
  const requestRework = useMutation(api.projects.requestRework);
  const approveWork = useMutation(api.projects.approveWork);
  const addShipping = useMutation(api.projects.addShipping);
  const confirmDelivery = useMutation(api.projects.confirmDelivery);
  const approveMilestone = useMutation(api.projects.approveMilestone);
  const cancelBeforePayment = useMutation(api.projects.cancelBeforePayment);
  const submitReview = useMutation(api.reviews.submit);
  const ensureConversation = useMutation(api.messages.ensure);

  const [busy, setBusy] = useState<string | null>(null);
  const [sandboxAck, setSandboxAck] = useState(false);
  const [conceptTitle, setConceptTitle] = useState("");
  const [conceptNote, setConceptNote] = useState("");
  const [conceptUsage, setConceptUsage] = useState("Created by me for this project. The customer receives the agreed usage rights only.");
  const [conceptImages, setConceptImages] = useState<UploadedImage[]>([]);
  const [revisionNote, setRevisionNote] = useState("");
  const [progressNote, setProgressNote] = useState("");
  const [progressImages, setProgressImages] = useState<UploadedImage[]>([]);
  const [finalNote, setFinalNote] = useState("");
  const [finalImages, setFinalImages] = useState<UploadedImage[]>([]);
  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewBody, setReviewBody] = useState("");

  if (detail === undefined) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-maroon/15 bg-card py-20">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  const { project, viewer, request, artisan, concepts, events, milestones, payout, disputes, reviews } = detail;
  const isCustomer = viewer.role === "customer";
  const isArtisan = viewer.role === "artisan";
  const accepted = project.acceptedQuote as Record<string, number | string | undefined>;
  const activeDispute = disputes.find((row) => !["resolved", "closed"].includes(row.status));
  const approvedConcept = concepts.find((concept) => concept.status === "approved");
  const submittedConcept = concepts.find((concept) => concept.status === "submitted");
  const canStart = isArtisan && project.status === "funded" && project.paymentStatus === "confirmed" && Boolean(project.conceptApprovedAt);
  const reviewGiven = reviews.some((review) => review.authorId === viewer.userId);

  async function run(label: string, fn: () => Promise<unknown>, success: string) {
    setBusy(label);
    try {
      await fn();
      toast.success(success);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "That action could not be completed.");
    } finally {
      setBusy(null);
    }
  }

  async function paySandbox() {
    if (!sandboxAck) return;
    await run(
      "sandbox",
      async () => {
        const order = await sandboxOrder({ projectId });
        await confirmSandbox({ paymentOrderId: order.orderId, acknowledgedSandbox: true });
      },
      "Sandbox payment recorded — no money moved.",
    );
  }

  async function payLive() {
    setBusy("live");
    try {
      const order = await createLiveOrder({ projectId });
      const loaded = await loadRazorpay();
      if (!loaded || !window.Razorpay) throw new Error("The payment checkout could not be loaded.");
      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amountInr * 100,
        currency: order.currency,
        name: "KALकारी",
        description: order.projectTitle,
        order_id: order.providerOrderId,
        prefill: { name: user?.name ?? "", email: user?.email ?? "" },
        theme: { color: "#7b2040" },
        handler: async (response: { razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await verifyCheckout({
              paymentOrderId: order.paymentOrderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success("Payment verified with the provider.");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Payment verification failed.");
          }
        },
      });
      checkout.open();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Payment could not be started.");
    } finally {
      setBusy(null);
    }
  }

  async function openMessages() {
    await run(
      "message",
      async () => {
        const conversation = await ensureConversation({
          artisanId: project.artisanId,
          scopeType: "project",
          scopeId: String(projectId),
          projectId,
          requestId: project.requestId,
        });
        navigate(`/${isCustomer ? "customer" : "artisan"}/messages?c=${conversation.conversationId}`);
      },
      "Opening conversation",
    );
  }

  return (
    <div className="space-y-5">
      <header className="relative overflow-hidden rounded-2xl border border-maroon/20 bg-[linear-gradient(115deg,#7b2040_0%,#651a34_55%,#4a1738_100%)] p-5 text-ivory md:p-7">
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-[60ch]">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill kind="project" status={project.status} className="border-ivory/25 bg-ivory/10 text-ivory" />
              <span className="text-[10px] uppercase tracking-[0.16em] text-ivory/55">
                {isCustomer ? "You are the customer" : isArtisan ? "You are the artisan" : "Admin view"}
              </span>
            </div>
            <h1 className="mt-2 font-display text-3xl font-semibold leading-tight md:text-4xl">{project.title}</h1>
            <p className="mt-1 text-sm text-ivory/70">
              {isCustomer ? `Artisan: ${artisan?.displayName ?? "—"}` : `Customer: ${detail.customerName}`} · accepted quote v{String(accepted.version ?? "—")} ·{" "}
              {formatInr(project.amountInr)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-ivory/70">
              <span className="rounded-full border border-ivory/20 px-2 py-0.5">Payment: {statusLabel("payment", project.paymentStatus)}</span>
              <span className="rounded-full border border-ivory/20 px-2 py-0.5">Delivery: {project.status === "delivered" ? "handover in progress" : "—"}</span>
              {request?.deadline && <span className="rounded-full border border-ivory/20 px-2 py-0.5">Target {formatDate(request.deadline)}</span>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => void openMessages()} disabled={busy === "message"} className="rounded-full border-ivory/30 bg-ivory/10 text-ivory hover:bg-ivory/20">
              <MessageSquare className="size-3.5" /> Message
            </Button>
            {project.status !== "completed" && project.status !== "refunded" && project.status !== "cancelled" && (
              <Button asChild variant="outline" size="sm" className="rounded-full border-ivory/30 bg-ivory/10 text-ivory hover:bg-ivory/20">
                <Link to={`/projects/${projectId}/dispute`}>
                  <ShieldAlert className="size-3.5" /> {activeDispute ? "View dispute" : "Open a dispute"}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {activeDispute && (
        <div className="rounded-xl border border-vermilion/30 bg-vermilion/5 px-4 py-3 text-sm text-vermilion">
          <p className="font-semibold">This project is under dispute — {statusLabel("dispute", activeDispute.status)}.</p>
          <p className="mt-0.5 text-xs text-vermilion/80">An administrator reviews evidence from KalaProof. Payment and payout changes wait for the decision.</p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-5">
          {project.status === "awaiting_payment" && isCustomer && (
            <Panel eyebrow="Mutual protection" title="Pay to unlock production">
              <p className="text-sm leading-relaxed text-ink/65">
                The artisan cannot start until the payment provider confirms your payment. {accepted.terms}
              </p>
              <p className="mt-2 rounded-lg bg-maroon/[0.04] px-3 py-2 text-xs leading-relaxed text-ink/65">
                Platform fee {String(accepted.platformFeePercent ?? 8)}% ({formatInr(Number(accepted.platformFeeInr ?? 0))}) · artisan receives{" "}
                {formatInr(Number(accepted.netPayoutInr ?? 0))} after completion.
              </p>

              {paymentConfig?.mode === "live" ? (
                <Button className="mt-3 w-full rounded-full bg-maroon text-ivory hover:bg-maroon-deep" onClick={() => void payLive()} disabled={busy !== null}>
                  {busy === "live" ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
                  Pay {formatInr(project.amountInr)} securely
                </Button>
              ) : paymentConfig?.mode === "sandbox" ? (
                <div className="mt-3 rounded-xl border border-saffron/40 bg-saffron/[0.08] p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-[#7a4f10]">
                    <ShieldCheck className="size-3.5" /> Sandbox demonstration — no money moves
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink/65">
                    No Razorpay keys are configured. This records a clearly labelled sandbox payment so you can walk the full flow. Production is unlocked for the demonstration only.
                  </p>
                  <label className="mt-2 flex items-start gap-2 text-[11px] text-ink/70">
                    <input type="checkbox" checked={sandboxAck} onChange={(event) => setSandboxAck(event.target.checked)} className="mt-0.5" />
                    I understand this is a test payment and no funds are collected.
                  </label>
                  <Button className="mt-2 w-full rounded-full bg-saffron text-maroon-deep hover:bg-marigold" onClick={() => void paySandbox()} disabled={!sandboxAck || busy !== null}>
                    {busy === "sandbox" ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
                    Record sandbox payment
                  </Button>
                </div>
              ) : (
                <p className="mt-3 rounded-lg border border-maroon/15 bg-parchment px-3 py-2 text-xs text-muted-foreground">
                  Checking the configured payment mode…
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Cancel this unpaid project? The artisan will be notified in KalaProof.")) {
                    void run("cancel", () => cancelBeforePayment({ projectId }), "Project cancelled");
                  }
                }}
                className="mt-2 text-[11px] text-muted-foreground underline-offset-2 hover:text-vermilion hover:underline"
              >
                Cancel before payment
              </button>
            </Panel>
          )}

          {(project.status === "funded" || project.status === "in_production" || project.status === "review_pending" || project.status === "delivered") && (
            <Panel
              eyebrow="Artisan-created concept"
              title={approvedConcept ? "Approved concept" : submittedConcept ? "Awaiting customer review" : "Concept workspace"}
              action={
                approvedConcept ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald">
                    <BadgeCheck className="size-3.5" /> Version {approvedConcept.version} approved
                  </span>
                ) : undefined
              }
            >
              {concepts.length === 0 && <p className="text-sm text-ink/60">No concept yet. The artisan's sketch or mockup will appear here — never an AI-generated artwork.</p>}
              <div className="space-y-3">
                {concepts.map((concept) => (
                  <article key={concept._id} className="overflow-hidden rounded-xl border border-maroon/12 bg-parchment/60">
                    {concept.url && <img src={concept.url} alt={`Concept v${concept.version}: ${concept.title}`} className="max-h-72 w-full object-contain bg-ivory" />}
                    <div className="p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-display text-sm font-semibold text-ink">
                          v{concept.version} · {concept.title}
                        </p>
                        <span className="rounded-full border border-gold/40 bg-ivory px-2 py-0.5 text-[10px] font-semibold capitalize text-ink/65">
                          {concept.status.split("_").join(" ")}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-ink/65">{concept.note}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">Created by the artisan. {concept.usageNote}</p>
                      {isCustomer && concept.status === "submitted" && (
                        <div className="mt-3 space-y-2">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              className="rounded-full bg-emerald text-ivory hover:bg-emerald/90"
                              disabled={busy !== null}
                              onClick={() => void run("approve-concept", () => approveConcept({ projectId, conceptId: concept._id }), "Concept approved")}
                            >
                              <CheckCircle2 className="size-3.5" /> Approve this concept
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <input
                              value={revisionNote}
                              onChange={(event) => setRevisionNote(event.target.value)}
                              placeholder="What should change?"
                              className="h-8 flex-1 rounded-md border border-maroon/20 bg-card px-2 text-xs"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full border-maroon/25 text-maroon"
                              disabled={busy !== null || revisionNote.trim().length < 10}
                              onClick={() => void run("revision", () => requestConceptRevision({ projectId, conceptId: concept._id, note: revisionNote }), "Revision requested")}
                            >
                              <RotateCcw className="size-3.5" /> Request revision
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>

              {isArtisan && !approvedConcept && project.status === "funded" && (
                <div className="mt-4 space-y-2 rounded-xl border border-teal/20 bg-teal/[0.04] p-3">
                  <p className="text-xs font-semibold text-teal-deep">Upload your own sketch, colour study or placement mockup</p>
                  <input value={conceptTitle} onChange={(event) => setConceptTitle(event.target.value)} placeholder="Concept title" className="h-8 w-full rounded-md border border-maroon/20 bg-card px-2 text-xs" />
                  <textarea value={conceptNote} onChange={(event) => setConceptNote(event.target.value)} rows={2} placeholder="Approach, materials and what you will make" className="w-full rounded-md border border-maroon/20 bg-card px-2 py-1.5 text-xs" />
                  <input value={conceptUsage} onChange={(event) => setConceptUsage(event.target.value)} placeholder="Usage rights note" className="h-8 w-full rounded-md border border-maroon/20 bg-card px-2 text-[11px]" />
                  <UploadImages value={conceptImages} onChange={setConceptImages} max={1} label="Concept image" hint="Your own drawing, sketch or mockup · up to 8 MB." />
                  <Button
                    size="sm"
                    className="rounded-full bg-maroon text-ivory hover:bg-maroon-deep"
                    disabled={busy !== null || conceptImages.length === 0}
                    onClick={() =>
                      void run(
                        "concept",
                        async () => {
                          const image = conceptImages[0];
                          await uploadConcept({
                            projectId,
                            title: conceptTitle,
                            note: conceptNote,
                            usageNote: conceptUsage,
                            image: { storageId: image.storageId, name: image.name, contentType: image.contentType, size: image.size },
                          });
                          setConceptImages([]);
                          setConceptTitle("");
                          setConceptNote("");
                        },
                        "Concept uploaded for review",
                      )
                    }
                  >
                    {busy === "concept" ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                    Send concept to customer
                  </Button>
                </div>
              )}
            </Panel>
          )}

          {(canStart || project.status === "in_production" || project.status === "review_pending") && (
            <Panel eyebrow="Production" title={project.status === "review_pending" ? "Final work review" : "Workshop progress"}>
              {canStart && (
                <div className="rounded-xl border border-emerald/25 bg-emerald/[0.05] p-3">
                  <p className="text-sm font-semibold text-emerald">Payment confirmed and concept approved.</p>
                  <p className="mt-0.5 text-xs text-ink/60">Start production when you are ready. Every update is recorded in KalaProof.</p>
                  <Button
                    size="sm"
                    className="mt-2 rounded-full bg-emerald text-ivory hover:bg-emerald/90"
                    disabled={busy !== null}
                    onClick={() => void run("start", () => startProduction({ projectId }), "Production started")}
                  >
                    <Hammer className="size-3.5" /> Start production
                  </Button>
                </div>
              )}

              {project.status === "in_production" && isArtisan && (
                <div className="mt-3 space-y-3">
                  <div className="space-y-2 rounded-xl border border-maroon/12 bg-parchment/60 p-3">
                    <p className="text-xs font-semibold text-ink">Add a progress update</p>
                    <textarea value={progressNote} onChange={(event) => setProgressNote(event.target.value)} rows={2} placeholder="What stage is the work at? Any material or timing notes?" className="w-full rounded-md border border-maroon/20 bg-card px-2 py-1.5 text-xs" />
                    <UploadImages value={progressImages} onChange={setProgressImages} max={4} label="Progress photos" />
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full border-teal/30 text-teal-deep"
                      disabled={busy !== null || progressImages.length === 0 || progressNote.trim().length < 10}
                      onClick={() =>
                        void run(
                          "progress",
                          async () => {
                            await addProgress({
                              projectId,
                              note: progressNote,
                              images: progressImages.map((image) => ({ storageId: image.storageId, name: image.name, contentType: image.contentType, size: image.size })),
                            });
                            setProgressImages([]);
                            setProgressNote("");
                          },
                          "Progress added to KalaProof",
                        )
                      }
                    >
                      Save progress
                    </Button>
                  </div>
                  <div className="space-y-2 rounded-xl border border-emerald/25 bg-emerald/[0.04] p-3">
                    <p className="text-xs font-semibold text-emerald">Finished the work?</p>
                    <textarea value={finalNote} onChange={(event) => setFinalNote(event.target.value)} rows={2} placeholder="Completion note for the customer" className="w-full rounded-md border border-maroon/20 bg-card px-2 py-1.5 text-xs" />
                    <UploadImages value={finalImages} onChange={setFinalImages} max={4} label="Final photos" />
                    <Button
                      size="sm"
                      className="rounded-full bg-emerald text-ivory hover:bg-emerald/90"
                      disabled={busy !== null || finalImages.length === 0 || finalNote.trim().length < 10}
                      onClick={() =>
                        void run(
                          "final",
                          async () => {
                            await submitFinalWork({
                              projectId,
                              note: finalNote,
                              images: finalImages.map((image) => ({ storageId: image.storageId, name: image.name, contentType: image.contentType, size: image.size })),
                            });
                            setFinalImages([]);
                            setFinalNote("");
                          },
                          "Final work sent for review",
                        )
                      }
                    >
                      Submit final work
                    </Button>
                  </div>
                </div>
              )}

              {project.status === "review_pending" && (
                <div className="mt-2 space-y-2">
                  {isCustomer ? (
                    <>
                      <p className="text-sm text-ink/65">Compare the final photos with the approved concept and KalaProof. You can request rework or approve the work.</p>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" className="rounded-full bg-emerald text-ivory hover:bg-emerald/90" disabled={busy !== null} onClick={() => void run("approve", () => approveWork({ projectId }), "Work approved")}>
                          <CheckCircle2 className="size-3.5" /> Approve final work
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <input value={revisionNote} onChange={(event) => setRevisionNote(event.target.value)} placeholder="What needs correcting?" className="h-8 flex-1 rounded-md border border-maroon/20 bg-card px-2 text-xs" />
                        <Button size="sm" variant="outline" className="rounded-full border-maroon/25 text-maroon" disabled={busy !== null || revisionNote.trim().length < 10} onClick={() => void run("rework", () => requestRework({ projectId, note: revisionNote }), "Rework requested")}>
                          <RotateCcw className="size-3.5" /> Request rework
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-ink/60">Waiting for the customer to review the final work. KalaProof has your photos and completion note.</p>
                  )}
                </div>
              )}
            </Panel>
          )}

          {project.status === "delivered" && (
            <Panel eyebrow="Handover" title="Delivery & confirmation">
              {isArtisan && (
                <div className="space-y-2">
                  <p className="text-sm text-ink/65">Add the carrier and tracking reference, or arrange a local handoff. Then the customer confirms receipt.</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input value={carrier} onChange={(event) => setCarrier(event.target.value)} placeholder="Carrier / handoff" className="h-8 rounded-md border border-maroon/20 bg-card px-2 text-xs" />
                    <input value={tracking} onChange={(event) => setTracking(event.target.value)} placeholder="Tracking number / reference" className="h-8 rounded-md border border-maroon/20 bg-card px-2 text-xs" />
                  </div>
                  <Button size="sm" variant="outline" className="rounded-full border-teal/30 text-teal-deep" disabled={busy !== null || carrier.trim().length < 2 || tracking.trim().length < 3} onClick={() => void run("ship", () => addShipping({ projectId, carrier, trackingNumber: tracking }), "Shipping recorded")}>
                    <Truck className="size-3.5" /> Record shipping
                  </Button>
                </div>
              )}
              {isCustomer && (
                <div>
                  <p className="text-sm text-ink/65">Confirm once the product is in your hands and matches the approved work. Payout then moves to review and release.</p>
                  <Button size="sm" className="mt-2 rounded-full bg-maroon text-ivory hover:bg-maroon-deep" disabled={busy !== null} onClick={() => void run("delivery", () => confirmDelivery({ projectId }), "Delivery confirmed")}>
                    <PackageCheck className="size-3.5" /> Confirm delivery
                  </Button>
                </div>
              )}
            </Panel>
          )}

          {project.status === "completed" && (
            <Panel eyebrow="Reputation" title="Reviews from this project">
              {reviews.length === 0 && <p className="text-sm text-ink/60">No reviews yet. Both sides can review once delivery is confirmed.</p>}
              <div className="space-y-2">
                {reviews.map((review) => (
                  <div key={review._id} className="rounded-lg border border-maroon/12 bg-parchment/60 p-3">
                    <p className="text-xs font-semibold text-ink">{review.authorRole === "customer" ? "Customer" : "Artisan"} · {review.rating}/5</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink/65">{review.body}</p>
                  </div>
                ))}
              </div>
              {!reviewGiven && !isCustomer && !isArtisan ? null : !reviewGiven ? (
                <div className="mt-3 space-y-2 rounded-xl border border-gold/35 bg-ivory/60 p-3">
                  <p className="text-xs font-semibold text-ink">Leave a verified review</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button key={rating} type="button" onClick={() => setReviewRating(rating)} className={`text-lg ${rating <= reviewRating ? "text-saffron" : "text-muted-foreground/40"}`} aria-label={`${rating} stars`}>
                        ★
                      </button>
                    ))}
                  </div>
                  <textarea value={reviewBody} onChange={(event) => setReviewBody(event.target.value)} rows={2} placeholder="What was working with them like?" className="w-full rounded-md border border-maroon/20 bg-card px-2 py-1.5 text-xs" />
                  <Button size="sm" className="rounded-full bg-maroon text-ivory" disabled={busy !== null || reviewBody.trim().length < 10} onClick={() => void run("review", () => submitReview({ projectId, rating: reviewRating, body: reviewBody }), "Review published")}>
                    Publish review
                  </Button>
                </div>
              ) : (
                <p className="mt-2 text-xs text-emerald">You reviewed this project.</p>
              )}
            </Panel>
          )}

          <Panel eyebrow="Append-only record" title="KalaProof timeline">
            <KalaProofTimeline events={events} />
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel eyebrow="Agreed terms" title={`Accepted quote v${String(accepted.version ?? "—")}`}>
            <QuoteBreakdown
              quote={{
                materialsInr: Number(accepted.materialsInr ?? 0),
                labourInr: Number(accepted.labourInr ?? 0),
                preparationInr: Number(accepted.preparationInr ?? 0),
                finishingInr: Number(accepted.finishingInr ?? 0),
                packagingInr: Number(accepted.packagingInr ?? 0),
                deliveryInr: Number(accepted.deliveryInr ?? 0),
                totalInr: project.amountInr,
                platformFeePercent: Number(accepted.platformFeePercent ?? 8),
                platformFeeInr: project.platformFeeInr,
                netPayoutInr: project.netPayoutInr,
                timelineDays: Number(accepted.timelineDays ?? 0),
                revisionRounds: Number(accepted.revisionRounds ?? 0),
                depositPercent: Number(accepted.depositPercent ?? 0),
                terms: String(accepted.terms ?? ""),
              }}
            />
          </Panel>

          <Panel eyebrow="Milestones" title="Release plan">
            <div className="space-y-2">
              {milestones.length === 0 && <p className="text-xs text-muted-foreground">Milestones appear after payment confirmation.</p>}
              {milestones.map((milestone) => (
                <div key={milestone._id} className="flex items-start justify-between gap-2 rounded-lg border border-maroon/12 bg-parchment/50 px-3 py-2">
                  <div>
                    <p className="text-xs font-medium text-ink">{milestone.title}</p>
                    <p className="text-[10px] text-muted-foreground">{formatInr(milestone.amountInr)} · {milestone.status}</p>
                  </div>
                  {isCustomer && milestone.status === "submitted" && (
                    <Button size="sm" variant="outline" className="h-7 rounded-full border-emerald/30 px-2 text-[10px] text-emerald" disabled={busy !== null} onClick={() => void run("milestone", () => approveMilestone({ projectId, milestoneId: milestone._id }), "Milestone approved")}>
                      Approve
                    </Button>
                  )}
                </div>
              ))}
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                Approvals record evidence. Money moves only through the payment provider and the administrator payout record.
              </p>
            </div>
          </Panel>

          {payout && (
            <Panel eyebrow="Settlement" title="Artisan payout">
              <p className="text-sm text-ink/65">
                {formatInr(payout.amountInr)} · <span className="font-medium text-ink">{payout.status}</span>
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{payout.note ?? "Payout status is recorded after provider-supported settlement."}</p>
            </Panel>
          )}

          <Panel eyebrow="Parties" title="Who is involved">
            <div className="space-y-2 text-xs text-ink/65">
              <p className="flex items-center justify-between gap-2">
                <span>Customer</span>
                <span className="font-medium text-ink">{detail.customerName}</span>
              </p>
              <p className="flex items-center justify-between gap-2">
                <span>Artisan</span>
                <span className="font-medium text-ink">{artisan?.displayName ?? "—"}</span>
              </p>
              {artisan && (
                <p className="flex items-center justify-between gap-2">
                  <span>Artisan verification</span>
                  <span className="font-medium text-ink">{artisan.verificationStatus}</span>
                </p>
              )}
              <Link to={`/artisans/${project.artisanId}`} className="inline-flex items-center gap-1 pt-1 font-semibold text-maroon hover:text-vermilion">
                View artisan portfolio <ArrowRight className="size-3" />
              </Link>
            </div>
          </Panel>

          {request && (
            <Panel eyebrow="The brief" title="Customer request">
              <p className="text-xs leading-relaxed text-ink/65">{request.description}</p>
              <p className="mt-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                Budget {formatInr(request.budgetInr)} · {request.category} · {request.city}
              </p>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
