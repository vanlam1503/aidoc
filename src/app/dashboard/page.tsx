import { getLessonSummaries } from "@/lib/content/loader";
import { localStore } from "@/lib/local/store";
import { LearningDashboard } from "@/components/learning/dashboard";

export const metadata = { title: "Learning dashboard — AI Engineering Academy" };
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const lessons = getLessonSummaries();
  const ids = new Set(lessons.map((lesson) => lesson.id));
  try {
    const state = await localStore.snapshot();
    return <LearningDashboard bookmarkCount={state.bookmarks.length} lessons={lessons} completedIds={state.progress.filter((item) => item.completed && ids.has(item.lessonId)).map((item) => item.lessonId)} bookmarkedIds={state.bookmarks.flatMap((item) => item.kind === "lesson" && ids.has(item.lessonId) ? [item.lessonId] : [])} />;
  } catch { return <LearningDashboard lessons={lessons} completedIds={[]} bookmarkedIds={[]} unavailable />; }
}
