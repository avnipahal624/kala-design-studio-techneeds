import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/access";
import { scoreArtisan } from "./lib/matching";
import { publicArtisan } from "./lib/serialise";
import {
  DEMO_ARTISANS,
  DEMO_CUSTOMERS,
  DEMO_LABEL,
  DEMO_PORTFOLIO,
  DEMO_REQUESTS,
  DEMO_SEED_KEY,
  demoArtwork,
} from "./demoData";

const DAY = 86_400_000;

type DemoCounts = {
  artisans: number;
  customers: number;
  portfolio: number;
  requests: number;
  quotes: number;
  projects: number;
  reviews: number;
  plans: number;
  passports: number;
};

async function record(
  ctx: MutationCtx,
  entityType: string,
  entityId: string,
  label?: string,
) {
  await ctx.db.insert("demoEntities", {
    seedKey: DEMO_SEED_KEY,
    entityType,
    entityId,
    label,
    createdAt: Date.now(),
  });
}

function isoDay(offsetDays: number) {
  return new Date(Date.now() + offsetDays * DAY).toISOString().slice(0, 10);
}

function quoteNumbers(amount: number) {
  const materialsInr = Math.round(amount * 0.24);
  const labourInr = Math.round(amount * 0.4);
  const preparationInr = Math.round(amount * 0.1);
  const finishingInr = Math.round(amount * 0.1);
  const packagingInr = Math.round(amount * 0.06);
  const platformFeeInr = Math.round(amount * 0.08);
  return {
    materialsInr,
    labourInr,
    preparationInr,
    finishingInr,
    packagingInr,
    deliveryInr: Math.max(0, amount - materialsInr - labourInr - preparationInr - finishingInr - packagingInr),
    totalInr: amount,
    platformFeePercent: 8,
    platformFeeInr,
    netPayoutInr: amount - platformFeeInr,
  };
}

