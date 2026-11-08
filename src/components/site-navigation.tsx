"use client";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { PreferencesControl } from "@/components/preferences-control";
import { ThemeToggle } from "@/components/theme-toggle";
export function SiteNavigation({ current }: { current?: "curriculum" | "references" | "dashboard" | "flashcards" | "bookmarks" }) {
  const { t } = useLanguage();
  return <nav className="top-nav" aria-label={t("nav_label")}>
    <Link href="/#curriculum" aria-current={current === "curriculum" ? "page" : undefined}>{t("nav_curriculum")}</Link>
    <Link href="/flashcards" className="nav-flashcards" aria-current={current === "flashcards" ? "page" : undefined}>{t("nav_flashcards")}</Link>
    <Link href="/bookmarks" className="nav-bookmarks" aria-current={current === "bookmarks" ? "page" : undefined}>{t("nav_bookmarks")}</Link>
    <Link href="/references" aria-current={current === "references" ? "page" : undefined}>{t("nav_references")}</Link>
    <Link href="/dashboard" aria-current={current === "dashboard" ? "page" : undefined}>{t("nav_dashboard")}</Link>
    <PreferencesControl /><ThemeToggle />
  </nav>;
}
