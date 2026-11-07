// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider, useLanguage } from "@/components/language-provider";
import { localeStorageKey } from "@/lib/i18n/config";

function Preferences() {
  const { locale, setLocale, t } = useLanguage();
  return <>
    <output aria-label="Current locale">{locale}</output>
    <h1>{t("settings_title")}</h1>
    <p>{t("lesson_count", { count: 33 })}</p>
    <button onClick={() => setLocale("en")}>English</button>
    <button onClick={() => setLocale("vi")}>Tiếng Việt</button>
  </>;
}

describe("language preferences", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = "en";
  });

  it("defaults to English even when the browser prefers Vietnamese", () => {
    vi.spyOn(navigator, "language", "get").mockReturnValue("vi-VN");
    render(<LanguageProvider><Preferences /></LanguageProvider>);
    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByText("33 lessons")).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute("lang", "en");
    expect(localStorage.getItem(localeStorageKey)).toBe("en");
  });

  it.each(["en", "vi"])("restores an explicit %s preference", (locale) => {
    localStorage.setItem(localeStorageKey, locale);
    render(<LanguageProvider><Preferences /></LanguageProvider>);
    expect(screen.getByLabelText("Current locale")).toHaveTextContent(locale);
    expect(document.documentElement).toHaveAttribute("lang", locale);
    expect(localStorage.getItem(localeStorageKey)).toBe(locale);
  });

  it.each(["fr", "undefined", ""])("falls back to English for an invalid stored value: %s", (value) => {
    localStorage.setItem(localeStorageKey, value);
    render(<LanguageProvider><Preferences /></LanguageProvider>);
    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
    expect(localStorage.getItem(localeStorageKey)).toBe("en");
  });

  it("saves explicit language changes and updates the document language", () => {
    render(<LanguageProvider><Preferences /></LanguageProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Tiếng Việt" }));
    expect(screen.getByRole("heading", { name: "Cài đặt" })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute("lang", "vi");
    expect(localStorage.getItem(localeStorageKey)).toBe("vi");
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
    expect(localStorage.getItem(localeStorageKey)).toBe("en");
  });

  it("uses English and still allows switching when browser storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Storage blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Storage blocked"); });
    render(<LanguageProvider><Preferences /></LanguageProvider>);
    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tiếng Việt" }));
    expect(document.documentElement).toHaveAttribute("lang", "vi");
  });
});
