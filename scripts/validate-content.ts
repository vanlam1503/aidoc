import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { parseLessonMetadata } from "../src/lib/content/schema";
import { references } from "../src/lib/content/references";
import { findMissingLessonSections } from "../src/lib/content/structure";
import { defaultLocale, supportedLocales } from "../src/lib/i18n/config";

const root = path.join(process.cwd(), "content");
const ids = new Set<string>();
const prerequisitesById = new Map<string, string[]>();
let count = 0;
let translationCount = 0;
for (const section of fs.readdirSync(root).sort()) {
  const sectionPath = path.join(root, section);
  if (!fs.statSync(sectionPath).isDirectory()) continue;
  for (const folder of fs.readdirSync(sectionPath).sort()) {
    const file = path.join(sectionPath, folder, "index.mdx");
    if (!fs.existsSync(file)) continue;
    try {
      const parsed = matter(fs.readFileSync(file, "utf8"));
      const lesson = parseLessonMetadata(parsed.data);
      if (lesson.language !== defaultLocale) throw new Error("Default lesson must be in English");
      if (ids.has(lesson.id)) throw new Error(`Duplicate lesson id: ${lesson.id}`);
      ids.add(lesson.id);
      prerequisitesById.set(lesson.id, lesson.prerequisites);
      const missing = findMissingLessonSections(parsed.content, lesson.language);
      if (missing.length) throw new Error(`Missing required sections: ${missing.join(", ")}`);
      for (const locale of supportedLocales.filter((value) => value !== defaultLocale)) {
        const translationFile = path.join(sectionPath, folder, `${locale}.mdx`);
        if (!fs.existsSync(translationFile)) continue;
        const translation = matter(fs.readFileSync(translationFile, "utf8"));
        const metadata = parseLessonMetadata(translation.data);
        if (metadata.id !== lesson.id || metadata.language !== locale) throw new Error(`Invalid ${locale} translation identity or language`);
        if (JSON.stringify(metadata.prerequisites) !== JSON.stringify(lesson.prerequisites)) throw new Error(`Mismatched prerequisites in ${locale} translation`);
        const missingTranslationSections = findMissingLessonSections(translation.content, locale);
        if (missingTranslationSections.length) throw new Error(`${locale} translation missing sections: ${missingTranslationSections.join(", ")}`);
        translationCount += 1;
      }
      count += 1;
    } catch (error) {
      console.error(`${file}: ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    }
  }
}
for (const [id, prerequisites] of prerequisitesById) {
  for (const prerequisite of prerequisites) {
    if (!ids.has(prerequisite)) {
      console.error(`${id}: unknown prerequisite ${prerequisite}`);
      process.exitCode = 1;
    }
  }
}
for (const reference of references) {
  for (const relatedLesson of reference.relatedLessons) {
    if (!ids.has(relatedLesson)) {
      console.error(`${reference.name}: unknown related lesson ${relatedLesson}`);
      process.exitCode = 1;
    }
  }
}
if (!process.exitCode) console.log(`Validated ${count} lesson(s) and ${translationCount} translation(s).`);
