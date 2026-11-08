import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { bookmarkRecordSchema, bookmarkUrlSchema } from "@/lib/bookmarks/schema";

const timestamp = z.string().datetime();
const progressSchema = z.object({ lessonId: z.string(), progressPercent: z.number().int().min(0).max(100), completed: z.boolean(), completedAt: timestamp.nullable(), lastReadAt: timestamp, updatedAt: timestamp });
const messageSchema = z.object({ id: z.string(), role: z.enum(["user", "assistant"]), content: z.string().max(12_000), createdAt: timestamp });
const conversationSchema = z.object({ id: z.string(), title: z.string().max(72), createdAt: timestamp, updatedAt: timestamp, messages: z.array(messageSchema).max(100) });
const usageSchema = z.object({ id: z.string(), model: z.string(), status: z.enum(["started", "success", "failed"]), createdAt: timestamp, inputTokens: z.number().int().nonnegative(), outputTokens: z.number().int().nonnegative(), requestId: z.string().optional(), errorCode: z.string().max(80).optional() });
const stateSchema = z.object({ version: z.literal(1), progress: z.array(progressSchema), bookmarks: z.array(bookmarkRecordSchema), conversations: z.array(conversationSchema).max(20), usage: z.array(usageSchema) });
type LocalState = z.infer<typeof stateSchema>;
export type LocalProgress = z.infer<typeof progressSchema>;
export type LocalMessage = z.infer<typeof messageSchema>;
export type LocalConversation = z.infer<typeof conversationSchema>;
export type LocalUsage = z.infer<typeof usageSchema>;

export class LocalStoreError extends Error {
  constructor(public readonly code: "CONVERSATION_NOT_FOUND" | "USAGE_LIMIT") { super(code); }
}

const globalStore = globalThis as typeof globalThis & { academyLocalQueues?: Map<string, Promise<unknown>> };
const queues = globalStore.academyLocalQueues ??= new Map();

/** One personal workspace, persisted locally; no account or database service. */
export class LocalStore {
  constructor(private readonly filePath: string) {}

  private async read(): Promise<LocalState> {
    try {
      const stat = await fs.stat(this.filePath);
      if (stat.size > 32 * 1024 * 1024) throw new Error("Local data file exceeds its size limit");
      return stateSchema.parse(JSON.parse(await fs.readFile(this.filePath, "utf8")) as unknown);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return { version: 1, progress: [], bookmarks: [], conversations: [], usage: [] };
      // Never overwrite malformed or incompatible existing data with an empty file.
      throw error;
    }
  }

  async snapshot(): Promise<LocalState> {
    await queues.get(this.filePath);
    return this.read();
  }

  private mutate<T>(change: (state: LocalState) => T): Promise<T> {
    const pending = queues.get(this.filePath) ?? Promise.resolve();
    const operation = pending.catch(() => undefined).then(async () => {
      const state = await this.read();
      const result = change(state);
      const data = JSON.stringify(stateSchema.parse(state));
      if (Buffer.byteLength(data) > 32 * 1024 * 1024) throw new Error("Local data file exceeds its size limit");
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      const temporaryPath = `${this.filePath}.${randomUUID()}.tmp`;
      try {
        await fs.writeFile(temporaryPath, data, { mode: 0o600 });
        await fs.rename(temporaryPath, this.filePath);
      } finally { await fs.rm(temporaryPath, { force: true }).catch(() => undefined); }
      return result;
    });
    queues.set(this.filePath, operation.then(() => undefined, () => undefined));
    return operation;
  }

  async getProgress(lessonId?: string) {
    const { progress } = await this.snapshot();
    return lessonId ? progress.find((item) => item.lessonId === lessonId) ?? null : progress;
  }

  saveProgress(lessonId: string, percent: number, completed = false) {
    return this.mutate((state) => {
      const existing = state.progress.find((item) => item.lessonId === lessonId);
      const now = new Date().toISOString();
      const progress = progressSchema.parse({ lessonId, progressPercent: Math.max(percent, existing?.progressPercent ?? 0, completed ? 100 : 0), completed: completed || Boolean(existing?.completed), completedAt: completed ? existing?.completedAt ?? now : existing?.completedAt ?? null, lastReadAt: now, updatedAt: now });
      state.progress = [...state.progress.filter((item) => item.lessonId !== lessonId), progress];
      return progress;
    });
  }

