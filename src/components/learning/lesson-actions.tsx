"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/language-provider";

type State = "loading" | "signed-out" | "ready" | "unavailable";
type Progress = { progressPercent: number; completed: boolean } | null;

export function LessonActions({ lessonId }: { lessonId: string }) {
  const { t } = useLanguage();
  const [state, setState] = useState<State>("loading");
  const [progress, setProgress] = useState<Progress>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [busy, setBusy] = useState(false);
  const lastSavedPercent = useRef(0);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch(`/api/progress?lessonId=${encodeURIComponent(lessonId)}`).then(async (response) => ({ response, data: await response.json() as { progress?: Progress } })),
      fetch(`/api/bookmarks?lessonId=${encodeURIComponent(lessonId)}`).then(async (response) => ({ response, data: await response.json() as { bookmarks?: { id: string } | null } })),
    ]).then(([p, b]) => {
      if (!active) return;
      if (p.response.status === 401 || b.response.status === 401) { setState("signed-out"); return; }
      if (!p.response.ok || !b.response.ok) { setState("unavailable"); return; }
      setProgress(p.data.progress ?? null);
      setBookmarked(Boolean(b.data.bookmarks));
      lastSavedPercent.current = p.data.progress?.progressPercent ?? 0;
      setState("ready");
    }).catch(() => { if (active) setState("unavailable"); });
    return () => { active = false; };
  }, [lessonId]);

  useEffect(() => {
    if (state !== "ready" || progress?.completed) return;
    const save = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total <= 0) return;
      const percent = Math.min(100, Math.floor((window.scrollY / total) * 100));
      if (percent < lastSavedPercent.current + 10 || percent >= 100) return;
      lastSavedPercent.current = percent;
      void fetch("/api/progress", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lessonId, progressPercent: percent }) });
    };
    window.addEventListener("scroll", save, { passive: true });
    return () => window.removeEventListener("scroll", save);
  }, [lessonId, progress?.completed, state]);

  async function toggleBookmark() {
    setBusy(true);
    try {
      const response = await fetch("/api/bookmarks", { method: bookmarked ? "DELETE" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lessonId }) });
      if (response.ok) setBookmarked(!bookmarked);
      else if (response.status === 401) setState("signed-out");
      else setState("unavailable");
    } catch { setState("unavailable"); }
    finally { setBusy(false); }
  }

  async function completeLesson() {
    setBusy(true);
    try {
      const response = await fetch("/api/progress", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lessonId, progressPercent: 100, completed: true }) });
      if (response.ok) setProgress({ progressPercent: 100, completed: true });
      else if (response.status === 401) setState("signed-out");
      else setState("unavailable");
    } catch { setState("unavailable"); }
    finally { setBusy(false); }
  }

  if (state === "loading") return <div className="lesson-actions loading-actions" aria-live="polite">{t("checking_progress")}</div>;
  if (state === "signed-out") return <div className="lesson-actions signed-out-actions"><span>{t("lesson_signin_save")}</span><Link href="/auth/signin">{t("lesson_signin_button")}</Link></div>;
  if (state === "unavailable") return <div className="lesson-actions error-actions" role="status"><span>{t("lesson_progress_unavailable")}</span><Link href="/auth/signin">{t("chat_setup")}</Link></div>;
  return <div className="lesson-actions"><div className="lesson-actions-progress"><span className="complete-icon">{progress?.completed ? "✓" : "↗"}</span><div><strong>{progress?.completed ? t("lesson_completed") : t("lesson_progress_saving")}</strong><span>{progress?.completed ? t("lesson_completed") : t("read_percent", { count: progress?.progressPercent ?? 0 })}</span></div></div><button className={`bookmark-button ${bookmarked ? "bookmarked" : ""}`} type="button" aria-label={bookmarked ? t("remove_bookmark") : t("bookmark")} aria-pressed={bookmarked} disabled={busy} onClick={toggleBookmark}>{bookmarked ? "★" : "☆"}</button>{!progress?.completed && <button className="complete-button" type="button" disabled={busy} onClick={completeLesson}>{t("mark_complete")}</button>}</div>;
}
