// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SearchBox } from "@/components/search-box";
import { BookmarkProvider } from "@/components/bookmarks/bookmark-provider";
import { LanguageProvider } from "@/components/language-provider";
import type { SearchResult } from "@/lib/search/search";

vi.mock("next/link", () => ({ default: ({ href, children, ...props }: { href: string; children: ReactNode }) => <a href={href} {...props}>{children}</a> }));

const lessons: SearchResult[] = [
  { id: "prompt-design", title: "Prompt Engineering Basics", description: "Learn prompt design", level: "basic", tags: ["prompting"], sectionTitle: "Foundations" },
  { id: "rag", title: "Retrieval Augmented Generation", description: "Search over documents", level: "intermediate", tags: ["vector databases"], sectionTitle: "RAG" },
];

describe("SearchBox", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
  });

  it("exposes a labeled search field and updates results from local input", () => {
    render(<LanguageProvider><BookmarkProvider><SearchBox lessons={lessons} /></BookmarkProvider></LanguageProvider>);
    const input = screen.getByRole("textbox", { name: "Search prompts, agents, RAG..." });
    fireEvent.change(input, { target: { value: "vector" } });
    expect(screen.getByRole("link", { name: /Retrieval Augmented Generation/ })).toHaveAttribute("href", "/learn/rag");
    expect(screen.queryByRole("link", { name: /Prompt Engineering Basics/ })).not.toBeInTheDocument();
  });

  it("shows a useful empty state when no lesson matches", () => {
    render(<LanguageProvider><BookmarkProvider><SearchBox lessons={lessons} /></BookmarkProvider></LanguageProvider>);
    fireEvent.change(screen.getByRole("textbox", { name: "Search prompts, agents, RAG..." }), { target: { value: "nonexistent" } });
    expect(screen.getByText("No matching lessons. Try another search.")).toBeInTheDocument();
  });
});