  async getBookmarks(lessonId?: string) {
    const { bookmarks } = await this.snapshot();
    return lessonId ? bookmarks.find((item) => item.kind === "lesson" && item.lessonId === lessonId) ?? null : bookmarks;
  }

  saveBookmark(lessonId: string) {
    return this.mutate((state) => {
      const existing = state.bookmarks.find((item) => item.kind === "lesson" && item.lessonId === lessonId);
      if (existing) return existing;
      const bookmark = { id: randomUUID(), kind: "lesson" as const, lessonId, createdAt: new Date().toISOString() };
      state.bookmarks.push(bookmark);
      return bookmark;
    });
  }

  removeBookmark(lessonId: string) {
    return this.mutate((state) => { state.bookmarks = state.bookmarks.filter((item) => item.kind !== "lesson" || item.lessonId !== lessonId); });
  }

  saveLink(url: string, title?: string) {
    const normalized = bookmarkUrlSchema.parse(url);
    return this.mutate((state) => {
      const existing = state.bookmarks.find((item) => item.kind === "link" && item.url === normalized);
      if (existing) return existing;
      const bookmark = bookmarkRecordSchema.parse({ id: randomUUID(), kind: "link", url: normalized, title: title?.trim() || new URL(normalized).hostname, createdAt: new Date().toISOString() });
      state.bookmarks.push(bookmark);
      return bookmark;
    });
  }

  removeBookmarkById(id: string) {
    return this.mutate((state) => { state.bookmarks = state.bookmarks.filter((item) => item.id !== id); });
  }

  async getConversation(id: string) {
    return (await this.snapshot()).conversations.find((item) => item.id === id) ?? null;
  }

  async listConversations() {
    return (await this.snapshot()).conversations.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map((item) => ({ ...item, messages: item.messages.slice(-1) }));
  }

  startChat(message: string, model: string, conversationId?: string) {
    return this.mutate((state) => {
      const now = new Date();
      const time = now.toISOString();
      let conversation = conversationId ? state.conversations.find((item) => item.id === conversationId) : undefined;
      if (conversationId && !conversation) throw new LocalStoreError("CONVERSATION_NOT_FOUND");
      const hourStart = now.getTime() - 3_600_000;
      const dayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
      state.usage = state.usage.filter((item) => Date.parse(item.createdAt) >= now.getTime() - 86_400_000);
      if (state.usage.filter((item) => Date.parse(item.createdAt) >= dayStart).length >= 30 || state.usage.filter((item) => Date.parse(item.createdAt) >= hourStart).length >= 10) throw new LocalStoreError("USAGE_LIMIT");
      if (!conversation) {
        conversation = { id: randomUUID(), title: message.replace(/\s+/g, " ").slice(0, 72), createdAt: time, updatedAt: time, messages: [] };
        state.conversations.push(conversation);
      }
      conversation.messages.push({ id: randomUUID(), role: "user", content: message, createdAt: time });
      conversation.messages = conversation.messages.slice(-100);
      conversation.updatedAt = time;
      state.conversations.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      state.conversations = state.conversations.slice(0, 20);
      const usage: LocalUsage = { id: randomUUID(), model, status: "started", createdAt: time, inputTokens: 0, outputTokens: 0 };
      state.usage.push(usage);
      return { conversationId: conversation.id, usageId: usage.id, history: conversation.messages.slice(-10) };
    });
  }

  finishChat(conversationId: string, usageId: string, content: string, counters: Pick<LocalUsage, "inputTokens" | "outputTokens" | "requestId">) {
    return this.mutate((state) => {
      const conversation = state.conversations.find((item) => item.id === conversationId);
      const usage = state.usage.find((item) => item.id === usageId);
      if (!conversation || !usage) throw new LocalStoreError("CONVERSATION_NOT_FOUND");
      const now = new Date().toISOString();
      conversation.messages.push({ id: randomUUID(), role: "assistant", content, createdAt: now });
      conversation.messages = conversation.messages.slice(-100);
      conversation.updatedAt = now;
      Object.assign(usage, counters, { status: "success" });
    });
  }

  failChat(usageId: string, requestId?: string, errorCode?: string) {
    return this.mutate((state) => {
      const usage = state.usage.find((item) => item.id === usageId);
      if (usage) Object.assign(usage, { status: "failed", requestId, errorCode });
    });
  }
}

export const localStore = new LocalStore(path.join(process.cwd(), ".data", "academy.json"));
