import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, FinishReason, GenerateContentResponse } from "@google/genai";

const mocks = vi.hoisted(() => ({ key: vi.fn(), stream: vi.fn(), retrieve: vi.fn(), startChat: vi.fn(), finishChat: vi.fn(), failChat: vi.fn(), listConversations: vi.fn(), getConversation: vi.fn() }));
vi.mock("@/lib/gemini/credentials", () => ({ geminiCredentials: { read: mocks.key } }));
vi.mock("@/lib/content/retriever", () => ({ localRetriever: { retrieve: mocks.retrieve } }));
vi.mock("@/lib/gemini/client", async (original) => ({ ...await original<typeof import("@/lib/gemini/client")>(), streamGeminiResponse: mocks.stream }));
vi.mock("@/lib/local/store", async (original) => ({ ...await original<typeof import("@/lib/local/store")>(), localStore: mocks }));
import { localStore, LocalStoreError } from "@/lib/local/store";
import { GET, POST } from "@/app/api/chat/route";

function chunk(value: Partial<GenerateContentResponse>) { return Object.assign(new GenerateContentResponse(), value); }
async function* events(chunks: GenerateContentResponse[]) { yield* chunks; }
function request(body: Record<string, unknown> = { message: "Explain tools" }, origin = "http://localhost:3001") {
  return new Request("http://localhost:3001/api/chat", { method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify(body) });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.key.mockResolvedValue("test-key-never-return");
  vi.stubEnv("GEMINI_MODEL", "gemini-3.5-flash-lite");
  vi.stubEnv("GEMINI_TIMEOUT_MS", "90000");
  mocks.startChat.mockResolvedValue({ conversationId: "conversation-1", usageId: "usage-1", history: [{ id: "message-1", role: "user", content: "Explain tools", createdAt: new Date().toISOString() }] });
  mocks.finishChat.mockResolvedValue(undefined);
  mocks.failChat.mockResolvedValue(undefined);
  mocks.listConversations.mockResolvedValue([]);
  mocks.getConversation.mockResolvedValue(null);
  mocks.retrieve.mockResolvedValue([]);
  mocks.stream.mockResolvedValue(events([
    chunk({ candidates: [{ content: { parts: [{ text: "Validate tool inputs." }] }, finishReason: FinishReason.FINISH_REASON_UNSPECIFIED }] }),
    chunk({ candidates: [{ finishReason: FinishReason.STOP }], responseId: "google-response-1", usageMetadata: { promptTokenCount: 20, candidatesTokenCount: 8, thoughtsTokenCount: 3 } }),
  ]));
});
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });

