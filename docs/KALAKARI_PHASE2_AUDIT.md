# KALAKARI — Phase 2 Functional Audit

**Audit date:** 13 November 2026  
**Scope:** Existing Vite + React + TypeScript + Convex application, all customer, artisan, admin, KalaCollab, feasibility and KalaPassport surfaces.  
**Method:** Route and link inventory; Convex schema/function review; access-control review; state-machine review; live route checks; live database counts; focused unit tests. No browser automation was available, so visual and click-through claims are limited to what was verified in code and HTTP responses.

## 1. Live environment snapshot

Verified against the dev Convex deployment:

| Record | Count |
|---|---:|
| Users | 2 |
| Artisan profiles | 1 |
| Customer requests | 1 |
| Projects | 0 |
| Collaboration plans | 0 |
| KalaPassports | 0 |

The open request is a footwear/hand-painting brief. There is no completed project and no multi-artisan data. That limits what a live demo can prove and is recorded again in the demo guide.

## 2. Feature inventory

### Fully functional and server-enforced

- Email OTP and guest authentication.
- Server-side user lookup and suspended-account checks.
- Customer request creation, editing/closure, images and Craft DNA derivation.
- CraftFit scoring with six explainable dimensions.
- Artisan profile, portfolio, availability and public profile pages.
- Quote submission, revision, withdrawal, decline, expiry and acceptance.
- Quote acceptance creates one project and declines sibling quotes.
- Project state machine, concept approval, revision rounds, production/delivery transitions.
- Sandbox payment order, explicit sandbox acknowledgement and idempotent confirmation.
- KalaProof event timeline with visibility filtering.
- Messaging, notifications, reviews and disputes.
- Admin role checks, verification review, reports, disputes, transactions, user actions and audit log.
- KalaPassport private/public projection and QR display.
- KalaCollab plan/task persistence, invitations, response, approval, start, submit, approve and cancel.

### Partially implemented or demo-dependent

- **KalaCollab evidence:** tasks support progress notes but not file attachments. Evidence upload remains a recommendation.
- **KalaCollab payments:** amounts are proposals. No multi-artisan payout split, transfer or release exists. This is intentional and disclosed.
- **KalaPassport:** exists only after a completed project. No live completed project exists yet.
- **KalaVision:** text/rule-based analysis and optional text LLM narrative. Images are measured locally as colour/edge signals; no vision model analyses the object.
- **Demo data:** the public `/demo` is a scripted, labelled walkthrough. Admin sample artisans are labelled and cannot log in. They are excluded from matching.
- **Live multi-artisan demo:** requires multiple authenticated artisan accounts, which the current database does not have.

### Placeholder or illustrative surfaces

- Homepage Studio preview, KalaCollab illustrative proposal and the `/demo` screens are explicitly labelled as illustrations.
- `/demo` uses `demoScenario` constants, not live marketplace records.
- Admin “sample artisans” are clearly labelled, have no authentication accounts, no reviews and no verification badge.

No hardcoded data was found inside authenticated customer/artisan project, quote or passport records.

## 3. Defects found and disposition

### High — KalaPassport public sharing was writable by any participant

**Finding:** `passport.setPublic` authorised any project participant, and `passport.ensure` allowed artisan/admin creation. An artisan could publish the customer-owned provenance record without customer consent.

**Fix:** Creation and public sharing are now customer-only on the server. Artisans and admins retain read access. The UI explains that the customer controls sharing. Artisan/admin users no longer see the create/share controls.

### High — KalaCollab could be approved above the customer's budget

**Finding:** Artisans could each propose an amount up to ₹10,00,000; the plan had no aggregate check. The customer could approve a plan whose accepted total exceeded the brief budget.

**Fix:** Acceptance is rejected when accepted task amounts plus the new amount exceed `combinedBudgetInr`. Approval re-checks the accepted total server-side. The customer panel warns and disables approval when the visible total is over budget.

### High — Finishing could start before all surface tasks were approved

**Finding:** `decomposeRequest` gave finishing a dependency on only the last surface task. With embroidery and painting, finishing could start while the earlier surface task was still in progress. `startTask` checked one dependency only.

**Fix:** Tasks now store `dependsOnPositions`. Surface work waits for construction; finishing waits for every construction and surface task. `startTask` checks every dependency server-side. The UI shows all prerequisite titles.

### Medium — Auth fallback always sent users to the customer dashboard

**Finding:** `/auth` was mounted with a fixed `/customer/dashboard` fallback. A user with no `returnTo` could land in the wrong workspace after sign-in.

