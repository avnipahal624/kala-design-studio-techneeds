# KalaPassport Verification

## What KalaPassport is

KalaPassport remains a platform-recorded provenance document built from KalaProof, the approved concept, the artisan profile and the brief. It is not an independent authenticity certificate, appraisal, legal title, GI certificate or blockchain record.

## Evidence

The passport now supports structured evidence:

- craft tradition;
- heritage region (the documented regional association of a tradition);
- actual production city/region, kept private by default;
- materials and origin, only when known;
- participant credits from the existing project/artisan record;
- dated KalaProof milestones;
- private supporting images;
- a public-safe evidence summary;
- a private reviewer note.

Heritage region and production location are separate fields in the data model and on the certificate. A tradition's regional association is never presented as the place where the specific item was made.

## Review statuses

| Status | Meaning |
| --- | --- |
| `unreviewed` | No evidence review has been completed. |
| `evidence_submitted` | Evidence exists but has not been reviewed. |
| `under_review` | A named administrator has opened the case. |
| `verified` | A named reviewer recorded a decision, scope, date and limitations. |
| `rejected` | The reviewer declined the evidence; the reason is recorded. |
| `revoked` | A previous verification was withdrawn; public sharing stops. |

The platform does not issue a verified badge automatically. The `verified` status is only written by `passport.decideReview`, which requires admin authorization and an open review with a recorded scope.

## Reviewer workflow

1. Project participant submits evidence with at least one private supporting file.
2. Admin opens `/admin/verifications`; the passport review section lists submitted cases.
3. Admin opens the passport's private review workspace, inspects the evidence and starts a review with a scope.
4. Admin records `verified` or `rejected` with a review basis and limitations.
5. A reviewer may later revoke a verified passport with a reason.
6. Every step is written to `passportReviews` and the admin audit log.

The reviewer UI lives on the private passport page, accessible to an authenticated admin. The review queue is admin-only.

## Privacy controls

The customer controls:

- whether production location appears in the public passport;
- whether artisan names appear;
- whether the public summary is enabled;
- revoking the current QR/link by rotating the share token.

Default public behavior: production location off, artisan names on. Exact addresses, conversations, payment identifiers, private evidence files and customer identity are never included.

## QR and revocation

The private certificate renders a QR code with `qrcode.react` pointing to the current share URL. "Revoke link & rotate" replaces the token and turns sharing off. The old QR and URL then return the standard private/unavailable state rather than showing a revoked certificate.

## Status wording

- Verified: "Reviewed by [named reviewer] on [date]. Scope: …" plus limitations.
- Evidence submitted: explicitly not reviewed.
- Under review: no badge while the review is open.
- Rejected: reason shown.
- Revoked: revocation date and reason shown.
- Unreviewed: recorded provenance only.

No government, GI, NGO or third-party endorsement is invented.

## Demo records

The seed includes five clearly fictional passports:

| Token | Status | Public |
| --- | --- | --- |
| `demo-passport-1` | verified with sample reviewer | yes |
| `demo-passport-2` | evidence submitted | yes |
| `demo-passport-3` | under review | yes |
| `demo-passport-4` | rejected | yes |
| `demo-passport-5` | revoked | no |

All include the sample-data label and state that the review is fictional.

## Limitations

- Review decisions are only as good as the evidence process; the platform does not independently authenticate objects.
- No GI registry or external authority integration exists.
- Evidence files are private but stored in Convex storage; production deployment still needs retention and deletion policy review.
- No browser-based QR/layout test was available in this session.
