import Link from "next/link";
import { SiteNavigation } from "@/components/site-navigation";
import { BookmarkLibrary } from "@/components/bookmarks/bookmark-library";
import { Chatbot } from "@/components/chatbot/chatbot";
import { getLessonSummaries } from "@/lib/content/loader";

export const metadata = { title: "Bookmarks — AI Engineering Academy", description: "Search saved lessons and links in your local learning library." };

export default function BookmarksPage() {
  return <main className="home-shell bookmarks-shell"><header className="topbar"><Link href="/" className="brand"><span className="brand-mark">A</span><span>AI Engineering <b>Academy</b></span></Link><SiteNavigation current="bookmarks" /></header><BookmarkLibrary lessons={getLessonSummaries()} /><Chatbot /></main>;
}
