"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { localizeLesson } from "@/lib/content/localization";
import type { LessonSummary } from "@/lib/content/schema";

export function MobileStudyCard({ lessons }: { lessons: LessonSummary[] }) {
  const { locale } = useLanguage();
  const [lastId, setLastId] = useState<string | null>(null);
  useEffect(() => {
    try { setLastId(localStorage.getItem("academy:last-lesson")); } catch { /* Start with the first lesson. */ }
  }, []);
  const saved = lessons.find((lesson) => lesson.id === lastId);
  const source = saved ?? lessons[0];
  if (!source) return null;
  const lesson = localizeLesson(source, locale);
  const vi = locale === "vi";
  return <section className="mobile-study" aria-label={vi ? "Học hôm nay" : "Today's learning"}>
    <Link href={`/learn/${lesson.id}`} className="mobile-study-card">
      <span className="eyebrow">{saved ? (vi ? "TIẾP TỤC HỌC" : "PICK UP WHERE YOU LEFT OFF") : (vi ? "BẮT ĐẦU HÀNH TRÌNH" : "YOUR FIRST STEP")}</span>
      <strong>{lesson.title}</strong>
      <span className="mobile-study-meta">{lesson.durationMinutes} {vi ? "phút" : "min"} · {lesson.sectionTitle}<span aria-hidden="true">↗</span></span>
    </Link>
    <Link className="mobile-resources-link" href="/references">{vi ? "Khám phá thư viện tài liệu" : "Explore the reference library"} <span aria-hidden="true">↗</span></Link>
  </section>;
}
