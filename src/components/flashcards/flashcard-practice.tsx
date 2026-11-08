"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { createPracticeDeck, type Flashcard, type PracticeCard } from "@/lib/flashcards/deck";
import type { Locale } from "@/lib/i18n/config";

const labels = {
  en: {
    title: "Interview flashcards", intro: "Match each question to its answer outline. Four shuffled choices, one matching answer.",
    start: "Start practice", next: "Next question", finish: "See results", correct: "Correct", incorrect: "Incorrect", answer: "Matching answer",
    complete: "Practice complete", score: "Correct answers", restart: "Shuffle and restart", review: "Review missed questions", source: "Read the lesson", empty: "No flashcards available.",
    question: "Question", of: "of", choices: "Choose the matching answer", ready: "questions ready", essential: "* Essential", session: "Results apply to this practice session.",
  },
  vi: {
    title: "Flashcard phỏng vấn", intro: "Ghép câu hỏi với gợi ý trả lời tương ứng. Bốn lựa chọn được xáo trộn, một đáp án phù hợp.",
    start: "Bắt đầu ôn tập", next: "Câu tiếp theo", finish: "Xem kết quả", correct: "Đúng", incorrect: "Sai", answer: "Đáp án phù hợp",
    complete: "Hoàn thành ôn tập", score: "Số câu đúng", restart: "Xáo trộn và làm lại", review: "Ôn lại câu sai", source: "Đọc bài học", empty: "Chưa có flashcard.",
    question: "Câu", of: "trên", choices: "Chọn đáp án phù hợp", ready: "câu hỏi sẵn sàng", essential: "* Essential", session: "Kết quả chỉ áp dụng cho lượt ôn tập này.",
  },
};

export function FlashcardPractice({ cards, bank, locale }: { cards: Flashcard[]; bank: Flashcard[]; locale: Locale }) {
  const copy = labels[locale];
  const [deck, setDeck] = useState<PracticeCard[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [missed, setMissed] = useState<Flashcard[]>([]);
  const [score, setScore] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const active = deck[index];
  const completed = deck.length > 0 && !active;

  function focusHeading() { requestAnimationFrame(() => heading.current?.focus()); }
  function start(items: Flashcard[]) {
    setDeck(createPracticeDeck(items, bank));
    setIndex(0); setSelected(null); setMissed([]); setScore(0); focusHeading();
  }
  function choose(id: string) {
    if (selected !== null || !active) return;
    setSelected(id);
    if (id === active.card.id) setScore((value) => value + 1);
    else setMissed((items) => [...items, active.card]);
  }

  return <section className="flashcard-practice" lang={locale} aria-label={copy.title}>
    <div className="flashcard-intro"><span className="eyebrow">{locale === "vi" ? "LUYỆN NHỚ CHỦ ĐỘNG" : "ACTIVE RECALL"}</span><h2>{copy.title}</h2><p>{copy.intro}</p></div>
    {!deck.length ? <div className="flashcard-ready"><p>{cards.length ? `${cards.length} ${locale === "en" && cards.length === 1 ? "question ready" : copy.ready}` : copy.empty}</p><Button disabled={!cards.length} onClick={() => start(cards)}>{copy.start}</Button></div>
      : completed ? <div className="flashcard-results"><h3 ref={heading} tabIndex={-1}>{copy.complete}</h3><p className="flashcard-score">{score} / {deck.length}</p><p>{copy.score} · {Math.round(score / deck.length * 100)}%</p><p>{copy.session}</p><div className="flashcard-controls">{missed.length > 0 && <Button onClick={() => start(missed)}>{copy.review} ({missed.length})</Button>}<Button variant="outline" onClick={() => start(cards)}>{copy.restart}</Button></div></div>
        : <>
          <div className="flashcard-status"><span>{copy.question} {index + 1} {copy.of} {deck.length}</span><span>{copy.correct}: {score}</span></div>
          <progress className="flashcard-progress" value={index + (selected === null ? 0 : 1)} max={deck.length} aria-label={copy.title} />
          <div className="flashcard-question">
            <p className="flashcard-topic">{active.card.lessonTitle}</p>
            {active.card.essential && <p className="flashcard-essential">{copy.essential}{active.card.reason ? ` — ${active.card.reason}` : ""}</p>}
            <h3 ref={heading} tabIndex={-1}>{active.card.question}</h3>
          </div>
          <fieldset className="flashcard-options"><legend>{copy.choices}</legend>{active.options.map((option, position) => {
            const correct = selected !== null && option.id === active.card.id;
            const wrong = selected === option.id && option.id !== active.card.id;
            return <button type="button" key={option.id} aria-disabled={selected !== null} aria-pressed={selected === option.id} className={`flashcard-option${correct ? " is-correct" : ""}${wrong ? " is-wrong" : ""}`} onClick={() => choose(option.id)}>
              <span className="flashcard-letter" aria-hidden="true">{"ABCD"[position]}</span><span>{option.text}{correct && <strong className="flashcard-verdict">✓ {copy.correct}</strong>}{wrong && <strong className="flashcard-verdict">✕ {copy.incorrect}</strong>}</span>
            </button>;
          })}</fieldset>
          <div role="status" aria-live="polite">{selected !== null && <div className="flashcard-feedback"><strong>{selected === active.card.id ? copy.correct : copy.incorrect}</strong><p>{copy.answer}: {active.card.answer}</p><div className="flashcard-sources"><Link href={`/learn/${active.card.lessonId}#${locale === "vi" ? "câu-hỏi-phỏng-vấn" : "interview-questions"}`}>{copy.source} ↗</Link>{active.card.references.map((reference) => <a key={reference.url} href={reference.url} target="_blank" rel="noreferrer">{reference.title} ↗</a>)}</div></div>}</div>
          {selected !== null && <div className="flashcard-controls"><Button onClick={() => { setIndex((value) => value + 1); setSelected(null); focusHeading(); }}>{index === deck.length - 1 ? copy.finish : copy.next} →</Button></div>}
        </>}
  </section>;
}

export function LocalizedFlashcardPractice({ banks, lessonId }: { banks: Record<Locale, Flashcard[]>; lessonId: string }) {
  const { locale } = useLanguage();
  const bank = banks[locale];
  return <FlashcardPractice key={`${locale}:${lessonId}`} locale={locale} bank={bank} cards={bank.filter((card) => card.lessonId === lessonId)} />;
}
