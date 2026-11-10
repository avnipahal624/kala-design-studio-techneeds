import { z } from "zod";

/**
 * Language-model boundary.
 *
 * Every model call in the app goes through `completeJson`, which enforces a
 * timeout, validates the response against a Zod schema, and reports failures
 * as typed results instead of throwing fabricated content into the UI.
 */

export type ModelResult<T> =
  | { status: "ok"; data: T; model: string; provider: string; latencyMs: number }
  | { status: "unavailable"; reason: string }
  | { status: "invalid"; reason: string }
  | { status: "rate_limited"; reason: string };

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

type CompletionResponse = {
  choices?: { message?: { content?: string } }[];
};

const TIMEOUT_MS = 22_000;

export function languageModelConfigured() {
  return Boolean(process.env.VLY_INTEGRATION_KEY);
}

export async function completeJson<T>(
  messages: ChatMessage[],
  schema: z.ZodType<T>,
  options: { model?: string; timeoutMs?: number; maxTokens?: number } = {},
): Promise<ModelResult<T>> {
  const key = process.env.VLY_INTEGRATION_KEY;
  if (!key) {
    return {
      status: "unavailable",
      reason: "No language-model provider is configured for this deployment.",
    };
  }

  // VLY's AI gateway is OpenAI-compatible.
  const baseUrl =
    process.env.VLY_AI_BASE_URL ?? "https://integrations.vly.ai/v1/llm";
  const model = options.model ?? "gpt-4o-mini";
  const started = Date.now();

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const response = await Promise.race([
      fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.6,
          max_tokens: options.maxTokens ?? 700,
        }),
      }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("AI_TIMEOUT")),
          options.timeoutMs ?? TIMEOUT_MS,
        );
      }),
    ]);

    if (!response.ok) {
      return {
        status: "unavailable",
        reason: `Provider responded with ${response.status}.`,
      };
    }

    const payload = (await response.json()) as
      | CompletionResponse
      | { success?: boolean; data?: CompletionResponse; error?: string };

    // The gateway may wrap results, so unwrap defensively.
    const completion =
      "choices" in payload && Array.isArray(payload.choices)
        ? payload
        : ((payload as { data?: CompletionResponse }).data ?? null);

    const raw = completion?.choices?.[0]?.message?.content;
    if (!raw) {
      return { status: "unavailable", reason: "The provider returned no text." };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(stripFences(raw));
    } catch {
      return { status: "invalid", reason: "The model did not return valid JSON." };
    }

    const validated = schema.safeParse(parsed);
    if (!validated.success) {
      return { status: "invalid", reason: "The model output failed schema validation." };
    }

    return {
      status: "ok",
      data: validated.data,
      model,
      provider: "vly-gateway",
      latencyMs: Date.now() - started,
    };
  } catch (error) {
    return {
      status: "unavailable",
      reason:
        error instanceof Error && error.message === "AI_TIMEOUT"
          ? "The model timed out."
          : "The model could not be reached.",
    };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function stripFences(text: string) {
  const trimmed = text.trim();
  if (!trimmed.startsWith("```")) return trimmed;
  return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
}
