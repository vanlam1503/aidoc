"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";
type ThemeContextValue = { theme: Theme; resolvedTheme: ResolvedTheme; setTheme: (theme: Theme) => void };

const ThemeContext = createContext<ThemeContextValue | null>(null);
const storageKey = "theme";
const systemPreference = "(prefers-color-scheme: dark)";

function applyTheme(theme: Theme): ResolvedTheme {
  const dark = theme === "dark" || (theme === "system" && window.matchMedia(systemPreference).matches);
  const resolvedTheme: ResolvedTheme = dark ? "dark" : "light";
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = resolvedTheme;
  return resolvedTheme;
}

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
  } catch {
    return "system";
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  useEffect(() => {
    const storedTheme = readStoredTheme();
    setThemeState(storedTheme);
    setResolvedTheme(applyTheme(storedTheme));
  }, []);

  useEffect(() => {
    if (theme !== "system") {
      setResolvedTheme(applyTheme(theme));
      return;
    }
    const media = window.matchMedia(systemPreference);
    const update = () => setResolvedTheme(applyTheme("system"));
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [theme]);

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme);
    try { localStorage.setItem(storageKey, nextTheme); } catch { /* Theme still applies when storage is unavailable. */ }
    setResolvedTheme(applyTheme(nextTheme));
  }, []);

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
