"use client";

import Link from "next/link";
import { SiteNavigation } from "@/components/site-navigation";
import { useLanguage } from "@/components/language-provider";
import { localizeLesson } from "@/lib/content/localization";
import type { LessonSummary } from "@/lib/content/schema";

export function LearningDashboard({ lessons, completedIds, bookmarkedIds, bookmarkCount = bookmarkedIds.length, unavailable }: { bookmarkCount?: number; lessons: LessonSummary[]; completedIds: string[]; bookmarkedIds: string[]; unavailable?: boolean }) {
  const { locale } = useLanguage();
  const vi = locale === "vi";
  const completed = new Set(completedIds);
  const bookmarked = new Set(bookmarkedIds);
  return <main className="home-shell dashboard-shell"><header className="topbar"><Link href="/" className="brand"><span className="brand-mark">A</span><span>AI Engineering <b>Academy</b></span></Link><SiteNavigation current="dashboard" /></header>
    <section className="dashboard-heading"><span className="eyebrow">{vi ? "KHÔNG GIAN HỌC TẬP LOCAL" : "YOUR LOCAL LEARNING SPACE"}</span><h1>{vi ? "Tiến độ học tập" : "Your learning dashboard"}</h1><p>{vi ? "Tiến độ và bookmark được lưu trên máy này. Không cần tài khoản." : "Progress and bookmarks are saved on this computer. No account needed."}</p>{unavailable && <p role="status">{vi ? "Không thể đọc dữ liệu local. Bạn vẫn có thể mở bài học." : "Local data could not be read. You can still open lessons."}</p>}</section>
    <div className="dashboard-stats"><article><strong>{completed.size}</strong><span>{vi ? "BÀI ĐÃ HOÀN THÀNH" : "LESSONS COMPLETED"}</span></article><article><strong>{bookmarkCount}</strong><span>BOOKMARKS</span></article><article><strong>{lessons.length - completed.size}</strong><span>{vi ? "BÀI CÒN LẠI" : "LESSONS TO EXPLORE"}</span></article></div>
    <section className="dashboard-list"><div className="dashboard-list-head"><h2>{vi ? "Chương trình học" : "Your curriculum"}</h2><span>{completed.size} / {lessons.length} {vi ? "hoàn thành" : "complete"}</span></div>{lessons.map((item) => { const lesson = localizeLesson(item, locale); return <Link key={lesson.id} href={`/learn/${lesson.id}`} className="dashboard-lesson"><span className={completed.has(lesson.id) ? "dashboard-done done" : "dashboard-done"}>{completed.has(lesson.id) ? "✓" : ""}</span><span><strong>{lesson.title}</strong><small>{lesson.sectionTitle} · {lesson.durationMinutes} min</small></span>{bookmarked.has(lesson.id) && <span className="dashboard-bookmark" aria-label={vi ? "Đã bookmark" : "Bookmarked"}>★</span>}</Link>; })}</section>
  </main>;
}
