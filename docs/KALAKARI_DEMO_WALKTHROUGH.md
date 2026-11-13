# Kalakari Demo Walkthrough

## Before you start

The prepared demo dataset is already seeded in the development deployment. It is fictional sample data. It is not evidence of real users, real verification or real payments.

Two useful starting points:

- `/demo` — the curated seven-scene judge walkthrough explaining the product logic.
- `/demo/live` — the populated marketplace, KalaCollab stages, 3D product preview, artisan workspace preview and public passports.

Do not use `/demo` and `/demo/live` as evidence of platform traction. Use them to inspect the product mechanics and the prepared dataset.

## Five-minute route

### 1. Open the populated demo

Go to `/demo/live`.

You should see:

- 22 fictional artisan profiles.
- 52 portfolio pieces.
- 15 projects.
- 20 sample reviews.
- A real 3D jacket preview.
- Three persisted KalaCollab scenarios.
- Five public sample passports.
- A read-only artisan workspace preview with calculated CraftFit opportunities.

The counters come from persisted demo records and are labelled as sample figures.

### 2. Explore the marketplace

Go to `/explore-artisans`.

Use search, craft filters and sorting. Open several profiles. Each profile should show:

- Craft specialisation and location.
- Skills, materials and availability.
- Portfolio artwork with demo labels.
- Reviews only where the seeded completed work supports them.
- A clear "not verified" state for fictional demo makers.

### 3. Inspect the public 3D preview

From `/demo/live`, use the jacket preview:

- Drag to rotate.
- Scroll or pinch to zoom.
- Switch front and back.
- Reset the camera.

The motif is attached to the garment surface. The preview is read-only and does not bypass auth.

### 4. Open the real Studio

From the public navigation, choose **Studio** or go to `/studio`.

The Studio is protected. Sign in with your own account (or create one through the existing auth page) to continue. There are intentionally no published demo credentials.

Once inside:

1. Choose the jacket, T-shirt or tote.
2. Add a motif or text in the 2D tools.
3. Switch to 3D.
4. Change fabric colour.
5. Rotate, zoom, switch views and reset.
6. Switch back to 2D to reposition the motif.
7. Save.

Save creates a real design version tied to your account. Reopen it from the saved designs list. The design remains available to the customer request flow.

Products without a 3D mesh show a labelled 2D fallback and do not offer a 3D button.

### 5. Explore KalaCollab

On `/demo/live`, scroll to the KalaCollab section. It displays three records:

- An in-progress jacket with an approved tailoring stage, an in-progress embroidery stage and a dependent painting stage.
- An awaiting-approval saree where every artisan has accepted but the customer has not approved the plan.
- A completed zardozi jacket with three approved contributions.

These are real `collaborationPlans` and `collaborationTasks` rows. The public showcase is read-only.

For the product explanation, open `/kalacollab`.

For real collaboration actions, sign in and use the customer/artisan workspaces. A demo artisan identity cannot be used to sign in.

### 6. Inspect the artisan business view

On `/demo/live`, the **Artisan workspace preview** shows the first seeded maker, Meera Joshi.

It includes:

- Confirmed sandbox earnings from seeded payouts.
- Active and completed project counts.
- Pending quotations and collaboration invitations.
- Sample review count and average rating.
- Portfolio count.
- Live CraftFit scores for eligible open briefs.
- The explanation for each match.

This is a read-only preview calculated from the demo maker's seeded records. It is not another user's account and it cannot approve work or move money.

### 7. Open a completed creation's passport

Open:

- `/passport/demo-passport-1`
- `/passport/demo-passport-2`
- `/passport/demo-passport-3`
- `/passport/demo-passport-4`
- `/passport/demo-passport-5`

The certificate shows:

- The project title and craft.
- The credited artisan.
- Techniques and materials.
- The approved design direction or the documented fallback.
- The KalaProof milestone timeline.
- The public privacy note.
- The sample-data label.

It does not claim independent authentication or blockchain verification.

## What requires a real account

The seed deliberately creates fictional users without auth accounts. This prevents a judge from impersonating a customer or artisan by changing a URL parameter.

To exercise write actions:

- Create your own account through `/auth`.
- Complete the relevant profile.
- Create a request, quote, project or collaboration from the real workspace.

Your new account starts with your own data, not the demo records. This is intentional isolation.

Admin seed and reset controls appear only for an authenticated admin in the admin overview. No administrator credentials are documented or invented.

## Demo maintenance

The dataset can be rebuilt from the Convex CLI:

```bash
bunx convex run demo:reset
bunx convex run demo:seed
```

A repeated seed is a no-op and reports that the dataset is already present.

And from an authorised admin account, the admin overview includes:

- Seed full demo marketplace.
- Reset demo records.
- Current seeded counts.

Reset removes only entities tracked by the `kalakari-phase3-v1` seed key. It does not delete genuine users or their projects.

## Known limitations to mention honestly

- Portfolio images are original generated illustrations, not photographs.
- The 3D meshes are procedural, not licensed scanned garments.
- Motifs are positioned in the 2D editor; direct 3D dragging is not implemented.
- The three demo KalaCollab plans are read-only on the public showcase. Real collaboration actions use authenticated accounts.
- Demo customer/artisan dashboards are not available through demo logins because no demo auth accounts are provisioned.
- Browser screenshots, responsive visual checks and end-to-end browser tests were not run in this session.
