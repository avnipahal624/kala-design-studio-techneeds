# Kalakari Phase 3 Demo Data

## What this is

The prepared demo environment contains persisted Convex records, not front-end fixtures. Every record is deliberately fictional and is labelled through `sampleLabel` or `demoLabel` where the table supports it. A dedicated `demoEntities` provenance table tracks every seeded row so the dataset can be reset without deleting genuine user data.

The demo is designed to make the marketplace, public profiles, KalaCollab showcase, artisan workspace preview, projects and KalaPassport useful immediately.

## Seed contents

| Entity | Count |
| --- | ---: |
| Fictional artisan users | 22 |
| Artisan profiles | 22 |
| Fictional customer users | 8 |
| Customer profiles | 8 |
| Portfolio items | 52 |
| Customer requests | 20 |
| Quotations | 24 |
| Projects | 15 |
| Reviews | 20 |
| Collaboration plans | 3 |
| Collaboration tasks | 9 |
| KalaPassports | 5 |
| Sandbox payment orders | 15 |
| Sandbox payment transactions | 14 |
| Sandbox payouts | 10 |
| Feasibility reviews | 6 |
| Conversations | 4 |
| Messages | 16 |
| Notifications | 14 |
| KalaProof events | 104 |
| Total tracked demo entities | 391 |

The counts above are returned by `demo:seed` and can be checked again with `demo:adminStatus` when signed in as an admin.

## Artisans

The 22 fictional makers cover:

- Chikankari and fine embroidery (Lucknow)
- Phulkari (Amritsar)
- Block printing and natural dye (Jaipur, Ahmedabad, Varanasi)
- Madhubani and Pattachitra-inspired painting
- Tailoring and structured garment construction
- Kantha (Kolkata)
- Zardozi and beadwork (Delhi, Hyderabad)
- Kashmiri-inspired wool embroidery (Srinagar)
- Leather craft, bags and footwear (Jodhpur, Mumbai, Bengaluru)
- Crochet and small accessories (Kochi)
- Hand-dyed home textiles (Panipat)
- Woodwork and carved finishing (Jaipur)

Each profile includes:

- A fictional name and demo email.
- Craft specialisation, city and service region.
- Skills, custom skills, products and materials.
- Minimum and maximum project value.
- Availability, turnaround time, weekly capacity and collaboration willingness.
- A fictional portfolio of two or three original SVG artworks.
- A demo label.
- No verification badge (`verificationStatus: "not_submitted"`).

The generated artwork is original abstract textile illustration, not photography. It always renders from an external URL fallback, so there are no broken local image placeholders.

## Customers and briefs

Eight fictional customers in different Indian cities provide preferences for festive clothing, painted sneakers, wedding gifts, Phulkari, block print, Kantha, resort wear and boutique apparel.

The 20 requests include:

- 15 selected briefs linked to accepted quotations and projects.
- 2 open marketplace briefs that can produce meaningful CraftFit results.
- 3 closed briefs reserved for the KalaCollab scenarios.

Budgets, cities, materials, deadlines and required skills are coherent with the intended craft process.

## Quotations and projects

There are 24 quotations:

- 15 accepted quotations, each linked to one project.
- 5 declined alternative quotations for comparison history.
- 4 submitted quotations across the two open briefs.

No request has two accepted quotations.

The 15 projects cover:

- 10 completed projects.
- 1 delivered project.
- 1 in production.
- 1 funded project.
- 1 awaiting payment.
- 1 refunded project with a recorded sandbox refund.

Each project has:

- A customer, artisan, request and accepted quotation.
- A platform fee and net payout snapshot.
- A sandbox payment order.
- A sandbox transaction for paid/refunded records.
- A KalaProof timeline including quotation acceptance, concept approval, payment, production, progress and completion where applicable.
- Payout records for the ten completed projects.

The payment records are explicitly `provider: "sandbox"`, `mode: "sandbox"` and `signatureVerified: false`. They do not claim to be Razorpay-verified or live money transfers.

## KalaCollab scenarios

The three persisted plans are:

1. **In progress — The Heirloom Jacket**
   - Tailor: base construction, approved.
   - Embroiderer: Kantha front panels, in progress.
   - Fabric painter: terracotta border, accepted and dependent on both previous stages.
   - Plan status: `in_production`.

2. **Awaiting approval — Monsoon Story Saree**
   - Dyer, block printer and finishing artisan.
   - All three tasks accepted.
   - Plan status: `ready`, waiting for customer approval.
   - The customer has not pre-approved the plan.

3. **Completed — Wedding Zardozi Jacket**
   - Tailor, zardozi artisan and beadworker.
   - All three contributions approved.
   - Plan status: `completed`.

The task dependencies are real schema data, and the public showcase derives its stages directly from these records.

## Reviews

Twenty reviews are linked to completed projects:

- Ten customer reviews of artisans, with a 4/5 rating mix.
- Ten artisan reviews of customers.

Artisan profile rating sums and counts are recalculated from the seeded customer reviews. This means an artisan with no completed demo project honestly shows no review data rather than invented traction.

## KalaPassports

Five completed projects have public sample passports:

- `demo-passport-1`
- `demo-passport-2`
- `demo-passport-3`
- `demo-passport-4`
- `demo-passport-5`

They are explicitly published for demo inspection. The certificate displays the sample-data label. They do not claim independent authentication, appraisal, insurance or blockchain verification.

## Messages and notifications

Four completed projects have private demo conversations with sixteen messages. They are attached to legitimate demo participants and are not exposed on public routes.

Fourteen notifications populate demo artisan and customer inboxes. Some link to collaboration or passport routes.

## Provenance and isolation

- `demoEntities` records the seed key, entity type, entity ID and optional label for every demo row.
- `sampleLabel` is used on artisan profiles and portfolio items.
- `demoLabel` is used on requests, quotes, projects, plans, tasks, reviews, passports, payment orders, KalaProof events, feasibility records and messages where supported.
- Demo user emails use `@kalakari.example`.
- Demo users have no auth accounts and cannot be used to sign in.
- The public showcase does not expose customer identities, private messages, addresses or payment identifiers.

## Seed and reset

The supported commands are:

```bash
# Seed once. Re-running returns alreadySeeded and creates no duplicates.
bunx convex run demo:seed

# Remove only the tracked Phase 3 demo rows.
bunx convex run demo:reset
```

The public wrappers are:

- `api.demo.seedAsAdmin`
- `api.demo.resetAsAdmin`
- `api.demo.adminStatus`

They all check for an authenticated admin on the server. The internal `demo:seed` and `demo:reset` mutations are intended for a development or controlled demo deployment through the Convex CLI.

The admin dashboard also exposes the seed and reset controls in the Phase 3 demo panel. The reset action asks for confirmation.

## Idempotency

`seedDemo` checks for any existing `demoEntities` row with the Phase 3 seed key before writing. A repeated seed returns:

```json
{
  "seeded": false,
  "reason": "Demo dataset already present. Reset first to rebuild it."
}
```

Reset deletes children before parents in a fixed order and then removes the `demoEntities` rows. It does not delete users or records that are not tracked under `kalakari-phase3-v1`.

## What is not included

- No real customer personal information.
- No live Razorpay orders or signatures.
- No real payout or bank transfer.
- No admin privileges for demo users.
- No demo login credentials.
- No external stock photography or licensed GLB files.
