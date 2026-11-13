# Kalakari Phase 4 Audit

Date: 13 November 2026

## Baseline that was preserved

The repository already contained a working, substantial marketplace:

- React 19, TypeScript, Vite, Tailwind, Convex and Convex Auth.
- Customer, artisan and admin workspaces with server-side role checks.
- Artisan discovery, public profiles, portfolio items and verification requests.
- Structured briefs, quotations, quote acceptance, feasibility reviews and CraftFit matching.
- KalaCollab plans/tasks with server-validated dependencies and approvals.
- Sandbox and Razorpay order boundaries, signed-webhook handling and manual admin payouts.
- Project state machine, KalaProof event timeline, reviews, disputes and refunds.
- KalaPassport public/private sharing.
- A saved design canvas with immutable versions.
- An existing demo seed and a public `/demo/live` showcase.

Baseline checks before this phase:

- `bunx tsc -b --noEmit` passed.
- `bun test` passed: 25 tests, 4 files, 366 expectations.
- Convex codegen/deploy passed.
- Production build passed.
- Existing CSS/Tailwind identity and authenticated routes were preserved.

## Gaps identified

1. The 3D jacket was a rounded-box approximation, not garment-like.
2. There was no geographic craft-discovery surface.
3. Project progress existed only inside the workspace; there was no dedicated customer tracker.
4. Shipping had an event note but no structured carrier/tracking fields.
5. Payouts were single-project manual records with no integer-paise multi-artisan ledger or simulator.
6. KalaPassport had no evidence submission, reviewer decision, revocation history or public privacy toggles.
7. The demo did not show Atlas, tracker, sandbox split or the passport review states as one story.
8. There was no browser automation available for WebGL/map visual verification.

## Constraints accepted

- Keep the existing Convex schema and working flows; add optional fields/tables rather than rewrite.
- Use an openly licensed state boundary dataset, not generated geography.
- Keep 2D design as the placement source of truth; 3D is a preview.
- Use procedural garment geometry because no licensed GLB exists in the repository.
- Keep payouts sandbox-only because no compliant live route-payout/KYC provider is configured.
- Do not claim real verification, traction, GI certification or blockchain provenance.
- No demo auth accounts.

## Data source decision

KalaAtlas uses the LGD-derived 36-feature state/UT geometry from India Geodata's `admin/states` release, licensed CC0. The file was simplified locally and attributed to the upstream Local Government Directory/Survey of India/Bhuvan/DataMeet references. This is a presentation asset, not a legal boundary.
