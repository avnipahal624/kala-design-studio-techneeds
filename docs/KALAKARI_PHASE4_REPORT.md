# Kalakari Phase 4 Report

Date: 13 November 2026

## Executive summary

Kalakari was upgraded in place. The existing Convex schema, authentication, marketplace, matching, quotation, KalaCollab, payment, project, KalaProof and passport workflows were retained.

Delivered in this phase:

- A cloth-panel 3D jacket/T-shirt/tote preview with seams, collars, sleeves, material texture, orbit/zoom, front/back and reset.
- Design-to-request continuity: a saved Studio design can be attached to a customer brief, with server ownership validation.
- `/kala-atlas`, a real 36-feature India map with source-linked craft notes, state search, zoom/pan, keyboard support, mobile selection and live artisan filtering.
- `/track` and `/track/:projectId`, built on existing projects/KalaProof/milestones/disputes and structured manual shipping.
- An integer-paise multi-artisan sandbox payout ledger with proposed splits, explicit acceptance, holds, a simulator, balances, reversals and idempotency.
- KalaPassport evidence submission, named reviewer workflow, statuses, revocation history, privacy toggles and revocable QR links.
- A connected demo with Atlas, 3D, KalaCollab, KalaTrack, sandbox split and five transparent passport review states.
- Tests for ledger arithmetic/reconciliation, map data/filters and existing permissions/state transitions.

Nothing was reported as live that is not configured: payouts are sandbox-only and passport verification is a platform review, not independent authentication.

## Baseline

| Check | Baseline | Final |
| --- | --- | --- |
| TypeScript (`bunx tsc -b --noEmit`) | Passed | Passed |
| Tests (`bun test`) | 25 pass, 4 files, 366 expectations | 34 pass, 6 files, 503 expectations |
| Convex codegen/deploy | Passed | Passed |
| Lint | 0 errors / 22 warnings | 0 errors / 22 warnings |
| Production build | Passed | Passed |
| Demo seed | 391 tracked records | 420 tracked records |

The final build transformed 3,099 modules. Main bundle: 989.05 kB raw / 275.53 kB gzip. KalaAtlas lazy chunk: 52.52 kB / 18.74 kB. KalaTrack lazy chunk: 22.57 kB / 6.12 kB. 3D lazy chunk: 973.98 kB / 262.65 kB. The 3D engine remains out of the initial route.

## What changed

### 1. 3D garment experience

Files:

- `src/components/studio/Garment3DPreview.tsx`
- `src/components/studio/StudioBrief.tsx`
- `src/pages/Studio.tsx`
- `src/pages/customer/CustomerPages.tsx`

Changes:

- Replaced rounded-box garments with tapered cloth panels, shoulders, sleeves, collars, lapels, cuffs, plackets, hem seams and tubular tote handles.
- Added a generated fabric weave bump map, cloth roughness and restrained sheen.
- Kept surface-projected motif decals anchored to front panels; layers are split left/right and remain attached during orbit.
- Kept the honest 2D fallback for unsupported products and missing WebGL.
- Added a saved-design CTA in the Studio summary.
- Create-request now pre-fills from a saved design, displays its reference, and sends `designId`; `requests.create` validates ownership.
- Schema adds optional `customerRequests.designId`.

Not delivered: a licensed or rigged GLB. The meshes are procedural and are not claimed to be photoreal.

### 2. KalaAtlas

Files:

- `src/pages/KalaAtlas.tsx`
- `src/lib/kala-atlas.ts`
- `public/data/india-states.geojson`
- `public/data/INDIA_STATES_SOURCE.md`
- `src/convex/artisans.ts`
- `src/convex/lib/serialise.ts`
- `src/pages/ExploreArtisans.tsx`
- route/navigation in `src/main.tsx`, `src/components/public/PublicShell.tsx`
- landing entry in `src/pages/Landing.tsx`

Changes:

