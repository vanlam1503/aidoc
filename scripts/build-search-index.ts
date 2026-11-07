import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { parseLessonMetadata } from "../src/lib/content/schema";
import { defaultLocale, supportedLocales } from "../src/lib/i18n/config";

const root = path.join(process.cwd(), "content");
const output = path.join(process.cwd(), "public", "search-index.json");
const records: Array<Record<string, unknown>> = [];
const searchableText = (value: string) => value.replace(/[#>*`_]/g, " ").replace(/\s+/g, " ").trim();
const sectionTitles: Record<string, string> = {
  "01-foundations": "Foundations", "02-codex": "OpenAI Codex", "03-agent-fundamentals": "Agent Fundamentals",
  "04-langchain": "LangChain & LangGraph", "05-advanced": "Advanced Engineering", "06-projects": "Projects",
};
for (const section of fs.readdirSync(root).sort()) {
  const sectionPath = path.join(root, section);
  if (!fs.statSync(sectionPath).isDirectory()) continue;
  for (const folder of fs.readdirSync(sectionPath).sort()) {
    const file = path.join(sectionPath, folder, "index.mdx");
    if (!fs.existsSync(file)) continue;
    const parsed = matter(fs.readFileSync(file, "utf8"));
    const data = parseLessonMetadata(parsed.data);
    const translations = Object.fromEntries(supportedLocales.filter((locale) => locale !== defaultLocale).flatMap((locale) => {
      const translationFile = path.join(sectionPath, folder, `${locale}.mdx`);
      if (!fs.existsSync(translationFile)) return [];
      const translation = matter(fs.readFileSync(translationFile, "utf8"));
      const metadata = parseLessonMetadata(translation.data);
      return [[locale, { title: metadata.title, description: metadata.description, language: metadata.language, body: searchableText(translation.content) }]];
    }));
    records.push({ ...data, sectionTitle: sectionTitles[section] ?? section, body: searchableText(parsed.content), translations });
  }
}
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(records, null, 2)}\n`);
console.log(`Built local search index with ${records.length} lesson(s): ${path.relative(process.cwd(), output)}`);
