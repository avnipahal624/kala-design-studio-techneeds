import { query } from "./_generated/server";

/**
 * Tells the client whether an AI narrative provider is configured, so the UI
 * can show an honest "unavailable" state instead of fabricated output.
 */
export const status = query({
  args: {},
  handler: async () => ({
    configured: Boolean(process.env.VLY_INTEGRATION_KEY),
    provider: process.env.VLY_INTEGRATION_KEY ? "vly-gateway" : null,
    capabilities: {
      textNarrative: Boolean(process.env.VLY_INTEGRATION_KEY),
      visionAnalysis: false,
      imageGeneration: false,
    },
  }),
});
