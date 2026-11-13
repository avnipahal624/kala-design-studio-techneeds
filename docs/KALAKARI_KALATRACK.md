# KalaTrack

## Purpose

KalaTrack is the customer-facing production and delivery tracker. It does not introduce a second order-status system. It is a presentation layer over:

- `projects.mine` / `projects.detail`;
- existing project status and payment status;
- `kalaProofEvents` and their attachments;
- `orderMilestones`;
- `disputes`;
- `reviews`;
- KalaCollab tasks through the collaboration record;
- the optional structured shipment on a project.

## Routes

| Route | Access | Content |
| --- | --- | --- |
| `/track` | signed-in customer, artisan or admin | Filterable list of the viewer's projects. |
| `/track/:projectId` | project participant or admin | Dated timeline, milestones, shipping, dispute and evidence. |
| `/projects/:projectId/proof` | existing private KalaProof route | Full append-only evidence record. |
| `/projects/:projectId/dispute` | existing route | Dispute support. |

`RequireAuth` preserves the intended path in `/auth?returnTo=...`.

## What the tracker shows

- Project status and payment status from the existing state machine.
- Planned deadline from the brief, clearly labelled as planned.
- Actual event timestamps, recorded by the server.
- Milestone due dates, approval dates and released/released status.
- Progress photos already stored in KalaProof.
- A dispute banner with payment/payout changes paused.
- Cancelled and refunded projects without inventing replacement statuses.
- A manual shipping card.

## Artisan progress

`projects.addProgress` already existed. It now backs the KalaTrack form as well:

- only the assigned artisan may add progress;
- only during `in_production`;
- at least 10 characters of note;
- at least one validated private image;
- the event is appended to KalaProof and the customer is notified;
- the mutation cannot change project status.

## Manual shipping

The project schema now has an optional structured `shipment` object:

```ts
{
  carrier: string,
  trackingNumber: string,
  trackingUrl?: string,
  note?: string,
  recordedAt: number,
  recordedBy: Id<"users">
}
```

`projects.addShipping` requires the assigned artisan, a `delivered` project (customer approved final work), a carrier and tracking number, and validates that an optional URL begins with `http://` or `https://`. It updates the structured field and still appends the existing `product_shipped` KalaProof event.

There is no live carrier integration. The UI therefore says "manual tracking", opens an external carrier link only when one was explicitly recorded, and never shows GPS or a projected delivery time.

## Status handling

The five display stages are derived from the existing project status:

1. Order confirmed
2. In production
3. Final review
4. Handover / shipping
5. Complete

Disputed, cancelled and refunded states stop the progress bar and show an explicit notice. They are not mapped onto a fake happy path. "Past planned date" is shown only when a real planned deadline exists and the project is still active.

## Privacy and permissions

- `projects.detail` already enforces customer/artisan/admin access.
- KalaTrack does not expose private project data publicly.
- Photos are private storage URLs resolved by the existing server query.
- Shipping fields are participant/admin-only.
- The tracker does not add a public share link.

## Limitations

- No live courier API, GPS or automatic delivery confirmation.
- A manually entered tracking number is not proof of delivery.
- Sample projects cannot be operated through demo logins because no demo auth accounts are provisioned.
- Browser-based responsive checks were not available in this session.
