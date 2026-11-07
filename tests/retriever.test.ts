import { describe, expect, it } from "vitest";
import { LocalLexicalRetriever } from "@/lib/content/retriever";
import fs from "node:fs";

describe("local lesson retrieval", () => {
  const retriever = new LocalLexicalRetriever();

  it("returns bounded source passages that match the query", async () => {
    const results = await retriever.retrieve("Codex CLI configuration", { limit: 3 });
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(3);
    expect(results.some((result) => result.lessonId === "codex-cli")).toBe(true);
    expect(results.every((result) => result.sourcePath.startsWith("content/") && result.content.length <= 1100)).toBe(true);
    expect(results.every((result) => fs.existsSync(result.sourcePath))).toBe(true);
  });

  it("prioritizes the active lesson and safely clamps limits", async () => {
    const results = await retriever.retrieve("architecture concepts", { lessonId: "multi-agent-architectures", limit: 100 });
    expect(results.length).toBeLessThanOrEqual(6);
    expect(results[0]?.lessonId).toBe("multi-agent-architectures");
  });

  it("returns no context for a query without searchable terms", async () => {
    expect(await retriever.retrieve("!? #")).toEqual([]);
  });

  it("retrieves Vietnamese source files when Vietnamese is selected", async () => {
    const results = await retriever.retrieve("trạng thái", { lessonId: "agent-memory", locale: "vi", limit: 3 });
    expect(results).toHaveLength(3);
    expect(results.every((result) => result.sourcePath.endsWith("/vi.mdx") && fs.existsSync(result.sourcePath))).toBe(true);
    expect(results[0].title).toContain("lưu đúng thứ cần khôi phục");
  });
});
