import { z } from "zod";
import { defaultLocale, supportedLocales } from "../i18n/config";
import type { Locale } from "../i18n/config";

export const lessonSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(3),
  description: z.string().min(10),
  language: z.enum(supportedLocales).default(defaultLocale),
  level: z.enum(["basic", "intermediate", "advanced"]),
  durationMinutes: z.number().int().positive(),
  order: z.number().int().positive(),
  prerequisites: z.array(z.string()),
  tags: z.array(z.string()),
  updatedAt: z.string().date(),
});

export type LessonMetadata = z.infer<typeof lessonSchema>;
export type LessonTranslation = Pick<LessonMetadata, "title" | "description" | "language"> & { body?: string };
export type LessonTranslations = Partial<Record<Locale, LessonTranslation>>;
export type Lesson = LessonMetadata & {
  slug: string;
  section: string;
  sectionTitle: string;
  body: string;
  sourcePath: string;
};

export type LessonSummary = Omit<Lesson, "body" | "sourcePath"> & { translations: LessonTranslations };

export function parseLessonMetadata(value: unknown): LessonMetadata {
  if (typeof value === "object" && value !== null && "updatedAt" in value && value.updatedAt instanceof Date) {
    return lessonSchema.parse({ ...value, updatedAt: value.updatedAt.toISOString().slice(0, 10) });
  }
  return lessonSchema.parse(value);
}
