import type { Lesson } from "../content/schema";

export type Flashcard = {
  id: string;
  lessonId: string;
  lessonTitle: string;
  section: string;
  question: string;
  answer: string;
  essential: boolean;
  reason?: string;
  references: { title: string; url: string }[];
};
export type PracticeCard = { card: Flashcard; options: { id: string; text: string }[] };

export function extractFlashcards(lesson: Lesson): Flashcard[] {
  const heading = lesson.language === "vi" ? "Câu hỏi phỏng vấn" : "Interview questions";
  const section = lesson.body.split(`## ${heading}\n`)[1]?.split(/\n## /)[0] ?? "";
  return [...section.matchAll(/^### (\d+)\. (.+)\n([\s\S]*?)(?=^### |$(?![\s\S]))/gm)].map((match) => {
    const [, number, title, body] = match;
    const answer = /\*\*(?:Answer outline|Gợi ý trả lời):\*\*\s*([^\n]+(?:\n(?!\n)[^\n]+)*)/.exec(body)?.[1]?.trim();
    if (!answer) throw new Error(`Missing flashcard answer: ${lesson.id}/${number}`);
    return {
      id: `${lesson.id}:interview:${number}`, lessonId: lesson.id, lessonTitle: lesson.title,
      section: lesson.section, question: title.replace(/^\\\* Essential\s*—\s*/, ""), answer,
      essential: title.includes("Essential"),
      reason: /\*\*(?:Why essential|Vì sao cần ưu tiên):\*\*\s*([^\n]+)/.exec(body)?.[1],
      references: [...body.matchAll(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g)].map((link) => ({ title: link[1], url: link[2] })),
    };
  });
}

export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Answers remain tied to their source question. Use the full bank even for a
// three-question lesson, so every practice card can offer four distinct choices.
export function createPracticeDeck(cards: readonly Flashcard[], bank: readonly Flashcard[], random: () => number = Math.random): PracticeCard[] {
  // Keep essential prerequisites in curriculum order before shuffled follow-ups.
  const ordered = [...cards.filter((card) => card.essential), ...shuffle(cards.filter((card) => !card.essential), random)];
  return ordered.map((card) => {
    const seen = new Set([card.answer]);
    const candidates = shuffle(bank.filter((other) => other.id !== card.id), random)
      .sort((a, b) => Number(b.lessonId === card.lessonId) - Number(a.lessonId === card.lessonId) || Number(b.section === card.section) - Number(a.section === card.section));
    const distractors = candidates.filter((other) => {
      if (seen.has(other.answer)) return false;
      seen.add(other.answer);
      return true;
    }).slice(0, 3);
    if (distractors.length !== 3) throw new Error("Flashcards need at least four distinct answers in the bank.");
    return { card, options: shuffle([card, ...distractors].map((item) => ({ id: item.id, text: item.answer })), random) };
  });
}
