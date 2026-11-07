import Link from "next/link";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { isDatabaseConfigured, isGoogleOAuthConfigured } from "@/features/authentication/config";
import { prisma } from "@/lib/database/prisma";
import { getLessons } from "@/lib/content/loader";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { PreferencesControl } from "@/components/preferences-control";
import { ThemeToggle } from "@/components/theme-toggle";
import { SessionIndicator } from "@/components/auth/session-indicator";

export const metadata = { title: "Learning dashboard — AI Engineering Academy" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!isDatabaseConfigured() || !isGoogleOAuthConfigured()) return <main className="home-shell auth-page"><Link href="/" className="brand"><span className="brand-mark">A</span><span>AI Engineering <b>Academy</b></span></Link><section className="auth-card"><span className="eyebrow">SETUP REQUIRED</span><h1>Finish local<br />configuration.</h1><p>The dashboard requires Google OAuth and PostgreSQL. Follow the setup guide, then return to this page.</p><Link className="button-primary" href="/auth/signin">Open sign-in setup</Link><Link className="auth-back" href="/">← Continue learning</Link></section></main>;
  let session: Session | null;
  try {
    session = await auth();
  } catch {
    return <DatabaseUnavailable />;
  }
  if (!session?.user?.id) redirect("/auth/signin");
  try {
    const [progress, bookmarks] = await Promise.all([
      prisma.lessonProgress.findMany({ where: { userId: session.user.id }, orderBy: { updatedAt: "desc" } }),
      prisma.bookmark.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" } }),
    ]);
    const completed = new Set(progress.filter((item) => item.completed).map((item) => item.lessonId));
    const bookmarked = new Set(bookmarks.map((item) => item.lessonId));
    const lessons = getLessons();
    return <main className="home-shell dashboard-shell"><header className="topbar"><Link href="/" className="brand"><span className="brand-mark">A</span><span>AI Engineering <b>Academy</b></span></Link><nav className="top-nav"><Link href="/">Curriculum</Link><Link href="/references">References</Link><SessionIndicator /><SignOutButton /><PreferencesControl /><ThemeToggle /></nav></header><section className="dashboard-heading"><span className="eyebrow">YOUR LEARNING SPACE</span><h1>Welcome back{session.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}.</h1><p>Continue learning to build reliable AI systems.</p></section><div className="dashboard-stats"><article><strong>{completed.size}</strong><span>LESSONS COMPLETED</span></article><article><strong>{bookmarks.length}</strong><span>BOOKMARKS</span></article><article><strong>{lessons.length - completed.size}</strong><span>LESSONS TO EXPLORE</span></article></div><section className="dashboard-list"><div className="dashboard-list-head"><h2>Your curriculum</h2><span>{completed.size} / {lessons.length} complete</span></div>{lessons.map((lesson) => <Link key={lesson.id} href={`/learn/${lesson.id}`} className="dashboard-lesson"><span className={completed.has(lesson.id) ? "dashboard-done done" : "dashboard-done"}>{completed.has(lesson.id) ? "✓" : ""}</span><span><strong>{lesson.title}</strong><small>{lesson.sectionTitle} · {lesson.durationMinutes} min</small></span>{bookmarked.has(lesson.id) && <span className="dashboard-bookmark">☆</span>}</Link>)}</section></main>;
  } catch {
    return <DatabaseUnavailable />;
  }
}

function DatabaseUnavailable() {
  return <main className="home-shell auth-page"><section className="auth-card"><span className="eyebrow">DATABASE UNAVAILABLE</span><h1>Start PostgreSQL<br />to continue.</h1><p>Authentication and saved progress need the local database. Run <code>docker compose up -d</code>, then apply migrations.</p><Link href="/">← Continue reading lessons</Link></section></main>;
}