- Real 36-feature state/UT map from CC0 LGD-derived data, simplified locally.
- Search, mobile state selector, zoom buttons, drag pan, keyboard controls, loading/error/retry states.
- 14 source-linked craft entries across 11 states.
- Craft panel separates editorial context from artisan profiles; empty regions stay empty.
- `artisanProfiles.state` optional field, seeded and exposed through the public directory.
- Directory supports `state` filtering and shows a filter chip.
- Fictional profiles retain sample labels.

### 3. KalaTrack

Files:

- `src/pages/KalaTrack.tsx`
- `src/convex/schema.ts`
- `src/convex/projects.ts`
- `src/main.tsx`
- `src/components/portal/PortalShell.tsx`

Changes:

- Dedicated customer/artisan tracker using `projects.mine` and `projects.detail`.
- Dated KalaProof timeline, progress photos, milestones, planned dates, disputes and review counts.
- Existing `projects.addProgress` backs the artisan update form with server-side ownership and status checks.
- Optional structured `projects.shipment` with carrier, tracking number, optional external URL, note, recorder and date.
- `projects.addShipping` validates the assigned artisan, `delivered` status, required fields and http(s) URLs.
- Explicit past-deadline, disputed, cancelled and refunded states.
- No fabricated GPS, live carrier data or delivery estimate.

### 4. Sandbox multi-artisan payouts

Files:

- `src/convex/payouts.ts`
- `src/convex/lib/payoutLedger.ts`
- `src/convex/schema.ts`
- `src/components/marketplace/SandboxPayoutLedger.tsx`
- `src/components/marketplace/ProjectWorkspace.tsx`

New tables:

- `payoutPlans`
- `payoutAllocations`
- `payoutLedger`
- `payoutBalances`

Changes:

- Integer-paise gross, platform fee, processor fee, tax, refunds, holds and distributable amounts.
- KalaCollab task-based weights, or a single lead-artisan allocation when no plan exists.
- Exact remainder allocation; total always reconciles.
- Customer proposal/acceptance, holds, simulator release to available balances, admin reversal.
- Idempotency keys on plans and ledger entries.
- Artisan views show only their own allocations/ledger/balance.
- Project completion and confirmed/settled payment required before planning.
- No provider transfer, provider ID or paid-balance claim.

### 5. Evidence-based KalaPassport

Files:

- `src/convex/passport.ts`
- `src/convex/schema.ts`
- `src/pages/KalaPassport.tsx`
- `src/pages/admin/AdminPages.tsx`

Changes:

- Structured craft tradition, heritage region, production location, materials origin, public evidence summary, private evidence notes/files.
- Statuses: unreviewed, evidence submitted, under review, verified, rejected, revoked.
- Admin-only named reviewer decisions with scope, date, basis and limitations.
- Admin review queue in `/admin/verifications`; review workspace on the private passport.
- Revocation with reason and history.
- Privacy toggles for production location and artisan identity.
- QR sharing with token rotation that invalidates the previous link and turns sharing off.
- Public certificate exposes only the public summary and opted-in fields; review history remains private.

### 6. Connected demo

Files:

- `src/convex/demo.ts`
- `src/pages/DemoLive.tsx`
- `src/pages/Landing.tsx`
- docs.

Changes:

- Seed now includes one simulated three-artisan sandbox split with 3 allocations, 9 ledger entries and 3 balances.
- Five passports cover verified, evidence submitted, under review, rejected and revoked states.
- 13 passport review history entries.
- `/demo/live` shows the payout split and transparent passport statuses.
- Revoked passport is not rendered as a broken public link.
- Total tracked demo records: 420.

## Reused existing features

- Convex Auth and `RequireAuth`.
- Customer/artisan/admin role model.
- Project `requireProjectAccess` checks.
- Project state machine and transition assertions.
- KalaProof event append pattern and attachment validation.
- Existing KalaCollab plans/tasks and quote totals.
- Existing payment config and sandbox/Razorpay boundaries.
- Existing design canvas, save/version/restore.
- Existing admin audit and notification helpers.
- Existing visual system and shadcn/Tailwind setup.

