import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { requireOwned, requireUserId } from "./lib/guards";
import { canvasValidator } from "./schema";

const MAX_LAYERS = 40;

/**
 * Canvas payloads come from the browser, so they are treated as untrusted:
 * geometry is clamped, strings are length-capped and layer count is bounded
 * before anything is persisted.
 */
function sanitizeCanvas(input: {
  productType: string;
  silhouette: string;
  fabricColor: string;
  patternId?: string;
  layers: {
    id: string;
    kind: "motif" | "text";
    motifId?: string;
    text?: string;
    fontFamily?: string;
    x: number;
    y: number;
    size: number;
    rotation: number;
    color: string;
    opacity: number;
  }[];
}) {
  const clamp = (n: number, min: number, max: number) =>
    Math.min(max, Math.max(min, Number.isFinite(n) ? n : min));
  const hex = (value: string) =>
    /^#[0-9a-fA-F]{3,8}$/.test(value) ? value : "#7b2040";

  return {
    productType: input.productType.slice(0, 40),
    silhouette: input.silhouette.slice(0, 60),
    fabricColor: hex(input.fabricColor),
    patternId: input.patternId?.slice(0, 40),
    layers: input.layers.slice(0, MAX_LAYERS).map((layer, index) => ({
      id: layer.id.slice(0, 40) || `layer_${index}`,
      kind: layer.kind,
      motifId: layer.motifId?.slice(0, 40),
      text: layer.text?.slice(0, 120),
      fontFamily: layer.fontFamily?.slice(0, 60),
      x: clamp(layer.x, -200, 1100),
      y: clamp(layer.y, -200, 1100),
      size: clamp(layer.size, 16, 760),
      rotation: clamp(layer.rotation, -360, 360),
      color: hex(layer.color),
      opacity: clamp(layer.opacity, 0.05, 1),
    })),
  };
}

function summary(design: {
  _id: Id<"designs">;
  title: string;
  productType: string;
  craftId?: string;
  palette: string[];
  canvas: {
    productType: string;
    silhouette: string;
    fabricColor: string;
    patternId?: string;
    layers: {
      id: string;
      kind: "motif" | "text";
      motifId?: string;
      text?: string;
      fontFamily?: string;
      x: number;
      y: number;
      size: number;
      rotation: number;
      color: string;
      opacity: number;
    }[];
  };
  versionCount: number;
  updatedAt: number;
}) {
  return {
    _id: design._id,
    title: design.title,
    productType: design.productType,
    craftId: design.craftId,
    palette: design.palette,
    canvas: design.canvas,
    fabricColor: design.canvas.fabricColor,
    layerCount: design.canvas.layers.length,
    versionCount: design.versionCount,
    updatedAt: design.updatedAt,
  };
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const designs = await ctx.db
      .query("designs")
      .withIndex("by_user_updated", (q) => q.eq("userId", userId))
      .order("desc")
      .take(40);
    return designs.map(summary);
  },
});

export const get = query({
  args: { designId: v.id("designs") },
  handler: async (ctx, { designId }) => {
    const userId = await requireUserId(ctx);
    return await requireOwned(ctx, "designs", designId, userId);
  },
});

export const versions = query({
  args: { designId: v.id("designs") },
  handler: async (ctx, { designId }) => {
    const userId = await requireUserId(ctx);
    await requireOwned(ctx, "designs", designId, userId);
    const rows = await ctx.db
      .query("designVersions")
      .withIndex("by_design", (q) => q.eq("designId", designId))
      .collect();
    return rows
      .sort((a, b) => b.version - a.version)
      .map((row) => ({
        _id: row._id,
        version: row.version,
        note: row.note,
        _creationTime: row._creationTime,
        layerCount: row.canvas.layers.length,
        fabricColor: row.canvas.fabricColor,
        canvas: row.canvas,
      }));
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    productType: v.string(),
    craftId: v.optional(v.string()),
    palette: v.array(v.string()),
    canvas: canvasValidator,
    inspirationId: v.optional(v.id("inspirations")),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const canvas = sanitizeCanvas(args.canvas);
    const now = Date.now();

    if (args.inspirationId) {
      await requireOwned(ctx, "inspirations", args.inspirationId, userId);
    }

    const designId = await ctx.db.insert("designs", {
      userId,
      title: args.title.trim().slice(0, 90) || "Untitled creation",
      productType: args.productType,
      craftId: args.craftId,
      palette: args.palette.slice(0, 6),
      canvas,
      inspirationId: args.inspirationId,
      versionCount: 1,
      updatedAt: now,
    });

    await ctx.db.insert("designVersions", {
      designId,
      userId,
      version: 1,
      canvas,
      note: args.note ?? "First version",
    });

    if (args.inspirationId) {
      await ctx.db.patch(args.inspirationId, { designId });
    }

    return designId;
  },
});

