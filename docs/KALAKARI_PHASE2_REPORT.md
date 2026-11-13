# KALAKARI — Phase 2 Validation Report

**Date:** 13 November 2026  
**Live URL:** https://kalakari.freebuff.app/  
**Scope:** Polish, validate and harden the existing Kalakari implementation. No rebuild and no replacement of Convex data with mocks.

## 1. Existing features audited

- Authentication (email OTP and guest), session handling and role-aware landing.
- Customer brief creation, product references, Craft DNA, KalaVision text/rule fallback and feasibility.
- Artisan CraftFit profile, portfolio, availability and public directory.
- Explainable CraftFit matching, invitations and artisan comparison.
- Quote submission, revision, withdrawal, decline, expiry and acceptance.
- Project state machine, concept approval, revisions, payment state, production, delivery and completion.
- Sandbox payment order and idempotent confirmation; existing provider boundary.
- KalaProof timeline and private file resolution.
- Messaging, notifications, reviews and disputes.
- Admin verification, reports, disputes, transactions, users, audit and first-admin bootstrap.
- KalaCollab decomposition, assignment, invitations, acceptance, approval, dependencies, task progress and cancellation.
- KalaPassport private/public projection, QR display and sharing controls.
- Homepage, Studio, artisan marketplace, dashboards, responsive navigation and reduced-motion styling.
- `/demo`, public explainer pages and admin sample-artisan seeding.

## 2. Bugs discovered

| Severity | Finding |
|---|---|
| High | KalaPassport public sharing could be changed by an artisan or admin, not only the customer who owns the record. |
| High | KalaCollab had no aggregate budget check; accepted task amounts could exceed the brief budget. |
| High | A finishing task depended on only the last surface task; it could start while other surface work was still incomplete. |
| Medium | Auth without a `returnTo` always fell back to `/customer/dashboard`, including for artisan/admin roles. |
| Medium | Reassigning an in-flight invited task could leave the plan in `awaiting_artisans` after the task returned to `proposed`, with no way to dispatch it. |
| Medium | “Refresh matches” could re-offer a declined task to the same artisan who declined it. |
| Medium | Cancelling a plan did not notify invited/accepted/in-progress artisans. |
| Medium | The demo stopped before KalaCollab and KalaPassport, and used “AI connects” framing even though matching is rule-based. |
| Medium | An artisan opening a completed project could see passport creation/sharing controls that would fail server-side. |
| Low | KalaCollab finishing dependency was described with a single title in the customer view, hiding multiple prerequisites. |

## 3. Bugs fixed

### Passport ownership

`src/convex/passport.ts` now permits only the project customer to create a passport or change public sharing. Artisans and admins retain read access. `src/pages/KalaPassport.tsx` hides controls they cannot use and explains that the customer controls sharing.

### KalaCollab budget safety

- `respondTask` rejects an acceptance that would push accepted task amounts above the plan budget.
- `approvePlan` re-checks the accepted total on the server.
- The customer panel shows an over-budget warning and disables approval.

### Dependency correctness

- Added `dependsOnPositions` to collaboration tasks.
- Surface tasks wait for construction.
- Finishing waits for every construction and surface task.
- `startTask` checks every dependency, not only one.
- The customer panel lists all prerequisites.

### Reassignment and decline handling

- Reassignment returns an awaiting plan to `draft`, making the updated proposal dispatchable.
- The previous artisan receives a reassignment notification.
- Declined tasks exclude the declining artisan during “Refresh matches.”
- The plan's next status is calculated by a tested helper.

### Cancellation

- Invited, accepted and in-progress artisans receive a cancellation notification.
- Cancellation is recorded in the audit log.
- After cancellation, `submitTask` and `approveTask` reject further contributions or approvals, and the customer approval control is hidden.

### Auth fallback

`/auth` now chooses the default destination from the authenticated role. Explicit `returnTo` paths still win.

### Demo accuracy

- `/demo` now has seven scenes: homepage, brief, matching, quote, KalaProof, KalaCollab and KalaPassport.
- The demo length label is 3–4 minutes.
- “AI connects” was replaced with “CraftFit connects.”
- All illustrative screens remain labelled as demonstration data.

## 4. UI/UX improvements

- Budget-overrun feedback appears next to the KalaCollab plan total.
- Dependency labels show the full prerequisite chain.
- Passport views now distinguish “customer controls sharing” from “artisan can view.”
- Artisan/admin users get an explanatory state instead of a button that returns an authorization error.
- Demo navigation now covers the innovation story and the provenance story.
- Existing visual system was preserved: warm ivory, terracotta, gold, forest, charcoal, Cormorant Garamond and DM Sans.
- Existing keyboard/focus styles, reduced-motion media query, mobile sheet navigation and route loading states were retained.

No visual browser session was available. The UI is code-reviewed and builds, but the 375/768/1440 rendering and keyboard pass remain unverified.

## 5. Security improvements

- Passport creation and public sharing are now customer-only and server-enforced.
- KalaCollab acceptance and approval enforce aggregate budget limits.
- Task start enforces all declared dependencies on the server.
- Reassignment invalidates the prior invitation and notifies the previous assignee.
- Cancellation notifies affected makers.
- Existing controls remain intact: project participation checks, quote ownership, payment amount/idempotency checks, project transition validation, private storage resolution and admin role checks.

