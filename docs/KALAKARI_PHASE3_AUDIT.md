# Kalakari Phase 3 Audit

Date: 13 November 2026

## 1. Scope and method

This audit was made before the Phase 3 changes were implemented. It covers the repository structure, public and authenticated routes, the visual system, Convex schema and queries, the existing Studio, demo capabilities, access controls and payment boundaries.

The goal was to preserve the working marketplace architecture and improve the experience without replacing real backend operations with static simulations.

## 2. Existing architecture

- React 19 + TypeScript + Vite 7.
- Tailwind CSS v4 with the existing KALकारी token system.
- Convex for the database, queries, mutations, actions and auth.
- Convex Auth with role-aware customer, artisan and admin areas.
- shadcn/Radix UI primitives, Lucide icons and Framer Motion.
- Existing deterministic engines for Craft DNA, CraftFit matching, craft feasibility and KalaCollab decomposition.
- Existing project state machine, quotation versioning, sandbox/live payment separation, KalaProof events and KalaPassport privacy.
- Bun is the package manager.

## 3. Route inventory before Phase 3

Public:

- `/` — editorial landing page.
- `/demo` — seven-scene judged walkthrough using curated scenario data.
- `/how-it-works`, `/crafts`, `/trust-and-safety`, `/for-artisans`, `/why-kalkaari`, `/kala-rights`.
- `/explore-artisans` — artisan directory and filters.
- `/artisans/:artisanId` — public artisan profile with portfolio and reviews.
- `/kalacollab` — public explanation of multi-artisan production.
- `/passport/:token` — public KalaPassport, only when explicitly enabled.
- `/auth`.

Authenticated customer:

- `/customer/dashboard`, `/customer/create-request`, `/customer/requests`, `/customer/requests/:requestId`.
- `/customer/quotes`, `/customer/projects`, `/customer/projects/:projectId`.
- `/customer/payments`, `/customer/messages`.

Authenticated artisan:

- `/artisan/onboarding`, `/artisan/dashboard`, `/artisan/jobs`, `/artisan/jobs/:requestId`.
- `/artisan/quotes`, `/artisan/collaborations`, `/artisan/projects`, `/artisan/projects/:projectId`.
- `/artisan/portfolio`, `/artisan/availability`, `/artisan/earnings`, `/artisan/messages`.

Shared and admin:

- `/notifications`, `/settings`, `/kalasaathi`.
- `/projects/:projectId/proof`, `/projects/:projectId/passport`, `/projects/:projectId/dispute`.
- `/admin/dashboard`, `/admin/verifications`, `/admin/reports`, `/admin/disputes`, `/admin/transactions`, `/admin/users`, `/admin/audit`.
- Legacy `/kalavision`, `/creations`, `/studio/:designId`, `/legacy/dashboard`.

## 4. Visual system

The existing theme already used the correct heritage palette:

- Warm ivory `#F7F2E8`
- Deep terracotta `#7A302A`
- Antique gold `#D8A65B`
- Forest green `#34483E`
- Charcoal `#28231F`
- Soft sand `#E9DFD0`

Typography and editorial components were already in place. The Phase 3 work extends this system rather than replacing it. The design risks were not the palette; they were empty data, overly static demo surfaces and the Studio being described as legacy.

## 5. Existing feature audit

### CraftFit and matching

- Deterministic scoring already existed in `src/convex/lib/matching.ts`.
- Dimensions: skills, product and material, availability, budget, location and delivery, portfolio relevance, with a bounded newcomer boost.
- Scores and reasons were already explainable and were not fabricated in the UI.
- The seed needed enough artisans with varied crafts, availability and pricing to make the results meaningful.

### KalaCollab

- Real `collaborationPlans` and `collaborationTasks` tables already existed.
- The server enforced combined budget, dependency order, all-dependency approval and participant permissions.
- Customer and artisan interaction screens existed.
- The public `/kalacollab` page was a static explanation, not a data-backed showcase.
- There were no seeded multi-artisan scenarios.

### KalaPassport

- Passport generation was customer-only and limited to completed projects.
- Public sharing required an explicit `publicEnabled` flag.
- Public output excluded conversations, addresses, payment identifiers, private files and customer identity.
- There were no completed demo projects to issue a passport for.
- The public record did not surface the demo provenance label.

### Artisan dashboard

- The dashboard and earnings pages used real Convex queries.
- Without seeded projects, payouts, quotes and reviews, the pages could not demonstrate a working business view.
- There was no safe way for a judge to inspect an artisan workspace without being a genuine account owner.

### Craft feasibility

- The rule-based feasibility engine and artisan review records existed.
- There were no feasibility reviews in the live data.

## 6. Studio audit

Before Phase 3:

- The Studio was a working 2D SVG placement editor at `/studio/:designId`.
- It supported product selection, fabric colour, patterns, motif library, text, layer ordering, drag, resize, rotate, undo/redo, save, immutable version history, restore, saved comparison, brief export and design export.
- Designs and immutable `designVersions` were persisted in Convex.
- The product set was jacket, kurta, tote, cushion and stole.
- There was no T-shirt, no Three.js, no React Three Fiber and no 3D asset pipeline.
- The route was protected and was described in the router as a legacy studio, so it was not part of marketplace navigation.
- A working 2D editor had to be preserved. Replacing it with a purely visual 3D scene would have broken placement editing and save continuity.

## 7. Data state before Phase 3

The live development deployment contained:

- 2 users.
- 1 artisan profile.
- 1 open customer request.
- 0 projects.
- 0 collaboration plans.
- 0 passports.
- No meaningful portfolio, quote, review, payment or notification population.

This was the primary reason the application felt empty. The problem was data, not page count.

## 8. Empty-state and UX findings

- `/explore-artisans` could show only one real artisan.
- Artisan profiles had no meaningful portfolio or review depth.
- Customer and artisan dashboards had no orders, quotes, payouts or invitations.
- KalaCollab had no persisted scenarios to explain itself.
- KalaPassport had no eligible completed project.
- `/demo` was an excellent explanatory walkthrough but did not link to a populated live marketplace.
- The Studio existed but was hidden from the main navigation.
- The public artisan card preview used only uploaded storage images and did not fall back to an external portfolio URL. Seeded local artwork would therefore have appeared blank.
- The public passport record did not identify sample data.

## 9. Demo and seed capabilities before Phase 3

- The admin area could create labelled sample artisan profiles.
- `/demo` contained curated static scenario data.
- There was no full marketplace seed, no demo provenance table, no reset operation and no way to populate projects, plans, reviews or passports without touching genuine records.
- There was no demo admin account, and no safe way to impersonate one.

## 10. Security and payment boundaries

The following boundaries were already present and had to be preserved:

- Server-side role and ownership checks in `src/convex/lib/access.ts`.
- Admin-only oversight functions.
- Project access limited to customer, artisan and admin reviewers.
- Customer-only passport creation and public-share control.
- Artisan-only contribution actions.
- KalaCollab dependency and budget enforcement on the server.
- Payment state transitions that require confirmed or settled payment.
- Sandbox and live payment records kept distinct.
- No client-side payment success state.

The Phase 3 seed therefore had to:

- Use CLI-only internal mutations and admin-protected public wrappers.
- Create no auth accounts for demo identities.
- Create no live payment records.
- Mark sandbox records explicitly.
- Track every inserted entity for reset.
- Never modify existing genuine users.

## 11. 3D feasibility decision

The repository had no licensed GLB/GLTF garment assets. Downloading stock models would introduce licensing and visual-quality risk. The practical solution was:

- Add Three.js, React Three Fiber and drei.
- Use original procedural meshes for jacket, T-shirt and tote.
- Attach motif previews to the garment surface using surface decals.
- Keep the existing 2D editor for precise placement, text and products without a 3D model.
- Lazy-load the 3D chunk so the homepage and marketplace do not download the WebGL engine.
- Check WebGL availability and provide a labelled 2D fallback.
- Make the 3D scene available from the Studio and as a public read-only preview.

## 12. What was implemented after the audit

- Full Phase 3 demo seed with idempotency and tracked reset.
- 22 fictional artisans, 52 portfolio pieces and 8 fictional customers.
- 20 requests, 24 quotes, 15 projects, 20 reviews, 3 KalaCollab scenarios and 5 public sample passports.
- Sandbox payment, transaction and payout records.
- Conversations, messages, notifications and feasibility reviews.
- Public `/demo/live` showcase backed by real seeded queries.
- A read-only artisan workspace preview with real calculated CraftFit scores and seeded earnings.
- Existing 2D Studio preserved and extended with a lazy 3D jacket/T-shirt/tote preview.
- New T-shirt product in the product taxonomy and 2D renderer.
- Studio added to the public navigation; `/studio` protected entry point added.
- Public sample passport provenance label.
- External portfolio URL fallback for seeded artwork.

## 13. Remaining gaps

- No licensed photographic or GLB assets were added. Portfolio artwork is original generated SVG art and is labelled as demo data.
- Direct 3D motif dragging is not implemented. Placement remains in the 2D editor, with the 3D view updating immediately.
- Demo artisan identities have no login accounts, so role-specific actions still require a genuine signed-in account.
- No browser automation was available to verify visual rendering, responsive breakpoints or WebGL output.
- Automated browser end-to-end tests were not run.

These limitations are repeated in the Phase 3 report and are not presented as completed functionality.