export async function seedDemo(ctx: MutationCtx) {
  const existing = await ctx.db
    .query("demoEntities")
    .withIndex("by_seed", (q) => q.eq("seedKey", DEMO_SEED_KEY))
    .first();
  if (existing) {
    return { seeded: false, reason: "Demo dataset already present. Reset first to rebuild it." };
  }

  const now = Date.now();
  const artisanIds: Id<"users">[] = [];
  const customerIds: Id<"users">[] = [];
  const profileIds: Id<"artisanProfiles">[] = [];

  for (let i = 0; i < DEMO_ARTISANS.length; i++) {
    const artisan = DEMO_ARTISANS[i];
    const userId = await ctx.db.insert("users", {
      name: artisan.name,
      displayName: artisan.name,
      email: `demo.artisan.${i + 1}@kalakari.example`,
      image: demoArtwork(artisan.craft, artisan.name, i),
      role: "artisan",
      city: artisan.city,
      language: i % 3 === 0 ? "Hindi" : "English",
      craftInterests: artisan.skills,
      onboardedAt: now - (80 - i) * DAY,
      lastActiveAt: now - i * 3_600_000,
    });
    artisanIds.push(userId);
    await record(ctx, "artisanUser", userId, artisan.name);

    const profileId = await ctx.db.insert("artisanProfiles", {
      userId,
      displayName: artisan.name,
      craftHeadline: artisan.craft,
      city: artisan.city,
      serviceRegion: artisan.region,
      mode: "individual",
      yearsExperience: 6 + (i % 14),
      intro: `${artisan.name} is a ${artisan.city}-based craftsperson working with ${artisan.materials.join(
        " and ",
      ).toLowerCase()}. This demo profile shows the kind of portfolio, skills and availability a real artisan would publish.`,
      languages: i % 2 === 0 ? ["Hindi", "English"] : ["Hindi", "English", "Hinglish"],
      skills: artisan.skills,
      customSkills: artisan.customSkills,
      products: artisan.products,
      materials: artisan.materials,
      minProjectValue: artisan.min,
      maxProjectValue: artisan.max,
      weeklyCapacity: 2 + (i % 3),
      turnaroundDays: artisan.days,
      shipsNationwide: true,
      localOnly: false,
      collaborates: artisan.collaborates,
      availability: artisan.availability,
      workingHours: "10:00–18:00 IST · replies within one working day",
      verificationStatus: "not_submitted",
      craftFitCompletedAt: now - (70 - i) * DAY,
      completedProjects: 0,
      ratingSum: 0,
      ratingCount: 0,
      sampleLabel: DEMO_LABEL,
      createdAt: now - (90 - i) * DAY,
      updatedAt: now - i * DAY,
    });
    profileIds.push(profileId);
    await record(ctx, "artisanProfile", profileId, artisan.name);

    const portfolioSet = DEMO_PORTFOLIO[i % DEMO_PORTFOLIO.length];
    const itemCount = i < 8 ? 3 : 2;
    for (let p = 0; p < itemCount; p++) {
      const title = portfolioSet.titles[p % portfolioSet.titles.length];
      const itemId = await ctx.db.insert("portfolioItems", {
        artisanId: userId,
        title,
        description: `${title} made for a private commission. ${portfolioSet.craft} work in ${portfolioSet.materials.join(
          " and ",
        )}, documented for this fictional demo profile.`,
        craftTags: [portfolioSet.craft, ...artisan.skills.slice(0, 1)],
        materialTags: portfolioSet.materials,
        durationDays: 5 + ((i + p * 3) % 18),
        externalUrl: demoArtwork(portfolioSet.craft, title, i + p),
        ownershipDeclared: true,
        reusePermission: "portfolio_and_promotion",
        sampleLabel: DEMO_LABEL,
        createdAt: now - (60 - i * 2 - p) * DAY,
      });
      await record(ctx, "portfolio", itemId, title);
    }
  }

  for (let i = 0; i < DEMO_CUSTOMERS.length; i++) {
    const customer = DEMO_CUSTOMERS[i];
    const userId = await ctx.db.insert("users", {
      name: customer.name,
      displayName: customer.name,
      email: `demo.customer.${i + 1}@kalakari.example`,
      image: demoArtwork(customer.interests[0], customer.name, i + 2),
      role: "customer",
      city: customer.city,
      language: i % 2 === 0 ? "English" : "Hindi",
      craftInterests: customer.interests,
      onboardedAt: now - (60 - i) * DAY,
      lastActiveAt: now - i * 7_200_000,
    });
    customerIds.push(userId);
    await record(ctx, "customerUser", userId, customer.name);
    const profileId = await ctx.db.insert("customerProfiles", {
      userId,
      city: customer.city,
      preferredContact: "email",
      notes: "Fictional demo customer used to populate briefs, projects and reviews.",
      marketingOptIn: false,
      createdAt: now - (60 - i) * DAY,
    });
    await record(ctx, "customerProfile", profileId, customer.name);
  }

  const requestIds: Id<"customerRequests">[] = [];
  for (let i = 0; i < DEMO_REQUESTS.length; i++) {
    const brief = DEMO_REQUESTS[i];
    const requestId = await ctx.db.insert("customerRequests", {
      customerId: customerIds[brief.customer],
      title: brief.title,
      category: brief.category,
      productDescription: brief.product,
      conditionNotes: "Sample condition notes recorded for this demo brief.",
      ownershipConfirmed: true,
      description: brief.description,
      craftPreference: brief.craft,
      colours: "Warm ivory, terracotta and antique gold",
      placement: "As described in the brief",
      materialsKnown: brief.materials,
      specialInstructions: "Demo brief — no real payment or fulfilment is expected.",
      budgetInr: brief.budget,
      deadline: isoDay(brief.days),
      city: brief.city,
      fulfilment: brief.fulfilment,
      customerSuppliesProduct: brief.category === "Footwear" || i % 3 === 0,
      images: [],
      requiredSkills: brief.skills,
      suggestedMaterials: [brief.materials],
      productionNotes: [
        "Confirm a physical or digital swatch before starting.",
        "Photograph the work at key stages for the project timeline.",
      ],
      briefSummary: brief.description,
      missingInfo: [],
      analysis: { source: "phase-3-demo", craft: brief.craft },
      demoLabel: DEMO_LABEL,
      status: brief.status === "quote_selected" ? "quote_selected" : brief.status,
      publishedAt: now - (30 - i) * DAY,
      closedAt: brief.status === "open" ? undefined : now - (8 + i) * DAY,
      createdAt: now - (30 - i) * DAY,
      updatedAt: now - i * 3_600_000,
    });
    requestIds.push(requestId);
    await record(ctx, "request", requestId, brief.title);
  }

  const quoteIds: Id<"quotes">[] = [];
  const acceptedQuoteIds: Id<"quotes">[] = [];
  const projectIds: Id<"projects">[] = [];

  for (let i = 0; i < 15; i++) {
    const brief = DEMO_REQUESTS[i];
    const artisanId = artisanIds[brief.artisan];
    const amount = Math.round((brief.budget * 0.9) / 100) * 100;
    const money = quoteNumbers(amount);
    const createdAt = now - (22 - i) * DAY;
    const quoteId = await ctx.db.insert("quotes", {
      requestId: requestIds[i],
      artisanId,
      customerId: customerIds[brief.customer],
      ...money,
      timelineDays: brief.days,
      revisionRounds: 2,
      depositPercent: 40,
      terms: "Sample quotation. Materials are confirmed after a swatch review; two revision rounds are included. No live payment is attached to this demo record.",
      note: `A considered approach to ${brief.title.toLowerCase()}, with documented stages and a hand-finished result.`,
      demoLabel: DEMO_LABEL,
      version: 1,
      status: "accepted",
      acceptedAt: createdAt + 2 * DAY,
      createdAt,
      updatedAt: createdAt + 2 * DAY,
    });
    quoteIds.push(quoteId);
    acceptedQuoteIds.push(quoteId);
    await record(ctx, "quote", quoteId, `${brief.title} — accepted`);

    if (i < 5) {
      const alternate = artisanIds[(brief.artisan + 3) % artisanIds.length];
      const alternateAmount = Math.round((brief.budget * 0.97) / 100) * 100;
      const altQuoteId = await ctx.db.insert("quotes", {
        requestId: requestIds[i],
        artisanId: alternate,
        customerId: customerIds[brief.customer],
        ...quoteNumbers(alternateAmount),
        timelineDays: brief.days + 8,
        revisionRounds: 1,
        depositPercent: 50,
        terms: "Sample declined quotation, kept to show how a customer compares proposals.",
        note: "An alternative material story, declined because the timeline was longer.",
        demoLabel: DEMO_LABEL,
        version: 1,
        status: "declined",
        createdAt: createdAt + 2_000,
        updatedAt: createdAt + 3_000,
      });
      quoteIds.push(altQuoteId);
      await record(ctx, "quote", altQuoteId, `${brief.title} — declined`);
    }
  }

  for (let i = 15; i < 17; i++) {
    const brief = DEMO_REQUESTS[i];
    for (let q = 0; q < 2; q++) {
      const artisanIndex = (i * 4 + q * 5) % artisanIds.length;
      const amount = Math.round((brief.budget * (0.92 + q * 0.05)) / 100) * 100;
      const quoteId = await ctx.db.insert("quotes", {
        requestId: requestIds[i],
        artisanId: artisanIds[artisanIndex],
        customerId: customerIds[brief.customer],
        ...quoteNumbers(amount),
        timelineDays: brief.days + q * 4,
        revisionRounds: 2,
        depositPercent: 40,
        terms: "Sample pending quotation for the open demo brief.",
        note: q === 0 ? "I can begin with a swatch story and keep the ornament light." : "A slightly slower plan with an extra revision round.",
        demoLabel: DEMO_LABEL,
        version: 1,
        status: "submitted",
        expiresAt: now + 10 * DAY,
        createdAt: now - (3 + q) * DAY,
        updatedAt: now - (3 + q) * DAY,
      });
      quoteIds.push(quoteId);
      await record(ctx, "quote", quoteId, `${brief.title} — pending`);
    }
  }

  const projectStatuses = [
    "completed", "completed", "completed", "completed", "completed",
    "completed", "completed", "completed", "completed", "completed",
    "delivered", "in_production", "funded", "awaiting_payment", "refunded",
  ] as const;

  for (let i = 0; i < 15; i++) {
    const brief = DEMO_REQUESTS[i];
    const quoteId = acceptedQuoteIds[i];
    const status = projectStatuses[i];
    const amount = Math.round((brief.budget * 0.9) / 100) * 100;
    const money = quoteNumbers(amount);
    const createdAt = now - (20 - i) * DAY;
    const fundedAt = status === "awaiting_payment" ? undefined : createdAt + DAY;
    const startedAt = ["completed", "delivered", "in_production"].includes(status)
      ? createdAt + 2 * DAY
      : undefined;
    const deliveredAt = ["completed", "delivered"].includes(status)
      ? createdAt + 9 * DAY
      : undefined;
    const completedAt = status === "completed" ? createdAt + 11 * DAY : undefined;
    const paymentStatus =
      status === "awaiting_payment"
        ? "awaiting_payment"
        : status === "refunded"
          ? "refunded"
          : "confirmed";
    const projectId = await ctx.db.insert("projects", {
      requestId: requestIds[i],
      quoteId,
      customerId: customerIds[brief.customer],
      artisanId: artisanIds[brief.artisan],
      title: brief.title,
      acceptedQuote: {
        quoteId,
        totalInr: amount,
        materialsInr: money.materialsInr,
        labourInr: money.labourInr,
        preparationInr: money.preparationInr,
        finishingInr: money.finishingInr,
        packagingInr: money.packagingInr,
        deliveryInr: money.deliveryInr,
        timelineDays: brief.days,
        revisionRounds: 2,
        depositPercent: 40,
      },
      amountInr: amount,
      platformFeeInr: money.platformFeeInr,
      netPayoutInr: money.netPayoutInr,
      status,
      paymentStatus,
      revisionRoundsUsed: i % 3 === 0 ? 1 : 0,
      conceptApprovedAt: fundedAt ? fundedAt - 6 * 3_600_000 : undefined,
      fundedAt,
      startedAt,
      deliveredAt,
      completedAt,
      cancellationReason:
        status === "refunded" ? "Sample cancellation after a material mismatch; refund recorded in sandbox." : undefined,
      demoLabel: DEMO_LABEL,
      createdAt,
      updatedAt: completedAt ?? deliveredAt ?? startedAt ?? createdAt,
    });
    projectIds.push(projectId);
    await ctx.db.patch(quoteId, { projectId });
    await ctx.db.patch(requestIds[i], {
      status: "quote_selected",
      closedAt: createdAt + 2 * DAY,
      updatedAt: createdAt + 2 * DAY,
    });
    await record(ctx, "project", projectId, `${brief.title} — ${status}`);

    const addProof = async (
      type: "quote_accepted" | "concept_uploaded" | "concept_approved" | "payment_confirmed" | "production_started" | "progress_uploaded" | "product_delivered" | "project_completed" | "dispute_resolved",
      title: string,
      createdAtValue: number,
      note?: string,
    ) => {
      const eventId = await ctx.db.insert("kalaProofEvents", {
        projectId,
        requestId: requestIds[i],
        type,
        title,
        note,
        attachments: [],
        actorRole: "system",
        visibility: "participants",
        demoLabel: DEMO_LABEL,
        createdAt: createdAtValue,
      });
      await record(ctx, "proof", eventId);
    };

    await addProof("quote_accepted", "Quotation accepted", createdAt + 2 * DAY, "Demo quotation accepted by the customer.");
    await addProof("concept_uploaded", "Design direction agreed", createdAt + 2 * DAY + 3_600_000);
    if (fundedAt) {
      await addProof("concept_approved", "Customer approved the design direction", fundedAt - 6 * 3_600_000);
      await addProof("payment_confirmed", "Sandbox payment confirmed", fundedAt, "Recorded in demo mode only; no live money moved.");
    }
    if (startedAt) {
      await addProof("production_started", "Work started at the bench", startedAt);
      await addProof("progress_uploaded", "Progress update added", startedAt + 4 * DAY, "A mid-production photograph and note were added to the project record.");
    }
    if (deliveredAt) {
      await addProof("product_delivered", "Finished piece delivered", deliveredAt);
    }
    if (completedAt) {
      await addProof("project_completed", "Project completed", completedAt, "Customer approval recorded and the KalaPassport became eligible.");
    }
    if (status === "refunded") {
      await addProof("dispute_resolved", "Refund recorded in sandbox", createdAt + 5 * DAY, "The demo project closed with a full sandbox refund.");
    }
  }

  const completedProjectIds = projectIds.slice(0, 10);
  const passportTokens: string[] = [];

  for (let i = 0; i < completedProjectIds.length; i++) {
    const projectId = completedProjectIds[i];
    const brief = DEMO_REQUESTS[i];
    const customerReviewId = await ctx.db.insert("reviews", {
      projectId,
      authorId: customerIds[brief.customer],
      subjectId: artisanIds[brief.artisan],
      authorRole: "customer",
      rating: i % 4 === 0 ? 4 : 5,
      body:
        i % 3 === 0
          ? "The handwork is beautiful and the process updates made it easy to trust the timeline. A little more contrast in the final border would have been perfect."
          : i % 3 === 1
            ? "Thoughtful craft, careful packing and a genuinely collaborative process. The piece feels personal rather than shop-bought."
            : "Exactly the kind of detail I hoped for. The artisan explained each material choice and the finish is beautiful.",
      demoLabel: DEMO_LABEL,
      createdAt: now - (8 - i) * DAY,
    });
    await record(ctx, "review", customerReviewId, `${brief.title} — customer review`);

    const artisanReviewId = await ctx.db.insert("reviews", {
      projectId,
      authorId: artisanIds[brief.artisan],
      subjectId: customerIds[brief.customer],
      authorRole: "artisan",
      rating: 5,
      body: "Clear references, prompt feedback and respect for the making process. A lovely commission to work on.",
      demoLabel: DEMO_LABEL,
      createdAt: now - (7 - i) * DAY,
    });
    await record(ctx, "review", artisanReviewId, `${brief.title} — artisan review`);
  }

  for (let i = 0; i < 5; i++) {
    const token = `demo-passport-${i + 1}`;
    passportTokens.push(token);
    const passportId = await ctx.db.insert("kalaPassports", {
      projectId: completedProjectIds[i],
      customerId: customerIds[DEMO_REQUESTS[i].customer],
      shareToken: token,
      publicEnabled: true,
      demoLabel: DEMO_LABEL,
      createdAt: now - (6 - i) * DAY,
      updatedAt: now - (6 - i) * DAY,
    });
    await record(ctx, "passport", passportId, token);
  }

  for (let i = 0; i < projectIds.length; i++) {
    const projectId = projectIds[i];
    const brief = DEMO_REQUESTS[i];
    const isAwaiting = i === 13;
    const isRefunded = i === 14;
    const amount = Math.round((brief.budget * 0.9) / 100) * 100;
    const orderStatus = isAwaiting ? "created" : isRefunded ? "refunded" : "paid";
    const orderId = await ctx.db.insert("paymentOrders", {
      projectId,
      customerId: customerIds[brief.customer],
      provider: "sandbox",
      mode: "sandbox",
      providerOrderId: `demo_order_${i + 1}`,
      amountInr: amount,
      currency: "INR",
      status: orderStatus,
      demoLabel: DEMO_LABEL,
      checkoutReference: `demo_checkout_${i + 1}`,
      createdAt: now - (18 - i) * DAY,
      paidAt: isAwaiting ? undefined : now - (17 - i) * DAY,
    });
    await record(ctx, "paymentOrder", orderId, orderStatus);

    if (!isAwaiting) {
      const transactionId = await ctx.db.insert("paymentTransactions", {
        paymentOrderId: orderId,
        projectId,
        provider: "sandbox",
        event: isRefunded ? "refund.processed" : "payment.captured",
        idempotencyKey: `demo:${orderId}:${isRefunded ? "refund" : "capture"}`,
        amountInr: amount,
        signatureVerified: false,
        createdAt: now - (17 - i) * DAY,
      });
      await record(ctx, "paymentTransaction", transactionId, orderStatus);
    }

    if (i < 10) {
      const payoutId = await ctx.db.insert("payouts", {
        projectId,
        artisanId: artisanIds[brief.artisan],
        amountInr: quoteNumbers(amount).netPayoutInr,
        platformFeeInr: quoteNumbers(amount).platformFeeInr,
        status: i % 3 === 0 ? "pending" : "paid",
        provider: "sandbox",
        providerTransferId: i % 3 === 0 ? undefined : `demo_transfer_${i + 1}`,
        note: "Sandbox payout record for the demo artisan dashboard. Not a real bank transfer.",
        createdAt: now - (5 - (i % 5)) * DAY,
        processedAt: i % 3 === 0 ? undefined : now - (4 - (i % 4)) * DAY,
      });
      await record(ctx, "payout", payoutId, `Project ${i + 1}`);
    }
  }

  for (let i = 0; i < 4; i++) {
    const projectId = projectIds[i];
    const brief = DEMO_REQUESTS[i];
    const conversationId = await ctx.db.insert("conversations", {
      customerId: customerIds[brief.customer],
      artisanId: artisanIds[brief.artisan],
      scopeType: "project",
      scopeId: projectId,
      requestId: requestIds[i],
      projectId,
      lastMessageAt: now - (9 - i) * 3_600_000,
      lastMessagePreview: "The final photographs are in the project record. Thank you for the thoughtful brief.",
      demoLabel: DEMO_LABEL,
      createdAt: now - (18 - i) * DAY,
    });
    await record(ctx, "conversation", conversationId, brief.title);
    const messageBodies = [
      `I have started a thread for ${brief.title.toLowerCase()}. I will share a material note first.`,
      "The swatch is closer to warm ivory than pure white. Would you like me to keep the border in antique gold?",
      "Warm ivory and antique gold sounds right. Please keep the finish soft rather than glossy.",
      "Understood. The final photographs are in the project record. Thank you for the thoughtful brief.",
    ];
    for (let m = 0; m < messageBodies.length; m++) {
      const senderId = m % 2 === 0 ? artisanIds[brief.artisan] : customerIds[brief.customer];
      const messageId = await ctx.db.insert("messages", {
        conversationId,
        senderId,
        body: messageBodies[m],
        attachments: [],
        demoLabel: DEMO_LABEL,
        createdAt: now - (18 - i) * DAY + m * 3_600_000,
        readAt: m < 3 ? now - (9 - i) * 3_600_000 : undefined,
      });
      await record(ctx, "message", messageId, brief.title);
    }
  }

  for (let i = 0; i < 6; i++) {
    const requestId = requestIds[15 + (i % 2)];
    const artisanId = artisanIds[(i * 3) % artisanIds.length];
    const profile = await ctx.db.get(profileIds[(i * 3) % profileIds.length]);
    const reviewId = await ctx.db.insert("feasibilityReviews", {
      requestId,
      artisanId,
      artisanName: profile?.displayName ?? "Demo artisan",
      verdict: i % 3 === 0 ? "needs_artisan_review" : "likely_feasible",
      note: i % 3 === 0
        ? "The finish is achievable, but I would test the sealing method on a hidden panel first. A small swatch review will protect the final surface."
        : "A considered plan. The materials and timeline are workable with a clear swatch approval and one revision round.",
      estimatedDays: 12 + i * 2,
      demoLabel: DEMO_LABEL,
      createdAt: now - (2 + i) * DAY,
      updatedAt: now - (2 + i) * DAY,
    });
    await record(ctx, "feasibility", reviewId);
  }

  const planSpecs = [
    {
      requestIndex: 17,
      label: "in_progress",
      status: "in_production" as const,
      tasks: [
        { position: 1, title: "Tailor the ivory silk base", role: "Tailor", skill: "Tailoring", brief: "Cut and construct the jacket, finish the seams and prepare clean panels for handwork.", artisan: 5, deps: [] as number[], status: "approved" as const, amount: 7000 },
        { position: 2, title: "Work the Kantha front panels", role: "Embroiderer", skill: "Embroidery", brief: "Layer running-stitch Kantha across both front panels, following the approved motif map.", artisan: 2, deps: [1], status: "in_progress" as const, amount: 8000 },
        { position: 3, title: "Paint the terracotta border", role: "Fabric painter", skill: "Hand Painting", brief: "Add a fine hand-painted border in terracotta and antique gold, then seal the painted area.", artisan: 0, deps: [1, 2], status: "accepted" as const, amount: 6000 },
      ],
    },
    {
      requestIndex: 18,
      label: "awaiting_approval",
      status: "ready" as const,
      tasks: [
        { position: 1, title: "Dye the monsoon-grey silk", role: "Dyer", skill: "Textile Dyeing", brief: "Create an even monsoon-grey ground with a soft hand and documented dye bath.", artisan: 16, deps: [] as number[], status: "accepted" as const, amount: 6000 },
        { position: 2, title: "Block-print the rain motif", role: "Block printer", skill: "Block Printing", brief: "Print the repeat across the body, keeping the pallu composition open and airy.", artisan: 3, deps: [1], status: "accepted" as const, amount: 7000 },
        { position: 3, title: "Finish the pallu border", role: "Finishing artisan", skill: "Decorative Finishing", brief: "Add a fine stitched border and finish the saree edges by hand.", artisan: 5, deps: [1, 2], status: "accepted" as const, amount: 5000 },
      ],
    },
    {
      requestIndex: 19,
      label: "completed",
      status: "completed" as const,
      tasks: [
        { position: 1, title: "Tailor the wine velvet jacket", role: "Tailor", skill: "Tailoring", brief: "Construct the jacket with a clean shoulder and a lightly structured front.", artisan: 5, deps: [] as number[], status: "approved" as const, amount: 10000 },
        { position: 2, title: "Work the zardozi panels", role: "Zardozi artisan", skill: "Zardozi", brief: "Work antique-gold zardozi on the front panels with a restrained paisley composition.", artisan: 7, deps: [1], status: "approved" as const, amount: 12000 },
        { position: 3, title: "Bead the shoulder detail", role: "Beadworker", skill: "Beadwork", brief: "Finish the shoulders with a fine beadwork edge that catches the light without adding weight.", artisan: 17, deps: [1, 2], status: "approved" as const, amount: 8000 },
      ],
    },
  ];

  for (const spec of planSpecs) {
    const request = DEMO_REQUESTS[spec.requestIndex];
    const planId = await ctx.db.insert("collaborationPlans", {
      requestId: requestIds[spec.requestIndex],
      customerId: customerIds[request.customer],
      title: request.title,
      status: spec.status,
      combinedBudgetInr: spec.tasks.reduce((sum, task) => sum + task.amount, 0),
      note: "Sample multi-artisan plan. Dependencies, approvals and statuses are real collaboration records.",
      demoLabel: DEMO_LABEL,
      approvedAt: spec.label === "awaiting_approval" ? undefined : now - (14 - spec.requestIndex) * DAY,
      completedAt: spec.label === "completed" ? now - 4 * DAY : undefined,
      createdAt: now - 20 * DAY,
      updatedAt: now - 2 * DAY,
    });
    await record(ctx, "collabPlan", planId, spec.label);

    for (const task of spec.tasks) {
      const taskId = await ctx.db.insert("collaborationTasks", {
        planId,
        requestId: requestIds[spec.requestIndex],
        position: task.position,
        title: task.title,
        role: task.role,
        skill: task.skill,
        brief: task.brief,
        dependsOnPosition: task.deps[0],
        dependsOnPositions: task.deps,
        artisanId: artisanIds[task.artisan],
        matchScore: 78 + task.position * 4,
        matchReasons: ["Skill and material fit confirmed by the demo matching record.", "Available for the proposed production window."],
        status: task.status,
        plannedAmountInr: task.amount,
        quotedAmountInr: task.amount,
        artisanNote: task.status === "in_progress" ? "The front panel is on the frame; next update after the border is marked." : undefined,
        demoLabel: DEMO_LABEL,
        startedAt: task.status === "in_progress" || task.status === "approved" ? now - 6 * DAY : undefined,
        submittedAt: task.status === "approved" ? now - 3 * DAY : undefined,
        approvedAt: task.status === "approved" ? now - 2 * DAY : undefined,
        createdAt: now - 20 * DAY,
        updatedAt: now - 2 * DAY,
      });
      await record(ctx, "collabTask", taskId, `${spec.label}:${task.position}`);
    }
  }

  const artisanStats = new Map<string, { completed: number; ratingSum: number; ratingCount: number }>();
  for (const profileId of profileIds) {
    artisanStats.set(profileId, { completed: 0, ratingSum: 0, ratingCount: 0 });
  }
  for (let i = 0; i < 10; i++) {
    const profile = await ctx.db
      .query("artisanProfiles")
      .withIndex("by_user", (q) => q.eq("userId", artisanIds[DEMO_REQUESTS[i].artisan]))
      .unique();
    if (!profile) continue;
    const stat = artisanStats.get(profile._id) ?? { completed: 0, ratingSum: 0, ratingCount: 0 };
    stat.completed += 1;
    stat.ratingSum += i % 4 === 0 ? 4 : 5;
    stat.ratingCount += 1;
    artisanStats.set(profile._id, stat);
  }
  for (const [profileId, stat] of artisanStats) {
    await ctx.db.patch(profileId as Id<"artisanProfiles">, {
      completedProjects: stat.completed,
      ratingSum: stat.ratingSum,
      ratingCount: stat.ratingCount,
    });
  }

  for (let i = 0; i < 10; i++) {
    const brief = DEMO_REQUESTS[i];
    const notificationId = await ctx.db.insert("notifications", {
      userId: artisanIds[brief.artisan],
      type: i < 3 ? "collaboration_invite" : "project_update",
      title: i < 3 ? "A sample collaboration invitation" : "Sample project update",
      body: i < 3 ? `You are invited to contribute to ${brief.title} in the demo workspace.` : `${brief.title} has a new demo milestone and customer note.`,
      href: "/artisan/collaborations",
      readAt: i > 5 ? now - DAY : undefined,
      createdAt: now - i * DAY,
    });
    await record(ctx, "notification", notificationId);
  }
  for (let i = 0; i < 4; i++) {
    const brief = DEMO_REQUESTS[i];
    const notificationId = await ctx.db.insert("notifications", {
      userId: customerIds[brief.customer],
      type: "passport_ready",
      title: "A sample KalaPassport is ready",
      body: `${brief.title} has a public demo passport you can open and inspect.`,
      href: `/passport/${passportTokens[i]}`,
      createdAt: now - i * DAY,
    });
    await record(ctx, "notification", notificationId);
  }

  const counts: DemoCounts = {
    artisans: artisanIds.length,
    customers: customerIds.length,
    portfolio: DEMO_ARTISANS.reduce((total, _artisan, index) => total + (index < 8 ? 3 : 2), 0),
    requests: requestIds.length,
    quotes: quoteIds.length,
    projects: projectIds.length,
    reviews: 20,
    plans: planSpecs.length,
    passports: passportTokens.length,
  };
  return { seeded: true, seedKey: DEMO_SEED_KEY, counts, profileIds };
}

