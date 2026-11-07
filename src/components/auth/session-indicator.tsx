"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";

type SessionState = { name?: string | null; email?: string | null } | null;

export function SessionIndicator() {
  const [session, setSession] = useState<SessionState | undefined>(undefined);
  const { t } = useLanguage();

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/session", { cache: "no-store", signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<{ user?: SessionState }> : null)
      .then((data) => { if (!controller.signal.aborted) setSession(data?.user ?? null); })
      .catch(() => { if (!controller.signal.aborted) setSession(null); });
    return () => controller.abort();
  }, []);

  if (session === undefined) return <span className="session-indicator session-loading" aria-hidden="true" />;
  if (!session) return <Link href="/auth/signin" className="session-indicator">{t("nav_signin")}</Link>;
  const label = session.name?.trim() || session.email || t("nav_signed_in");
  return <Link href="/dashboard" className="session-indicator is-signed-in" title={label}><span className="session-dot" aria-hidden="true" />{label}</Link>;
}
