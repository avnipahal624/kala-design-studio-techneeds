import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
  CUSTOMER: "customer",
  ARTISAN: "artisan",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
  v.literal(ROLES.CUSTOMER),
  v.literal(ROLES.ARTISAN),
);
export type Role = Infer<typeof roleValidator>;

export const layerValidator = v.object({
  id: v.string(),
  kind: v.union(v.literal("motif"), v.literal("text")),
  motifId: v.optional(v.string()),
  text: v.optional(v.string()),
  fontFamily: v.optional(v.string()),
  x: v.number(),
  y: v.number(),
  size: v.number(),
  rotation: v.number(),
  color: v.string(),
  opacity: v.number(),
});

export const canvasValidator = v.object({
  productType: v.string(),
  silhouette: v.string(),
  fabricColor: v.string(),
  patternId: v.optional(v.string()),
  layers: v.array(layerValidator),
});

/* ------------------------------------------------------------------ */
/* Marketplace primitives                                              */
/* ------------------------------------------------------------------ */

/** An uploaded file. URLs are never stored — they are resolved behind an
 *  authorisation check in `files.ts`. */
export const fileRefValidator = v.object({
  storageId: v.id("_storage"),
  name: v.optional(v.string()),
  contentType: v.optional(v.string()),
  size: v.optional(v.number()),
});

export const moneyValidator = v.number();

export const verificationStatusValidator = v.union(
  v.literal("not_submitted"),
  v.literal("pending"),
  v.literal("verified"),
  v.literal("info_required"),
  v.literal("rejected"),
  v.literal("suspended"),
);

export const requestStatusValidator = v.union(
  v.literal("draft"),
  v.literal("open"),
  v.literal("quote_selected"),
  v.literal("closed"),
  v.literal("cancelled"),
);

export const quoteStatusValidator = v.union(
  v.literal("submitted"),
  v.literal("accepted"),
  v.literal("declined"),
  v.literal("withdrawn"),
  v.literal("expired"),
);

export const projectStatusValidator = v.union(
  v.literal("awaiting_payment"),
  v.literal("funded"),
  v.literal("in_production"),
  v.literal("review_pending"),
  v.literal("delivered"),
  v.literal("completed"),
  v.literal("disputed"),
  v.literal("cancelled"),
  v.literal("refunded"),
);

export const paymentStatusValidator = v.union(
  v.literal("awaiting_payment"),
  v.literal("pending"),
  v.literal("confirmed"),
  v.literal("settled"),
  v.literal("refunded"),
  v.literal("failed"),
);

export const feasibilityVerdictValidator = v.union(
  v.literal("likely_feasible"),
  v.literal("needs_artisan_review"),
  v.literal("potentially_impractical"),
);

export const kalaProofTypeValidator = v.union(
  v.literal("request_created"),
  v.literal("quote_requested"),
  v.literal("quote_submitted"),
  v.literal("quote_accepted"),
  v.literal("concept_uploaded"),
  v.literal("concept_approved"),
  v.literal("revision_requested"),
  v.literal("payment_order_created"),
  v.literal("payment_confirmed"),
  v.literal("production_started"),
  v.literal("progress_uploaded"),
  v.literal("product_dispatched"),
  v.literal("product_received"),
  v.literal("condition_documented"),
  v.literal("quality_reviewed"),
  v.literal("product_shipped"),
  v.literal("product_delivered"),
  v.literal("review_period_started"),
  v.literal("dispute_opened"),
  v.literal("dispute_updated"),
  v.literal("dispute_resolved"),
  v.literal("payout_processed"),
  v.literal("project_completed"),
  v.literal("note"),
);

