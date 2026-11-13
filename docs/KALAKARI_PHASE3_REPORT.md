# Kalakari Phase 3 Report

Date: 13 November 2026

## Executive summary

Phase 3 addressed the main reason the prototype felt unfinished: the application was well structured but almost empty. The development deployment had only two users, one artisan profile, one open brief, no projects, no collaboration plans and no passports.

The delivered work now provides:

- A full, labelled, idempotent demo dataset in Convex.
- 22 fictional artisans with 52 portfolio pieces.
- 8 fictional customers, 20 requests, 24 quotations and 15 projects.
- 3 real KalaCollab scenarios with dependencies and task states.
- 20 sample reviews, 5 public sample passports, sandbox payment records and notifications.
- A populated public demo route at `/demo/live`.
- A read-only artisan workspace preview with real calculated CraftFit opportunities.
- A lazy-loaded WebGL preview for jacket, T-shirt and tote in the existing Studio.
- A T-shirt product and a protected `/studio` entry in the public navigation.
- Sample-data labelling on public passports.

The existing authentication, matching, quotation, collaboration, payment and project-management architecture was retained. No genuine user was converted into a demo account, and no live payment was created.

## What existed before Phase 3

The repository already contained:

- React 19, TypeScript, Vite, Tailwind, Convex and Convex Auth.
- A premium Indian heritage visual system.
- Landing, artisan directory, artisan profiles, KalaCollab explainer, KalaPassport, CraftFit, feasibility and authenticated workspaces.
- A working 2D SVG Studio with layers, drag/resize/rotate, undo/redo, saved comparison, immutable version history, restore, brief export and design export.
- Deterministic CraftFit, Craft DNA, feasibility and KalaCollab dependency logic.
- Server-side role and ownership checks.
- A project state machine and payment separation.
- A seven-scene `/demo` walkthrough.
- Admin sample-artisan creation, but no full demo dataset.

## What changed

### Demo data foundation

- Added `demoEntities` provenance table with indexes by seed, seed/label and seed/type.
- Added optional `demoLabel` fields to requests, quotes, projects, plans, tasks, reviews, passports, payment orders, KalaProof events and feasibility records.
- Added `src/convex/demoData.ts` with fictional artisan, customer, brief and portfolio definitions plus original generated SVG artwork.
- Added `src/convex/demo.ts` with:
  - `seedDemo` and `resetDemo`.
  - CLI-only `seed` and `reset` internal mutations.
  - Admin-protected `seedAsAdmin` and `resetAsAdmin`.
  - Admin-only `adminStatus`.
  - Public `showcase` query.
- Seed writes no auth accounts for demo identities and no live payment records.
- Every seeded row is tracked for reset.
- Re-running seed is idempotent.

### Population and marketplace visibility

- Seeded 22 artisan profiles, 52 portfolio items, 8 customer profiles and 20 requests.
- Seeded 24 quotes, 15 projects, 20 reviews and 104 KalaProof events.
- Seeded 3 collaboration plans and 9 tasks.
- Seeded 5 public passports.
- Seeded 15 sandbox payment orders, 14 payment transactions and 10 payouts.
- Seeded 4 conversations, 16 messages, 14 notifications and 6 feasibility reviews.
- Added external portfolio URL fallback so seeded artwork appears on directory cards and public profiles.
- Recalculated profile ratings and completed-project counts from seeded records.

### Public demo experience

- Added `/demo/live` with:
  - Marketplace counters labelled as sample figures.
  - Artisan spotlight cards linked to real profiles.
  - A read-only 3D jacket preview.
  - Persisted KalaCollab stages with dependencies and status.
  - Public passport links.
  - An artisan workspace preview derived from seeded projects, payouts, reviews and live CraftFit scores.
- Added a link from `/demo` to `/demo/live`.
- Added sample-data labelling to the public passport certificate.
- No private messages, customer identity or payment identifiers are exposed on the public showcase.

### 3D Studio

- Added `three`, `@react-three/fiber` and `@react-three/drei`.
- Added `Garment3DPreview` as a lazy-loaded component.
- Added procedural 3D jacket, T-shirt and tote meshes.
- Motifs are projected as surface decals using the existing canvas layer positions, sizes, rotations and colours.
- Added fabric colour changes, orbit rotation, zoom, front/back views, reset and contact shadows.
- Added WebGL detection and a labelled 2D fallback.
- Added 3D error handling through the existing Studio error boundary.
- Added a 2D/3D toggle. Products without a 3D mesh do not show a 3D button.
- Added the T-shirt to `ProductTypeId`, the product catalogue and the 2D garment renderer.
- Added a protected `/studio` route and public navigation entry. Existing `/creations` and `/studio/:designId` routes remain.
- The 3D view reads the existing `CanvasState`; no second design format was introduced.

