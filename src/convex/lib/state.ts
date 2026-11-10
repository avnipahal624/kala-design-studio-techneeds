export type ProjectStatus =
  | "awaiting_payment"
  | "funded"
  | "in_production"
  | "review_pending"
  | "delivered"
  | "completed"
  | "disputed"
  | "cancelled"
  | "refunded";

/**
 * Explicit project state machine. Every project mutation goes through
 * `assertProjectTransition`, so statuses cannot be jumped by the client.
 */
export const PROJECT_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  awaiting_payment: ["funded", "cancelled"],
  funded: ["in_production", "disputed", "cancelled"],
  in_production: ["review_pending", "disputed", "cancelled"],
  review_pending: ["completed", "in_production", "disputed"],
  delivered: ["completed", "disputed"],
  completed: ["disputed", "refunded"],
  disputed: ["in_production", "review_pending", "completed", "refunded", "cancelled"],
  cancelled: [],
  refunded: [],
};

export function assertProjectTransition(from: ProjectStatus, to: ProjectStatus) {
  if (!PROJECT_TRANSITIONS[from]?.includes(to)) {
    throw new Error(`INVALID_STATE: cannot move a project from ${from} to ${to}.`);
  }
}

export function paymentAllowsProduction(paymentStatus: string) {
  return paymentStatus === "confirmed" || paymentStatus === "settled";
}
