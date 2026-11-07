export const supportedLocales = ["en", "vi"] as const;
export type Locale = (typeof supportedLocales)[number];
export const defaultLocale: Locale = "en";
export const localeStorageKey = "academy-locale";

export function isLocale(value: unknown): value is Locale {
  return supportedLocales.some((locale) => locale === value);
}
