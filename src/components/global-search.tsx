"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { searchLessons, type SearchResult } from "@/lib/search/search";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";

export function GlobalSearch({ lessons }: { lessons: SearchResult[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(lessons);
  const { locale, t } = useLanguage();
  const results = useMemo(() => searchLessons(index, query, undefined, locale), [index, query, locale]);

  async function openSearch() {
    dialog.current?.showModal();
    window.setTimeout(() => input.current?.focus(), 0);
    if (index.some((lesson) => lesson.body)) return;
    try {
      const response = await fetch("/search-index.json");
      if (response.ok) setIndex(await response.json() as SearchResult[]);
    } catch { /* Metadata-only search remains available when the local index cannot be fetched. */ }
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        void openSearch();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return <>
    <Button type="button" variant="outline" size="sm" className="global-search-trigger" onClick={() => void openSearch()}><span aria-hidden="true">⌕</span><span className="search-trigger-label">{t("chat_tab_search")}</span><kbd>⌘ / Ctrl K</kbd></Button>
    <dialog className="search-dialog" ref={dialog} onClose={() => setQuery("")} aria-label={t("chat_tab_search")}>
      <div className="dialog-search"><span aria-hidden="true">⌕</span><input ref={input} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("chat_search_placeholder")} aria-label={t("chat_search_placeholder")} /><button type="button" onClick={() => dialog.current?.close()}>Esc</button></div>
      <div className="dialog-results" aria-live="polite">{results.slice(0, 8).map((lesson) => <Link key={lesson.id} href={`/learn/${lesson.id}`} onClick={() => dialog.current?.close()}><span className={`level level-${lesson.level}`}>{t(lesson.level === "basic" ? "level_basic" : lesson.level === "intermediate" ? "level_intermediate" : "level_advanced")}</span><span><strong>{lesson.title}</strong><small>{lesson.description}</small></span><span aria-hidden="true">↗</span></Link>)}{!results.length && <p>{t("no_results")}</p>}</div>
      <div className="dialog-hint">{t("home_section_kicker")} <span>ESC</span></div>
    </dialog>
  </>;
}