export async function resetDemo(ctx: MutationCtx) {
  const rows = await ctx.db
    .query("demoEntities")
    .withIndex("by_seed", (q) => q.eq("seedKey", DEMO_SEED_KEY))
    .take(2000);

  const order = [
    "proof", "message", "conversation", "notification", "review", "passport",
    "paymentTransaction", "paymentOrder", "payout", "collabTask", "collabPlan",
    "project", "quote", "request", "portfolio", "feasibility", "artisanProfile",
    "customerProfile", "artisanUser", "customerUser",
  ];

  for (const entityType of order) {
    for (const row of rows.filter((candidate) => candidate.entityType === entityType)) {
      switch (entityType) {
        case "proof":
          await ctx.db.delete(row.entityId as Id<"kalaProofEvents">);
          break;
        case "message":
          await ctx.db.delete(row.entityId as Id<"messages">);
          break;
        case "conversation":
          await ctx.db.delete(row.entityId as Id<"conversations">);
          break;
        case "notification":
          await ctx.db.delete(row.entityId as Id<"notifications">);
          break;
        case "review":
          await ctx.db.delete(row.entityId as Id<"reviews">);
          break;
        case "passport":
          await ctx.db.delete(row.entityId as Id<"kalaPassports">);
          break;
        case "paymentTransaction":
          await ctx.db.delete(row.entityId as Id<"paymentTransactions">);
          break;
        case "paymentOrder":
          await ctx.db.delete(row.entityId as Id<"paymentOrders">);
          break;
        case "payout":
          await ctx.db.delete(row.entityId as Id<"payouts">);
          break;
        case "collabTask":
          await ctx.db.delete(row.entityId as Id<"collaborationTasks">);
          break;
        case "collabPlan":
          await ctx.db.delete(row.entityId as Id<"collaborationPlans">);
          break;
        case "project":
          await ctx.db.delete(row.entityId as Id<"projects">);
          break;
        case "quote":
          await ctx.db.delete(row.entityId as Id<"quotes">);
          break;
        case "request":
          await ctx.db.delete(row.entityId as Id<"customerRequests">);
          break;
        case "portfolio":
          await ctx.db.delete(row.entityId as Id<"portfolioItems">);
          break;
        case "feasibility":
          await ctx.db.delete(row.entityId as Id<"feasibilityReviews">);
          break;
        case "artisanProfile":
          await ctx.db.delete(row.entityId as Id<"artisanProfiles">);
          break;
        case "customerProfile":
          await ctx.db.delete(row.entityId as Id<"customerProfiles">);
          break;
        case "artisanUser":
        case "customerUser":
          await ctx.db.delete(row.entityId as Id<"users">);
          break;
      }
    }
  }

  for (const row of rows) await ctx.db.delete(row._id);
  return { reset: true, removed: rows.length };
}

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => await seedDemo(ctx),
});

