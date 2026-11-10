import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from "./taxonomy";

export type FileRefInput = {
  storageId: Id<"_storage">;
  name?: string;
  contentType?: string;
  size?: number;
};

type Ctx = QueryCtx | MutationCtx;

/** Re-checks the stored object's real metadata, never the browser's claim. */
export async function validateImageRef(ctx: Ctx, ref: FileRefInput) {
  const meta = await ctx.db.system.get(ref.storageId);
  if (!meta) throw new Error("INVALID_FILE: that upload could not be found.");
  if (meta.size > MAX_UPLOAD_BYTES) {
    throw new Error("INVALID_FILE: images must be 8 MB or smaller.");
  }
  if (!ALLOWED_IMAGE_TYPES.includes(meta.contentType ?? "")) {
    throw new Error("INVALID_FILE: upload a PNG, JPG or WebP image.");
  }
  return {
    storageId: ref.storageId,
    name: ref.name?.replace(/[^\w .-]/g, "").slice(0, 120) || undefined,
    contentType: meta.contentType,
    size: meta.size,
  };
}

export async function validateImageRefs(ctx: Ctx, refs: FileRefInput[]) {
  if (refs.length > 6) throw new Error("INVALID_FILE: up to 6 images per upload.");
  const validated = [];
  for (const ref of refs) validated.push(await validateImageRef(ctx, ref));
  return validated;
}

/**
 * Resolves private storage ids to URLs. Callers must have already checked that
 * the viewer is allowed to see the document holding the reference.
 */
export async function fileUrl(ctx: Ctx, ref: FileRefInput) {
  return await ctx.storage.getUrl(ref.storageId);
}

export async function fileUrls<T extends FileRefInput>(ctx: Ctx, refs: T[]) {
  return await Promise.all(
    refs.map(async (ref) => ({
      ...ref,
      url: await ctx.storage.getUrl(ref.storageId),
    })),
  );
}
