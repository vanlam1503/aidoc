import Link from "next/link";
import { references, referenceCategories } from "@/lib/content/references";
import { getLessons } from "@/lib/content/loader";
import { SiteNavigation } from "@/components/site-navigation";
import { Chatbot } from "@/components/chatbot/chatbot";

export const metadata = { title: "References — AI Engineering Academy", description: "Primary documentation and community resources for your AI engineering journey." };

export default function ReferencesPage() {
  const lessonIds = new Set(getLessons().map((lesson) => lesson.id));
  return <main className="home-shell references-shell">
    <header className="topbar"><Link href="/" className="brand"><span className="brand-mark">A</span><span>AI Engineering <b>Academy</b></span></Link><SiteNavigation current="references" /></header>
    <section className="references-hero"><span className="eyebrow">THE FIELD GUIDE</span><h1>Learn from the<br /><em>source.</em></h1><p>Explore official documentation and community resources after each lesson. Academy explanations are written independently; the links below take you to the original sources.</p><span className="reference-check">Checked {references[0]?.lastVerified} · Star counts are shown only when verified</span></section>
    <nav className="reference-jump" aria-label="Reference categories">{referenceCategories.map((category) => <a key={category} href={`#${category.toLowerCase().replaceAll(" ", "-")}`}>{category}</a>)}</nav>
    {referenceCategories.map((category) => <section id={category.toLowerCase().replaceAll(" ", "-")} className="reference-category" key={category}><div className="reference-category-head"><span className="eyebrow">REFERENCE LIBRARY</span><h2>{category}</h2><span>{references.filter((reference) => reference.category === category).length.toString().padStart(2, "0")} RESOURCES</span></div><div className="reference-grid">{references.filter((reference) => reference.category === category).map((reference) => <article className="reference-card" key={reference.url}><div className="reference-card-top"><span className={`level level-${reference.difficulty}`}>{reference.difficulty}</span><span className="reference-external" aria-hidden="true">↗</span></div><h3><a href={reference.url} target="_blank" rel="noreferrer">{reference.name}</a></h3><p>{reference.description}</p><div className="reference-related"><span>RELATED LESSONS</span><div>{reference.relatedLessons.map((slug) => lessonIds.has(slug) ? <Link key={slug} href={`/learn/${slug}`}>{slug}</Link> : <span key={slug} className="pending-lesson">{slug} · planned</span>)}</div></div><footer><span>★ {reference.githubStars}</span><span>Verified {reference.lastVerified}</span></footer></article>)}</div></section>)}
    <footer className="footer"><Link href="/" className="brand"><span className="brand-mark">A</span><span>AI Engineering <b>Academy</b></span></Link><span>Sources, not substitutes for practice.</span><span>© 2026 AI Engineering Academy</span></footer><Chatbot />
  </main>;
}
