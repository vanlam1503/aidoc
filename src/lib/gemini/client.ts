import "server-only";
import { GoogleGenAI, ThinkingLevel, type Content } from "@google/genai";

export const defaultGeminiModel = "gemini-3.5-flash-lite";

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || defaultGeminiModel;
}

export function getGeminiTimeoutMs(): number {
  const value = Number(process.env.GEMINI_TIMEOUT_MS);
  return Number.isInteger(value) && value >= 10_000 && value <= 180_000 ? value : 90_000;
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim()) && /^gemini-[a-zA-Z0-9._-]+$/.test(getGeminiModel());
}

export type AssistantMessage = { role: "user" | "assistant"; content: string };

export function streamGeminiResponse({ instructions, messages, signal }: {
  instructions: string;
  messages: AssistantMessage[];
  signal: AbortSignal;
}) {
  if (!isGeminiConfigured()) throw new Error("GEMINI_NOT_CONFIGURED");
  const model = getGeminiModel();
  const client = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!.trim(),
    enterprise: false,
    httpOptions: { timeout: getGeminiTimeoutMs(), retryOptions: { attempts: 1 } },
  });
  // Failed/retried requests can leave adjacent user turns in stored history.
  // Merge them into one turn without promoting user content to instructions.
  const contents: Content[] = [];
  for (const message of messages) {
    const role = message.role === "assistant" ? "model" : "user";
    const previous = contents.at(-1);
    if (previous?.role === role) previous.parts!.push({ text: `\n\n${message.content}` });
    else contents.push({ role, parts: [{ text: message.content }] });
  }
  return client.models.generateContentStream({
    model,
    contents,
    config: {
      systemInstruction: instructions,
      maxOutputTokens: 900,
      abortSignal: signal,
      // One upstream generation per quota reservation, with no continuation calls.
      automaticContinuation: false,
      ...(model.startsWith("gemini-3") ? { thinkingConfig: { thinkingLevel: model.includes("flash-lite") ? ThinkingLevel.MINIMAL : ThinkingLevel.LOW, includeThoughts: false } } : {}),
    },
  });
}
