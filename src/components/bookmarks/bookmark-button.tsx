"use client";

import { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { useBookmarks } from "./bookmark-provider";

export function BookmarkButton({ lessonId, title, compact = false }: { lessonId: string; title?: string; compact?: boolean }) {
  const { t } = useLanguage();
  const { bookmarks, loading, pending, toggleLesson } = useBookmarks();
  const [failed, setFailed] = useState(false);
  const saved = bookmarks.some((item) => item.kind === "lesson" && item.lessonId === lessonId);
  const label = t(saved ? "remove_bookmark" : "bookmark");
  return <span className={`lesson-bookmark-control${compact ? " is-compact" : ""}`}>
    <button type="button" className={`lesson-bookmark-button${saved ? " is-saved" : ""}`} aria-label={title ? `${label}: ${title}` : label} title={label} aria-pressed={saved} disabled={loading || pending.has(`lesson:${lessonId}`)} onClick={async () => {
      setFailed(false);
      try { await toggleLesson(lessonId); } catch { setFailed(true); }
    }}>
      <svg aria-hidden="true" width="17" height="19" viewBox="0 0 20 22" fill={saved ? "currentColor" : "none"}><path d="M5 2h10a1 1 0 0 1 1 1v17l-6-4-6 4V3a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
      {!compact && <span>{t(saved ? "bookmarks_saved" : "bookmark")}</span>}
    </button>
    {failed && <span className="bookmark-save-error" role="alert">{t("bookmarks_error")}</span>}
  </span>;
}
