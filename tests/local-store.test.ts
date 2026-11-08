import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocalStore } from "@/lib/local/store";

let directory: string;
let filePath: string;
let store: LocalStore;
beforeEach(async () => {
  directory = await fs.mkdtemp(path.join(os.tmpdir(), "academy-local-test-"));
  filePath = path.join(directory, "academy.json");
  store = new LocalStore(filePath);
});
afterEach(async () => { vi.useRealTimers(); await fs.rm(directory, { recursive: true, force: true }); });

describe("personal local persistence", () => {
  it("persists progress and bookmarks across store instances without a database", async () => {
    await store.saveProgress("llm-fundamentals", 40);
    await store.saveProgress("llm-fundamentals", 100, true);
    await store.saveProgress("llm-fundamentals", 20, false);
    await store.saveBookmark("llm-fundamentals");
    await store.saveBookmark("llm-fundamentals");
    const reopened = new LocalStore(filePath);
    expect(await reopened.getProgress("llm-fundamentals")).toMatchObject({ progressPercent: 100, completed: true });
    expect(await reopened.getBookmarks()).toHaveLength(1);
    await reopened.removeBookmark("llm-fundamentals");
    expect(await store.getBookmarks()).toEqual([]);
  });

  it("preserves legacy lesson bookmarks when adding links and reopening the store", async () => {
    await fs.writeFile(filePath, JSON.stringify({ version: 1, progress: [], conversations: [], usage: [], bookmarks: [{ id: "legacy-lesson", lessonId: "llm-fundamentals", createdAt: "2026-11-08T00:00:00Z" }] }));
    const saved = await store.saveLink("https://example.com", "Reference");
    expect(await store.saveLink("https://example.com/", "Duplicate")).toHaveProperty("id", saved.id);
    const reopened = new LocalStore(filePath);
    expect(await reopened.getBookmarks()).toHaveLength(2);
    expect(await reopened.getBookmarks("llm-fundamentals")).toMatchObject({ id: "legacy-lesson", kind: "lesson" });
    await reopened.removeBookmarkById(saved.id);
    expect(await reopened.getBookmarks()).toHaveLength(1);
    expect(await reopened.getBookmarks("llm-fundamentals")).toHaveProperty("id", "legacy-lesson");
  });

  it("serializes concurrent writes without losing independent lesson changes", async () => {
    await Promise.all(Array.from({ length: 15 }, (_, index) => store.saveProgress(`lesson-${index}`, index)));
    expect(await store.getProgress()).toHaveLength(15);
    const parsed = JSON.parse(await fs.readFile(filePath, "utf8"));
    expect(parsed.version).toBe(1);
    expect((await fs.readdir(directory)).filter((name) => name.endsWith(".tmp"))).toEqual([]);
  });

  it("retains conversations, history, and success/failure usage locally", async () => {
    const started = await store.startChat("Explain tools", "gemini-model");
    await store.finishChat(started.conversationId, started.usageId, "Validate inputs.", { inputTokens: 10, outputTokens: 5, requestId: "response-1" });
    const retry = await store.startChat("Give an example", "gemini-model", started.conversationId);
    await store.failChat(retry.usageId);
    const reopened = new LocalStore(filePath);
    const conversation = await reopened.getConversation(started.conversationId);
    expect(conversation?.messages.map((message) => message.role)).toEqual(["user", "assistant", "user"]);
    expect((await reopened.snapshot()).usage.map((usage) => usage.status)).toEqual(["success", "failed"]);
    expect((await reopened.listConversations())[0].messages).toHaveLength(1);
    await expect(store.startChat("Unknown", "gemini-model", "missing-id")).rejects.toMatchObject({ code: "CONVERSATION_NOT_FOUND" });
  });

  it("reserves quota atomically across concurrent requests and retains it after reopening", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-08T06:00:00Z"));
    const results = await Promise.allSettled(Array.from({ length: 12 }, () => store.startChat("Question", "gemini-model")));
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(10);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(2);
    await expect(new LocalStore(filePath).startChat("Question", "gemini-model")).rejects.toMatchObject({ code: "USAGE_LIMIT" });
    vi.setSystemTime(new Date("2026-11-08T08:00:00Z"));
    await expect(store.startChat("Later question", "gemini-model")).resolves.toHaveProperty("usageId");
  });

  it("enforces the daily quota across separate hourly windows", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    for (const hour of [4, 8, 12]) {
      vi.setSystemTime(new Date(`2026-11-08T${String(hour).padStart(2, "0")}:00:00Z`));
      for (let index = 0; index < 10; index++) await store.startChat("Question", "gemini-model");
    }
    vi.setSystemTime(new Date("2026-11-08T16:00:00Z"));
    await expect(store.startChat("One more", "gemini-model")).rejects.toMatchObject({ code: "USAGE_LIMIT" });
    vi.setSystemTime(new Date("2026-11-09T01:00:00Z"));
    await expect(store.startChat("Next day", "gemini-model")).resolves.toHaveProperty("usageId");
    expect((await store.snapshot()).conversations).toHaveLength(20);
  });

  it("keeps malformed existing data untouched instead of silently resetting it", async () => {
    await fs.writeFile(filePath, "broken data");
    await expect(store.saveBookmark("llm-fundamentals")).rejects.toThrow();
    expect(await fs.readFile(filePath, "utf8")).toBe("broken data");
  });
});