### Admin operation

- Added a Phase 3 demo panel to the admin overview with:
  - Seed full demo marketplace.
  - Reset demo records.
  - Current seeded counts.
- Both actions remain server-checked for admin access.
- The reset action asks for confirmation and deletes only entities tracked under `kalakari-phase3-v1`.

## Functional status

### Fully implemented and automatically checked

- Demo seed, reset and idempotency.
- `demoEntities` provenance and reset isolation by tracked IDs.
- Public demo showcase query and page.
- Populated artisan directory and public profiles.
- Seeded KalaCollab records and public stage rendering.
- Seeded public passports and public passport query.
- External portfolio artwork fallback.
- 2D Studio preserved and typechecked.
- 3D component compiled and included as a separate lazy production chunk.
- Admin seed/reset controls wired to server-checked mutations.
- Public sample-data label on passports.

### Implemented, with runtime visual verification outstanding

- Actual WebGL rendering and surface decal appearance.
- Orbit, zoom and front/back controls on real devices.
- The public read-only 3D preview on `/demo/live`.
- Responsive behaviour at 1440 px, 768 px and 375 px.

No browser automation or screenshot tooling was available in this session. These are not reported as visually verified.

### Partially implemented

- **Direct 3D motif placement:** not implemented. Motifs are moved, resized and rotated in the 2D editor, and the 3D surface updates from that state. This is explicitly communicated in the Studio.
- **Demo dashboards:** the public demo has a read-only artisan workspace preview. It does not sign a judge into a seeded customer or artisan account. Real dashboards remain protected and use the user's own records.
- **KalaCollab interaction:** the three demo plans are persisted and rendered publicly. Accepting invitations, approving plans and submitting work still require genuine authenticated customers/artisans, because no demo auth accounts were provisioned.
- **Photography:** portfolio visuals are original generated SVG illustrations, not licensed photographs. They are always labelled and never presented as evidence of real work.

### Not implemented

- Uploaded photographic portfolio assets or licensed GLB garment files.
- A finance seed with live Razorpay identifiers or signatures.
- Browser end-to-end tests.
- A production deployment seed executed globally.
- Admin or demo credentials in documentation.

## Demo records created

The seed produces 391 tracked rows:

| Entity | Count |
| --- | ---: |
| Artisan users | 22 |
| Artisan profiles | 22 |
| Customer users | 8 |
| Customer profiles | 8 |
| Portfolio items | 52 |
| Requests | 20 |
| Quotations | 24 |
| Projects | 15 |
| Reviews | 20 |
| Collaboration plans | 3 |
| Collaboration tasks | 9 |
| Passports | 5 |
| Payment orders | 15 |
| Payment transactions | 14 |
| Payouts | 10 |
| Feasibility reviews | 6 |
| Conversations | 4 |
| Messages | 16 |
| Notifications | 14 |
| KalaProof events | 104 |

Payment records use `provider: "sandbox"` and `mode: "sandbox"`. They are not live transfers.

## Seeding and resetting

CLI:

```bash
bunx convex run demo:seed
bunx convex run demo:reset
```

Admin-protected public functions:

- `api.demo.seedAsAdmin`
- `api.demo.resetAsAdmin`
- `api.demo.adminStatus`

A repeated seed returns already-seeded and creates no duplicates.

The seed was run, then reset and rerun during verification:

- First seed: 391 records.
- Reset: 391 tracked records removed.
- Second seed: 391 records recreated.
- Repeated seed: no records created.

No genuine user records were targeted by the reset.

## Exact routes

Public:

- `/` — landing page.
- `/demo` — seven-scene walkthrough.
- `/demo/live` — populated demo marketplace, 3D preview, KalaCollab stages, artisan preview and passports.
- `/explore-artisans` — populated directory.
- `/artisans/:artisanId` — public profile.
- `/kalacollab` — product explanation.
- `/passport/demo-passport-1` through `/passport/demo-passport-5` — sample public passports.

Protected:

- `/studio` — Design Studio product chooser.
- `/studio/:designId` — editor with 2D/3D toggle.
- `/creations` — saved designs.
- `/customer/*`, `/artisan/*`, `/admin/*` — existing authenticated workflows.

