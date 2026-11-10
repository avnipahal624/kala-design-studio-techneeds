import { query } from "./_generated/server";
import { languageProviderName, languageModelConfigured } from "./lib/ai/languageModel";

/**
 * Tells the client whether an AI provider is configured, so the UI can show an
 * honest "unavailable" state instead of fabricated output.
 */
export const status = query({
  args: {},
  handler: async () => ({
    configured: languageModelConfigured(),
    provider: languageProviderName(),
    capabilities: {
      textNarrative: languageModelConfigured(),
      // No vision provider is wired up. The app must never imply photos were analysed.
      visionAnalysis: false,
      imageGeneration: false,
    },
  }),
});
