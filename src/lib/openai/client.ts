import "server-only";
import OpenAI from "openai";

let client: OpenAI | undefined;

export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL);
}

export function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_NOT_CONFIGURED");
  client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 45_000, maxRetries: 1 });
  return client;
}

export function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL ?? "";
}
