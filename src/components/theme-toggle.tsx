"use client";

import { useTheme } from "@/components/theme-provider";
import { useLanguage } from "@/components/language-provider";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useLanguage();
  return <button className="icon-button" type="button" aria-label={t("theme_toggle")} onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>{resolvedTheme === "dark" ? "☼" : "◐"}</button>;
}
