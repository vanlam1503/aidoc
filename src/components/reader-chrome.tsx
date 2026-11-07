"use client";

import Link from "next/link";
import { GlobalSearch } from "@/components/global-search";
import { PreferencesControl } from "@/components/preferences-control";
import { ThemeToggle } from "@/components/theme-toggle";
import { useLanguage } from "@/components/language-provider";
import type { SearchResult } from "@/lib/search/search";
import { SessionIndicator } from "@/components/auth/session-indicator";

type ReaderLesson = { id: string; title: string; order: number; level: string; durationMinutes: number; updatedAt: string };
type Group = { title: string; items: ReaderLesson[] };

export function ReaderTopActions({ lessons }: { lessons: SearchResult[] }) {
  const { t } = useLanguage();
  return <div className="reader-top-actions"><GlobalSearch lessons={lessons} /><Link href="/references" className="back-link">{t("nav_references")}</Link><Link href="/dashboard" className="back-link">{t("nav_dashboard")}</Link><SessionIndicator /><PreferencesControl /><ThemeToggle /></div>;
}

export function CurriculumSidebar({ groups, lessonId, lessonCount }: { groups: Group[]; lessonId: string; lessonCount: number }) {
  const { t } = useLanguage();
  return <aside className="curriculum-sidebar"><div className="sidebar-label">{t("reader_learning_path")}</div><Link href="/" className="sidebar-home">⌂ <span>{t("reader_overview")}</span></Link>{groups.map((group, groupIndex) => <details className="sidebar-section" key={group.title} open={group.items.some((item) => item.id === lessonId)}><summary className="sidebar-section-title"><span>{String(groupIndex + 1).padStart(2, "0")}</span> {group.title.toLocaleUpperCase()} <span className="nav-chevron">⌄</span></summary><div className="sidebar-links">{group.items.map((item) => <Link key={item.id} href={`/learn/${item.id}`} aria-current={item.id === lessonId ? "page" : undefined} className={`sidebar-lesson ${item.id === lessonId ? "active" : ""}`}><span className="sidebar-index">{String(item.order).padStart(2, "0")}</span>{item.title}</Link>)}</div></details>)}<div className="sidebar-progress"><span>{t("reader_progress")}</span><strong>0 <small>{t("reader_of", { count: lessonCount })}</small></strong><div className="progress-line"><i style={{ width: "0%" }} /></div><small>{t("reader_sync")}</small></div></aside>;
}

export function LessonMeta({ level, duration, updatedAt }: { level: string; duration: number; updatedAt: string }) {
  const { t } = useLanguage();
  const levelKey = level === "basic" ? "level_basic" : level === "intermediate" ? "level_intermediate" : "level_advanced";
  return <div className="lesson-meta"><span className={`level level-${level}`}>{t(levelKey)}</span><span>{t("minutes", { count: duration })}</span><span>{t("updated")} {updatedAt}</span></div>;
}

export function ReaderOnPage({ headings }: { headings: string[] }) {
  const { t } = useLanguage();
  return <aside className="toc-sidebar"><div className="sidebar-label">{t("reader_on_page")}</div>{headings.map((heading) => <a key={heading} href={`#${heading.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "")}`}>{heading}</a>)}<div className="toc-help"><span>✳</span><strong>{t("reader_help")}</strong><p>{t("reader_help_body")}</p></div></aside>;
}

export function LessonPagination({ previous, next }: { previous?: { id: string; title: string }; next?: { id: string; title: string } }) {
  const { t } = useLanguage();
  return <nav className="lesson-pagination" aria-label={t("reader_learning_path")}>{previous ? <Link href={`/learn/${previous.id}`}><span>{t("reader_previous")}</span><strong>{previous.title}</strong></Link> : <span />}{next ? <Link href={`/learn/${next.id}`} className="next"><span>{t("reader_next")}</span><strong>{next.title}</strong></Link> : <span />}</nav>;
}
