"use client";

import { BookmarkButton } from "@/components/bookmarks/bookmark-button";
import { LocalizedFlashcardPractice } from "@/components/flashcards/flashcard-practice";
import type { Flashcard } from "@/lib/flashcards/deck";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { ReadingProgress } from "@/components/reading-progress";
import { LessonMarkdown } from "@/components/markdown/lesson-markdown";
import { LessonActions } from "@/components/learning/lesson-actions";
import { Chatbot } from "@/components/chatbot/chatbot";
import { SelectionAssistant } from "@/components/selection-assistant";
import { CurriculumSidebar, LessonMeta, LessonPagination, ReaderOnPage, ReaderTopActions } from "@/components/reader-chrome";
import { localizeLesson } from "@/lib/content/localization";
import type { Lesson, LessonSummary } from "@/lib/content/schema";
import type { Locale } from "@/lib/i18n/config";

export function LessonReader({ lessonsByLocale, summaries, flashcardBanks }: { flashcardBanks: Record<Locale, Flashcard[]>; lessonsByLocale: Record<Locale, Lesson>; summaries: LessonSummary[] }) {
  const { locale } = useLanguage();
  const lesson = lessonsByLocale[locale];
  const lessons = summaries.map((item) => localizeLesson(item, locale));
  const groups = [...new Map(lessons.map((item) => [item.section, { title: item.sectionTitle, items: lessons.filter((entry) => entry.section === item.section) }])).values()];
  const index = lessons.findIndex(({ id }) => id === lesson.id);
  const headings = lesson.body.split("\n").filter((line) => line.startsWith("## ")).map((line) => line.slice(3));
  return <div className="reader-shell"><ReadingProgress />
    <header className="reader-topbar"><Link href="/" className="brand"><span className="brand-mark">A</span><span>AI Engineering <b>Academy</b></span></Link><ReaderTopActions lessons={summaries} /></header>
    <div className="reader-grid"><CurriculumSidebar groups={groups} lessonId={lesson.id} lessonCount={lessons.length} />
      <main className="lesson-main"><div className="breadcrumbs"><Link href="/">Academy</Link><span>/</span><Link href="/#curriculum">{lesson.sectionTitle}</Link><span>/</span><span>{lesson.title}</span></div><div className="lesson-title-row"><div><div className="lesson-heading-actions"><LessonMeta level={lesson.level} duration={lesson.durationMinutes} updatedAt={lesson.updatedAt} /><BookmarkButton lessonId={lesson.id} /></div><h1 lang={lesson.language}>{lesson.title}</h1><p className="lesson-description" lang={lesson.language}>{lesson.description}</p></div></div><LessonMarkdown key={lesson.language} source={lesson.body} language={lesson.language} /><LocalizedFlashcardPractice banks={flashcardBanks} lessonId={lesson.id} /><LessonActions lessonId={lesson.id} /><LessonPagination previous={lessons[index - 1]} next={lessons[index + 1]} /></main>
      <ReaderOnPage headings={headings} /></div><Chatbot lessonId={lesson.id} />
    <SelectionAssistant lessonTitle={lesson.title} />
  </div>;
}
