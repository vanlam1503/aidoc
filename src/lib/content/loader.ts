import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { parseLessonMetadata, type Lesson, type LessonSummary } from "./schema";
import { defaultLocale, supportedLocales, type Locale } from "../i18n/config";

const contentRoot = path.join(process.cwd(), "content");
const sectionTitles: Record<string, string> = {
  "01-foundations": "Foundations",
  "02-codex": "OpenAI Codex",
  "03-agent-fundamentals": "Agent Fundamentals",
  "04-langchain": "LangChain & LangGraph",
  "05-advanced": "Advanced Engineering",
  "06-projects": "Projects",
};

export function getLessons(locale: Locale = defaultLocale): Lesson[] {
  if (!fs.existsSync(contentRoot)) return [];
  const lessons: Lesson[] = [];
  for (const section of fs.readdirSync(contentRoot).sort()) {
    const sectionPath = path.join(contentRoot, section);
    if (!fs.statSync(sectionPath).isDirectory()) continue;
    for (const folder of fs.readdirSync(sectionPath).sort()) {
      const defaultPath = path.join(sectionPath, folder, "index.mdx");
      if (!fs.existsSync(defaultPath)) continue;
      const translatedPath = path.join(sectionPath, folder, `${locale}.mdx`);
      const filePath = locale !== defaultLocale && fs.existsSync(translatedPath) ? translatedPath : defaultPath;
      const parsed = matter(fs.readFileSync(filePath, "utf8"));
      const metadata = parseLessonMetadata(parsed.data);
      lessons.push({ ...metadata, slug: metadata.id, section, sectionTitle: sectionTitles[section] ?? section, body: parsed.content.trim(), sourcePath: path.relative(process.cwd(), filePath).split(path.sep).join("/") });
    }
  }
  return lessons.sort((a, b) => a.section.localeCompare(b.section) || a.order - b.order || a.title.localeCompare(b.title));
}

export function getLessonBySlug(slug: string, locale: Locale = defaultLocale): Lesson | undefined {
  return getLessons(locale).find((lesson) => lesson.slug === slug);
}

export function getLessonSummaries(): LessonSummary[] {
  const translations = supportedLocales.filter((locale) => locale !== defaultLocale).map((locale) => ({ locale, lessons: new Map(getLessons(locale).map((lesson) => [lesson.id, lesson])) }));
  return getLessons().map(({ body: _body, sourcePath: _sourcePath, ...lesson }) => ({
    ...lesson,
    translations: Object.fromEntries(translations.map(({ locale, lessons }) => {
      const translated = lessons.get(lesson.id) ?? lesson;
      return [locale, { title: translated.title, description: translated.description, language: translated.language }];
    })),
  }));
}
