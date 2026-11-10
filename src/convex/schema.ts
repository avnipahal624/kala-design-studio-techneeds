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

      // KALAकारी profile — reference preferences only, no sensitive data.
      displayName: v.optional(v.string()),
      language: v.optional(v.string()),
      craftInterests: v.optional(v.array(v.string())),
      stylePreferences: v.optional(v.array(v.string())),
      onboardedAt: v.optional(v.number()),
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
  },
  {
    schemaValidation: false,
  },
);

export default schema;