**Fix:** The fallback now derives from the authenticated role: admin → admin dashboard, artisan → artisan dashboard, otherwise customer. Explicit `returnTo` paths still take precedence.

### Medium — Reassignment could leave a plan stuck in “awaiting artisans”

**Finding:** Reassigning an invited task patched the task back to `proposed` but left the plan in `awaiting_artisans`. `dispatchPlan` only accepts a `draft`, so the new artisan might never receive an invitation. The previous artisan was not notified.

**Fix:** Reassignment while awaiting returns the plan to `draft`, notifies the previous artisan, and requires the customer to explicitly send the updated proposal.

### Medium — Declined tasks could be re-offered to the same artisan

**Finding:** “Refresh matches” excluded only accepted artisans, so a declined task could be re-matched to the person who declined it.

**Fix:** The declined task's current artisan is excluded from that refresh attempt.

### Medium — Cancellation was silent and did not close task mutations

**Finding:** `cancelPlan` changed the plan status but sent no notices. Artisans with accepted or in-progress tasks had to discover the cancellation themselves, and stale task submissions/approvals were still accepted server-side.

**Fix:** Cancellation now notifies invited, accepted and in-progress assignees, records an audit event, and blocks further task submission or approval because those mutations require an approved/in-production plan. The customer approval control is hidden once the plan is cancelled.

### Medium — Demo did not cover the innovation story

**Finding:** The existing `/demo` stopped at KalaProof. It did not show KalaCollab or KalaPassport, and its copy said “AI connects” even though matching is rule-based.

**Fix:** The demo now has seven scenes: homepage, brief, matching, quote, KalaProof, KalaCollab and KalaPassport. The copy now says CraftFit connects and artisans create. Every scene keeps the “preloaded demonstration data” label.

## 4. Navigation and route audit

Checked public routes over HTTP: `/`, `/kalacollab`, `/passport/:token`, `/artisan/collaborations` and `/demo` returned 200. The React routes exist for every static destination found in page and component links. Dynamic destinations use existing IDs from query results.

Remaining navigation risk: protected artisan routes are wrapped by authentication but not by a profile-specific frontend guard. A customer can open an artisan route and see the artisan shell; Convex queries still enforce access and return no private data. This is a UX issue, not a data leak.

## 5. Loading, empty and error states

Present: route-level lazy loading, root error boundary, studio error boundary, skeleton loaders on dashboards and lists, empty states for requests, quotes, projects, collaborations, passports and payments, toast feedback on mutations.

Remaining gap: KalaCollab and passport queries do not have a route-local error card. A backend error would surface through the root boundary. This is a recommendation, not a blocker for the current demo.

## 6. Security and data-integrity review

Verified controls:

- Every sensitive mutation resolves the authenticated user server-side.
- Project access checks customer/artisan/admin participation.
- Design and inspiration ownership checks return a non-leaking `NOT_FOUND`.
- Quote actions verify ownership and request state.
- Quote acceptance is idempotent by quote status and closes the request.
- Payment confirmation verifies amount, order ownership and idempotency key; sandbox mode is explicitly acknowledged.
- Project transitions are explicit; invalid jumps are rejected.
- Passport public output excludes customer identity, messages, addresses, payments and private files.
- Public passport requires an opted-in token and a completed project.
- Admin functions call `requireAdmin`; the first-admin bootstrap requires a verified email and is audited.
- Private storage URLs are resolved only after document-level access checks.

Residual risks and recommendations:

- No browser-level penetration or accessibility test was run.
- KalaCollab has no evidence-file attachments, so “evidence” currently means a completion note.
- There is no multi-artisan payment integration. Do not describe task amounts as paid or split.
- Sample artisan records intentionally have no login. They must not be presented as real supply.
- No rate limiting was added beyond existing KalaVision AI logging.

## 7. Features difficult to demonstrate

1. Full three-artisan acceptance and dependency flow with only one artisan profile.
2. KalaPassport sharing without a completed project.
3. Live payment confirmation without intentionally creating a sandbox project.
4. Image understanding — not implemented; do not claim it.

The scripted `/demo` is the reliable fallback for all four except real live account activity. The demo guide explains which claims are safe.

## 8. Prioritised remaining work

1. Add optional KalaCollab task evidence attachments tied to private storage and project access.
2. Add a seeded, authenticated three-artisan sandbox dataset with a one-click reset.
3. Add Playwright coverage for the customer/artisan journey at 375/768/1440 px.
4. Add route-local query error states for collaboration and passport.
5. Add a frontend role/profile guard for artisan-only routes.
6. Consider a provider-backed payout design only after recipient verification, refunds and reconciliation are specified and tested.