## Migrations and compatibility

All schema changes are additive and backward-compatible:

- optional `customerRequests.designId`;
- optional `artisanProfiles.state`;
- optional `projects.shipment`;
- optional passport review/privacy/evidence fields;
- new passport review and payout ledger tables.

Existing rows remain valid. No production data was rewritten. The development demo was reset and reseeded; reset removes only tracked sample entities.

## Security and permissions

- Design ID on a request is checked against the signed-in customer.
- KalaTrack data is participant/admin-only via existing project access.
- Progress updates and shipping are artisan-only; shipping requires the correct project state.
- Payout plans require customer/admin; simulator requires an accepted plan; reversals are admin-only.
- Artisan payout views are scoped to their own allocations.
- Ledger movements are idempotent and reject negative balances.
- Passport evidence can be submitted by project participants; review decisions and revocation are admin-only.
- Public passport sharing is customer-controlled and revocable.
- Existing payment shortcuts were not added.

## Verification actually run

- `bun convex dev --once` — passed.
- `bunx tsc -b --noEmit` — passed.
- `bun test` — 34 pass, 0 fail, 6 files, 503 expectations.
- `bun run lint` — 0 errors, 22 pre-existing fast-refresh/generated-file warnings.
- `bun run build` — passed, 3,099 modules.
- `bunx convex run demo:reset` then `demo:seed` — passed, 420 records.
- `bunx convex run demo:showcase` — verified 3 payout allocations, 5 passport states and expected counts.

Not run or not available:

- Browser/Playwright automation.
- WebGL visual inspection or screenshots.
- Responsive visual checks.
- Live payout-provider integration tests.
- Real KYC/route-payout reconciliation tests.

## Status matrix

| Area | Status |
| --- | --- |
| Existing marketplace/auth/quotes/projects | Implemented previously; preserved and typechecked |
| 3D jacket/T-shirt/tote | Implemented; compiled; not visually verified |
| Design-to-request continuity | Implemented and server-validated |
| KalaAtlas map | Implemented; data tests pass; not visually verified |
| KalaTrack | Implemented; uses existing records; not browser-tested |
| Manual shipping | Implemented and server-validated; no live carrier |
| Sandbox payout ledger | Implemented and unit-tested; sandbox only |
| Live multi-artisan payouts | Externally blocked: no provider/KYC integration |
| Passport evidence/review/revocation | Implemented; admin-scoped; demo statuses are fictional |
| Independent/GI authenticity | Not implemented and not claimed |
| QR sharing/revocation | Implemented |
| Demo story | Seeded and linked; 420 records |

## Known limitations and blockers

1. **No browser automation or visual inspection.** The 3D garment and SVG map were compiled and code-reviewed but not viewed in a browser. Layout, WebGL rendering and mobile map usability need a visual pass.
2. **No licensed GLB asset.** The garment is a substantially improved procedural mesh, not a scanned/rigged asset. No photorealism is claimed.
3. **No live payout marketplace.** The ledger is intentionally sandbox-only. A compliant provider needs onboarding, KYC, transfer authorization, webhook signature validation, refunds and reconciliation before any live claim.
4. **No independent authentication or GI integration.** KalaPassport verification is a platform review of submitted evidence, with named reviewer, scope and limitations. It is not a government, GI, museum or NGO endorsement.
5. **Demo accounts do not exist.** The public demo is read-only. Authenticated actions require a real account. Admin controls require a real admin.
6. **Craft coverage is partial.** KalaAtlas has 14 curated entries; most states have no craft note. Empty states are intentional.
7. **Boundary data is not authoritative.** It is a simplified CC0 presentation asset, not a survey/legal boundary.
8. **Processor fees and taxes are zero/not modelled** in the sandbox because no provider transfer occurs. They are labelled, not invented.
9. **Legacy payout records remain separate.** The new ledger does not migrate or overwrite existing manual `payouts` records.
