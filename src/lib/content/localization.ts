import type { Locale } from "../i18n/config";
import type { LessonTranslations } from "./schema";

export function localizeLesson<T extends { title: string; translations?: LessonTranslations }>(lesson: T, locale: Locale): T {
  return { ...lesson, ...lesson.translations?.[locale] };
}
