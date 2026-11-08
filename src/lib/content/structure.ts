import { defaultLocale, type Locale } from "../i18n/config";

const requiredSections: Record<Locale, readonly string[]> = {
  en: ["Learning objectives", "Prerequisites", "Theory", "Architecture", "TypeScript example", "Practice", "Common mistakes", "Further reading", "Interview questions", "Quick quiz", "Completion criteria"],
  vi: ["Mục tiêu học tập", "Điều kiện tiên quyết", "Lý thuyết", "Kiến trúc", "Ví dụ TypeScript", "Thực hành", "Lỗi thường gặp", "Đọc thêm", "Câu hỏi phỏng vấn", "Quiz nhanh", "Tiêu chí hoàn thành"],
};

export function findMissingLessonSections(source: string, language: Locale = defaultLocale): string[] {
  // Code samples can contain Markdown headings; only inspect the lesson prose.
  const headings: string[] = [];
  let fence: string | undefined;
  for (const line of source.split(/\r?\n/)) {
    const marker = /^\s{0,3}(`{3,}|~{3,})/.exec(line)?.[1];
    if (marker) {
      if (!fence) fence = marker;
      else if (marker[0] === fence[0] && marker.length >= fence.length) fence = undefined;
      continue;
    }
    if (fence) continue;
    const heading = /^##\s+(.+?)\s*#*\s*$/.exec(line)?.[1];
    if (heading) headings.push(heading);
  }
  return requiredSections[language].filter((section) => !headings.some((heading) =>
    heading === section || heading.startsWith(`${section}:`) || heading.startsWith(`${section} `)
  ));
}
