import Link from "next/link";
import { SettingsHeading, SettingsPanel } from "@/components/settings-panel";
import { PreferencesControl } from "@/components/preferences-control";
import { ThemeToggle } from "@/components/theme-toggle";
import { Chatbot } from "@/components/chatbot/chatbot";

export const metadata = { title: "Settings — AI Engineering Academy", description: "Choose the language and appearance for AI Engineering Academy." };

export default function SettingsPage() {
  return <main className="home-shell settings-page">
    <header className="topbar"><Link href="/" className="brand"><span className="brand-mark">A</span><span>AI Engineering <b>Academy</b></span></Link><div className="reader-top-actions"><Link href="/" className="back-link">Academy</Link><PreferencesControl /><ThemeToggle /></div></header>
    <SettingsHeading />
    <SettingsPanel />
    <footer className="footer"><Link href="/" className="brand"><span className="brand-mark">A</span><span>AI Engineering <b>Academy</b></span></Link><span>© 2026 AI Engineering Academy</span></footer>
    <Chatbot />
  </main>;
}
