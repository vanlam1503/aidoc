"use client";

import { useLanguage } from "@/components/language-provider";

export function HomeHeroCopy({ lessonCount }: { lessonCount: number }) {
  const { t } = useLanguage();
  return <div className="hero-copy">
    <span className="eyebrow"><i /> {t("home_eyebrow")}</span>
    <h1>{t("home_title_start")}<br /><em>{t("home_title_end")}</em></h1>
    <p>{t("home_description")}</p>
    <div className="hero-actions"><a className="button-primary" href="#curriculum">{t("home_explore")} <span>↓</span></a><span className="hero-note">{t("home_note")}</span></div>
    <div className="hero-stats"><div><strong>{lessonCount.toString().padStart(2, "0")}</strong><span>{t("lessons")}</span></div><div><strong>03</strong><span>{t("levels")}</span></div><div><strong>∞</strong><span>{t("possibilities")}</span></div></div>
  </div>;
}

export function CurriculumIntro() {
  const { t } = useLanguage();
  return <div className="section-intro"><div><span className="eyebrow">{t("home_section_kicker")}</span><h2>{t("home_section_title_start")}<br /><em>{t("home_section_title_end")}</em></h2></div><p>{t("home_section_body")}</p></div>;
}

export function LocalizedFooterTagline() {
  const { t } = useLanguage();
  return <span>{t("footer_tagline")}</span>;
}