/**
 * Saves the canvas. Each successful save writes an immutable version row; the
 * design's own row only tracks the latest state.
 */
export const save = mutation({
  args: {
    designId: v.id("designs"),
    canvas: canvasValidator,
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const design = await requireOwned(ctx, "designs", args.designId, userId);
    const canvas = sanitizeCanvas(args.canvas);
    const nextVersion = design.versionCount + 1;

    await ctx.db.patch(args.designId, {
      canvas,
      versionCount: nextVersion,
      updatedAt: Date.now(),
    });
    await ctx.db.insert("designVersions", {
      designId: args.designId,
      userId,
      version: nextVersion,
      canvas,
      note: args.note?.slice(0, 120) ?? `Version ${nextVersion}`,
    });
    return nextVersion;
  },
});

export const rename = mutation({
  args: { designId: v.id("designs"), title: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    await requireOwned(ctx, "designs", args.designId, userId);
    const title = args.title.trim().slice(0, 90);
    if (!title) throw new Error("INVALID_TITLE: give your creation a name.");
    await ctx.db.patch(args.designId, { title, updatedAt: Date.now() });
  },
});

/**
 * Restoring history creates a new version rather than rewriting an older one,
 * so a version that was shown to an artisan is never silently changed.
 */
export const restoreVersion = mutation({
  args: { designId: v.id("designs"), version: v.number() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const design = await requireOwned(ctx, "designs", args.designId, userId);
    const row = await ctx.db
      .query("designVersions")
      .withIndex("by_design_version", (q) =>
        q.eq("designId", args.designId).eq("version", args.version),
      )
      .unique();
    if (!row) throw new Error("NOT_FOUND: that version does not exist.");

    const canvas = sanitizeCanvas(row.canvas);
    const nextVersion = design.versionCount + 1;
    await ctx.db.patch(args.designId, {
      canvas,
      versionCount: nextVersion,
      updatedAt: Date.now(),
    });
    await ctx.db.insert("designVersions", {
      designId: args.designId,
      userId,
      version: nextVersion,
      canvas,
      note: `Restored from v${args.version}`,
    });
    return nextVersion;
  },
});

export const duplicate = mutation({
  args: { designId: v.id("designs") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const design = await requireOwned(ctx, "designs", args.designId, userId);
    const now = Date.now();
    const newId = await ctx.db.insert("designs", {
      userId,
      title: `${design.title} (copy)`.slice(0, 90),
      productType: design.productType,
      craftId: design.craftId,
      palette: design.palette,
      canvas: sanitizeCanvas(design.canvas),
      versionCount: 1,
      updatedAt: now,
    });
    await ctx.db.insert("designVersions", {
      designId: newId,
      userId,
      version: 1,
      canvas: sanitizeCanvas(design.canvas),
      note: `Duplicated from ${design.title}`,
    });
    return newId;
  },
});

export const remove = mutation({
  args: { designId: v.id("designs") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    await requireOwned(ctx, "designs", args.designId, userId);
    const versions = await ctx.db
      .query("designVersions")
      .withIndex("by_design", (q) => q.eq("designId", args.designId))
      .collect();
    for (const row of versions) await ctx.db.delete(row._id);
    await ctx.db.delete(args.designId);
  },
});
