import { beforeEach, describe, expect, it, vi } from "vitest";
const store = vi.hoisted(() => ({ getProgress: vi.fn(), saveProgress: vi.fn(), getBookmarks: vi.fn(), saveBookmark: vi.fn(), removeBookmark: vi.fn(), saveLink: vi.fn(), removeBookmarkById: vi.fn() }));
vi.mock("@/lib/local/store", () => ({ localStore: store }));
import * as progress from "@/app/api/progress/route";
import * as bookmarks from "@/app/api/bookmarks/route";

function request(body: unknown, origin = "http://localhost:3001") {
  return new Request("http://localhost:3001/api/progress", { method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify(body) });
}
beforeEach(() => {
  vi.resetAllMocks();
  store.getProgress.mockResolvedValue([]);
  store.getBookmarks.mockResolvedValue([]);
  store.saveProgress.mockResolvedValue({ lessonId: "llm-fundamentals", progressPercent: 100, completed: true });
  store.saveBookmark.mockResolvedValue({ id: "bookmark-1", lessonId: "llm-fundamentals" });
});

describe("local learning APIs", () => {
  it("reads and writes progress/bookmarks without account cookies", async () => {
    expect((await progress.GET(new Request("http://localhost:3001/api/progress"))).status).toBe(200);
    expect((await bookmarks.GET(new Request("http://localhost:3001/api/bookmarks"))).status).toBe(200);
    expect((await progress.POST(request({ lessonId: "llm-fundamentals", progressPercent: 100, completed: true }))).status).toBe(200);
    expect(store.saveProgress).toHaveBeenCalledWith("llm-fundamentals", 100, true);
    expect((await bookmarks.POST(request({ lessonId: "llm-fundamentals" }))).status).toBe(200);
    expect((await bookmarks.DELETE(request({ lessonId: "llm-fundamentals" }))).status).toBe(200);
    expect(store.removeBookmark).toHaveBeenCalledWith("llm-fundamentals");
  });
  it("rejects foreign origins and invalid lessons or input before writes", async () => {
    expect((await progress.POST(request({ lessonId: "llm-fundamentals", progressPercent: 50 }, "https://untrusted.test"))).status).toBe(403);
    expect((await bookmarks.POST(request({ lessonId: "llm-fundamentals" }, "https://untrusted.test"))).status).toBe(403);
    expect((await progress.POST(request({ lessonId: "llm-fundamentals", progressPercent: 101 }))).status).toBe(400);
    expect((await progress.POST(request({ lessonId: "not-a-lesson", progressPercent: 50 }))).status).toBe(404);
    expect((await bookmarks.POST(request({ lessonId: "not-a-lesson" }))).status).toBe(404);
    expect(store.saveProgress).not.toHaveBeenCalled();
    expect(store.saveBookmark).not.toHaveBeenCalled();
  });
  it("saves normalized links and removes only the supplied bookmark ID", async () => {
    store.saveLink.mockResolvedValue({ id: "link-1", kind: "link", url: "https://example.com/", title: "Reference", createdAt: "2026-11-08T00:00:00Z" });
    const response = await bookmarks.POST(request({ url: "https://example.com", title: "Reference" }));
    expect(response.status).toBe(200);
    expect(store.saveLink).toHaveBeenCalledWith("https://example.com/", "Reference");
    expect((await response.json()).bookmark.kind).toBe("link");
    expect((await bookmarks.DELETE(request({ id: "link-1" }))).status).toBe(200);
    expect(store.removeBookmarkById).toHaveBeenCalledWith("link-1");
  });
  it.each(["javascript:alert(1)", "data:text/html,test", "file:///tmp/private", "ftp://example.com/file"])("rejects unsafe bookmark URL %s", async (url) => {
    expect((await bookmarks.POST(request({ url }))).status).toBe(400);
    expect(store.saveLink).not.toHaveBeenCalled();
  });

  it("reports local persistence failures with a recoverable status", async () => {
    store.saveProgress.mockRejectedValue(new Error("Disk is read-only"));
    expect((await progress.POST(request({ lessonId: "llm-fundamentals", progressPercent: 50 }))).status).toBe(503);
  });
});
