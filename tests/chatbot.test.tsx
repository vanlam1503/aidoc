// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Chatbot } from "@/components/chatbot/chatbot";
import { LanguageProvider } from "@/components/language-provider";

const fetchMock = vi.fn<typeof fetch>();
Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
beforeEach(() => { localStorage.clear(); vi.stubGlobal("fetch", fetchMock); fetchMock.mockReset(); });
afterEach(() => vi.unstubAllGlobals());

async function startQuestion() {
  render(<LanguageProvider><Chatbot /></LanguageProvider>);
  fireEvent.click(screen.getByRole("button", { name: "Ask assistant" }));
  const input = await screen.findByRole("textbox", { name: "Your question" });
  fireEvent.change(input, { target: { value: "Explain tool calling" } });
  fireEvent.click(screen.getByRole("button", { name: "Send question" }));
  return input;
}

function history() { return Response.json({ configured: true, conversations: [] }); }
function openStream(body: string, cancel = vi.fn()) {
  return new Response(new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(new TextEncoder().encode(body)); }, cancel }), { headers: { "content-type": "text/event-stream" } });
}

describe("assistant terminal and cancellation states", () => {
  it("automatically sends a selected phrase once after configuration finishes loading", async () => {
    let resolveConfiguration!: (response: Response) => void;
    const configuration = new Promise<Response>((resolve) => { resolveConfiguration = resolve; });
    let initial = true;
    fetchMock.mockImplementation(async (_url, init) => {
      if (init?.method === "POST") return openStream('data: {"type":"delta","text":"Tokens are units of text processed by the model."}\n\ndata: {"type":"done"}\n\n');
      if (initial) { initial = false; return configuration; }
      return history();
    });
    render(<LanguageProvider><Chatbot lessonId="llm-fundamentals" /></LanguageProvider>);
    act(() => { window.dispatchEvent(new CustomEvent("academy:ask-assistant", { detail: { prompt: "Explain tokens in this lesson.", autoSubmit: true } })); });
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(0);
    await act(async () => resolveConfiguration(history()));
    expect(await screen.findByText("Tokens are units of text processed by the model.")).toBeVisible();
    const posts = fetchMock.mock.calls.filter(([, init]) => init?.method === "POST");
    expect(posts).toHaveLength(1);
    expect(JSON.parse(String(posts[0][1]?.body))).toMatchObject({ message: "Explain tokens in this lesson.", lessonId: "llm-fundamentals", locale: "en" });
    expect(screen.getByRole("textbox", { name: "Your question" })).toHaveValue("");
  });

  it("renders Markdown from streamed assistant replies", async () => {
    const markdown = "---\n### 💡 Gợi ý bước tiếp theo\nTìm hiểu **Tokenization** hoặc `tokens`.\n\n- Ví dụ thực tế\n";
    fetchMock.mockImplementation(async (_url, init) => init?.method === "POST"
      ? openStream(`data: ${JSON.stringify({ type: "delta", text: markdown.slice(0, 20) })}\n\ndata: ${JSON.stringify({ type: "delta", text: markdown.slice(20) })}\n\ndata: {"type":"done"}\n\n`)
      : history());
    await startQuestion();
    const heading = await screen.findByRole("heading", { name: "💡 Gợi ý bước tiếp theo", level: 3 });
    const reply = heading.closest("article")!;
    expect(reply.querySelector("strong")).toHaveTextContent("Tokenization");
    expect(reply.querySelector("hr")).toBeInTheDocument();
    expect(reply.querySelector("code")).toHaveTextContent("tokens");
    expect(reply.querySelector("li")).toHaveTextContent("Ví dụ thực tế");
    expect(reply).not.toHaveTextContent("###");
    expect(reply).not.toHaveTextContent("**Tokenization**");
  });

  it("saves a password key without restoring it into HTML or browser storage and enables chat", async () => {
    const key = "fake-key-12345678901234567890";
    let configured = false;
    fetchMock.mockImplementation(async (url, init) => {
      if (url === "/api/assistant/key" && init?.method === "POST") {
        expect(JSON.parse(String(init.body))).toEqual({ apiKey: key });
        configured = true;
        return Response.json({ configured: true });
      }
      return Response.json({ configured, conversations: [] });
    });
    render(<LanguageProvider><Chatbot /></LanguageProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Ask assistant" }));
    const input = await screen.findByLabelText("Gemini API key", { exact: true });
    expect(input).toHaveAttribute("type", "password");
    fireEvent.change(input, { target: { value: key } });
    expect(input).not.toHaveAttribute("value");
    fireEvent.click(screen.getByRole("button", { name: "Save API key" }));
    expect(await screen.findByRole("textbox", { name: "Your question" })).toBeEnabled();
    expect(document.body.innerHTML).not.toContain(key);
    expect(JSON.stringify(localStorage)).not.toContain(key);
    expect(JSON.stringify(sessionStorage)).not.toContain(key);
    expect(screen.getByLabelText("Gemini API key", { exact: true })).toHaveValue("");
  });

  it("saves a pasted key on Save and ignores stale history responses after activation", async () => {
    const key = "fake-pasted-key-12345678901234567890";
    let resolveStale!: (response: Response) => void;
    let reads = 0;
    fetchMock.mockImplementation(async (url, init) => {
      if (url === "/api/assistant/key") return Response.json({ configured: true });
      if (++reads === 1) return Response.json({ configured: false, conversations: [] });
      return new Promise<Response>((resolve) => { resolveStale = resolve; });
    });
    render(<LanguageProvider><Chatbot /></LanguageProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Ask assistant" }));
    const input = await screen.findByLabelText("Gemini API key", { exact: true });
    act(() => window.dispatchEvent(new Event("focus")));
    expect(input).toBeInTheDocument();
    fireEvent.input(input, { target: { value: key }, inputType: "insertFromPaste" });
    expect(fetchMock.mock.calls.some(([url]) => url === "/api/assistant/key")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Save API key" }));
    expect(await screen.findByRole("textbox", { name: "Your question" })).toBeEnabled();
    expect(screen.getByText("Chat enabled")).toBeInTheDocument();
    const save = fetchMock.mock.calls.find(([url]) => url === "/api/assistant/key");
    expect(JSON.parse(String(save?.[1]?.body))).toEqual({ apiKey: key });
    await act(async () => resolveStale(Response.json({ configured: false, conversations: [] })));
    expect(screen.getByRole("textbox", { name: "Your question" })).toBeEnabled();
    expect(document.body.innerHTML).not.toContain(key);
  });

  it("keeps chat disabled and shows an error when a pasted key cannot be saved", async () => {
    fetchMock.mockImplementation(async (url) => url === "/api/assistant/key"
      ? Response.json({ error: "Cannot save" }, { status: 503 })
      : Response.json({ configured: false, conversations: [] }));
    render(<LanguageProvider><Chatbot /></LanguageProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Ask assistant" }));
    const input = await screen.findByLabelText("Gemini API key", { exact: true });
    fireEvent.input(input, { target: { value: "fake-failed-key-12345678901234567890" }, inputType: "insertFromPaste" });
    fireEvent.click(screen.getByRole("button", { name: "Save API key" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not save the key");
    expect(screen.queryByRole("textbox", { name: "Your question" })).not.toBeInTheDocument();
    expect(input).toHaveValue("fake-failed-key-12345678901234567890");
  });

  it("preserves draft-only events without sending an automatic request", async () => {
    fetchMock.mockImplementation(async () => history());
    render(<LanguageProvider><Chatbot /></LanguageProvider>);
    act(() => { window.dispatchEvent(new CustomEvent("academy:ask-assistant", { detail: { prompt: "A draft to review first" } })); });
    expect(await screen.findByRole("textbox", { name: "Your question" })).toHaveValue("A draft to review first");
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(0);
  });

  it("stops Thinking on an error event even when the HTTP stream stays open", async () => {
    const cancel = vi.fn();
    fetchMock.mockImplementation(async (_url, init) => init?.method === "POST"
      ? openStream('data: {"type":"error","code":"TIMEOUT","message":"Gemini took too long to respond."}\n\n', cancel)
      : history());
    const input = await startQuestion();
    expect(await screen.findByRole("alert")).toHaveTextContent("Gemini took too long");
    await waitFor(() => expect(input).not.toBeDisabled());
    expect(screen.queryByText("Thinking…")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Stop response" })).not.toBeInTheDocument();
    expect(cancel).toHaveBeenCalled();
  });

  it("shows a completed response without waiting for transport EOF", async () => {
    fetchMock.mockImplementation(async (_url, init) => init?.method === "POST"
      ? openStream('data: {"type":"delta","text":"Validate tool inputs."}\n\ndata: {"type":"done"}\n\n')
      : history());
    const input = await startQuestion();
    expect(await screen.findByText("Validate tool inputs.")).toBeVisible();
    await waitFor(() => expect(input).not.toBeDisabled());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("lets the learner stop a stalled request and send another question", async () => {
    let requestSignal: AbortSignal | null | undefined;
    fetchMock.mockImplementation(async (_url, init) => {
      if (init?.method !== "POST") return history();
      requestSignal = init.signal;
      return new Promise((_, reject) => init.signal?.addEventListener("abort", () => reject(new DOMException("Stopped", "AbortError")), { once: true }));
    });
    const input = await startQuestion();
    fireEvent.click(await screen.findByRole("button", { name: "Stop response" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Response stopped");
    expect(requestSignal?.aborted).toBe(true);
    expect(input).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Send question" })).toBeInTheDocument();
  });
});
