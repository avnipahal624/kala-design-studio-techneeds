# Sandbox Payout Ledger

## Boundary

The existing Razorpay/sandbox payment flow is preserved. This phase adds a separate sandbox payout ledger for multi-artisan splits. It does **not** call a payout provider, execute a bank transfer, or claim that money moved.

Live payouts remain externally blocked until a compliant marketplace/route payout provider is configured with onboarding, KYC, transfer authorization, webhook verification and reconciliation.

## Data model

All amounts are integer paise.

### `payoutPlans`

- project, request, customer, optional collaboration plan;
- `grossPaise`, `platformFeePaise`, `processorFeePaise`, `taxPaise`, `refundedPaise`, `heldPaise`, `distributablePaise`;
- status: `proposed`, `accepted`, `simulated`, `reversed`, `cancelled`;
- mode: `sandbox`;
- unique idempotency key;
- explicit fee note;
- optional demo label.

### `payoutAllocations`

- plan, project, artisan, optional collaboration task;
- label, weight and net paise;
- status: `proposed`, `held`, `available`, `reversed`;
- demo label and hold/revocation note.

### `payoutLedger`

Append-only balance movements with a bucket (`available`, `held`, `paid`), kind, direction, amount, idempotency key and note. Unique idempotency keys prevent duplicate movements on retries.

### `payoutBalances`

Derived per-artisan `availablePaise`, `heldPaise` and `paidPaise`, updated atomically in the same Convex mutation as each ledger entry. A movement that would make a balance negative is rejected.

## Workflow

1. Customer completes the project. Payment must be `confirmed` or `settled`.
2. Customer proposes a sandbox split from the project workspace.
3. The server uses accepted KalaCollab tasks where available, otherwise a single lead-artisan allocation.
4. Weights are task amounts; the pure allocator distributes every paise exactly once.
5. Validation reconciles gross − platform fee − processor fee − tax − refunds − holds = distributable = sum of allocations.
6. Customer explicitly accepts the split. Each allocation is moved into the `held` bucket with an idempotent ledger entry.
7. Customer runs the sandbox simulator. Held amounts are released into `available` balances. The response includes `movedMoney: false`.
8. An admin may reverse a held or available allocation with a reason. This writes a debit and marks the allocation reversed; if every allocation is reversed, the plan is reversed.

The existing manual admin payout record (`admin:releasePayout`) is untouched. This ledger does not set `paidPaise` or a provider transfer ID.

## Authorization

- `payouts.forProject`: project participant or admin; artisans see only their own allocations, ledger entries and balance.
- `payouts.createSandboxPlan`: customer or admin; project complete, settled payment.
- `payouts.acceptSandboxPlan`: customer or admin.
- `payouts.simulateSandboxPayouts`: customer or admin.
- `payouts.reverseAllocation`: admin only.
- `payouts.balances`: admin only.
- Idempotency keys prevent duplicate plans and duplicate ledger entries.
- Negative, zero, fractional and unreconciled amounts are rejected.

## UI

`SandboxPayoutLedger` is embedded in the existing project workspace and also represented on `/demo/live` with a seeded, clearly fictional three-way split.

It shows gross, platform fee, processor fee (not modelled), tax (not calculated), distributable, allocations and ledger entries. It explains that no provider transfer occurred.

## Tests

`tests/payout-ledger.test.ts` covers:

- exact allocation totals;
- deterministic remainder handling;
- rejection of negative/fractional/zero-weight allocations;
- gross/fee/hold/refund reconciliation;
- refusal of a movement that would make a balance negative.

## Limitations

- No live route payout/KYC integration.
- Processor fees and tax are explicitly `0` rather than invented because no provider transfer is executed.
- The sandbox ledger does not settle real refunds; refund behavior is still owned by the existing payment flow.
- No end-to-end payout test against a provider exists, because no provider is configured.
