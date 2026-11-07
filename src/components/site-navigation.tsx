"use client";

import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { PreferencesControl } from "@/components/preferences-control";
import { ThemeToggle } from "@/components/theme-toggle";
import { SessionIndicator } from "@/components/auth/session-indicator";

export function SiteNavigation({ current }: { current?: "curriculum" | "references" | "dashboard" }) {
  const { t } = useLanguage();
  return <nav className="top-nav" aria-label={t("nav_label")}>
    <Link href="/#curriculum" aria-current={current === "curriculum" ? "page" : undefined}>{t("nav_curriculum")}</Link>
    <Link href="/references" aria-current={current === "references" ? "page" : undefined}>{t("nav_references")}</Link>
    <Link href="/dashboard" aria-current={current === "dashboard" ? "page" : undefined}>{t("nav_dashboard")}</Link>
    <SessionIndicator />
    <PreferencesControl /><ThemeToggle />
  </nav>;
}