Access instructions:

- No demo login is provided. Create a real account through `/auth` to test write actions.
- Demo artisan/customer identities intentionally have no auth accounts.
- Admin seed/reset controls are visible only to an existing authenticated admin. No admin credentials are documented.
- The public demo can be inspected without signing in and cannot write data.

## Verification executed

### Convex

```bash
bunx convex dev --once
```

Result: passed. Functions deployed to the development deployment.

### TypeScript

```bash
bunx tsc -b --noEmit
```

Result: passed with no errors.

### Lint

```bash
bun run lint
```

Result: passed with 0 errors and 22 existing warnings, primarily Fast Refresh export warnings.

### Tests

```bash
bun test
```

Result:

- 25 passed.
- 0 failed.
- 366 expectations.
- 4 test files.

The existing engine, state/access and KalaCollab tests remain green. A new `tests/demo-data.test.ts` checks artisan count and uniqueness, portfolio volume, request/project scenario coherence, original artwork generation and sample-data labelling. No browser or 3D rendering tests were added.

### Production build

```bash
bun run build
```

Result: passed.

- 3032 modules transformed.
- Main application chunk: approximately 953 kB raw / 267 kB gzip.
- Studio chunk: approximately 49 kB raw / 14 kB gzip.
- Lazy 3D chunk: approximately 970 kB raw / 262 kB gzip.
- The 3D chunk is not loaded by the homepage.

### HTTP smoke checks

The following returned HTTP 200:

- `/`
- `/demo`
- `/demo/live`
- `/explore-artisans`
- `/studio`
- `/creations`
- `/kalacollab`
- `/passport/demo-passport-1`

This confirms the routes are served. It does not prove the React page rendered correctly or that WebGL initialized.

### Data checks

- `demo:showcase` returned 22 artisan profiles, 52 portfolio items, 3 plans with 3 stages each, and 5 passports.
- The artisan workspace preview returned real derived values: completed and active projects, confirmed sandbox earnings, pending quotes, invitations, review count, portfolio count and CraftFit scores for eligible open briefs.
- `passport:publicGet` for `demo-passport-1` returned a completed project record with artisan attribution, techniques, materials, milestones and privacy text.
- Seed idempotency returned already-seeded on the second run.
- Reset and reseed restored the same 391-record dataset.
- Calling the public `demo:seedAsAdmin` wrapper without a session returned `UNAUTHENTICATED: sign in to continue.` This confirms the admin wrapper is server-checked rather than relying on the UI.

## Remaining limitations

- No browser screenshot, visual regression, responsive visual review or real WebGL render was performed.
- No Playwright or other browser E2E suite was available.
- Direct 3D motif dragging is not implemented; 2D placement is the source of truth.
- The 3D chunk is large. It is lazy-loaded, but low-end mobile performance remains unmeasured.
- Demo identity login is not provisioned, so authenticated collaboration and dashboard testing require a genuine account.
- Seed data is intended for the development/demo deployment. It should not be run globally against a production database shared with real users.
- Portfolio artwork is generated SVG art, not licensed photography.
- No GLB asset pipeline, texture compression pipeline or LOD system was added.
- The public demo showcases data-backed collaboration stages, but does not let a judge approve them without authentication.

## Files added or materially changed

- `src/convex/demo.ts`
- `src/convex/demoData.ts`
- `src/convex/schema.ts`
- `src/convex/artisans.ts`
- `src/convex/lib/serialise.ts`
- `src/convex/passport.ts`
- `src/components/studio/Garment3DPreview.tsx`
- `src/components/art/garments.tsx`
- `src/pages/Studio.tsx`
- `src/pages/DemoLive.tsx`
- `src/pages/Demo.tsx`
- `src/pages/Creations.tsx`
- `src/pages/KalaPassport.tsx`
- `src/pages/admin/AdminPages.tsx`
- `src/components/public/PublicShell.tsx`
- `src/main.tsx`
- `src/lib/crafts.ts`
- `package.json` and lockfile for the 3D dependencies

## Honest readiness statement

The demo environment is now populated and the public walkthrough can show the marketplace, artisan profiles, KalaCollab records, sample passports and an artisan business preview without signing in. The 3D viewer is a genuine WebGL implementation and is isolated behind a lazy chunk with a fallback.

The application is not fully browser-verified in this session. The 3D interaction, responsive layouts and authenticated collaboration flows should be checked in a real browser before a live judging session.
