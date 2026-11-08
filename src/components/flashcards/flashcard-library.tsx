"use client";

import { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { FlashcardPractice } from "./flashcard-practice";
import type { Flashcard } from "@/lib/flashcards/deck";
import type { Locale } from "@/lib/i18n/config";

export function FlashcardLibrary({ banks }: { banks: Record<Locale, Flashcard[]> }) {
  const { locale } = useLanguage();
  const [lessonId, setLessonId] = useState("");
  const [essentialOnly, setEssentialOnly] = useState(false);
  const bank = banks[locale];
  const lessons = [...new Map(bank.map((card) => [card.lessonId, card.lessonTitle])).entries()];
  const cards = bank.filter((card) => (!lessonId || card.lessonId === lessonId) && (!essentialOnly || card.essential));
  return <div className="flashcard-library">
    <div className="flashcard-hero"><span className="eyebrow">{locale === "vi" ? "THƯ VIỆN ÔN TẬP" : "THE PRACTICE LIBRARY"}</span><h1>{locale === "vi" ? "Một câu hỏi. Hiểu sâu hơn." : "One question. A stronger foundation."}</h1><p>{locale === "vi" ? "Ôn câu phỏng vấn từ các bài học. Chọn đáp án, xem phản hồi và thử lại những câu chưa nhớ." : "Practice interview questions from your lessons. Choose an answer, get feedback, and revisit what you missed."}</p></div>
    <div className="flashcard-filters"><div className="flashcard-lesson-filter"><label htmlFor="flashcard-lesson">{locale === "vi" ? "Bài học" : "Lesson"}</label><select id="flashcard-lesson" value={lessonId} onChange={(event) => setLessonId(event.target.value)}><option value="">{locale === "vi" ? "Tất cả bài học" : "All lessons"}</option>{lessons.map(([id, title]) => <option key={id} value={id}>{title}</option>)}</select></div><label className="flashcard-checkbox"><input type="checkbox" checked={essentialOnly} onChange={(event) => setEssentialOnly(event.target.checked)} />{locale === "vi" ? "Chỉ câu * Essential" : "* Essential questions only"}</label></div>
    <FlashcardPractice key={`${locale}:${lessonId}:${essentialOnly}`} locale={locale} cards={cards} bank={bank} />
  </div>;
}
