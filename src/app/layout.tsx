import { BookmarkProvider } from "@/components/bookmarks/bookmark-provider";
import type { Metadata, Viewport } from "next";
import { MobileNavigation } from "@/components/mobile-navigation";
import Script from "next/script";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/components/language-provider";
import { defaultLocale } from "@/lib/i18n/config";
import "./globals.css";

const themeBootstrap = `(()=>{try{const stored=localStorage.getItem("theme");const theme=stored==="light"||stored==="dark"||stored==="system"?stored:"system";const dark=theme==="dark"||(theme==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",dark);document.documentElement.style.colorScheme=dark?"dark":"light"}catch{}})()`;

export const metadata: Metadata = {
  title: "AI Engineering Academy — Learn to build with AI",
  description: "A practical learning path for prompt engineering, Codex, AI agents, RAG, and production systems.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang={defaultLocale} data-scroll-behavior="smooth" suppressHydrationWarning><body><Script id="theme-bootstrap" strategy="beforeInteractive">{themeBootstrap}</Script><ThemeProvider><LanguageProvider><BookmarkProvider>{children}<MobileNavigation /></BookmarkProvider></LanguageProvider></ThemeProvider></body></html>;
}
