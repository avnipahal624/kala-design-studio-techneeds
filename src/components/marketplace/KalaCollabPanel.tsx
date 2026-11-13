import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { formatInr } from "@/lib/marketplace";
import { useMutation, useQuery } from "convex/react";
import {
  Check,
  CircleAlert,
  CircleCheck,
  GitBranch,
  Handshake,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type TaskStatus =
  | "proposed"
  | "invited"
  | "accepted"
  | "declined"
  | "in_progress"
  | "submitted"
  | "approved";

const STATUS_LABEL: Record<TaskStatus, string> = {
  proposed: "Proposed",
  invited: "Awaiting artisan",
  accepted: "Accepted",
  declined: "Declined",
  in_progress: "In progress",
  submitted: "Ready to approve",
  approved: "Approved",
};

const STATUS_TONE: Record<TaskStatus, string> = {
  proposed: "border-maroon/18 bg-parchment text-ink/55",
  invited: "border-saffron/45 bg-saffron/[0.08] text-[#7d5a24]",
  accepted: "border-teal/25 bg-teal/[0.05] text-teal-deep",
  declined: "border-vermilion/30 bg-vermilion/[0.05] text-vermilion",
  in_progress: "border-teal/30 bg-teal/[0.08] text-teal-deep",
  submitted: "border-gold/50 bg-gold/[0.1] text-[#7d5a24]",
  approved: "border-emerald/30 bg-emerald/[0.06] text-emerald",
};

function AssignTaskControl({ taskId }: { taskId: Id<"collaborationTasks"> }) {
  const candidates = useQuery(api.collaboration.candidates, { taskId });
  const assign = useMutation(api.collaboration.assignTask);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!selected) return;
    setBusy(true);
    try {
      await assign({ taskId, artisanId: selected as Id<"users"> });
      toast.success("Artisan assigned to the task.");
      setSelected("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^[A-Z_]+:\s*/, "") : "Could not assign the task.");
    } finally {
      setBusy(false);
    }
  }

  if (candidates === undefined) return <span className="text-[9px] text-muted-foreground">Finding makers…</span>;
  if (candidates.length === 0) return <span className="text-[9px] text-muted-foreground">No other eligible profile. Invite an artisan from the directory.</span>;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-maroon/10 pt-2">
      <UserPlus className="size-3 text-teal" />
      <select value={selected} onChange={(event) => setSelected(event.target.value)} className="h-7 min-w-0 flex-1 border border-maroon/20 bg-parchment px-1.5 text-[9px] text-ink/65">
        <option value="">Choose a maker</option>
        {candidates.map((candidate) => (
          <option key={candidate.id} value={candidate.id}>{candidate.name} · {candidate.score}% · {candidate.city}</option>
        ))}
      </select>
      <Button size="sm" variant="outline" className="h-7 rounded-full border-maroon/25 px-2.5 text-[8px] text-maroon" disabled={!selected || busy} onClick={() => void submit()}>
        {busy ? <Loader2 className="size-3 animate-spin" /> : "Assign"}
      </Button>
    </div>
  );
}

