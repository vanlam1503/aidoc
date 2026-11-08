import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { getLessons, getLessonSummaries } from "@/lib/content/loader";
import { references, referenceCategories } from "@/lib/content/references";
import { parseLessonMetadata } from "@/lib/content/schema";
import { findMissingLessonSections } from "@/lib/content/structure";

describe("local curriculum", () => {
  const lessons = getLessons();

  it("loads the full curriculum with unique IDs and substantive content", () => {
    expect(lessons).toHaveLength(33);
    expect(new Set(lessons.map((lesson) => lesson.id)).size).toBe(lessons.length);
    expect(lessons.every((lesson) => lesson.body.length > 500)).toBe(true);
    expect(new Set(lessons.map((lesson) => lesson.level))).toEqual(new Set(["basic", "intermediate", "advanced"]));
    expect(lessons.every((lesson) => lesson.language === "en")).toBe(true);
    for (const lesson of lessons) {
      expect(findMissingLessonSections(lesson.body, lesson.language), lesson.id).toEqual([]);
      expect(`${lesson.title} ${lesson.description} ${lesson.body}`).not.toMatch(/[À-ỹ]/);
      expect(fs.existsSync(lesson.sourcePath)).toBe(true);
    }
  });

  it("preserves Vietnamese lessons with the same stable identities and prerequisites", () => {
    const vietnamese = getLessons("vi");
    expect(vietnamese).toHaveLength(33);
    expect(vietnamese.map((lesson) => lesson.id)).toEqual(lessons.map((lesson) => lesson.id));
    for (const [index, lesson] of vietnamese.entries()) {
      expect(lesson.language).toBe("vi");
      expect(lesson.prerequisites).toEqual(lessons[index].prerequisites);
      expect(findMissingLessonSections(lesson.body, "vi"), lesson.id).toEqual([]);
      expect(lesson.sourcePath).toMatch(/\/vi\.mdx$/);
      expect(fs.existsSync(lesson.sourcePath)).toBe(true);
    }
  });

  it("provides localized summaries without shipping lesson bodies to the curriculum", () => {
    const summaries = getLessonSummaries();
    expect(summaries).toHaveLength(33);
    expect(summaries[0].title).toBe("What is an LLM? How language models work");
    expect(summaries[0].translations.vi?.title).toBe("LLM là gì? Cách mô hình ngôn ngữ hoạt động");
    expect(summaries.every((lesson) => !("body" in lesson) && !lesson.translations.vi?.body)).toBe(true);
  });

  it("keeps prerequisites and reference lesson links resolvable", () => {
    const ids = new Set(lessons.map((lesson) => lesson.id));
    expect(lessons.flatMap((lesson) => lesson.prerequisites).every((id) => ids.has(id))).toBe(true);
    expect(references.flatMap((reference) => reference.relatedLessons).every((id) => ids.has(id))).toBe(true);
  });

  it("provides three sourced interview questions for every lesson in both languages", () => {
    for (const locale of ["en", "vi"] as const) {
      for (const lesson of getLessons(locale)) {
        const heading = locale === "en" ? "Interview questions" : "Câu hỏi phỏng vấn";
        const section = lesson.body.split(`## ${heading}\n`)[1]?.split(/\n## /)[0];
        expect(section, `${locale}/${lesson.id}`).toBeDefined();
        const questions = section!.split(/^### \d\. /m).slice(1);
        expect(questions, `${locale}/${lesson.id}`).toHaveLength(3);
        expect(questions[0]).toContain("\\* Essential");
        for (const question of questions) {
          expect(question).toMatch(locale === "en" ? /\*\*Answer outline:\*\*/ : /\*\*Gợi ý trả lời:\*\*/);
          expect(question).toMatch(/\[[^\]]+\]\(https:\/\/[^)]+\)/);
        }
        expect(section).toMatch(/(?:checked on|kiểm chứng ngày) \d{4}-\d{2}-\d{2}/);
        expect(section).toContain("https://github.com/");
      }
    }
  });

  it("has resources in every reference category", () => {
    for (const category of referenceCategories) {
      expect(references.some((reference) => reference.category === category), category).toBe(true);
    }
  });
});

describe("English lesson authoring", () => {
  const metadata = {
    id: "english-example", title: "English example", description: "An example English lesson.",
    level: "basic", durationMinutes: 10, order: 1, prerequisites: [], tags: [], updatedAt: "2026-11-07",
  };
  const source = `## Learning objectives
## Prerequisites
## Theory: core concepts
## Architecture in an application
## TypeScript example
## Practice
## Common mistakes
## Further reading
## Interview questions
## Quick quiz
## Completion criteria`;

  it("defaults new lesson metadata to English and rejects unsupported languages", () => {
    expect(parseLessonMetadata(metadata).language).toBe("en");
    expect(parseLessonMetadata({ ...metadata, language: "vi" }).language).toBe("vi");
    expect(() => parseLessonMetadata({ ...metadata, language: "fr" })).toThrow();
  });

  it("accepts English lesson sections, including headings with subtitles", () => {
    expect(findMissingLessonSections(source)).toEqual([]);
  });

  it("requires real section headings and ignores headings inside code examples", () => {
    const incomplete = source.replace("## Architecture in an application", "Architecture in an application");
    expect(findMissingLessonSections(`${incomplete}\n\n\`\`\`md\n## Architecture\n\`\`\``)).toEqual(["Architecture"]);
    expect(findMissingLessonSections(source.replace("## TypeScript example", "## Example"))).toEqual(["TypeScript example"]);
  });
});
