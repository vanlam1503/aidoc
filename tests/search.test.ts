import { describe, expect, it } from "vitest";
import { searchLessons, type SearchResult } from "@/lib/search/search";

const lessons: SearchResult[] = [
  { id: "prompt-design", title: "Prompt Engineering Basics", description: "Design useful prompts", level: "basic", tags: ["prompting"], sectionTitle: "Foundations" },
  { id: "rag", title: "Retrieval Augmented Generation", description: "Build search over documents", level: "intermediate", tags: ["vector databases", "search"], sectionTitle: "RAG" },
  { id: "agents", title: "Agent Evaluation", description: "Measure tool use", level: "advanced", tags: ["evals"], sectionTitle: "Agents" },
];

describe("local lesson search", () => {
  it("matches all query terms across lesson metadata", () => {
    expect(searchLessons(lessons, "vector search").map((lesson) => lesson.id)).toEqual(["rag"]);
  });

  it("ranks title matches and filters by level", () => {
    expect(searchLessons(lessons, "prompt", "basic").map((lesson) => lesson.id)).toEqual(["prompt-design"]);
    expect(searchLessons(lessons, "", "advanced").map((lesson) => lesson.id)).toEqual(["agents"]);
  });

  it("returns all lessons for a whitespace-only query", () => {
    expect(searchLessons(lessons, "   ")).toHaveLength(3);
  });

  it("searches and displays the selected lesson language without mutating the index", () => {
    const bilingual: SearchResult[] = [{ ...lessons[1], body: "Retrieve documents before generating an answer.", language: "en", translations: {
      vi: { title: "RAG và embeddings: truy xuất trước khi sinh", description: "Thiết kế pipeline có nguồn.", language: "vi", body: "Truy xuất tài liệu trước khi tạo câu trả lời." },
    } }];
    expect(searchLessons(bilingual, "Retrieve documents")[0].language).toBe("en");
    const results = searchLessons(bilingual, "truy xuất", "intermediate", "vi");
    expect(results[0].title).toBe("RAG và embeddings: truy xuất trước khi sinh");
    expect(results[0].language).toBe("vi");
    expect(searchLessons(bilingual, "truy xuất")).toEqual([]);
    expect(bilingual[0].title).toBe("Retrieval Augmented Generation");
  });
});
