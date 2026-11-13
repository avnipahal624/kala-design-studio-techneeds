import { describe, expect, test } from "bun:test";
import {
  allocatePaise,
  applyBalanceEntry,
  assertPayoutReconciles,
} from "../src/convex/lib/payoutLedger";

describe("sandbox payout arithmetic", () => {
  test("allocates every paise exactly once and preserves the total", () => {
    const shares = allocatePaise(10_000, [
      { key: "lead", weightPaise: 55 },
      { key: "embroidery", weightPaise: 30 },
      { key: "finishing", weightPaise: 15 },
    ]);
    expect(shares.map((share) => share.amountPaise)).toEqual([5_500, 3_000, 1_500]);
    expect(shares.reduce((total, share) => total + share.amountPaise, 0)).toBe(10_000);
  });

  test("gives the remainder deterministically without losing a paise", () => {
    const shares = allocatePaise(100, [
      { key: "a", weightPaise: 1 },
      { key: "b", weightPaise: 1 },
      { key: "c", weightPaise: 1 },
    ]);
    expect(shares.reduce((total, share) => total + share.amountPaise, 0)).toBe(100);
    expect(shares.map((share) => share.amountPaise).sort((a, b) => a - b)).toEqual([33, 33, 34]);
  });

  test("rejects negative, fractional or zero-weight allocations", () => {
    expect(() => allocatePaise(-1, [{ key: "a", weightPaise: 1 }])).toThrow();
    expect(() => allocatePaise(10.5, [{ key: "a", weightPaise: 1 }])).toThrow();
    expect(() => allocatePaise(100, [{ key: "a", weightPaise: 0 }])).toThrow();
    expect(() => allocatePaise(100, [{ key: "a", weightPaise: -3 }])).toThrow();
  });

  test("reconciles gross, fees, holds and allocations", () => {
    expect(() => assertPayoutReconciles({
      grossPaise: 10_000,
      platformFeePaise: 800,
      processorFeePaise: 0,
      taxPaise: 0,
      refundedPaise: 0,
      heldPaise: 0,
      distributablePaise: 9_200,
      allocationsPaise: 9_200,
      allocationAmounts: [5_000, 4_200],
    })).not.toThrow();

    expect(() => assertPayoutReconciles({
      grossPaise: 10_000,
      platformFeePaise: 800,
      processorFeePaise: 0,
      taxPaise: 0,
      refundedPaise: 0,
      heldPaise: 0,
      distributablePaise: 9_200,
      allocationsPaise: 9_100,
    })).toThrow("do not reconcile");
  });

  test("prevents a ledger movement from making a balance negative", () => {
    const balance = { availablePaise: 500, heldPaise: 0, paidPaise: 0 };
    expect(applyBalanceEntry(balance, { bucket: "available", direction: "debit", amountPaise: 500 })).toEqual({
      availablePaise: 0,
      heldPaise: 0,
      paidPaise: 0,
    });
    expect(() => applyBalanceEntry(balance, { bucket: "available", direction: "debit", amountPaise: 501 })).toThrow("negative");
  });
});
