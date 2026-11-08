import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getGeminiTimeoutMs, getGeminiModel, isGeminiConfigured, streamGeminiResponse } from "@/lib/gemini/client";

const keyMocks = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock("@/lib/gemini/credentials", () => ({ geminiCredentials: keyMocks }));

const fetchMock = vi.fn<typeof fetch>();

function sse(events: unknown[]) {
  return new Response(events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join(""), { headers: { "content-type": "text/event-stream" } });
}

beforeEach(() => {
  keyMocks.read.mockResolvedValue("test-server-secret");
  vi.stubEnv("GEMINI_MODEL", "");
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("Gemini server adapter", () => {
  it("uses a default model and requires a saved server key and valid model ID", async () => {
    expect(getGeminiModel()).toBe("gemini-3.5-flash-lite");
    expect(await isGeminiConfigured()).toBe(true);
    vi.stubEnv("GEMINI_MODEL", "gemini-custom-model");
    expect(getGeminiModel()).toBe("gemini-custom-model");
    vi.stubEnv("GEMINI_MODEL", "../untrusted-path");
    expect(await isGeminiConfigured()).toBe(false);
    vi.stubEnv("GEMINI_MODEL", "");
    keyMocks.read.mockResolvedValue(null);
    vi.stubEnv("GEMINI_API_KEY", "old-env-key-must-be-ignored");
    expect(await isGeminiConfigured()).toBe(false);
    await expect(streamGeminiResponse({ instructions: "Help", messages: [], signal: new AbortController().signal })).rejects.toThrow("GEMINI_NOT_CONFIGURED");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("bounds the configurable timeout and falls back for invalid values", () => {
    vi.stubEnv("GEMINI_TIMEOUT_MS", "120000");
    expect(getGeminiTimeoutMs()).toBe(120000);
    vi.stubEnv("GEMINI_TIMEOUT_MS", "99999999");
    expect(getGeminiTimeoutMs()).toBe(90000);
    vi.stubEnv("GEMINI_TIMEOUT_MS", "invalid");
    expect(getGeminiTimeoutMs()).toBe(90000);
  });

  it("sends the key in a header, maps conversation roles, and excludes thought text", async () => {
    fetchMock.mockResolvedValueOnce(sse([
      { candidates: [{ content: { role: "model", parts: [{ text: "private reasoning", thought: true }, { text: "Use validated tools." }] } }] },
      { candidates: [{ finishReason: "STOP" }], responseId: "gemini-response-1", usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 4, thoughtsTokenCount: 2 } },
    ]));
    const controller = new AbortController();
    const stream = await streamGeminiResponse({ instructions: "Answer in English.", signal: controller.signal, messages: [
      { role: "user", content: "First attempt" }, { role: "user", content: "Retry" },
      { role: "assistant", content: "Earlier answer" }, { role: "user", content: "Now explain tools" },
    ] });
    const events = [];
    for await (const event of stream) events.push(event);
    expect(events.map((event) => event.text ?? "").join("")).toBe("Use validated tools.");
    expect(events.at(-1)?.usageMetadata?.promptTokenCount).toBe(12);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("generativelanguage.googleapis.com");
    expect(String(url)).toContain("gemini-3.5-flash-lite:streamGenerateContent");
    expect(String(url)).not.toContain("test-server-secret");
    expect(new Headers(init?.headers).get("x-goog-api-key")).toBe("test-server-secret");
    const body = JSON.parse(String(init?.body));
    expect(JSON.stringify(body)).not.toContain("test-server-secret");
    expect(body.systemInstruction.parts[0].text).toBe("Answer in English.");
    expect(body.contents.map((turn: { role: string }) => turn.role)).toEqual(["user", "model", "user"]);
    expect(body.contents[0].parts.map((part: { text: string }) => part.text).join("")).toBe("First attempt\n\nRetry");
    expect(body.generationConfig.maxOutputTokens).toBe(900);
    expect(body.generationConfig.thinkingConfig.includeThoughts).toBe(false);
    expect(body.generationConfig.thinkingConfig.thinkingLevel).toBe("MINIMAL");
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("propagates upstream errors without retrying or embedding the key in the URL", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: 429, status: "RESOURCE_EXHAUSTED", message: "Quota exhausted" } }), { status: 429 }));
    await expect(streamGeminiResponse({ instructions: "Help", messages: [{ role: "user", content: "Hello" }], signal: new AbortController().signal })).rejects.toMatchObject({ status: 429 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
