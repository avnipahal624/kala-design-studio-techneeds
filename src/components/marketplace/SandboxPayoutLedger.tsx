import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { formatInr } from "@/lib/marketplace";
import { useMutation, useQuery } from "convex/react";
import { AlertTriangle, ArrowRight, FlaskConical, Loader2, LockKeyhole, Scale, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function rupees(paise: number) {
  return formatInr(paise / 100);
}

const STATUS_LABEL: Record<string, string> = {
  proposed: "Proposed",
  accepted: "Holds placed",
  simulated: "Sandbox complete",
  reversed: "Reversed",
  cancelled: "Cancelled",
};

export function SandboxPayoutLedger({ projectId }: { projectId: Id<"projects"> }) {
  const data = useQuery(api.payouts.forProject, { projectId });
  const createPlan = useMutation(api.payouts.createSandboxPlan);
  const acceptPlan = useMutation(api.payouts.acceptSandboxPlan);
  const simulate = useMutation(api.payouts.simulateSandboxPayouts);
  const [busy, setBusy] = useState<string | null>(null);
  const [key] = useState(() => `sandbox:${projectId}:${Date.now()}`);

  if (data === undefined) return null;
  if (data.plans.length === 0 && !data.canCreate) return null;

  async function run(label: string, action: () => Promise<unknown>) {
    setBusy(label);
    try {
      await action();
      toast.success(label);
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^.*?: /, "") : "Could not update the ledger");
    } finally {
      setBusy(null);
    }
  }

  const plan = data.plans[0];

  return (
    <section className="overflow-hidden rounded-2xl border border-maroon/20 bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-maroon/10 bg-[linear-gradient(120deg,#fbf5e8,#f1e4cf)] p-4">
        <div>
          <p className="label-caps flex items-center gap-1.5 text-[8px] text-[#8a6a31]"><FlaskConical className="size-3" /> Sandbox payout ledger</p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-maroon">Who gets what — in paise.</h2>
          <p className="mt-1 max-w-[62ch] text-[10px] leading-relaxed text-ink/55">
            This is a simulated split and bookkeeping ledger. No bank transfer, Razorpay route or payout-provider API is executed. Every amount is an integer number of paise.
          </p>
        </div>
        <span className="rounded-full border border-gold/45 bg-gold/15 px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.1em] text-[#74572c]">Sandbox only · no money moves</span>
      </div>

      <div className="p-4">
        {!plan ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-maroon/20 bg-[#fbf5e8] p-4">
            <div>
              <p className="text-[11px] font-semibold text-maroon">Propose a multi-artisan sandbox split</p>
              <p className="mt-1 max-w-[52ch] text-[10px] leading-relaxed text-ink/50">
                The project is complete and its payment is settled. This creates proposed allocations from KalaCollab tasks, or a single lead-artisan allocation when there is no collaboration plan. It does not pay anyone.
              </p>
            </div>
            <Button
              onClick={() => void run("Sandbox plan proposed", () => createPlan({ projectId, idempotencyKey: key }))}
              disabled={busy !== null}
              className="gap-2 rounded-full bg-maroon text-[10px] text-ivory hover:bg-maroon-deep"
            >
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Scale className="size-3.5" />} Propose split
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-maroon/20 bg-[#fbf5e8] px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.08em] text-maroon">{STATUS_LABEL[plan.status] ?? plan.status}</span>
                <span className="text-[9px] text-ink/40">Plan {plan._id.slice(-6)} · {plan.allocations.length} allocation{plan.allocations.length === 1 ? "" : "s"}</span>
                {plan.demoLabel && <span className="rounded-full border border-rani/25 bg-rani/8 px-2 py-0.5 text-[8px] font-semibold text-rani">Sample project</span>}
              </div>
              <p className="text-[9px] text-ink/40">Created {new Date(plan.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {([
                { label: "Order gross", value: plan.grossPaise },
                { label: "Platform fee", value: plan.platformFeePaise },
                { label: "Processor fee", value: plan.processorFeePaise },
                { label: "Tax", value: plan.taxPaise },
                { label: "Distributable", value: plan.distributablePaise },
              ] as const).map((metric, index) => (
                <div key={metric.label} className={`rounded-xl border p-3 ${index === 4 ? "border-maroon/25 bg-maroon text-ivory" : "border-maroon/10 bg-[#fbf5e8]"}`}>
                  <p className={`text-[8px] uppercase tracking-[0.1em] ${index === 4 ? "text-ivory/55" : "text-ink/35"}`}>{metric.label}</p>
                  <p className={`mt-1 font-display text-xl font-semibold ${index === 4 ? "text-ivory" : "text-maroon"}`}>{rupees(metric.value)}</p>
                  {index === 2 && <p className="mt-0.5 text-[7px] leading-tight text-ink/35">Not modelled in sandbox</p>}
                  {index === 3 && <p className="mt-0.5 text-[7px] leading-tight text-ink/35">No tax calculation</p>}
                </div>
              ))}
            </div>
            <p className="flex items-start gap-1.5 rounded-lg bg-gold/10 p-2.5 text-[9px] leading-relaxed text-[#74572c]">
              <AlertTriangle className="mt-0.5 size-3 shrink-0" /> {plan.feeNote}
            </p>

            <div className="overflow-hidden rounded-xl border border-maroon/12">
              <div className="grid grid-cols-[1.5fr_1fr_auto] gap-2 border-b border-maroon/10 bg-[#fbf5e8] px-3 py-2 text-[8px] font-semibold uppercase tracking-[0.1em] text-ink/40">
                <span>Artisan / contribution</span><span>Net allocation</span><span>State</span>
              </div>
              {plan.allocations.map((allocation) => (
                <div key={allocation._id} className="grid grid-cols-[1.5fr_1fr_auto] items-center gap-2 border-b border-maroon/8 px-3 py-2.5 last:border-0">
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-semibold text-maroon">{allocation.artisanName}</p>
                    <p className="truncate text-[8px] text-ink/40">{allocation.label}</p>
                  </div>
                  <p className="font-mono text-[10px] font-semibold text-ink/70">{rupees(allocation.netPaise)}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[7px] font-semibold uppercase ${allocation.status === "available" ? "bg-emerald/10 text-emerald" : allocation.status === "reversed" ? "bg-vermilion/10 text-vermilion" : "bg-gold/15 text-[#74572c]"}`}>{allocation.status}</span>
                </div>
              ))}
              <div className="grid grid-cols-[1.5fr_1fr_auto] gap-2 bg-[#fbf5e8] px-3 py-2 text-[9px] font-semibold text-maroon">
                <span>Reconciled total</span>
                <span className="font-mono">{rupees(plan.allocations.reduce((total, allocation) => total + allocation.netPaise, 0))}</span>
                <span className="text-[7px] font-normal uppercase text-ink/35">= distributable</span>
              </div>
            </div>

            {data.balance && (
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  ["Available", data.balance.availablePaise],
                  ["Held", data.balance.heldPaise],
                  ["Paid", data.balance.paidPaise],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-xl border border-maroon/10 bg-[#fbf5e8] p-3">
                    <p className="flex items-center gap-1 text-[8px] uppercase tracking-[0.1em] text-ink/35"><Wallet className="size-2.5" /> {label}</p>
                    <p className="mt-1 font-mono text-sm font-semibold text-maroon">{rupees(value as number)}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {data.viewer.role !== "artisan" && plan.status === "proposed" && (
                <Button onClick={() => void run("Split accepted · funds held in sandbox", () => acceptPlan({ planId: plan._id }))} disabled={busy !== null} className="gap-1.5 rounded-full bg-maroon text-[10px] text-ivory hover:bg-maroon-deep">
                  {busy ? <Loader2 className="size-3 animate-spin" /> : <LockKeyhole className="size-3" />} Accept split & place holds
                </Button>
              )}
              {data.viewer.role !== "artisan" && plan.status === "accepted" && (
                <Button onClick={() => void run("Sandbox simulation complete · no money moved", () => simulate({ planId: plan._id }))} disabled={busy !== null} className="gap-1.5 rounded-full bg-maroon text-[10px] text-ivory hover:bg-maroon-deep">
                  {busy ? <Loader2 className="size-3 animate-spin" /> : <FlaskConical className="size-3" />} Run sandbox simulator
                </Button>
              )}
              {plan.status === "simulated" && (
                <p className="flex items-center gap-1.5 text-[9px] font-semibold text-emerald"><LockKeyhole className="size-3" /> Holds released to sandbox available balances. No transfer occurred.</p>
              )}
              <Button asChild variant="outline" className="rounded-full border-maroon/20 text-[9px] text-maroon">
                <a href="#payout-ledger-entries">View ledger entries <ArrowRight className="size-3" /></a>
              </Button>
            </div>

            <details id="payout-ledger-entries" className="rounded-xl border border-maroon/10 bg-[#fbf5e8] p-3">
              <summary className="cursor-pointer text-[9px] font-semibold uppercase tracking-[0.1em] text-maroon/70">Ledger entries ({plan.ledger.length})</summary>
              <div className="mt-2 space-y-1">
                {plan.ledger.length === 0 ? <p className="text-[9px] text-ink/45">No balance movements yet. Accepting the plan creates holds.</p> : plan.ledger.map((entry) => (
                  <div key={entry._id} className="flex flex-wrap items-center justify-between gap-2 border-b border-maroon/8 py-1.5 text-[8px] last:border-0">
                    <span className="text-ink/50">{entry.kind} · {entry.bucket} · {entry.note}</span>
                    <span className={`font-mono font-semibold ${entry.direction === "credit" ? "text-emerald" : "text-vermilion"}`}>{entry.direction === "credit" ? "+" : "−"}{rupees(entry.amountPaise)}</span>
                  </div>
                ))}
              </div>
            </details>

            <p className="text-[8px] leading-relaxed text-ink/35">
              A live route-payout integration would require provider onboarding, KYC and transfer APIs. No such integration is configured here, so this panel never labels a balance as paid or transferred.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
