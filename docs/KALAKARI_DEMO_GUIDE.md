# KALAKARI — Hackathon Demo Guide

**Target length:** 3–4 minutes  
**Primary route:** `/demo`  
**Live product:** `/`  
**No real payments are executed in this demo.**

## 1. Pre-flight

- Open the deployed site in a desktop browser at 1440 px and a phone at 375 px.
- Confirm `/demo` loads. It needs no sign-in and makes no Convex mutation.
- Keep the `/demo` tab open as the fallback if live data or auth is slow.
- Do **not** use the admin sample-artisan button during the pitch. Those records are labelled demonstration profiles, have no login and are excluded from matching.
- Do not claim that any task amount was paid, split or transferred.

### Current live data boundary

At audit time the dev database contained:

| Record | Count |
|---|---:|
| Users | 2 |
| Artisan profiles | 1 |
| Requests | 1 |
| Projects | 0 |
| Collaboration plans | 0 |
| KalaPassports | 0 |

That means the **scripted `/demo` is the only reliable way to show the full three-artisan plan and a passport without first creating and completing live records.** The live product can show the real customer brief and the real single-artisan marketplace.

## 2. Recommended 3–4 minute script

Use the numbered buttons at the top of `/demo`, or the left/right arrow keys. Every screen carries a demonstration label.

### Scene 1 — The Idea (0:00–0:35)

**Screen 1 — Homepage**

Say:

> Kalakari starts with a customer's imagination, not a catalogue. The customer describes a piece, and the platform turns it into a production brief that real Indian artisans can quote.

Point to the hero, the **Start Creating** CTA and the explanation that no AI artwork is generated.

Expected result: the hero reads “Your Imagination. Their Craftsmanship.” and the demo badge says “Judge walkthrough · 3–4 minutes”.

### Scene 2 — Design Intelligence (0:35–1:10)

**Screen 2 — Sneaker brief**

Show the brief, the illustrative product photo, the budget/deadline and the Craft DNA panel.

Say:

> The rules read the written brief and identify practical production skills: surface preparation, hand painting and protective finishing. The image is illustrative; the system does not claim to understand the object visually.

Expected result: the screen explicitly labels the request as preloaded demonstration data.

### Scene 3 — Artisan Discovery (1:10–1:40)

**Screen 3 — Matching**

Show the explainable CraftFit breakdown and the portfolio-led artisan cards.

Say:

> Matching is transparent: skills, product, material, availability, budget and delivery are weighted. There is no paid placement and no invented match percentage.

Expected result: the match reasons are visible, and the screen says the explanation comes from the fields, not an AI guess.

### Scene 4 — Quote and Coordination (1:40–2:25)

**Screen 4 — KalaJobs / quote**

Show the quote breakdown, timeline, revisions and the platform-fee boundary.

**Screen 6 — KalaCollab**

Show the three-task plan:

- Tailor: garment construction.
- Embroidery artisan: Kantha surface work, after construction.
- Painting artisan: finishing details, after surface work.

Say:

> The customer sees one plan, not three disconnected chats. Each maker has accepted their own scope; the customer still has to approve the complete plan. The finishing task cannot start until the construction and every surface task are approved.

Expected result: all three tasks show “Accepted”, the combined budget is visible, and the panel states that no funds are split or transferred.

**Do not say** that this illustrative plan is a live database record. It is labelled “illustrative plan” and uses sample makers.

### Scene 5 — Production and trust (2:25–2:55)

**Screen 5 — KalaProof**

Show the production timeline and the evidence/approval language.

Say:

> Production starts only after payment and concept approval. Progress, dispatch and completion are recorded as platform events, not decorative percentages. The same event history feeds the final passport.

Expected result: the timeline is clearly labelled as a demonstration and shows recorded stages.

### Scene 6 — KalaPassport (2:55–3:30)

**Screen 7 — KalaPassport**

Show the certificate, artisan attribution, milestone list and QR area.

Say:

> When the project is complete, the customer can create a passport. It is private by default. The customer—not the artisan or an admin—controls public sharing. The public summary excludes conversations, addresses, payment identifiers and private files.

