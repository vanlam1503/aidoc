"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/language-provider";

type State = "loading" | "ready" | "unavailable";
type Progress = { progressPercent: number; completed: boolean } | null;

export function LessonActions({ lessonId }: { lessonId: string }) {
  const { t } = useLanguage();
  const [state, setState] = useState<State>("loading");
  const [progress, setProgress] = useState<Progress>(null);
  const [busy, setBusy] = useState(false);
  const lastSavedPercent = useRef(0);

  useEffect(() => {
    let active = true;
    fetch(`/api/progress?lessonId=${encodeURIComponent(lessonId)}`).then(async (response) => {
      if (!response.ok) throw new Error("Local progress unavailable");
      const data = await response.json() as { progress?: Progress };
      if (!active) return;
      setProgress(data.progress ?? null);
      lastSavedPercent.current = data.progress?.progressPercent ?? 0;
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
      void fetch("/api/progress", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lessonId, progressPercent: percent }) })
        .then(async (response) => {
          if (!response.ok) throw new Error("Local progress could not be saved");
          const data = await response.json() as { progress: Progress };
          setProgress(data.progress);
        }).catch(() => setState("unavailable"));
    };
    window.addEventListener("scroll", save, { passive: true });
    return () => window.removeEventListener("scroll", save);
  }, [lessonId, progress?.completed, state]);

  async function completeLesson() {
    setBusy(true);
    try {
      const response = await fetch("/api/progress", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lessonId, progressPercent: 100, completed: true }) });
      if (response.ok) { setProgress({ progressPercent: 100, completed: true }); window.dispatchEvent(new Event("academy:progress-updated")); }
      else setState("unavailable");
    } catch { setState("unavailable"); }
    finally { setBusy(false); }
  }

  if (state === "loading") return <div className="lesson-actions loading-actions" aria-live="polite">{t("checking_progress")}</div>;
  if (state === "unavailable") return <div className="lesson-actions error-actions" role="status"><span>{t("lesson_progress_unavailable")}</span><button type="button" onClick={() => window.location.reload()}>{t("retry")}</button></div>;
  return <div className="lesson-actions"><div className="lesson-actions-progress"><span className="complete-icon">{progress?.completed ? "✓" : "↗"}</span><div><strong>{progress?.completed ? t("lesson_completed") : t("lesson_progress_saving")}</strong><span>{progress?.completed ? t("lesson_completed") : t("read_percent", { count: progress?.progressPercent ?? 0 })}</span></div></div>{!progress?.completed && <button className="complete-button" type="button" disabled={busy} onClick={completeLesson}>{t("mark_complete")}</button>}</div>;
}
