import { getFlashcardBanks } from "@/lib/flashcards/loader";
import { notFound } from "next/navigation";
import { getLessonBySlug, getLessons, getLessonSummaries } from "@/lib/content/loader";
import { LessonReader } from "@/components/learning/lesson-reader";

export function generateStaticParams() { return getLessons().map(({ slug }) => ({ slug })); }

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const english = getLessonBySlug(slug);
  if (!english) notFound();
  return <LessonReader lessonsByLocale={{ en: english, vi: getLessonBySlug(slug, "vi") ?? english }} summaries={getLessonSummaries()} flashcardBanks={getFlashcardBanks()} />;
}