## 6. Automated test results

Command: `bun test`

```
20 pass
0 fail
50 expect() calls
3 files
```

Coverage added:

- Craft DNA skill derivation for a painted sneaker.
- CraftFit eligibility, six-dimension breakdown and minimum-budget blocking.
- Feasibility likely/needs-review/impractical outcomes, realistic buffer, missing materials and incompatible craft/product combinations.
- Project transition rejection and valid lifecycle path.
- Payment gate for production.
- Project access for customer, artisan, outsider and admin.
- Cross-user owned-resource access returning a non-leaking not-found error.
- KalaCollab ordering, finishing dependency on all prior tasks, de-duplication and empty-skill fallback.
- Plan readiness only when every task is accepted.
- Aggregate budget guard.
- Dependency approval guard.

Not run: Playwright or browser end-to-end tests. Playwright is not installed in the project, and no browser automation surface was available. No live project/payment/KalaPassport flow was exercised because the database has no completed project.

## 7. Build, TypeScript and lint results

| Check | Result |
|---|---|
| `bunx convex dev --once` | Passed — Convex functions ready |
| `bunx tsc -b --noEmit` | Passed — no output |
| `bun run lint` | Passed — 0 errors, 22 pre-existing/UI warnings |
| `bun run build` | Passed — 2,466 modules transformed |
| Public route HTTP checks | `/`, `/demo`, `/kalacollab`, `/explore-artisans`, `/passport/demo-token`, `/artisan/collaborations`, `/customer/create-request` all returned 200 |

The build includes the new demo scenes and passport/collaboration changes. HTTP 200 confirms routing, not rendered visual correctness.

## 8. Remaining limitations

1. **No live multi-artisan dataset.** The live database has 1 artisan profile; a real three-artisan acceptance flow cannot be demonstrated without creating authenticated accounts and eligible profiles.
2. **No completed project.** KalaPassport cannot be generated from live data yet. The `/demo` passport is illustrative.
3. **No task evidence attachments.** KalaCollab supports completion notes, not private file evidence.
4. **No multi-artisan payouts.** Task amounts are proposals. No split, transfer or release exists.
5. **No vision AI.** Image handling measures local colour/edge signals; no model understands the object. The UI says so.
6. **No browser-based mobile, keyboard or penetration test.** These remain recommendations.
7. **Artisan routes are auth-protected but not profile-guarded on the client.** Server queries still prevent private data access.
8. **Route-local error cards are missing** for a few Convex query failures; the root error boundary catches them.
9. **KalaCollab plan approval does not itself fund or start production.** This is deliberate; existing project payment/concept controls remain separate.
10. **Static homepage/demo illustrations are labelled illustrations**, not real artisan photography or live records.

## 9. Demo readiness checklist

- [x] Landing page and public routes load.
- [x] `/demo` contains the complete seven-scene story.
- [x] Every demo scene is labelled as demonstration data.
- [x] KalaCollab scene explains explicit artisan acceptance, customer approval, dependencies and no payouts.
- [x] KalaPassport scene explains recorded history, customer-controlled sharing and privacy exclusions.
- [x] The demo avoids “AI artwork” and “AI image understanding” claims.
- [x] The demo can be reset by refreshing; it performs no writes.
- [x] Live customer brief and single-artisan flow remain available.
- [ ] Three authenticated artisans are seeded for a live KalaCollab run.
- [ ] A completed live project exists for a live passport token.
- [x] Fallback script documented in `docs/KALAKARI_DEMO_GUIDE.md`.
- [ ] Browser-level rehearsal at 375/768/1440 px completed.

## 10. Recommended next steps

1. Create a dedicated sandbox with three authenticated artisan accounts and one completed project, plus a repeatable reset/seed procedure.
2. Add private task evidence attachments to KalaCollab using the existing `fileRef` and access patterns.
3. Add Playwright smoke tests for auth, brief creation, KalaCollab approval guards and passport visibility at mobile/tablet/desktop widths.
4. Add a frontend role/profile guard for artisan-only routes.
5. Add route-local error and retry states for collaboration and passport queries.
6. Only design automatic payouts after recipient verification, refunds, reconciliation and provider-supported transfer rules are implemented and tested.

## Files changed in this phase

- `src/convex/passport.ts` — customer-only passport creation/sharing.
- `src/convex/collaboration.ts` — budget guards, dependency array, reassignment, cancellation notices.
- `src/convex/schema.ts` — collaboration dependency array.
- `src/convex/lib/collaboration.ts` — tested plan-state and budget helpers.
- `src/pages/Auth.tsx` — role-aware fallback.
- `src/main.tsx` — removed the fixed customer auth fallback.
- `src/components/marketplace/KalaCollabPanel.tsx` — over-budget warning, all-dependency display, approval guard.
- `src/pages/KalaPassport.tsx` — customer-controlled sharing UI.
- `src/pages/Demo.tsx` — seven-scene demo and corrected claims.
- `tests/engines.test.ts`, `tests/state-access.test.ts`, `tests/collaboration.test.ts` — expanded coverage.
- `docs/KALAKARI_PHASE2_AUDIT.md`, `docs/KALAKARI_DEMO_GUIDE.md`, `docs/KALAKARI_PHASE2_REPORT.md`.