Expected result: the certificate says “Recorded from KalaProof” and “not an independent authenticity certificate”.

Close with:

> Kalakari is not AI drawing over an artisan's name. It is a way to imagine a piece, find the right hands, coordinate the making and preserve its story.

## 3. Optional live product proof

Use this only if there is time and a pre-authenticated session. It is not the primary 3–4 minute script.

1. Open `/`.
2. Choose **Start Creating**. Signed-out users are returned to `/auth` with the intended `/customer/create-request` path preserved.
3. Sign in with the existing verified owner account or continue as guest. Do not create a new production account during the pitch.
4. Complete the six-step brief. Attach a product photo; the form requires ownership confirmation.
5. Publish the brief. Expected result: success toast with the number of eligible matching artisans and navigation to the request detail.
6. On the request detail, show the Craft DNA, feasibility panel and KalaCollab proposal.
7. Open `/explore-artisans` and show the real artisan card and comparison tray.
8. If using the artisan account, open `/artisan/jobs`, open the matched brief, add a quote within the budget and submit. Sign back in as the customer and accept the quote.
9. The project opens at `awaiting_payment`. Create the sandbox order, tick the explicit sandbox acknowledgement and confirm it. Expected result: the project becomes funded and KalaProof records “Sandbox payment confirmed (no money moved)”.
10. Approve the artisan concept, then show the production/delivery controls. Do not imply that a real transfer occurred.

### Live multi-artisan limitation

The current database has one artisan profile. A real three-artisan acceptance demonstration would require three authenticated artisan accounts with eligible profiles. Do not fake this in the live UI. Use the `/demo` KalaCollab scene and state that it is an illustrative sandbox plan.

### Live passport limitation

There is no completed project, so no live KalaPassport token exists. Use the `/demo` passport scene. A real passport is created only by the customer of a completed project through `/projects/:projectId/passport`; public sharing is off until that customer enables it.

## 4. Accounts and safety

- **Demo walkthrough:** no account required.
- **Live customer:** existing verified owner account or a guest session created for the demo.
- **Live artisan:** the existing artisan account, reached through email OTP. Do not expose the address on screen.
- **Admin:** only if separately prepared. Admin controls are seat-claimed and audited; do not claim the first admin seat during a live pitch unless planned.

Never ask the audience to enter card details, OTPs or identity documents during the demo. The only payment path shown is sandbox mode, clearly acknowledged.

## 5. Reset and repeatability

- **Scripted demo:** refresh `/demo`. State lives in React and resets to Scene 1. No database writes occur.
- **Live request:** create a fresh brief for the next rehearsal. Do not delete other users' records.
- **Live project:** use sandbox mode only. If a rehearsal project is left behind, close the brief or leave the project in its recorded state; do not present it as a completed real order.
- **Sample artisan seeding:** admin-only, labelled, no login and no reset control. Do not seed during the pitch.

## 6. Fallback script

If the live site is slow, authentication fails, or the preview is blank:

1. Switch immediately to `/demo`.
2. Say: “The live marketplace needs an authenticated session and a completed project for the final passport. I’m using the labelled sandbox walkthrough so you can see the complete workflow without creating real records.”
3. Run Scenes 1–6 as above.
4. If `/demo` itself fails, use the static story: brief → rule-based Craft DNA → explainable CraftFit → explicit artisan acceptance → dependency-ordered production → customer-approved KalaPassport. Do not claim any screen was seen live.

## 7. Claims checklist

Safe to claim:

- Rule-based Craft DNA and explainable CraftFit.
- Explicit artisan acceptance and customer plan approval.
- Server-enforced task dependencies and project authorisation.
- KalaProof event history.
- Private-by-default KalaPassport with customer-controlled public sharing.
- Sandbox payment recording with no money movement.

Do not claim:

- AI-generated artwork or photorealistic 3D.
- Image understanding by a vision model.
- Automatic multi-artisan payouts or fund splitting.
- Independent authenticity verification.
- That the illustrative KalaCollab or passport data is a real transaction.
- That a real three-artisan flow has been exercised in the current live database.
