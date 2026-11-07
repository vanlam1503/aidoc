"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { translate, type Locale, type TranslationKey } from "@/lib/i18n/dictionaries";
import { defaultLocale, isLocale, localeStorageKey } from "@/lib/i18n/config";

type LanguageContextValue = { locale: Locale; setLocale: (locale: Locale) => void; t: (key: TranslationKey, values?: Record<string, string | number>) => string };
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stored: Locale = defaultLocale;
    try { const value = localStorage.getItem(localeStorageKey); if (isLocale(value)) stored = value; } catch { /* Use English when storage is blocked. */ }
    setLocaleState(stored);
    document.documentElement.lang = stored;
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = locale;
    try { localStorage.setItem(localeStorageKey, locale); } catch { /* The preference still applies for this page. */ }
  }, [locale, ready]);

  const setLocale = useCallback((nextLocale: Locale) => setLocaleState(nextLocale), []);
  const t = useCallback((key: TranslationKey, values?: Record<string, string | number>) => translate(locale, key, values), [locale]);
  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
