/**
 * Pure sandbox payout arithmetic. All amounts are integer paise.
 * This module never calls a payment provider.
 */

export type PayoutWeight = {
  key: string;
  weightPaise: number;
};

export type PayoutShare = {
  key: string;
  amountPaise: number;
};

export function toPaise(rupees: number) {
  if (!Number.isFinite(rupees)) throw new Error("INVALID: non-finite amount.");
  return Math.round(rupees * 100);
}

export function assertIntegerPaise(value: number, label = "amount") {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`INVALID: ${label} must be a non-negative integer in paise.`);
  }
}

export function allocatePaise(totalPaise: number, weights: PayoutWeight[]): PayoutShare[] {
  assertIntegerPaise(totalPaise, "distributable amount");
  if (weights.length === 0) throw new Error("INVALID: at least one allocation is required.");
  const clean = weights.map((row) => {
    assertIntegerPaise(row.weightPaise, "allocation weight");
    if (!row.key) throw new Error("INVALID: every allocation needs a key.");
    return row;
  });
  const sum = clean.reduce((total, row) => total + row.weightPaise, 0);
  if (sum <= 0) throw new Error("INVALID: allocation weights must add up to more than zero.");

  const base = clean.map((row) => {
    const exact = (totalPaise * row.weightPaise) / sum;
    return { key: row.key, amountPaise: Math.floor(exact), fraction: exact - Math.floor(exact) };
  });
  let remainder = totalPaise - base.reduce((total, row) => total + row.amountPaise, 0);
  const order = [...base].sort((a, b) => b.fraction - a.fraction);
  for (let index = 0; remainder > 0; index += 1) {
    order[index % order.length].amountPaise += 1;
    remainder -= 1;
  }
  const result = base.map(({ key, amountPaise }) => ({ key, amountPaise }));
  if (result.reduce((total, row) => total + row.amountPaise, 0) !== totalPaise) {
    throw new Error("INVALID: allocation remainder did not reconcile.");
  }
  return result;
}

export function assertPayoutReconciles(input: {
  grossPaise: number;
  platformFeePaise: number;
  processorFeePaise: number;
  taxPaise: number;
  refundedPaise: number;
  heldPaise: number;
  distributablePaise: number;
  allocationsPaise: number;
  allocationAmounts?: number[];
}) {
  for (const [label, value] of Object.entries(input)) {
    if (label === "allocationAmounts") continue;
    assertIntegerPaise(value as number, label);
  }
  if (input.allocationAmounts?.some((amount) => amount <= 0)) {
    throw new Error("INVALID: every artisan allocation must be positive.");
  }
  const deductions = input.platformFeePaise + input.processorFeePaise + input.taxPaise + input.refundedPaise + input.heldPaise;
  if (deductions > input.grossPaise) {
    throw new Error("INVALID: deductions exceed the order gross.");
  }
  if (input.grossPaise - deductions !== input.distributablePaise) {
    throw new Error("INVALID: distributable amount does not reconcile with gross and deductions.");
  }
  if (input.allocationsPaise !== input.distributablePaise) {
    throw new Error("INVALID: artisan allocations do not reconcile with the distributable amount.");
  }
  return true;
}

export function applyBalanceEntry(
  balance: { availablePaise: number; heldPaise: number; paidPaise: number },
  entry: { bucket: "available" | "held" | "paid"; direction: "credit" | "debit"; amountPaise: number },
) {
  assertIntegerPaise(entry.amountPaise, "ledger amount");
  const key = entry.bucket === "available" ? "availablePaise" : entry.bucket === "held" ? "heldPaise" : "paidPaise";
  const next = { ...balance };
  const signed = entry.direction === "credit" ? entry.amountPaise : -entry.amountPaise;
  next[key] += signed;
  if (next[key] < 0) throw new Error("INVALID: a ledger movement would make a balance negative.");
  return next;
}
