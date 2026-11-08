import Link from "next/link";
import { SiteNavigation } from "@/components/site-navigation";
import { FlashcardLibrary } from "@/components/flashcards/flashcard-library";
import { getFlashcardBanks } from "@/lib/flashcards/loader";

export const metadata = { title: "Flashcards — AI Engineering Academy", description: "Practice interview questions with four shuffled answer choices and immediate feedback." };

export default function FlashcardsPage() {
  return <main className="home-shell flashcards-shell"><header className="topbar"><Link href="/" className="brand"><span className="brand-mark">A</span><span>AI Engineering <b>Academy</b></span></Link><SiteNavigation current="flashcards" /></header><FlashcardLibrary banks={getFlashcardBanks()} /></main>;
}