export function KalaCollabPanel({
  requestId,
  requestStatus,
}: {
  requestId: Id<"customerRequests">;
  requestStatus: string;
}) {
  const data = useQuery(api.collaboration.forRequest, { requestId });
  const createPlan = useMutation(api.collaboration.createPlan);
  const dispatchPlan = useMutation(api.collaboration.dispatchPlan);
  const rebuildPlan = useMutation(api.collaboration.rebuildPlan);
  const approvePlan = useMutation(api.collaboration.approvePlan);
  const approveTask = useMutation(api.collaboration.approveTask);
  const cancelPlan = useMutation(api.collaboration.cancelPlan);
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

  if (data === undefined) {
    return <div className="h-36 animate-pulse border border-maroon/12 bg-card" />;
  }

  if (!data) {
    return (
      <section className="border border-maroon/15 bg-[#fcf9f2] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="label-caps text-[9px] text-teal">KalaCollab</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-maroon">Does this piece need more than one maker?</h2>
            <p className="mt-1 max-w-[62ch] text-[11px] leading-relaxed text-ink/55">
              Break the brief into craft tasks, match real artisans to each role, and approve one
              coordinated plan. Every task is accepted by its artisan before it appears in the
              workspace.
            </p>
          </div>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-ivory">
            <Users className="size-5 text-maroon/55" />
          </span>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {[
            ["01", "Craft decomposition", "Tailoring, surface work and finishing are proposed from the brief's Craft DNA."],
            ["02", "Task-level CraftFit", "Each role gets its own explainable match and planned amount."],
            ["03", "Human approval", "Artisans accept. You approve the complete plan before making starts."],
          ].map(([number, title, body]) => (
            <div key={number} className="border border-maroon/10 bg-parchment/45 p-3">
              <p className="font-display text-[10px] italic text-maroon/40">{number}</p>
              <p className="mt-3 text-[10px] font-semibold text-ink/70">{title}</p>
              <p className="mt-1 text-[9px] leading-relaxed text-ink/45">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-maroon/12 pt-3">
          <p className="max-w-[60ch] text-[9px] leading-relaxed text-muted-foreground">
            This creates a coordination plan, not a payment. No funds are split or released.
          </p>
          {requestStatus === "open" ? (
            <Button
              size="sm"
              className="rounded-full bg-maroon px-4 text-ivory hover:bg-maroon-deep"
              disabled={busy !== null}
              onClick={() => void run("create", () => createPlan({ requestId }), "Collaboration plan proposed.")}
            >
              {busy === "create" ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
              Propose a collaboration
            </Button>
          ) : (
            <p className="border border-maroon/15 bg-parchment px-3 py-2 text-[10px] text-muted-foreground">
              KalaCollab can be proposed while the brief is open.
            </p>
          )}
        </div>
      </section>
    );
  }

  const { plan, tasks } = data;
  const accepted = tasks.filter((task) => !["proposed", "invited", "declined"].includes(task.status)).length;
  const approved = tasks.filter((task) => task.status === "approved").length;
  const unassigned = tasks.filter((task) => !task.artisanId).length;
  const declined = tasks.some((task) => task.status === "declined");
  const plannedTotal = tasks.reduce((sum, task) => sum + (task.quotedAmountInr ?? task.plannedAmountInr), 0);
  const overBudget = plannedTotal > plan.combinedBudgetInr;

  return (
    <section className="overflow-hidden border border-maroon/15 bg-[#fcf9f2]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-maroon/12 p-5">
        <div>
          <p className="label-caps text-[9px] text-teal">KalaCollab · coordinated making</p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-maroon">{plan.title}</h2>
          <p className="mt-1 text-[10px] text-ink/48">
            {tasks.length} tasks · {accepted} accepted · {approved} approved · {formatInr(plannedTotal)} planned
          </p>
          {overBudget && (
            <p className="mt-1 flex items-center gap-1 text-[9px] font-medium text-vermilion">
              <CircleAlert className="size-3" /> Above the {formatInr(plan.combinedBudgetInr)} brief ceiling. Reassign or ask makers to revise before approval.
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="border border-maroon/18 bg-parchment px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-maroon">
            {plan.status.replace(/_/g, " ")}
          </span>
          <span className="border border-gold/40 bg-ivory px-2.5 py-1 text-[9px] font-medium text-[#7d5a24]">No auto payouts</span>
        </div>
      </div>

      <div className="space-y-2 p-4">
        {tasks.map((task) => (
          <article key={task._id} className="border border-maroon/12 bg-card p-3.5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-maroon/15 bg-parchment font-display text-xs font-semibold text-maroon">
                  {String(task.position).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-ink/80">{task.title}</p>
                  <p className="mt-0.5 text-[9px] uppercase tracking-[0.1em] text-teal">{task.role} · {task.skill}</p>
                  <p className="mt-1 max-w-[68ch] text-[10px] leading-relaxed text-ink/50">{task.brief}</p>
                </div>
              </div>
              <span className={`border px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.08em] ${STATUS_TONE[task.status as TaskStatus]}`}>
                {STATUS_LABEL[task.status as TaskStatus]}
              </span>
            </div>

            <div className="mt-3 grid gap-2 border-t border-maroon/10 pt-2.5 sm:grid-cols-3">
              <div>
                <p className="label-caps text-[7px] text-muted-foreground">Proposed artisan</p>
                <p className="mt-0.5 text-[10px] font-medium text-ink/70">
                  {task.artisanName ?? <span className="text-vermilion">No eligible match</span>}
                </p>
                {task.matchScore !== undefined && task.artisanName && (
                  <p className="text-[8px] text-teal">{task.matchScore}% CraftFit</p>
                )}
                {!task.artisanName && plan.status === "draft" && <AssignTaskControl taskId={task._id} />}
              </div>
              <div>
                <p className="label-caps text-[7px] text-muted-foreground">Task amount</p>
                <p className="mt-0.5 text-[10px] font-medium text-maroon">
                  {task.quotedAmountInr ? formatInr(task.quotedAmountInr) : `${formatInr(task.plannedAmountInr)} planned`}
                </p>
                {!task.quotedAmountInr && <p className="text-[8px] text-muted-foreground">Not a quotation yet</p>}
              </div>
              <div>
                <p className="label-caps text-[7px] text-muted-foreground">Dependency</p>
                <p className="mt-0.5 flex items-start gap-1 text-[9px] text-ink/60">
                  <GitBranch className="mt-0.5 size-2.5 shrink-0" />
                  {(task.dependsOnPositions?.length
                    ? task.dependsOnPositions
                    : task.dependsOnPosition
                      ? [task.dependsOnPosition]
                      : []
                  )
                    .map((position) => tasks.find((row) => row.position === position)?.title ?? `Task ${position}`)
                    .join(" + ") || "Can start first"}
                </p>
              </div>
            </div>

            {task.matchReasons.length > 0 && (
              <div className="mt-2 border-l border-gold/50 pl-2">
                {task.matchReasons.slice(0, 2).map((reason) => (
                  <p key={reason} className="text-[9px] leading-snug text-ink/45">{reason}</p>
                ))}
              </div>
            )}

            {task.artisanNote && (
              <p className="mt-2 border border-maroon/10 bg-parchment/50 p-2 text-[10px] leading-relaxed text-ink/55">
                <span className="font-semibold text-ink/65">Artisan note:</span> {task.artisanNote}
              </p>
            )}

            {task.status === "submitted" && ["approved", "in_production"].includes(plan.status) && (
              <Button
                size="sm"
                className="mt-2 rounded-full bg-emerald px-4 text-[10px] text-ivory hover:bg-emerald/90"
                disabled={busy !== null}
                onClick={() => void run(`approve-${task._id}`, () => approveTask({ taskId: task._id }), "Contribution approved.")}
              >
                {busy === `approve-${task._id}` ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                Approve contribution
              </Button>
            )}
          </article>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-maroon/12 bg-parchment/45 px-4 py-3">
        <p className="max-w-[58ch] text-[9px] leading-relaxed text-muted-foreground">
          KalaCollab coordinates scope and approvals. It never splits or releases funds. Task
          amounts remain proposals until a separate payment flow is agreed.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {plan.status === "draft" && (
            <>
              {(unassigned > 0 || declined) && (
                <Button size="sm" variant="outline" className="rounded-full border-maroon/25 text-[10px]" disabled={busy !== null} onClick={() => void run("rebuild", () => rebuildPlan({ planId: plan._id }), "Task proposals refreshed.")}>
                  {busy === "rebuild" ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                  Refresh matches
                </Button>
              )}
              <Button size="sm" className="rounded-full bg-maroon px-4 text-[10px] text-ivory" disabled={busy !== null || unassigned > 0} onClick={() => void run("dispatch", () => dispatchPlan({ planId: plan._id }), "Invitations sent to the proposed artisans.")}>
                {busy === "dispatch" ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                Send proposal to artisans
              </Button>
            </>
          )}
          {plan.status === "awaiting_artisans" && (
            <span className="flex items-center gap-1.5 border border-saffron/40 bg-saffron/[0.06] px-3 py-1.5 text-[9px] text-[#7d5a24]">
              <CircleAlert className="size-3" /> Waiting for each artisan to accept
            </span>
          )}
          {plan.status === "ready" && (
            <Button size="sm" className="rounded-full bg-emerald px-4 text-[10px] text-ivory" disabled={busy !== null || overBudget} onClick={() => void run("approve-plan", () => approvePlan({ planId: plan._id }), "Collaboration plan approved.")}>
              {busy === "approve-plan" ? <Loader2 className="size-3.5 animate-spin" /> : <Handshake className="size-3.5" />}
              Approve collaboration plan
            </Button>
          )}
          {plan.status === "approved" && (
            <span className="flex items-center gap-1.5 border border-teal/25 bg-teal/[0.05] px-3 py-1.5 text-[9px] text-teal-deep">
              <CircleCheck className="size-3" /> Plan approved · makers can begin in dependency order
            </span>
          )}
          {plan.status === "in_production" && (
            <span className="flex items-center gap-1.5 border border-teal/25 bg-teal/[0.05] px-3 py-1.5 text-[9px] text-teal-deep">
              <Wallet className="size-3" /> In coordinated production
            </span>
          )}
          {plan.status === "completed" && (
            <span className="flex items-center gap-1.5 border border-emerald/30 bg-emerald/[0.06] px-3 py-1.5 text-[9px] text-emerald">
              <CircleCheck className="size-3" /> All contributions approved
            </span>
          )}
          {!["completed", "cancelled"].includes(plan.status) && (
            <Button size="sm" variant="ghost" className="h-7 px-2 text-[9px] text-muted-foreground" disabled={busy !== null} onClick={() => void run("cancel", () => cancelPlan({ planId: plan._id }), "Collaboration plan cancelled.")}>
              <X className="size-3" /> Cancel
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