export const disputeCategoryValidator = v.union(
  v.literal("payment_issue"),
  v.literal("work_not_started"),
  v.literal("missed_deadline"),
  v.literal("not_as_approved"),
  v.literal("damaged"),
  v.literal("lost"),
  v.literal("incomplete"),
  v.literal("excessive_revisions"),
  v.literal("shipping_problem"),
  v.literal("misrepresentation"),
  v.literal("other"),
);

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove

      // KALकारी profile — reference preferences only, no sensitive data.
      displayName: v.optional(v.string()),
      language: v.optional(v.string()),
      craftInterests: v.optional(v.array(v.string())),
      stylePreferences: v.optional(v.array(v.string())),
      onboardedAt: v.optional(v.number()),

      phone: v.optional(v.string()),
      phoneVerifiedAt: v.optional(v.number()),
      city: v.optional(v.string()),
      suspendedAt: v.optional(v.number()),
      suspendedReason: v.optional(v.string()),
      deletionRequestedAt: v.optional(v.number()),
      lastActiveAt: v.optional(v.number()),
    }).index("email", ["email"]), // index for the email. do not remove or modify

    inspirations: defineTable({
      userId: v.id("users"),
      storageId: v.optional(v.id("_storage")),
      imageUrl: v.string(),
      fileName: v.string(),
      productType: v.string(),
      palette: v.array(v.string()),
      /** Structured image measurements + rule-based analysis (validated on write). */
      analysis: v.any(),
      concept: v.optional(v.any()),
      craftId: v.optional(v.string()),
      designId: v.optional(v.id("designs")),
      title: v.optional(v.string()),
    })
      .index("by_user", ["userId"])
      .index("by_design", ["designId"]),

    designs: defineTable({
      userId: v.id("users"),
      title: v.string(),
      productType: v.string(),
      craftId: v.optional(v.string()),
      palette: v.array(v.string()),
      canvas: canvasValidator,
      inspirationId: v.optional(v.id("inspirations")),
      versionCount: v.number(),
      updatedAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_user_updated", ["userId", "updatedAt"])
      .index("by_inspiration", ["inspirationId"]),

    /** Immutable snapshots. Never updated in place. */
    designVersions: defineTable({
      designId: v.id("designs"),
      userId: v.id("users"),
      version: v.number(),
      canvas: canvasValidator,
      note: v.optional(v.string()),
    })
      .index("by_design", ["designId"])
      .index("by_design_version", ["designId", "version"]),

    /** AI call log — metadata only, never prompt contents or secrets. */
    aiRuns: defineTable({
      userId: v.id("users"),
      kind: v.string(),
      provider: v.string(),
      model: v.optional(v.string()),
      status: v.string(),
      latencyMs: v.optional(v.number()),
      errorCode: v.optional(v.string()),
    }).index("by_user", ["userId"]),

    /* ---------------------------------------------------------------- */
    /* Profiles                                                          */
    /* ---------------------------------------------------------------- */

    customerProfiles: defineTable({
      userId: v.id("users"),
      city: v.optional(v.string()),
      serviceRegion: v.optional(v.string()),
      preferredContact: v.optional(v.union(v.literal("email"), v.literal("phone"))),
      notes: v.optional(v.string()),
      marketingOptIn: v.optional(v.boolean()),
      createdAt: v.number(),
    }).index("by_user", ["userId"]),

    artisanProfiles: defineTable({
      userId: v.id("users"),
      displayName: v.string(),
      craftHeadline: v.string(),
      city: v.string(),
      serviceRegion: v.string(),
      mode: v.union(v.literal("individual"), v.literal("collective")),
      yearsExperience: v.number(),
      intro: v.string(),
      languages: v.array(v.string()),
      skills: v.array(v.string()),
      customSkills: v.optional(v.array(v.string())),
      products: v.array(v.string()),
      materials: v.array(v.string()),
      minProjectValue: v.number(),
      maxProjectValue: v.optional(v.number()),
      weeklyCapacity: v.number(),
      turnaroundDays: v.number(),
      shipsNationwide: v.boolean(),
      localOnly: v.boolean(),
      collaborates: v.boolean(),
      availability: v.union(
        v.literal("available"),
        v.literal("limited"),
        v.literal("paused"),
      ),
      workingHours: v.optional(v.string()),
      verificationStatus: verificationStatusValidator,
      craftFitCompletedAt: v.optional(v.number()),
      completedProjects: v.number(),
      ratingSum: v.number(),
      ratingCount: v.number(),
      sampleLabel: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_verification", ["verificationStatus"])
      .index("by_city", ["city"])
      .index("by_updated", ["updatedAt"]),

    savedArtisans: defineTable({
      userId: v.id("users"),
      artisanId: v.id("users"),
      createdAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_user_artisan", ["userId", "artisanId"])
      .index("by_artisan", ["artisanId"]),

    savedJobs: defineTable({
      artisanId: v.id("users"),
      requestId: v.id("customerRequests"),
      createdAt: v.number(),
    })
      .index("by_artisan", ["artisanId"])
      .index("by_artisan_request", ["artisanId", "requestId"]),

    craftFitResponses: defineTable({
      userId: v.id("users"),
      schemaVersion: v.number(),
      answers: v.any(),
      submittedAt: v.number(),
    }).index("by_user", ["userId"]),

    portfolioItems: defineTable({
      artisanId: v.id("users"),
      title: v.string(),
      description: v.string(),
      craftTags: v.array(v.string()),
      materialTags: v.array(v.string()),
      durationDays: v.optional(v.number()),
      externalUrl: v.optional(v.string()),
      image: v.optional(fileRefValidator),
      ownershipDeclared: v.boolean(),
      attribution: v.optional(v.string()),
      reusePermission: v.union(
        v.literal("display_only"),
        v.literal("portfolio_and_promotion"),
        v.literal("reuse_with_credit"),
      ),
      sampleLabel: v.optional(v.string()),
      createdAt: v.number(),
    })
      .index("by_artisan", ["artisanId"])
      .index("by_artisan_created", ["artisanId", "createdAt"]),

    verificationRequests: defineTable({
      userId: v.id("users"),
      requestedRole: v.union(v.literal("artisan"), v.literal("customer")),
      method: v.union(v.literal("manual_review"), v.literal("provider")),
      status: v.union(
        v.literal("pending"),
        v.literal("info_required"),
        v.literal("verified"),
        v.literal("rejected"),
        v.literal("suspended"),
      ),
      applicantNote: v.optional(v.string()),
      reviewerNote: v.optional(v.string()),
      submittedAt: v.number(),
      reviewedAt: v.optional(v.number()),
      reviewerId: v.optional(v.id("users")),
    })
      .index("by_user", ["userId"])
      .index("by_status", ["status"])
      .index("by_status_submitted", ["status", "submittedAt"]),

    /* ---------------------------------------------------------------- */
    /* Requests & matching                                               */
    /* ---------------------------------------------------------------- */

    customerRequests: defineTable({
      customerId: v.id("users"),
      title: v.string(),
      category: v.string(),
      productDescription: v.string(),
      conditionNotes: v.optional(v.string()),
      ownershipConfirmed: v.boolean(),
      description: v.string(),
      craftPreference: v.optional(v.string()),
      colours: v.optional(v.string()),
      placement: v.optional(v.string()),
      materialsKnown: v.optional(v.string()),
      specialInstructions: v.optional(v.string()),
      budgetInr: v.number(),
      deadline: v.optional(v.string()),
      city: v.string(),
      fulfilment: v.union(v.literal("shipping"), v.literal("local_handoff")),
      customerSuppliesProduct: v.boolean(),
      images: v.array(fileRefValidator),
      requiredSkills: v.array(v.string()),
      suggestedMaterials: v.array(v.string()),
      productionNotes: v.array(v.string()),
      briefSummary: v.optional(v.string()),
      missingInfo: v.array(v.string()),
      analysis: v.optional(v.any()),
      demoLabel: v.optional(v.string()),
      status: requestStatusValidator,
      publishedAt: v.number(),
      closedAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_customer", ["customerId"])
      .index("by_customer_created", ["customerId", "createdAt"])
      .index("by_status", ["status"])
      .index("by_status_published", ["status", "publishedAt"])
      .index("by_city", ["city"]),

    quoteRequests: defineTable({
      requestId: v.id("customerRequests"),
      customerId: v.id("users"),
      artisanId: v.id("users"),
      status: v.union(
        v.literal("sent"),
        v.literal("declined"),
        v.literal("quoted"),
        v.literal("withdrawn"),
      ),
      message: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_request", ["requestId"])
      .index("by_artisan", ["artisanId"])
      .index("by_request_artisan", ["requestId", "artisanId"])
      .index("by_artisan_status", ["artisanId", "status"]),

    quotes: defineTable({
      requestId: v.id("customerRequests"),
      projectId: v.optional(v.id("projects")),
      artisanId: v.id("users"),
      customerId: v.id("users"),
      materialsInr: moneyValidator,
      labourInr: moneyValidator,
      preparationInr: moneyValidator,
      finishingInr: moneyValidator,
      packagingInr: moneyValidator,
      deliveryInr: moneyValidator,
      totalInr: moneyValidator,
      platformFeePercent: v.number(),
      platformFeeInr: moneyValidator,
      netPayoutInr: moneyValidator,
      timelineDays: v.number(),
      revisionRounds: v.number(),
      depositPercent: v.number(),
      terms: v.string(),
      note: v.optional(v.string()),
      demoLabel: v.optional(v.string()),
      version: v.number(),
      status: quoteStatusValidator,
      expiresAt: v.optional(v.number()),
      acceptedAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_request", ["requestId"])
      .index("by_artisan", ["artisanId"])
      .index("by_customer", ["customerId"])
      .index("by_project", ["projectId"])
      .index("by_request_artisan", ["requestId", "artisanId"]),

    feasibilityReviews: defineTable({
      requestId: v.id("customerRequests"),
      artisanId: v.id("users"),
      artisanName: v.string(),
      verdict: feasibilityVerdictValidator,
      note: v.string(),
      estimatedDays: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_request", ["requestId"])
      .index("by_artisan", ["artisanId"])
      .index("by_request_artisan", ["requestId", "artisanId"]),

    /* ---------------------------------------------------------------- */
    /* KalaCollab — coordinated multi-artisan production                 */
    /* ---------------------------------------------------------------- */

    collaborationPlans: defineTable({
      requestId: v.id("customerRequests"),
      customerId: v.id("users"),
      title: v.string(),
      status: v.union(
        v.literal("draft"),
        v.literal("awaiting_artisans"),
        v.literal("ready"),
        v.literal("approved"),
        v.literal("in_production"),
        v.literal("completed"),
        v.literal("cancelled"),
      ),
      combinedBudgetInr: v.number(),
      note: v.optional(v.string()),
      demoLabel: v.optional(v.string()),
      approvedAt: v.optional(v.number()),
      completedAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_request", ["requestId"])
      .index("by_customer", ["customerId", "createdAt"])
      .index("by_status", ["status"]),

    collaborationTasks: defineTable({
      planId: v.id("collaborationPlans"),
      requestId: v.id("customerRequests"),
      position: v.number(),
      title: v.string(),
      role: v.string(),
      skill: v.string(),
      brief: v.string(),
      dependsOnPosition: v.optional(v.number()),
      dependsOnPositions: v.optional(v.array(v.number())),
      artisanId: v.optional(v.id("users")),
      matchScore: v.optional(v.number()),
      matchReasons: v.array(v.string()),
      status: v.union(
        v.literal("proposed"),
        v.literal("invited"),
        v.literal("accepted"),
        v.literal("declined"),
        v.literal("in_progress"),
        v.literal("submitted"),
        v.literal("approved"),
      ),
      plannedAmountInr: v.number(),
      quotedAmountInr: v.optional(v.number()),
      artisanNote: v.optional(v.string()),
      demoLabel: v.optional(v.string()),
      startedAt: v.optional(v.number()),
      submittedAt: v.optional(v.number()),
      approvedAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_plan", ["planId"])
      .index("by_plan_position", ["planId", "position"])
      .index("by_artisan", ["artisanId"])
      .index("by_request", ["requestId"]),

    /** Immutable quote snapshots. Every revision writes a new row. */
    quoteVersions: defineTable({
      quoteId: v.id("quotes"),
      requestId: v.id("customerRequests"),
      artisanId: v.id("users"),
      version: v.number(),
      snapshot: v.any(),
      createdAt: v.number(),
    })
      .index("by_quote", ["quoteId"])
      .index("by_quote_version", ["quoteId", "version"]),

    /* ---------------------------------------------------------------- */
    /* Projects, concepts, evidence                                      */
    /* ---------------------------------------------------------------- */

    projects: defineTable({
      requestId: v.id("customerRequests"),
      quoteId: v.id("quotes"),
      customerId: v.id("users"),
      artisanId: v.id("users"),
      title: v.string(),
      acceptedQuote: v.any(),
      amountInr: moneyValidator,
      platformFeeInr: moneyValidator,
      netPayoutInr: moneyValidator,
      status: projectStatusValidator,
      paymentStatus: paymentStatusValidator,
      revisionRoundsUsed: v.number(),
      conceptApprovedAt: v.optional(v.number()),
      fundedAt: v.optional(v.number()),
      startedAt: v.optional(v.number()),
      deliveredAt: v.optional(v.number()),
      completedAt: v.optional(v.number()),
      cancellationReason: v.optional(v.string()),
      demoLabel: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_customer", ["customerId"])
      .index("by_customer_created", ["customerId", "createdAt"])
      .index("by_artisan", ["artisanId"])
      .index("by_artisan_created", ["artisanId", "createdAt"])
      .index("by_status", ["status"])
      .index("by_request", ["requestId"]),

    kalaPassports: defineTable({
      projectId: v.id("projects"),
      customerId: v.id("users"),
      shareToken: v.string(),
      publicEnabled: v.boolean(),
      demoLabel: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_project", ["projectId"])
      .index("by_token", ["shareToken"])
      .index("by_customer", ["customerId", "createdAt"]),

    designConcepts: defineTable({
      projectId: v.id("projects"),
      requestId: v.id("customerRequests"),
      artisanId: v.id("users"),
      customerId: v.id("users"),
      title: v.string(),
      note: v.string(),
      image: fileRefValidator,
      version: v.number(),
      status: v.union(
        v.literal("submitted"),
        v.literal("revision_requested"),
        v.literal("approved"),
        v.literal("superseded"),
      ),
      attribution: v.string(),
      usageNote: v.string(),
      createdAt: v.number(),
      reviewedAt: v.optional(v.number()),
    })
      .index("by_project", ["projectId"])
      .index("by_project_created", ["projectId", "createdAt"])
      .index("by_artisan", ["artisanId"]),

    kalaProofEvents: defineTable({
      projectId: v.id("projects"),
      requestId: v.optional(v.id("customerRequests")),
      type: kalaProofTypeValidator,
      title: v.string(),
      note: v.optional(v.string()),
      attachments: v.array(fileRefValidator),
      actorId: v.optional(v.id("users")),
      actorRole: v.union(
        v.literal("customer"),
        v.literal("artisan"),
        v.literal("admin"),
        v.literal("system"),
      ),
      visibility: v.union(
        v.literal("participants"),
        v.literal("customer"),
        v.literal("artisan"),
        v.literal("admin"),
      ),
      demoLabel: v.optional(v.string()),
      createdAt: v.number(),
    })
      .index("by_project", ["projectId"])
      .index("by_project_created", ["projectId", "createdAt"])
      .index("by_actor", ["actorId"]),

    orderMilestones: defineTable({
      projectId: v.id("projects"),
      title: v.string(),
      amountInr: moneyValidator,
      position: v.number(),
      status: v.union(
        v.literal("pending"),
        v.literal("submitted"),
        v.literal("approved"),
        v.literal("released"),
      ),
      note: v.optional(v.string()),
      dueAt: v.optional(v.number()),
      approvedAt: v.optional(v.number()),
      createdAt: v.number(),
    })
      .index("by_project", ["projectId"])
      .index("by_project_position", ["projectId", "position"]),

    /* ---------------------------------------------------------------- */
    /* Payments                                                          */
    /* ---------------------------------------------------------------- */

    paymentOrders: defineTable({
      projectId: v.id("projects"),
      customerId: v.id("users"),
      provider: v.union(v.literal("razorpay"), v.literal("sandbox")),
      mode: v.union(v.literal("live"), v.literal("sandbox")),
      providerOrderId: v.optional(v.string()),
      amountInr: moneyValidator,
      currency: v.literal("INR"),
      status: v.union(
        v.literal("created"),
        v.literal("pending"),
        v.literal("paid"),
        v.literal("failed"),
        v.literal("refunded"),
      ),
      demoLabel: v.optional(v.string()),
      checkoutReference: v.optional(v.string()),
      createdAt: v.number(),
      paidAt: v.optional(v.number()),
    })
      .index("by_project", ["projectId"])
      .index("by_customer", ["customerId"])
      .index("by_provider_order", ["providerOrderId"]),

    paymentTransactions: defineTable({
      paymentOrderId: v.id("paymentOrders"),
      projectId: v.id("projects"),
      provider: v.string(),
      event: v.string(),
      providerPaymentId: v.optional(v.string()),
      idempotencyKey: v.string(),
      amountInr: moneyValidator,
      signatureVerified: v.boolean(),
      createdAt: v.number(),
    })
      .index("by_project", ["projectId"])
      .index("by_order", ["paymentOrderId"])
      .index("by_idempotency", ["idempotencyKey"]),

    payouts: defineTable({
      projectId: v.id("projects"),
      artisanId: v.id("users"),
      amountInr: moneyValidator,
      platformFeeInr: moneyValidator,
      status: v.union(
        v.literal("pending"),
        v.literal("processing"),
        v.literal("paid"),
        v.literal("failed"),
      ),
      provider: v.string(),
      providerTransferId: v.optional(v.string()),
      note: v.optional(v.string()),
      createdAt: v.number(),
      processedAt: v.optional(v.number()),
    })
      .index("by_artisan", ["artisanId"])
      .index("by_project", ["projectId"])
      .index("by_status", ["status"]),

    /* ---------------------------------------------------------------- */
    /* Messaging                                                         */
    /* ---------------------------------------------------------------- */

    conversations: defineTable({
      customerId: v.id("users"),
      artisanId: v.id("users"),
      scopeType: v.union(v.literal("request"), v.literal("project")),
      scopeId: v.string(),
      requestId: v.optional(v.id("customerRequests")),
      projectId: v.optional(v.id("projects")),
      lastMessageAt: v.number(),
      lastMessagePreview: v.string(),
      createdAt: v.number(),
    })
      .index("by_customer", ["customerId", "lastMessageAt"])
      .index("by_artisan", ["artisanId", "lastMessageAt"])
      .index("by_scope", ["scopeType", "scopeId"]),

    messages: defineTable({
      conversationId: v.id("conversations"),
      senderId: v.id("users"),
      body: v.string(),
      attachments: v.array(fileRefValidator),
      createdAt: v.number(),
      readAt: v.optional(v.number()),
    })
      .index("by_conversation", ["conversationId", "createdAt"])
      .index("by_sender", ["senderId"]),

    /* ---------------------------------------------------------------- */
    /* Trust, disputes, reviews, admin                                   */
    /* ---------------------------------------------------------------- */

    disputes: defineTable({
      projectId: v.id("projects"),
      openedBy: v.id("users"),
      againstId: v.id("users"),
      category: disputeCategoryValidator,
      description: v.string(),
      desiredOutcome: v.string(),
      evidence: v.array(fileRefValidator),
      response: v.optional(v.string()),
      respondedAt: v.optional(v.number()),
      status: v.union(
        v.literal("open"),
        v.literal("awaiting_response"),
        v.literal("under_review"),
        v.literal("resolved"),
        v.literal("appealed"),
        v.literal("closed"),
      ),
      decision: v.optional(
        v.union(
          v.literal("rework"),
          v.literal("partial_refund"),
          v.literal("full_refund"),
          v.literal("release_payment"),
          v.literal("cancellation"),
          v.literal("no_action"),
        ),
      ),
      decisionNote: v.optional(v.string()),
      decidedBy: v.optional(v.id("users")),
      decidedAt: v.optional(v.number()),
      appealNote: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_project", ["projectId"])
      .index("by_status", ["status", "createdAt"])
      .index("by_opened_by", ["openedBy"]),

    reviews: defineTable({
      projectId: v.id("projects"),
      authorId: v.id("users"),
      subjectId: v.id("users"),
      authorRole: v.union(v.literal("customer"), v.literal("artisan")),
      rating: v.number(),
      body: v.string(),
      demoLabel: v.optional(v.string()),
      createdAt: v.number(),
    })
      .index("by_subject", ["subjectId", "createdAt"])
      .index("by_project", ["projectId"])
      .index("by_author", ["authorId"]),

    moderationReports: defineTable({
      reporterId: v.id("users"),
      subjectType: v.union(
        v.literal("user"),
        v.literal("request"),
        v.literal("project"),
        v.literal("message"),
      ),
      subjectId: v.string(),
      reason: v.string(),
      detail: v.string(),
      status: v.union(
        v.literal("open"),
        v.literal("reviewing"),
        v.literal("resolved"),
        v.literal("dismissed"),
      ),
      adminNote: v.optional(v.string()),
      resolvedAt: v.optional(v.number()),
      createdAt: v.number(),
    })
      .index("by_status", ["status", "createdAt"])
      .index("by_reporter", ["reporterId"]),

    riskSignals: defineTable({
      subjectUserId: v.id("users"),
      kind: v.string(),
      severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
      detail: v.string(),
      requestId: v.optional(v.id("customerRequests")),
      reviewedAt: v.optional(v.number()),
      createdAt: v.number(),
    })
      .index("by_subject", ["subjectUserId"])
      .index("by_created", ["createdAt"]),

    demoEntities: defineTable({
      seedKey: v.string(),
      entityType: v.string(),
      entityId: v.string(),
      label: v.optional(v.string()),
      createdAt: v.number(),
    })
      .index("by_seed", ["seedKey"])
      .index("by_seed_label", ["seedKey", "label"])
      .index("by_seed_type", ["seedKey", "entityType"]),

    auditEvents: defineTable({
      actorId: v.optional(v.id("users")),
      actorRole: v.string(),
      action: v.string(),
      subjectType: v.string(),
      subjectId: v.string(),
      detail: v.optional(v.string()),
      createdAt: v.number(),
    })
      .index("by_created", ["createdAt"])
      .index("by_subject", ["subjectType", "subjectId"]),

    notifications: defineTable({
      userId: v.id("users"),
      type: v.string(),
      title: v.string(),
      body: v.string(),
      href: v.optional(v.string()),
      readAt: v.optional(v.number()),
      createdAt: v.number(),
    })
      .index("by_user", ["userId", "createdAt"])
      .index("by_user_read", ["userId", "readAt"]),

    assistantMessages: defineTable({
      userId: v.id("users"),
      role: v.union(v.literal("user"), v.literal("assistant")),
      body: v.string(),
      createdAt: v.number(),
    }).index("by_user", ["userId", "createdAt"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
