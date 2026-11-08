"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";

const tabs = [
  { href: "/", en: "Home", vi: "Trang chủ", path: "m3 10 9-7 9 7v10H3V10Zm6 10v-7h6v7" },
  { href: "/#curriculum", en: "Learn", vi: "Bài học", path: "M12 5C8 2 3 4 3 4v15s5-2 9 1c4-3 9-1 9-1V4s-5-2-9 1Zm0 0v15" },
  { href: "/flashcards", en: "Flashcards", vi: "Ôn tập", path: "m8 3 12 3-4 15-12-3L8 3Zm1 6 6 2m-7 3 6 2" },
  { href: "/bookmarks", en: "Bookmarks", vi: "Đã lưu", path: "M6 3h12v18l-6-4-6 4V3Z" },
  { href: "/dashboard", en: "Progress", vi: "Tiến độ", path: "M4 20V10m8 10V4m8 16v-7" },
] as const;

export function MobileNavigation() {
  const pathname = usePathname();
  const { locale } = useLanguage();
  const [hash, setHash] = useState("");

  useEffect(() => {
    const update = () => setHash(window.location.hash);
    update();
    window.addEventListener("hashchange", update);
    if (pathname.startsWith("/learn/")) {
      try { localStorage.setItem("academy:last-lesson", pathname.slice(7)); } catch { /* Navigation works without storage. */ }
    }
    return () => window.removeEventListener("hashchange", update);
  }, [pathname]);

  const active = pathname.startsWith("/learn/") || (pathname === "/" && hash === "#curriculum") ? "/#curriculum" : pathname;
  return <nav className="mobile-navigation" aria-label={locale === "vi" ? "Điều hướng ứng dụng" : "App navigation"}>
    {tabs.map((tab) => <Link key={tab.href} href={tab.href} aria-current={active === tab.href ? "page" : undefined} onClick={() => setHash(tab.href.includes("#") ? "#curriculum" : "")}>
      <span className="mobile-tab-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={tab.path} /></svg></span>
      <span>{tab[locale]}</span>
    </Link>)}
  </nav>;
}
