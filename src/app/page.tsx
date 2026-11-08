import { LearningOrbit } from "@/components/learning-orbit";
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
    <section className="hero"><HomeHeroCopy lessonCount={lessons.length} /><LearningOrbit lessons={lessons} /></section>
    <section id="curriculum" className="curriculum-section"><CurriculumIntro /><SearchBox lessons={lessons} /></section>
    <LearningPathways lessons={lessons} />
    <footer className="footer"><Link href="/" className="brand"><span className="brand-mark">A</span><span>AI Engineering <b>Academy</b></span></Link><LocalizedFooterTagline /><span>© 2026 AI Engineering Academy</span></footer><Chatbot />
  </main>;
}