export const reset = internalMutation({
  args: {},
  handler: async (ctx) => await resetDemo(ctx),
});

export const seedAsAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await seedDemo(ctx);
  },
});

export const resetAsAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await resetDemo(ctx);
  },
});

export const adminStatus = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db
      .query("demoEntities")
      .withIndex("by_seed", (q) => q.eq("seedKey", DEMO_SEED_KEY))
      .take(2000);
    const counts: Record<string, number> = {};
    for (const row of rows) counts[row.entityType] = (counts[row.entityType] ?? 0) + 1;
    return { seedKey: DEMO_SEED_KEY, populated: rows.length > 0, counts, demoLabel: DEMO_LABEL };
  },
});

export const showcase = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("demoEntities")
      .withIndex("by_seed", (q) => q.eq("seedKey", DEMO_SEED_KEY))
      .take(2000);
    const counts: Record<string, number> = {};
    for (const row of rows) counts[row.entityType] = (counts[row.entityType] ?? 0) + 1;

    const artisanRows = rows.filter((row) => row.entityType === "artisanProfile").slice(0, 7);
    const artisans = await Promise.all(
      artisanRows.map(async (row) => {
        const profile = await ctx.db.get(row.entityId as Id<"artisanProfiles">);
        if (!profile) return null;
        const preview = await ctx.db
          .query("portfolioItems")
          .withIndex("by_artisan_created", (q) => q.eq("artisanId", profile.userId))
          .order("desc")
          .first();
        return { ...publicArtisan(profile), previewUrl: preview?.externalUrl ?? null };
      }),
    );

    const planRows = rows.filter(
      (row) => row.entityType === "collabPlan" && row.label !== undefined,
    );
    const plans = [];
    for (const row of planRows) {
      const plan = await ctx.db.get(row.entityId as Id<"collaborationPlans">);
      if (!plan) continue;
      const tasks = await ctx.db
        .query("collaborationTasks")
        .withIndex("by_plan", (q) => q.eq("planId", plan._id))
        .collect();
      const stages = await Promise.all(
        tasks.map(async (task) => {
          const maker = task.artisanId ? await ctx.db.get(task.artisanId) : null;
          return {
            position: task.position,
            title: task.title,
            role: task.role,
            skill: task.skill,
            brief: task.brief,
            status: task.status,
            amountInr: task.quotedAmountInr ?? task.plannedAmountInr,
            artisanName: maker?.displayName ?? maker?.name ?? "Unassigned",
            dependsOnPositions: task.dependsOnPositions ?? (task.dependsOnPosition ? [task.dependsOnPosition] : []),
          };
        }),
      );
      plans.push({
        id: plan._id,
        label: row.label ?? "scenario",
        title: plan.title,
        status: plan.status,
        combinedBudgetInr: plan.combinedBudgetInr,
        stages: stages.sort((a, b) => a.position - b.position),
      });
    }

    const passports = [];
    for (const row of rows.filter((entry) => entry.entityType === "passport")) {
      const passport = await ctx.db.get(row.entityId as Id<"kalaPassports">);
      if (!passport) continue;
      const project = await ctx.db.get(passport.projectId);
      passports.push({
        token: passport.shareToken,
        publicEnabled: passport.publicEnabled,
        projectTitle: project?.title ?? "Completed demo project",
      });
    }

    const makerRow = rows.find((entry) => entry.entityType === "artisanProfile");
    let makerWorkspace = null;
    if (makerRow) {
      const profile = await ctx.db.get(makerRow.entityId as Id<"artisanProfiles">);
      if (profile) {
        const [projects, quotes, payoutRows, reviewRows, taskRows, openRequests, portfolio] = await Promise.all([
          ctx.db.query("projects").withIndex("by_artisan", (q) => q.eq("artisanId", profile.userId)).collect(),
          ctx.db.query("quotes").withIndex("by_artisan", (q) => q.eq("artisanId", profile.userId)).collect(),
          ctx.db.query("payouts").withIndex("by_artisan", (q) => q.eq("artisanId", profile.userId)).collect(),
          ctx.db.query("reviews").withIndex("by_subject", (q) => q.eq("subjectId", profile.userId)).collect(),
          ctx.db.query("collaborationTasks").withIndex("by_artisan", (q) => q.eq("artisanId", profile.userId)).collect(),
          ctx.db.query("customerRequests").withIndex("by_status", (q) => q.eq("status", "open")).take(10),
          ctx.db.query("portfolioItems").withIndex("by_artisan", (q) => q.eq("artisanId", profile.userId)).take(24),
        ]);
        const paid = payoutRows.filter((payout) => payout.status === "paid").reduce((total, payout) => total + payout.amountInr, 0);
        const pending = payoutRows.filter((payout) => payout.status !== "paid").reduce((total, payout) => total + payout.amountInr, 0);
        const completed = projects.filter((project) => project.status === "completed").length;
        const active = projects.filter((project) => ["funded", "in_production", "review_pending", "delivered"].includes(project.status)).length;
        const matches = openRequests
          .map((request) => {
            const result = scoreArtisan(
              {
                category: request.category,
                budgetInr: request.budgetInr,
                requiredSkills: request.requiredSkills,
                materialsKnown: request.materialsKnown,
                city: request.city,
                fulfilment: request.fulfilment,
                deadline: request.deadline,
                craftPreference: request.craftPreference,
              },
              {
                skills: profile.skills,
                customSkills: profile.customSkills,
                products: profile.products,
                materials: profile.materials,
                availability: profile.availability,
                minProjectValue: profile.minProjectValue,
                maxProjectValue: profile.maxProjectValue,
                turnaroundDays: profile.turnaroundDays,
                city: profile.city,
                shipsNationwide: profile.shipsNationwide,
                completedProjects: profile.completedProjects,
                craftHeadline: profile.craftHeadline,
                craftTags: profile.skills,
              },
            );
            return {
              id: request._id,
              title: request.title,
              budgetInr: request.budgetInr,
              deadline: request.deadline,
              city: request.city,
              skills: request.requiredSkills,
              matchScore: result.score,
              eligible: result.eligible,
              reason: result.reasons[0] ?? "A partial match for this brief.",
            };
          })
          .filter((match) => match.eligible)
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, 3);
        makerWorkspace = {
          id: profile.userId,
          name: profile.displayName,
          headline: profile.craftHeadline,
          city: profile.city,
          availability: profile.availability,
          completedProjects: completed,
          activeProjects: active,
          confirmedEarningsInr: paid,
          pendingEarningsInr: pending,
          pendingQuotes: quotes.filter((quote) => quote.status === "submitted").length,
          invitations: taskRows.filter((task) => ["invited", "accepted", "in_progress"].includes(task.status)).length,
          averageRating: reviewRows.length > 0 ? Math.round((reviewRows.reduce((sum, review) => sum + review.rating, 0) / reviewRows.length) * 10) / 10 : null,
          reviewCount: reviewRows.length,
          portfolioCount: portfolio.length,
          matches,
          sampleLabel: DEMO_LABEL,
        };
      }
    }

    return {
      seedKey: DEMO_SEED_KEY,
      demoLabel: DEMO_LABEL,
      counts,
      artisans: artisans.filter((artisan) => artisan !== null),
      plans,
      passports,
      makerWorkspace,
    };
  },
});