describe("local Gemini chat route", () => {
  it("allows local chat and history without any login cookie", async () => {
    const response = await GET(new Request("http://localhost:3001/api/chat"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ configured: true, conversations: [] });
    expect(await (await POST(request())).text()).toContain('"type":"done"');
  });

  it("rejects cross-origin writes before touching local data or Gemini", async () => {
    expect((await POST(request({}, "https://untrusted.test"))).status).toBe(403);
    expect(mocks.stream).not.toHaveBeenCalled();
    expect(mocks.startChat).not.toHaveBeenCalled();
  });

  it("reports missing Gemini configuration without sending a request", async () => {
    mocks.key.mockResolvedValue(null);
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: "GEMINI_NOT_CONFIGURED" });
    expect(mocks.stream).not.toHaveBeenCalled();
    expect(mocks.startChat).not.toHaveBeenCalled();
    expect(await (await GET(new Request("http://localhost:3001/api/chat"))).json()).toMatchObject({ configured: false });
  });

  it("does not create a new conversation for an unknown local conversation ID", async () => {
    mocks.startChat.mockRejectedValue(new LocalStoreError("CONVERSATION_NOT_FOUND"));
    expect((await POST(request({ message: "Explain tools", conversationId: "missing-conversation" }))).status).toBe(404);
    expect(mocks.stream).not.toHaveBeenCalled();
  });

  it("streams text and sources, preserves locale/context, and saves local usage", async () => {
    mocks.retrieve.mockResolvedValue([{ lessonId: "tool-calling", title: "Tool calling", sourcePath: "content/03-agent-fundamentals/02-tool-calling/vi.mdx", content: "Validate <tool> inputs." }]);
    const response = await POST(request({ message: "Explain tools", locale: "vi", lessonId: "tool-calling" }));
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    const text = await response.text();
    expect(text).toContain('"type":"delta","text":"Validate tool inputs."');
    expect(text).toContain('"type":"done"');
    expect(text).toContain("vi.mdx");
    const input = mocks.stream.mock.calls[0][0];
    expect(input.instructions).toContain("tiếng Việt");
    expect(input.messages).toHaveLength(1);
    expect(input.messages[0].content).toContain("Validate &lt;tool&gt; inputs.");
    expect(mocks.finishChat).toHaveBeenCalledWith("conversation-1", "usage-1", "Validate tool inputs.", { inputTokens: 20, outputTokens: 11, requestId: "google-response-1" });
    expect(text).not.toContain("test-key-never-return");
  });

  it.each(["MAX_TOKENS", "SAFETY", undefined])("does not save an incomplete or blocked stream (%s) as success", async (finishReason) => {
    mocks.stream.mockResolvedValue(events([chunk({ candidates: [{ content: { parts: [{ text: "Partial answer" }] }, finishReason: finishReason as FinishReason | undefined }] })]));
    const text = await (await POST(request())).text();
    expect(text).toContain('"type":"error"');
    expect(text).not.toContain('"type":"done"');
    expect(mocks.finishChat).not.toHaveBeenCalled();
    expect(mocks.failChat).toHaveBeenCalled();
  });

  it("does not save an empty response even when Gemini reports STOP", async () => {
    mocks.stream.mockResolvedValue(events([chunk({ candidates: [{ finishReason: FinishReason.STOP }] })]));
    expect(await (await POST(request())).text()).toContain('"type":"error"');
    expect(mocks.finishChat).not.toHaveBeenCalled();
  });

  it("enforces the local workspace quota before contacting Gemini", async () => {
    mocks.startChat.mockRejectedValue(new LocalStoreError("USAGE_LIMIT"));
    expect((await POST(request())).status).toBe(429);
    expect(mocks.stream).not.toHaveBeenCalled();
  });

  it("aborts Gemini when the learner cancels the response stream", async () => {
    let signal: AbortSignal | undefined;
    mocks.stream.mockImplementation((input: { signal: AbortSignal }) => {
      signal = input.signal;
      return new Promise((_, reject) => input.signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true }));
    });
    const reader = (await POST(request())).body!.getReader();
    await reader.read();
    await reader.cancel();
    expect(signal?.aborted).toBe(true);
    await vi.waitFor(() => expect(mocks.failChat).toHaveBeenCalled());
  });

  it("returns a safe Gemini rate-limit message without exposing upstream details", async () => {
    mocks.stream.mockRejectedValue(new ApiError({ status: 429, message: "test-key-never-return" }));
    const text = await (await POST(request())).text();
    expect(text).toContain("Gemini rate limit reached");
    expect(text).not.toContain("test-key-never-return");
    expect(mocks.finishChat).not.toHaveBeenCalled();
  });

  it.each([[400, "INVALID_REQUEST"], [403, "AUTH_ERROR"], [404, "MODEL_UNAVAILABLE"], [503, "UPSTREAM_UNAVAILABLE"], [504, "TIMEOUT"]] as const)("classifies upstream status %s without leaking raw details", async (status, code) => {
    mocks.stream.mockRejectedValue(new ApiError({ status, message: "test-key-never-return" }));
    const text = await (await POST(request())).text();
    expect(text).toContain(`"code":"${code}"`);
    expect(text).not.toContain("test-key-never-return");
  });

  it("aborts a stalled provider after the request timeout", async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    mocks.stream.mockImplementation((input: { signal: AbortSignal }) => {
      signal = input.signal;
      return new Promise(() => undefined); // Deliberately ignore abort to verify the hard deadline.
    });
    const text = (await POST(request())).text();
    await vi.advanceTimersByTimeAsync(90_000);
    expect(signal?.aborted).toBe(true);
    expect(await text).toContain('"code":"TIMEOUT"');
    expect(localStore.finishChat).not.toHaveBeenCalled();
  });
});
