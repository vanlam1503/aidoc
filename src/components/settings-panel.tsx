"use client";

import { useLanguage } from "@/components/language-provider";
import { useTheme, type Theme } from "@/components/theme-provider";

export function SettingsHeading() {
  const { t } = useLanguage();
  return <section className="settings-heading"><span className="eyebrow">AI ENGINEERING ACADEMY</span><h1>{t("settings_title")}</h1><p>{t("settings_intro")}</p></section>;
}

export function SettingsPanel() {
  const { locale, setLocale, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const themeOptions: { value: Theme; label: string }[] = [
    { value: "light", label: t("settings_light") },
    { value: "dark", label: t("settings_dark") },
    { value: "system", label: t("settings_system") },
  ];
  return <div className="settings-options">
    <section className="settings-card" aria-labelledby="settings-language-title">
      <div><span className="settings-icon">文</span><h2 id="settings-language-title">{t("settings_language")}</h2><p>{t("settings_language_help")}</p></div>
      <div className="setting-choices" role="group" aria-label={t("settings_language")}>
        <button type="button" aria-pressed={locale === "en"} className={locale === "en" ? "selected" : ""} onClick={() => setLocale("en")}>{t("settings_english")}<span>EN</span></button>
        <button type="button" aria-pressed={locale === "vi"} className={locale === "vi" ? "selected" : ""} onClick={() => setLocale("vi")}>{t("settings_vietnamese")}<span>VI</span></button>
      </div>
    </section>
    <section className="settings-card" aria-labelledby="settings-theme-title">
      <div><span className="settings-icon">◐</span><h2 id="settings-theme-title">{t("settings_theme")}</h2><p>{t("settings_theme_help")}</p></div>
      <div className="setting-choices" role="group" aria-label={t("settings_theme")}>
        {themeOptions.map((option) => <button key={option.value} type="button" aria-pressed={theme === option.value} className={theme === option.value ? "selected" : ""} onClick={() => setTheme(option.value)}>{option.label}<span>{option.value === "light" ? "☼" : option.value === "dark" ? "◐" : "◌"}</span></button>)}
      </div>
    </section>
    <p className="settings-saved">✓ {t("settings_saved")}</p>
    <aside className="settings-note"><span>✳</span><p>{t("lesson_language_note")}</p></aside>
  </div>;
}
