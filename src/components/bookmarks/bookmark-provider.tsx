"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { z } from "zod";
import { bookmarkRecordSchema, type BookmarkRecord } from "@/lib/bookmarks/schema";

const listResponse = z.object({ bookmarks: z.array(bookmarkRecordSchema) });
const savedResponse = z.object({ bookmark: bookmarkRecordSchema });
type BookmarkContextValue = {
  bookmarks: BookmarkRecord[]; loading: boolean; error: boolean; pending: Set<string>;
  refresh: () => Promise<void>;
  toggleLesson: (lessonId: string) => Promise<void>;
  addLink: (url: string, title?: string) => Promise<void>;
  remove: (bookmark: BookmarkRecord) => Promise<void>;
};
const BookmarkContext = createContext<BookmarkContextValue | null>(null);

export function BookmarkProvider({ children }: { children: ReactNode }) {
  const [bookmarks, setBookmarks] = useState<BookmarkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(new Set<string>());
  const generation = useRef(0);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    const version = ++generation.current;
    try {
      const response = await fetch("/api/bookmarks", { cache: "no-store" });
      if (!response.ok) throw new Error("Bookmarks unavailable");
      const data = listResponse.parse(await response.json());
      if (mounted.current && version === generation.current) { setBookmarks(data.bookmarks); setError(false); }
    } catch { if (mounted.current && version === generation.current) setError(true); }
    finally { if (mounted.current && version === generation.current) setLoading(false); }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    const onFocus = () => { void refresh(); };
    window.addEventListener("focus", onFocus);
    return () => { mounted.current = false; window.removeEventListener("focus", onFocus); };
  }, [refresh]);

  async function mutate(key: string, method: "POST" | "DELETE", body: Record<string, string>, removedId?: string) {
    ++generation.current;
    setPending((items) => new Set(items).add(key));
    setError(false);
    try {
      const response = await fetch("/api/bookmarks", { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      if (!response.ok) throw new Error("Bookmark could not be saved");
      const saved = method === "POST" ? savedResponse.parse(await response.json()).bookmark : undefined;
      ++generation.current; // Ignore stale reads that started before this write finished.
      setBookmarks((items) => saved ? [...items.filter((item) => item.id !== saved.id), saved] : items.filter((item) => item.id !== removedId));
    } catch (failure) { setError(true); throw failure; }
    finally {
      setLoading(false);
      setPending((items) => { const next = new Set(items); next.delete(key); return next; });
    }
  }

  async function toggleLesson(lessonId: string) {
    const current = bookmarks.find((item) => item.kind === "lesson" && item.lessonId === lessonId);
    await mutate(`lesson:${lessonId}`, current ? "DELETE" : "POST", { lessonId }, current?.id);
  }
  async function addLink(url: string, title?: string) { await mutate("link", "POST", { url, ...(title ? { title } : {}) }); }
  async function remove(bookmark: BookmarkRecord) {
    await mutate(bookmark.kind === "lesson" ? `lesson:${bookmark.lessonId}` : `bookmark:${bookmark.id}`, "DELETE", { id: bookmark.id }, bookmark.id);
  }

  return <BookmarkContext.Provider value={{ bookmarks, loading, error, pending, refresh, toggleLesson, addLink, remove }}>{children}</BookmarkContext.Provider>;
}

export function useBookmarks() {
  const context = useContext(BookmarkContext);
  if (!context) throw new Error("useBookmarks must be used within BookmarkProvider");
  return context;
}
