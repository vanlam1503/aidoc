"use client";

import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { isLocale } from "@/lib/i18n/config";

export function PreferencesControl() {
  const { locale, setLocale, t } = useLanguage();
  return <div className="preferences-control">
    <Link href="/settings" className="back-link">{t("nav_settings")}</Link>
    <select className="locale-switch" aria-label={t("settings_language")} value={locale} onChange={(event) => {
      const selectedLocale = event.target.value;
      if (isLocale(selectedLocale)) setLocale(selectedLocale);
    }}>
      <option value="en" lang="en">{t("settings_english")}</option>
      <option value="vi" lang="vi">{t("settings_vietnamese")}</option>
    </select>
  </div>;
}
