export type CollaborationTaskStatus =
  | "proposed"
  | "invited"
  | "accepted"
  | "declined"
  | "in_progress"
  | "submitted"
  | "approved";

export type CollaborationPlanStatus =
  | "draft"
  | "awaiting_artisans"
  | "ready"
  | "approved"
  | "in_production"
  | "completed"
  | "cancelled";

/** Plan progression after one artisan accepts or declines. */
export function nextPlanStatusAfterResponse(tasks: { status: string }[]): CollaborationPlanStatus {
  const allAccepted = tasks.length > 0 && tasks.every((task) => task.status === "accepted");
  const anyDeclined = tasks.some((task) => task.status === "declined");
  if (allAccepted) return "ready";
  if (anyDeclined) return "draft";
  return "awaiting_artisans";
}

export function acceptedTotalWithinBudget(
  alreadyAcceptedInr: number,
  nextAmountInr: number,
  budgetInr: number,
) {
  return alreadyAcceptedInr + nextAmountInr <= budgetInr;
}

export function allDependenciesApproved(statuses: string[]) {
  return statuses.length > 0 && statuses.every((status) => status === "approved");
}
