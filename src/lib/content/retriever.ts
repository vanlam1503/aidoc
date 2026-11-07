import "server-only";
import { getLessons } from "@/lib/content/loader";
import type { Locale } from "@/lib/i18n/config";

export type RetrievedChunk = {
  lessonId: string;
  title: string;
  content: string;
  sourcePath: string;
  score: number;
};

export interface ContentRetriever {
  retrieve(query: string, options?: { lessonId?: string; limit?: number; locale?: Locale }): Promise<RetrievedChunk[]>;
}

function normalize(value: string): string {
  return value.toLocaleLowerCase("vi").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replaceAll("đ", "d");
}

function terms(value: string): string[] {
  return [...new Set(normalize(value).split(/[^a-z0-9]+/).filter((word) => word.length > 1))];
}

export class LocalLexicalRetriever implements ContentRetriever {
  async retrieve(query: string, options: { lessonId?: string; limit?: number; locale?: Locale } = {}): Promise<RetrievedChunk[]> {
    const queryTerms = terms(query);
    if (!queryTerms.length) return [];
    const limit = Math.min(6, Math.max(1, options.limit ?? 4));
    const chunks: RetrievedChunk[] = [];
    for (const lesson of getLessons(options.locale)) {
      const path = lesson.sourcePath;
      const paragraphs = lesson.body.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
      for (const paragraph of paragraphs) {
        const content = paragraph.slice(0, 1100);
        const normalized = normalize(content);
        let score = queryTerms.reduce((sum, term) => sum + Math.min(4, normalized.split(term).length - 1), 0);
        const titleAndTags = normalize(`${lesson.title} ${lesson.tags.join(" ")}`);
        score += queryTerms.reduce((sum, term) => sum + (titleAndTags.includes(term) ? 3 : 0), 0);
        if (options.lessonId === lesson.id) score += 5;
        if (score > 0) chunks.push({ lessonId: lesson.id, title: lesson.title, content, sourcePath: path, score });
      }
    }
    return chunks.sort((a, b) => b.score - a.score || a.lessonId.localeCompare(b.lessonId)).slice(0, limit);
  }
}

export const localRetriever: ContentRetriever = new LocalLexicalRetriever();
