"use node";

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { z } from "zod";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import { completeJson, languageModelConfigured } from "./lib/ai/languageModel";

const replySchema = z.object({
  reply: z.string().min(10).max(1400),
  suggestions: z.array(z.string().min(3).max(140)).max(3),
  needsHumanCheck: z.boolean(),
});

const MAX_MESSAGES_PER_HOUR = 20;

type AskResult = {
  status:
    | "unauthenticated"
    | "invalid"
    | "not_found"
    | "rate_limited"
    | "unavailable"
    | "not_configured"
    | "ok";
  reply: string;
  suggestions?: string[];
  needsHumanCheck?: boolean;
};

const LANGUAGE_INSTRUCTION: Record<string, string> = {
  en: "Reply in clear English.",
  hi: "Reply in natural Hindi using Devanagari script.",
  hinglish:
    "Reply in friendly Hinglish (roman Hindi mixed with English), the way Indian craft customers speak.",
};

export const ask = action({
  args: {
    message: v.string(),
    language: v.union(v.literal("en"), v.literal("hi"), v.literal("hinglish")),
  },
  handler: async (ctx, args): Promise<AskResult> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { status: "unauthenticated", reply: "Sign in so KalaSaathi can help with your work." };
    }
    const message = args.message.trim().slice(0, 1000);
    if (message.length < 2) {
      return { status: "invalid" as const, reply: "Write a question and I will help." };
    }

    const context = await ctx.runQuery(internal.kalasaathiData.contextForUser, { userId });
    if (!context) return { status: "not_found" as const, reply: "Account not found." };

    const history = await ctx.runQuery(internal.kalasaathiData.recentHistory, { userId });
    const hourlyUserMessages = history.filter(
      (row: { role: "user" | "assistant"; createdAt: number }) =>
        row.role === "user" && row.createdAt > Date.now() - 60 * 60 * 1000,
    ).length;
    if (hourlyUserMessages >= MAX_MESSAGES_PER_HOUR) {
      return {
        status: "rate_limited" as const,
        reply: "You have reached the KalaSaathi limit for this hour. Your project screens still work normally.",
      };
    }

    await ctx.runMutation(internal.kalasaathiData.recordAssistant, {
      userId,
      role: "user",
      body: message,
    });

    const fallbackReply = languageModelConfigured()
      ? "KalaSaathi is temporarily unavailable. You can still use your KalaProof timeline, quotes and messages directly."
      : "KalaSaathi needs a language-model key to be configured. Until then, your brief, quotes, payments and KalaProof work without AI.";
    const fallback: AskResult = {
      status: languageModelConfigured() ? "unavailable" : "not_configured",
      reply: fallbackReply,
      suggestions: [
        "Explain what the platform fee covers",
        "Help me describe my customisation idea",
        "What should I ask an artisan before accepting a quote?",
      ],
    };

    if (!languageModelConfigured()) {
      await ctx.runMutation(internal.kalasaathiData.recordAssistant, {
        userId,
        role: "assistant",
        body: fallbackReply,
      });
      return fallback;
    }

    const result = await completeJson(
      [
        {
          role: "system",
          content: [
            "You are KalaSaathi, the bilingual craft companion inside KALकारी, an Indian artisan-first customisation marketplace.",
            "Tagline: Your Creative Craft Companion.",
            "HARD RULES:",
            "- Never generate, describe as finished, or copy artwork, motifs, sketches or portfolio designs. Artisans create the design; you may help the customer describe an idea in words.",
            "- Never accept a quote, pay, change a price, release a payout, approve a concept, grant rights or claim a verification result. Ask the user to do those actions in the app.",
            "- Never invent orders, payouts, matches, reviews, artisan identities or statuses. Only use the CONTEXT and CONVERSATION below. If something is absent, say it is not in your view.",
            "- Do not ask for passwords, OTPs, card numbers, bank details or identity documents.",
            "- Do not encourage moving payments off the platform.",
            "- Keep the reply under 140 words, warm and practical, with at most three suggested next prompts.",
            LANGUAGE_INSTRUCTION[args.language] ?? LANGUAGE_INSTRUCTION.en,
            'Reply with JSON only: {"reply": string, "suggestions": string[], "needsHumanCheck": boolean}.',
            "needsHumanCheck should be true when the question involves money, disputes, verification, safety or anything outside the context.",
          ].join("\n"),
        },
        {
          role: "user",
          content: `CONTEXT (authorised, ${new Date().toISOString()}):\n${JSON.stringify(context)}\n\nCONVERSATION:\n${history
            .slice(-8)
            .map((row: { role: "user" | "assistant"; body: string }) => `${row.role === "user" ? "User" : "KalaSaathi"}: ${row.body}`)
            .join("\n")}\n\nUser: ${message}`,
        },
      ],
      replySchema,
      { maxTokens: 600 },
    );

    try {
      await ctx.runMutation(internal.aiLog.record, {
        userId,
        kind: "kalasaathi",
        provider: result.status === "ok" ? result.provider : "none",
        model: result.status === "ok" ? result.model : undefined,
        status: result.status,
        latencyMs: result.status === "ok" ? result.latencyMs : undefined,
        errorCode: result.status === "ok" ? undefined : result.status,
      });
    } catch {
      // logging is best-effort
    }

    if (result.status !== "ok") {
      await ctx.runMutation(internal.kalasaathiData.recordAssistant, {
        userId,
        role: "assistant",
        body: result.reason,
      });
      return { status: result.status, reply: fallbackReply, suggestions: fallback.suggestions };
    }

    await ctx.runMutation(internal.kalasaathiData.recordAssistant, {
      userId,
      role: "assistant",
      body: result.data.reply,
    });
    return {
      status: "ok",
      reply: result.data.reply,
      suggestions: result.data.suggestions,
      needsHumanCheck: result.data.needsHumanCheck,
    };
  },
});
