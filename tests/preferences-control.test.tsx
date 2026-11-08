// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BookmarkProvider } from "@/components/bookmarks/bookmark-provider";
import { LanguageProvider } from "@/components/language-provider";
import { PreferencesControl } from "@/components/preferences-control";
import { SearchBox } from "@/components/search-box";
import { localeStorageKey } from "@/lib/i18n/config";
import type { SearchResult } from "@/lib/search/search";

vi.mock("next/link", () => ({ default: ({ href, children, ...props }: { href: string; children: ReactNode }) => <a href={href} {...props}>{children}</a> }));

const lessons: SearchResult[] = [{
  id: "llm-fundamentals", title: "What is an LLM? How language models work", description: "Understand how language models predict tokens.",
  level: "basic", tags: ["llm"], sectionTitle: "Foundations", language: "en",
  translations: { vi: { title: "LLM là gì? Cách mô hình ngôn ngữ hoạt động", description: "Hiểu cách mô hình dự đoán token.", language: "vi" } },
}];

function Curriculum() {
  return <LanguageProvider><BookmarkProvider><PreferencesControl /><SearchBox lessons={lessons} /></BookmarkProvider></LanguageProvider>;
}

describe("curriculum language selection", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
  });

  it("shows the selected language and displays its matching curriculum content", () => {
    render(<Curriculum />);
    const selector = screen.getByRole("combobox", { name: "Display language" });
    expect(selector).toHaveValue("en");
    expect(selector).toHaveDisplayValue("English");
    expect(screen.getByRole("heading", { name: lessons[0].title })).toBeInTheDocument();

    fireEvent.change(selector, { target: { value: "vi" } });
    expect(selector).toHaveValue("vi");
    expect(selector).toHaveDisplayValue("Tiếng Việt");
    expect(document.documentElement).toHaveAttribute("lang", "vi");
    expect(screen.getByRole("heading", { name: lessons[0].translations?.vi?.title })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: lessons[0].title })).not.toBeInTheDocument();

    fireEvent.change(selector, { target: { value: "en" } });
    expect(selector).toHaveDisplayValue("English");
    expect(document.documentElement).toHaveAttribute("lang", "en");
    expect(screen.getByRole("heading", { name: lessons[0].title })).toBeInTheDocument();
    expect(localStorage.getItem(localeStorageKey)).toBe("en");
  });

  it("preserves a restored selection and does not toggle when the same language is chosen again", () => {
    localStorage.setItem(localeStorageKey, "vi");
    const view = render(<Curriculum />);
    const selector = screen.getByRole("combobox", { name: "Ngôn ngữ hiển thị" });
    expect(selector).toHaveDisplayValue("Tiếng Việt");
    fireEvent.change(selector, { target: { value: "vi" } });
    expect(selector).toHaveValue("vi");
    expect(screen.getByRole("heading", { name: lessons[0].translations?.vi?.title })).toBeInTheDocument();
    fireEvent.change(selector, { target: { value: "en" } });
    fireEvent.change(selector, { target: { value: "en" } });
    expect(selector).toHaveDisplayValue("English");
    expect(localStorage.getItem(localeStorageKey)).toBe("en");
    view.unmount();
    render(<Curriculum />);
    expect(screen.getByRole("combobox", { name: "Display language" })).toHaveDisplayValue("English");
    expect(screen.getByRole("heading", { name: lessons[0].title })).toBeInTheDocument();
  });
});
