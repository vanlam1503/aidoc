"use client";

import Link from "next/link";
import { PreferencesControl } from "@/components/preferences-control";
import { ThemeToggle } from "@/components/theme-toggle";
import { SessionIndicator } from "@/components/auth/session-indicator";

export function AuthHeader() {
  return <header className="auth-topbar"><Link href="/" className="brand"><span className="brand-mark">A</span><span>AI Engineering <b>Academy</b></span></Link><div><SessionIndicator /><PreferencesControl /><ThemeToggle /></div></header>;
}
