import Link from "next/link";
import { getLessonSummaries } from "@/lib/content/loader";
import { SearchBox } from "@/components/search-box";
import { Chatbot } from "@/components/chatbot/chatbot";
import { SiteNavigation } from "@/components/site-navigation";
import { HomeHeroCopy, CurriculumIntro, LocalizedFooterTagline } from "@/components/home-copy";
import { LearningPathways } from "@/components/learning-pathways";

export default function HomePage() {
  const lessons = getLessonSummaries();
  return <main className="home-shell">
    <header className="topbar"><Link href="/" className="brand"><span className="brand-mark">A</span><span>AI Engineering <b>Academy</b></span></Link><SiteNavigation current="curriculum" /></header>
    <section className="hero"><HomeHeroCopy lessonCount={lessons.length} /><div className="hero-art" aria-hidden="true"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="orbit orbit-three"/><div className="core"><span>AI</span><small>ENGINEERING</small></div><div className="art-chip chip-one">✳ <span>Prompting</span></div><div className="art-chip chip-two">◈ <span>Agents</span></div><div className="art-chip chip-three">⌘ <span>Systems</span></div><div className="art-dot dot-one"/><div className="art-dot dot-two"/></div></section>
    <section id="curriculum" className="curriculum-section"><CurriculumIntro /><SearchBox lessons={lessons} /></section>
    <LearningPathways lessons={lessons} />
    <footer className="footer"><Link href="/" className="brand"><span className="brand-mark">A</span><span>AI Engineering <b>Academy</b></span></Link><LocalizedFooterTagline /><span>© 2026 AI Engineering Academy</span></footer><Chatbot />
  </main>;
}
