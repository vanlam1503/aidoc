"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { searchLessons, type SearchResult } from "@/lib/search/search";
import { useLanguage } from "@/components/language-provider";

export function SearchBox({ lessons }: { lessons: SearchResult[] }) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("");
  const [index, setIndex] = useState(lessons);
  const { locale, t } = useLanguage();
  useEffect(() => { fetch("/search-index.json").then((response) => response.ok ? response.json() as Promise<SearchResult[]> : lessons).then(setIndex).catch(() => setIndex(lessons)); }, [lessons]);
  const results = useMemo(() => searchLessons(index, query, level || undefined, locale), [index, query, level, locale]);
  return <section className="search-panel" aria-labelledby="search-title">
    <div className="search-heading"><div><span className="eyebrow">{t("search_panel_kicker")}</span><h2 id="search-title">{t("search_panel_title")}</h2></div><span className="count">{t("lesson_count", { count: lessons.length })}</span></div>
    <div className="search-controls"><label className="search-input"><span aria-hidden="true">⌕</span><span className="sr-only">{t("search_placeholder")}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("search_placeholder")} /></label>
      <label className="sr-only" htmlFor="level-filter">{t("filter_level")}</label><select id="level-filter" value={level} onChange={(event) => setLevel(event.target.value)}><option value="">{t("all_levels")}</option><option value="basic">{t("level_basic")}</option><option value="intermediate">{t("level_intermediate")}</option><option value="advanced">{t("level_advanced")}</option></select></div>
    <div className="lesson-list" aria-live="polite">{results.length ? results.map((lesson, index) => <Link className="lesson-card" key={lesson.id} href={`/learn/${lesson.id}`}>
      <span className="lesson-number">{String(index + 1).padStart(2, "0")}</span><div className="lesson-copy"><div className="lesson-meta"><span className={`level level-${lesson.level}`}>{lesson.level}</span><span>{lesson.sectionTitle}</span></div><h3>{lesson.title}</h3><p>{lesson.description}</p><div className="tag-row">{lesson.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div></div><span className="card-arrow" aria-hidden="true">↗</span>
    </Link>) : <p className="empty-state">{t("no_results")}</p>}</div>
  </section>;
}
