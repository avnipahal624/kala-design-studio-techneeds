import { mutation } from "./_generated/server";
import { requireMarketplaceUser } from "./lib/access";

/**
 * Upload handshake. Files are validated again, from storage metadata, when a
 * mutation attaches them to a request, portfolio, concept or message.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireMarketplaceUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});
