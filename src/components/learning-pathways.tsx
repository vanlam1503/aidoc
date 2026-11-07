"use client";

import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { localizeLesson } from "@/lib/content/localization";
import type { LessonSummary } from "@/lib/content/schema";

const tracks = [
  {
    title: "roadmap_agent_title", body: "roadmap_agent_body", start: ["agents-sdk-typescript", "agent-memory"], advanced: ["langgraph-state-machines", "agent-orchestration", "checkpointing-recovery"],
    resources: [{ label: "OpenAI Building agents track", href: "https://developers.openai.com/tracks/building-agents" }, { label: "LangGraph.js", href: "https://github.com/langchain-ai/langgraphjs" }, { label: "12-Factor Agents", href: "https://github.com/humanlayer/12-factor-agents" }],
  },
  {
    title: "roadmap_rag_title", body: "roadmap_rag_body", start: ["rag-embeddings", "vector-databases"], advanced: ["agent-evaluations", "prompt-regression-testing", "observability"],
    resources: [{ label: "OpenAI retrieval guide", href: "https://developers.openai.com/api/docs/guides/retrieval" }, { label: "OpenAI embeddings guide", href: "https://developers.openai.com/api/docs/guides/embeddings" }, { label: "OpenAI evaluation best practices", href: "https://developers.openai.com/api/docs/guides/evaluation-best-practices" }, { label: "Promptfoo", href: "https://github.com/promptfoo/promptfoo" }],
  },
  {
    title: "roadmap_prod_title", body: "roadmap_prod_body", start: ["agent-memory", "rag-embeddings"], advanced: ["security-guardrails", "token-cost-optimization", "observability", "production-ai"],
    resources: [{ label: "OWASP GenAI LLM Top 10 2026", href: "https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/" }, { label: "LangSmith Observability", href: "https://docs.langchain.com/langsmith/observability" }, { label: "12-Factor Agents", href: "https://github.com/humanlayer/12-factor-agents" }],
  },
] as const;

export function LearningPathways({ lessons }: { lessons: LessonSummary[] }) {
  const { locale, t } = useLanguage();
  const lessonTitles = Object.fromEntries(lessons.map((lesson) => [lesson.id, localizeLesson(lesson, locale).title]));
  const projects = ["code-review-agent-project", "api-monitoring-agent-project", "software-engineering-agent-project"];
  return <section className="pathway-section" id="advanced-paths">
    <div className="section-intro pathway-intro"><div><span className="eyebrow">{t("roadmap_kicker")}</span><h2>{t("roadmap_title")}</h2></div><p>{t("roadmap_intro")}</p></div>
    <div className="pathway-grid">{tracks.map((track, index) => <article className="pathway-card" key={track.title}>
      <span className="pathway-number">0{index + 1}</span><h3>{t(track.title)}</h3><p>{t(track.body)}</p>
      <div className="pathway-stages"><div><span>{t("roadmap_start")}</span><ul>{track.start.map((id) => <li key={id}>{lessonTitles[id] ? <Link href={`/learn/${id}`}>{lessonTitles[id]}</Link> : id}</li>)}</ul></div><div><span>{t("roadmap_advance")}</span><ul>{track.advanced.map((id) => <li key={id}>{lessonTitles[id] ? <Link href={`/learn/${id}`}>{lessonTitles[id]}</Link> : id}</li>)}</ul></div></div>
      <div className="pathway-resources"><span>{t("roadmap_resources")}</span>{track.resources.map((resource) => <a key={resource.href} href={resource.href} target="_blank" rel="noreferrer">↗ {resource.label}</a>)}</div>
    </article>)}</div>
    <section className="portfolio-panel"><div><span className="eyebrow">{t("roadmap_projects_title")}</span><p>{t("roadmap_projects_intro")}</p></div><div className="portfolio-links">{projects.map((id) => lessonTitles[id] ? <Link key={id} href={`/learn/${id}`}>↗ {lessonTitles[id]}</Link> : null)}</div></section>
  </section>;
}
