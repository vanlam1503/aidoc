"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useLanguage } from "@/components/language-provider";
import { localizeLesson } from "@/lib/content/localization";
import type { LessonSummary } from "@/lib/content/schema";
import { useBookmarks } from "./bookmark-provider";

function searchable(value: string) { return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").replaceAll("đ", "d").replaceAll("Đ", "D").toLowerCase(); }

export function BookmarkLibrary({ lessons }: { lessons: LessonSummary[] }) {
  const { locale, t } = useLanguage();
  const { bookmarks, loading, error, pending, refresh, addLink, remove } = useBookmarks();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [saved, setSaved] = useState(false);
  const entries = useMemo(() => {
    const localized = new Map(lessons.map((lesson) => [lesson.id, localizeLesson(lesson, locale)]));
    return bookmarks.map((bookmark) => {
      const lesson = bookmark.kind === "lesson" ? localized.get(bookmark.lessonId) : undefined;
      return { bookmark, title: bookmark.kind === "link" ? bookmark.title : lesson?.title ?? bookmark.lessonId,
        url: bookmark.kind === "link" ? bookmark.url : `/learn/${bookmark.lessonId}`,
        description: lesson?.description ?? "", section: lesson?.sectionTitle ?? "", tags: lesson?.tags.join(" ") ?? "" };
    }).sort((a, b) => b.bookmark.createdAt.localeCompare(a.bookmark.createdAt));
  }, [bookmarks, lessons, locale]);
  const results = entries.filter((entry) => (filter === "all" || entry.bookmark.kind === filter) && searchable(`${entry.title} ${entry.url} ${entry.description} ${entry.section} ${entry.tags}`).includes(searchable(query.trim())));

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaved(false);
    try {
      await addLink(url, title);
      setUrl(""); setTitle(""); setQuery(""); setFilter("all"); setSaved(true);
    } catch { /* Provider exposes a recoverable save error below. */ }
  }

  return <div className="bookmark-library">
    <section className="bookmarks-hero"><span className="eyebrow">{t("bookmarks_kicker")}</span><h1>{t("nav_bookmarks")}</h1><p>{t("bookmarks_intro")}</p><span className="bookmarks-local-note">{t("bookmarks_local")}</span></section>
    <section className="bookmark-add-panel" aria-labelledby="bookmark-add-title"><div><h2 id="bookmark-add-title">{t("bookmarks_add")}</h2><p>{t("bookmarks_add_help")}</p></div><form onSubmit={(event) => void submit(event)}>
      <label htmlFor="bookmark-url">URL<input id="bookmark-url" type="url" required maxLength={2048} placeholder="https://…" value={url} onChange={(event) => { setUrl(event.target.value); setSaved(false); }} /></label>
      <label htmlFor="bookmark-title">{t("bookmarks_title_label")}<input id="bookmark-title" maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
      <button type="submit" disabled={loading || pending.has("link")}>{pending.has("link") ? t("bookmarks_saving") : t("bookmarks_save_link")}</button>
    </form>{saved && <p className="bookmark-notice" role="status">{t("bookmarks_link_saved")}</p>}</section>
    <div className="bookmarks-toolbar"><label className="bookmarks-search" htmlFor="bookmark-search"><span className="sr-only">{t("bookmarks_search")}</span><span aria-hidden="true">⌕</span><input id="bookmark-search" type="search" placeholder={t("bookmarks_search")} value={query} onChange={(event) => setQuery(event.target.value)} /></label><label className="bookmarks-filter" htmlFor="bookmark-filter"><span className="sr-only">{t("bookmarks_filter")}</span><select id="bookmark-filter" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">{t("bookmarks_all")}</option><option value="lesson">{t("bookmarks_lessons")}</option><option value="link">{t("bookmarks_links")}</option></select></label></div>
    {error && <div className="bookmark-error" role="alert"><span>{t("bookmarks_error")}</span><button type="button" onClick={() => void refresh()}>{t("retry")}</button></div>}
    <div className="bookmarks-result-count" role="status">{loading ? t("bookmarks_loading") : t("bookmarks_count", { count: results.length, total: bookmarks.length })}</div>
    {!loading && (results.length ? <ul className="bookmarks-list">{results.map((entry) => <li className="saved-bookmark-card" key={entry.bookmark.id}>
      <div className="saved-bookmark-icon" aria-hidden="true">{entry.bookmark.kind === "lesson" ? "▤" : "↗"}</div><div className="saved-bookmark-copy"><div className="saved-bookmark-meta"><span>{t(entry.bookmark.kind === "lesson" ? "bookmarks_lesson" : "bookmarks_link")}</span><time dateTime={entry.bookmark.createdAt}>{new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en", { dateStyle: "medium" }).format(new Date(entry.bookmark.createdAt))}</time></div>
        <h2>{entry.bookmark.kind === "lesson" ? <Link href={entry.url}>{entry.title}</Link> : <a href={entry.url} target="_blank" rel="noreferrer">{entry.title} <span aria-hidden="true">↗</span></a>}</h2>
        {entry.description && <p>{entry.description}</p>}<span className="saved-bookmark-url">{entry.url}</span></div>
      <button type="button" className="bookmark-remove" aria-label={`${t("remove_bookmark")}: ${entry.title}`} title={t("remove_bookmark")} disabled={pending.has(entry.bookmark.kind === "lesson" ? `lesson:${entry.bookmark.lessonId}` : `bookmark:${entry.bookmark.id}`)} onClick={() => { setSaved(false); void remove(entry.bookmark).catch(() => undefined); }}>×</button>
    </li>)}</ul> : <section className="bookmarks-empty"><span aria-hidden="true">◇</span><h2>{t(query || filter !== "all" ? "bookmarks_no_matches" : "bookmarks_empty")}</h2><p>{t(query || filter !== "all" ? "bookmarks_no_matches_help" : "bookmarks_empty_help")}</p>{!query && filter === "all" && <Link href="/#curriculum">{t("home_explore")} →</Link>}</section>)}
  </div>;
}
