import { api } from "@/convex/_generated/api";
import { PortalShell } from "@/components/portal/PortalShell";
import { Button } from "@/components/ui/button";
import { formatInr } from "@/lib/marketplace";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowRight,
  Check,
  CircleAlert,
  CircleCheck,
  Clock3,
  GitBranch,
  Handshake,
  Loader2,
  Play,
  Send,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

const TASK_STATUS: Record<string, { label: string; tone: string }> = {
  proposed: { label: "Proposed", tone: "border-maroon/18 bg-parchment text-ink/55" },
  invited: { label: "Your response needed", tone: "border-saffron/45 bg-saffron/[0.08] text-[#7d5a24]" },
  accepted: { label: "Accepted", tone: "border-teal/25 bg-teal/[0.05] text-teal-deep" },
  declined: { label: "Declined", tone: "border-vermilion/30 bg-vermilion/[0.05] text-vermilion" },
  in_progress: { label: "In your hands", tone: "border-teal/30 bg-teal/[0.08] text-teal-deep" },
  submitted: { label: "Submitted", tone: "border-gold/50 bg-gold/[0.1] text-[#7d5a24]" },
  approved: { label: "Approved", tone: "border-emerald/30 bg-emerald/[0.06] text-emerald" },
};

export default function ArtisanCollaborations() {
  const data = useQuery(api.collaboration.invitations);
  const respond = useMutation(api.collaboration.respondTask);
  const start = useMutation(api.collaboration.startTask);
  const submit = useMutation(api.collaboration.submitTask);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  async function run(key: string, fn: () => Promise<unknown>, success: string) {
    setBusy(key);
    try {
      await fn();
      toast.success(success);
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^[A-Z_]+:\s*/, "") : "That action could not be completed.");
    } finally {
      setBusy(null);
    }
  }

  const actionable = (data ?? []).filter((task) => ["invited", "accepted", "in_progress"].includes(task.status));

  return (
    <PortalShell
      role="artisan"
      title="KalaCollab"
      hindi="सहयोग"
      subtitle="Coordinated tasks where your craft is one part of a larger piece."
      actions={<Link to="/artisan/jobs" className="hidden items-center gap-1.5 rounded-full border border-maroon/25 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-maroon sm:inline-flex">KalaJobs <ArrowRight className="size-3.5" /></Link>}
    >
      <div className="mx-auto max-w-[1040px]">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            [Users, "Your role is explicit", "Each task names the craft, scope, dependency and proposed amount."],
            [Handshake, "You choose", "A match is an invitation. Accept or decline before the customer approves the plan."],
            [GitBranch, "The sequence is visible", "Start only after the task you depend on has been approved."],
          ].map(([Icon, title, body]) => {
            const IconComponent = Icon as typeof Users;
            return (
              <div key={String(title)} className="border border-maroon/12 bg-card p-4">
                <IconComponent className="size-4 text-teal/70" />
                <p className="mt-4 text-[10px] font-semibold text-ink/75">{String(title)}</p>
                <p className="mt-1 text-[9px] leading-relaxed text-ink/45">{String(body)}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <p className="label-caps text-[9px] text-teal">Your collaboration invitations</p>
          <p className="text-[9px] text-muted-foreground">{actionable.length} need your attention</p>
        </div>

        {data === undefined ? (
          <div className="mt-3 h-52 animate-pulse border border-maroon/12 bg-card" />
        ) : data.length === 0 ? (
          <div className="mt-3 border border-dashed border-maroon/25 bg-card px-6 py-14 text-center">
            <Users className="mx-auto size-8 text-maroon/25" />
            <p className="mt-3 font-display text-2xl text-maroon">No KalaCollab tasks yet.</p>
            <p className="mx-auto mt-1 max-w-[48ch] text-[11px] leading-relaxed text-ink/50">
              When a customer decomposes a multi-maker brief and your CraftFit profile is the best
              match for a task, the invitation appears here. Single-artisan KalaJobs remain separate.
            </p>
            <Link to="/artisan/jobs" className="mt-4 inline-flex rounded-full bg-teal px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-ivory">
              Browse KalaJobs
            </Link>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {data.map((task) => {
              const status = TASK_STATUS[task.status] ?? TASK_STATUS.proposed;
              const amount = amounts[task._id] ?? String(task.plannedAmountInr);
              const dependencyBlocked = Boolean(task.dependsOnPosition && task.dependencyStatus !== "approved");
              return (
                <article key={task._id} className="overflow-hidden border border-maroon/15 bg-[#fcf9f2]">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-maroon/12 p-4">
                    <div className="min-w-0">
                      <p className="label-caps text-[8px] text-teal">{task.planTitle}</p>
                      <h2 className="mt-1 font-display text-2xl font-semibold leading-none text-maroon">{task.title}</h2>
                      <p className="mt-1 text-[10px] text-ink/48">
                        {task.role} · {task.skill} · with {task.customerName} on “{task.requestTitle}”
                      </p>
                    </div>
                    <span className={`border px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.08em] ${status.tone}`}>{status.label}</span>
                  </div>

                  <div className="grid gap-4 p-4 sm:grid-cols-[1fr_220px]">
                    <div>
                      <p className="text-[10px] leading-relaxed text-ink/60">{task.brief}</p>
                      {task.matchReasons.length > 0 && (
                        <div className="mt-3 border-l border-gold/50 pl-2.5">
                          <p className="label-caps text-[7px] text-muted-foreground">Why CraftFit proposed you</p>
                          {task.matchReasons.slice(0, 3).map((reason) => (
                            <p key={reason} className="mt-1 text-[9px] leading-relaxed text-ink/48">{reason}</p>
                          ))}
                        </div>
                      )}
                      {task.dependsOnPosition && (
                        <p className={`mt-3 flex items-start gap-1.5 border px-2.5 py-2 text-[9px] leading-relaxed ${dependencyBlocked ? "border-saffron/40 bg-saffron/[0.05] text-[#7d5a24]" : "border-emerald/25 bg-emerald/[0.04] text-emerald"}`}>
                          <GitBranch className="mt-0.5 size-3 shrink-0" />
                          {dependencyBlocked
                            ? `Waiting for “${task.dependencyTitle ?? "the prerequisite task"}” to be approved before you can start.`
                            : `“${task.dependencyTitle ?? "Prerequisite"}” is approved. You can begin.`}
                        </p>
                      )}
                      {task.planStatus === "awaiting_artisans" && task.status === "accepted" && (
                        <p className="mt-2 flex items-center gap-1.5 text-[9px] text-teal-deep"><Clock3 className="size-3" /> Accepted. Waiting for the customer to approve the complete plan.</p>
                      )}
                      {task.planStatus === "draft" && task.status === "declined" && (
                        <p className="mt-2 flex items-center gap-1.5 text-[9px] text-vermilion"><CircleAlert className="size-3" /> The customer will need to reassign this task.</p>
                      )}
                    </div>

                    <div className="border-t border-maroon/10 pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                      <p className="label-caps text-[7px] text-muted-foreground">Task amount</p>
                      <p className="mt-1 font-display text-2xl font-semibold text-maroon">
                        {task.quotedAmountInr ? formatInr(task.quotedAmountInr) : formatInr(task.plannedAmountInr)}
                      </p>
                      <p className="text-[8px] leading-relaxed text-muted-foreground">
                        {task.quotedAmountInr ? "Your proposed amount. Not a transfer." : "Planned allocation. Not a quotation yet."}
                      </p>

                      {task.status === "invited" ? (
                        <div className="mt-3 space-y-2">
                          <label className="block">
                            <span className="text-[8px] font-semibold uppercase tracking-[0.08em] text-ink/55">Your amount (₹)</span>
                            <input
                              type="number"
                              min={1}
                              value={amount}
                              onChange={(event) => setAmounts((current) => ({ ...current, [task._id]: event.target.value }))}
                              className="mt-1 h-8 w-full border border-maroon/20 bg-parchment px-2 text-[11px]"
                            />
                          </label>
                          <textarea
                            value={notes[task._id] ?? ""}
                            onChange={(event) => setNotes((current) => ({ ...current, [task._id]: event.target.value }))}
                            rows={2}
                            placeholder="Scope note, material assumption or dependency"
                            className="w-full border border-maroon/20 bg-parchment px-2 py-1.5 text-[10px]"
                          />
                          <div className="flex gap-1.5">
                            <Button
                              size="sm"
                              className="flex-1 rounded-full bg-emerald px-3 text-[9px] text-ivory"
                              disabled={busy !== null}
                              onClick={() => void run(`accept-${task._id}`, () => respond({ taskId: task._id, accept: true, quotedAmountInr: Number(amount), note: notes[task._id] || undefined }), "Task accepted with your proposed amount.")}
                            >
                              {busy === `accept-${task._id}` ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />} Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full border-vermilion/30 px-3 text-[9px] text-vermilion"
                              disabled={busy !== null}
                              onClick={() => void run(`decline-${task._id}`, () => respond({ taskId: task._id, accept: false, note: notes[task._id] || undefined }), "Task declined.")}
                            >
                              <X className="size-3" /> Decline
                            </Button>
                          </div>
                        </div>
                      ) : task.status === "accepted" ? (
                        <Button
                          size="sm"
                          className="mt-3 w-full rounded-full bg-teal px-3 text-[9px] text-ivory"
                          disabled={busy !== null || dependencyBlocked || !["approved", "in_production"].includes(task.planStatus)}
                          onClick={() => void run(`start-${task._id}`, () => start({ taskId: task._id }), "Task started. The customer has been notified.")}
                        >
                          {busy === `start-${task._id}` ? <Loader2 className="size-3 animate-spin" /> : <Play className="size-3" />}
                          {dependencyBlocked ? "Waiting for dependency" : "Start my task"}
                        </Button>
                      ) : task.status === "in_progress" ? (
                        <div className="mt-3 space-y-2">
                          <textarea
                            value={notes[task._id] ?? ""}
                            onChange={(event) => setNotes((current) => ({ ...current, [task._id]: event.target.value }))}
                            rows={3}
                            placeholder="What did you complete? Include material, finish or handover notes."
                            className="w-full border border-maroon/20 bg-parchment px-2 py-1.5 text-[10px]"
                          />
                          <Button
                            size="sm"
                            className="w-full rounded-full bg-maroon px-3 text-[9px] text-ivory"
                            disabled={busy !== null || (notes[task._id] ?? "").trim().length < 12}
                            onClick={() => void run(`submit-${task._id}`, () => submit({ taskId: task._id, note: notes[task._id] }), "Contribution submitted for customer approval.")}
                          >
                            {busy === `submit-${task._id}` ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />} Submit contribution
                          </Button>
                        </div>
                      ) : task.status === "submitted" ? (
                        <p className="mt-3 flex items-center gap-1.5 text-[9px] text-teal-deep"><Clock3 className="size-3" /> Waiting for customer approval.</p>
                      ) : task.status === "approved" ? (
                        <p className="mt-3 flex items-center gap-1.5 text-[9px] text-emerald"><CircleCheck className="size-3" /> Contribution approved.</p>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <p className="mt-5 max-w-[80ch] text-[9px] leading-relaxed text-muted-foreground">
          KalaCollab task amounts are proposals, not payouts. No funds are automatically split or
          released. Existing single-project payment, concept approval and dispute protections still
          apply to the work you agree.
        </p>
      </div>
    </PortalShell>
  );
}
