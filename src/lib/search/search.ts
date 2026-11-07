import type { Lesson, LessonTranslations } from "@/lib/content/schema";
import { localizeLesson } from "@/lib/content/localization";
import { defaultLocale, type Locale } from "@/lib/i18n/config";

export type SearchResult = Pick<Lesson, "id" | "title" | "description" | "level" | "tags" | "sectionTitle"> & { body?: string; language?: Locale; translations?: LessonTranslations };

export function searchLessons(lessons: SearchResult[], query: string, level?: string, locale: Locale = defaultLocale): SearchResult[] {
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return lessons.map((lesson) => localizeLesson(lesson, locale)).filter((lesson) => {
    if (level && lesson.level !== level) return false;
    if (!terms.length) return true;
    const fields = [lesson.title, lesson.description, lesson.sectionTitle, lesson.body ?? "", ...lesson.tags].map((field) => field.toLocaleLowerCase());
    return terms.every((term) => fields.some((field) => field.includes(term)));
  }).sort((a, b) => score(b, terms) - score(a, terms));
}

function score(lesson: SearchResult, terms: string[]): number {
  const title = lesson.title.toLocaleLowerCase();
  const tags = lesson.tags.join(" ").toLocaleLowerCase();
  return terms.reduce((sum, term) => sum + (title.includes(term) ? 5 : 0) + (tags.includes(term) ? 3 : 0), 0);
}
