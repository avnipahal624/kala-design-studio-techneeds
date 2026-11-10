import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireOwned, requireUserId } from "./lib/guards";

const MAX_ANALYSIS_BYTES = 24_000;

function assertSmallPayload(label: string, value: unknown) {
  const size = JSON.stringify(value ?? null).length;
  if (size > MAX_ANALYSIS_BYTES) {
    throw new Error(`INVALID_${label}: analysis payload is too large.`);
  }
}

/**
 * Secure upload handshake: the browser asks for a one-time URL, uploads the
 * file straight to storage, then calls `create` with the returned id. File type
 * and size are validated in the browser *and* re-checked here.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUserId(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
    storageId: v.optional(v.id("_storage")),
    fileName: v.string(),
    productType: v.string(),
    palette: v.array(v.string()),
    analysis: v.any(),
    concept: v.optional(v.any()),
    craftId: v.optional(v.string()),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    if (!/^[\w .-]{1,120}$/.test(args.fileName)) {
      throw new Error("INVALID_FILE: unsupported file name.");
    }
    if (!/^image\/(png|jpe?g|webp|avif)$/i.test(String(args.analysis?.mimeType ?? ""))) {
      throw new Error("INVALID_FILE: upload a PNG, JPG, WebP or AVIF image.");
    }
    if (typeof args.analysis?.byteSize === "number" && args.analysis.byteSize > 8 * 1024 * 1024) {
      throw new Error("INVALID_FILE: images must be 8 MB or smaller.");
    }
    assertSmallPayload("ANALYSIS", args.analysis);
    assertSmallPayload("CONCEPT", args.concept);

    let imageUrl = "";
    if (args.storageId) {
      const meta = await ctx.db.system.get(args.storageId);
      if (!meta) throw new Error("INVALID_FILE: upload was not found.");
      if (meta.size > 8 * 1024 * 1024) {
        await ctx.storage.delete(args.storageId);
        throw new Error("INVALID_FILE: images must be 8 MB or smaller.");
      }
      imageUrl = (await ctx.storage.getUrl(args.storageId)) ?? "";
    }

    const id = await ctx.db.insert("inspirations", {
      userId,
      storageId: args.storageId,
      imageUrl,
      fileName: args.fileName,
      productType: args.productType,
      palette: args.palette.slice(0, 8),
      analysis: args.analysis,
      concept: args.concept,
      craftId: args.craftId,
      title: args.title?.slice(0, 90),
    });

    return id;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const rows = await ctx.db
      .query("inspirations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(30);

    return Promise.all(
      rows.map(async (row) => ({
        _id: row._id,
        imageUrl: row.imageUrl || (row.storageId ? ((await ctx.storage.getUrl(row.storageId)) ?? "") : ""),
        fileName: row.fileName,
        productType: row.productType,
        palette: row.palette,
        craftId: row.craftId,
        designId: row.designId,
        title: row.title,
        _creationTime: row._creationTime,
        analysis: row.analysis,
        concept: row.concept,
      })),
    );
  },
});

export const get = query({
  args: { inspirationId: v.id("inspirations") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const row = await requireOwned(ctx, "inspirations", args.inspirationId, userId);
    return {
      ...row,
      imageUrl: row.imageUrl || (row.storageId ? ((await ctx.storage.getUrl(row.storageId)) ?? "") : ""),
    };
  },
});

export const setConcept = mutation({
  args: {
    inspirationId: v.id("inspirations"),
    craftId: v.string(),
    concept: v.any(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    await requireOwned(ctx, "inspirations", args.inspirationId, userId);
    assertSmallPayload("CONCEPT", args.concept);
    await ctx.db.patch(args.inspirationId, {
      craftId: args.craftId,
      concept: args.concept,
    });
  },
});

export const remove = mutation({
  args: { inspirationId: v.id("inspirations") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const row = await requireOwned(ctx, "inspirations", args.inspirationId, userId);
    if (row.storageId) await ctx.storage.delete(row.storageId);
    await ctx.db.delete(args.inspirationId);
  },
});
