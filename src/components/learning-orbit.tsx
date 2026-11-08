"use client";

import Link from "next/link";
import { useId, useState, type CSSProperties } from "react";
import { useLanguage } from "@/components/language-provider";
import { localizeLesson } from "@/lib/content/localization";
import type { LessonSummary } from "@/lib/content/schema";

const topics = [
  { id: "prompting", title: "Prompting", symbol: "✳", angle: "-135deg", radius: "20%", duration: "24s", lessons: ["llm-fundamentals", "prompt-engineering-basics", "context-engineering"] },
  { id: "agents", title: "Agents", symbol: "◈", angle: "-25deg", radius: "29%", duration: "46s", lessons: ["responses-api", "tool-calling", "agents-sdk-typescript"] },
  { id: "systems", title: "System", symbol: "⌘", angle: "125deg", radius: "38%", duration: "78s", lessons: ["security-guardrails", "agent-evaluations", "production-ai"] },
] as const;
type TopicId = typeof topics[number]["id"];

const copy = {
  en: {
    kicker: "YOUR LEARNING UNIVERSE", label: "Explore the AI learning system", help: "Hover a topic to pause & explore", touchHelp: "Tap an orbit to explore", pause: "Pause orbits", resume: "Resume orbits", paused: "Orbits paused", running: "Orbits moving", title: "Find your next lesson", intro: "Three paths. One AI foundation. Choose Prompting, Agents, or System to see where to start.", suggested: "Suggested lessons", essential: "* Essential", reason: "Start here to build the foundation for this path.", resources: "References & examples", lesson: "Open lesson", note: "Follow the prerequisites listed in each lesson.",
  },
  vi: {
    kicker: "VŨ TRỤ HỌC TẬP", label: "Khám phá hệ học tập AI", help: "Rê chuột vào chủ đề để dừng & khám phá", touchHelp: "Chạm vào quỹ đạo để khám phá", pause: "Dừng quỹ đạo", resume: "Tiếp tục quỹ đạo", paused: "Quỹ đạo đang dừng", running: "Quỹ đạo đang chuyển động", title: "Tìm bài học tiếp theo", intro: "Ba hướng học. Một nền tảng AI. Chọn Prompting, Agents hoặc System để xem nên bắt đầu từ đâu.", suggested: "Bài học gợi ý", essential: "* Essential", reason: "Học trước để xây nền tảng cho hướng này.", resources: "Tài liệu & ví dụ", lesson: "Mở bài học", note: "Học theo điều kiện tiên quyết ghi trong từng bài.",
  },
};

export function LearningOrbit({ lessons }: { lessons: LessonSummary[] }) {
  const { locale } = useLanguage();
  const text = copy[locale];
  const panelId = useId();
  const [activeId, setActiveId] = useState<TopicId | null>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [manuallyPaused, setManuallyPaused] = useState(false);
  const paused = hovered || focused || manuallyPaused;
  const active = topics.find((topic) => topic.id === activeId);
  const suggestions = active?.lessons.flatMap((id) => {
    const lesson = lessons.find((item) => item.id === id);
    return lesson ? [localizeLesson(lesson, locale)] : [];
  }) ?? [];

  return <section className="learning-orbit" aria-label={text.label} data-paused={paused}
    onPointerLeave={() => { setHovered(false); if (!focused) setActiveId(null); }}
    onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) { setFocused(false); if (!hovered) setActiveId(null); } }}
    onKeyDown={(event) => { if (event.key === "Escape") setActiveId(null); }}>
    <div className="learning-orbit-stage">
      <div className="learning-orbit-stars" aria-hidden="true" />
      <div className="learning-orbit-ring ring-prompting" aria-hidden="true" />
      <div className="learning-orbit-ring ring-agents" aria-hidden="true" />
      <div className="learning-orbit-ring ring-systems" aria-hidden="true" />
      <div className="learning-orbit-sun"><span>AI</span><small>ENGINEERING</small></div>
      {topics.map((topic) => <div className={`learning-orbit-carrier carrier-${topic.id}`} key={topic.id} style={{ "--orbit-angle": topic.angle, "--orbit-radius": topic.radius, "--orbit-duration": topic.duration } as CSSProperties}>
        <div className="learning-orbit-satellite"><button type="button" className={`learning-orbit-planet planet-${topic.id}`} aria-controls={panelId} aria-pressed={activeId === topic.id}
          onPointerEnter={(event) => { if (event.pointerType !== "touch") setHovered(true); setActiveId(topic.id); }}
          onPointerLeave={() => setHovered(false)} onFocus={() => { setFocused(true); setActiveId(topic.id); }} onBlur={() => setFocused(false)} onClick={() => setActiveId(topic.id)}>
          <span className="learning-orbit-symbol" aria-hidden="true">{topic.symbol}</span><span>{topic.title}</span>
          {topic.id === "agents" && <span className="agent-moon-orbit" aria-hidden="true"><span className="agent-moon" /></span>}
        </button></div>
      </div>)}
    </div>
    <div className="learning-orbit-toolbar"><p><span className="orbit-pointer-help">{text.help}</span><span className="orbit-touch-help">{text.touchHelp}</span></p><button type="button" className="orbit-pause" aria-pressed={manuallyPaused} onClick={() => setManuallyPaused((value) => !value)}><span aria-hidden="true">{manuallyPaused ? "▷" : "Ⅱ"}</span> {manuallyPaused ? text.resume : text.pause}</button></div>
    <div className="orbit-recommendations" id={panelId}>
      <div className="orbit-panel-heading" aria-live="polite"><span className="eyebrow">{active ? `${text.suggested} / ${active.title}` : text.kicker}</span><h2>{active ? active.title : text.title}</h2></div>
      {active ? <><ol className="orbit-lesson-list">{suggestions.map((lesson, index) => <li key={lesson.id}>
        <div className="orbit-lesson-number" aria-hidden="true">0{index + 1}</div><div>{index === 0 && <span className="orbit-essential" title={text.reason}>{text.essential} — {text.reason}</span>}<Link className="orbit-lesson-title" href={`/learn/${lesson.id}`}>{lesson.title}<span aria-hidden="true"> ↗</span></Link><p>{lesson.description}</p><Link className="orbit-lesson-resources" href={`/learn/${lesson.id}#${locale === "vi" ? "câu-hỏi-phỏng-vấn" : "interview-questions"}`}>{text.resources}</Link></div>
      </li>)}</ol><p className="orbit-panel-note">{text.note}</p></> : <div className="orbit-panel-placeholder"><span aria-hidden="true">✧</span><p>{text.intro}</p><div aria-hidden="true">Prompting <i>·</i> Agents <i>·</i> System</div></div>}
    </div>
  </section>;
}
