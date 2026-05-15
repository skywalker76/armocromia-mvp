/**
 * i18n configuration — fonte unica di verità per locali supportati.
 *
 * Why: Step 1 prepara la foundation per traduzioni IT + EN + ES.
 * Le traduzioni vere arrivano in Step 2+ (messages/<locale>.json).
 */

export const locales = ["it", "en", "es"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "it";

export const localeNames: Record<Locale, string> = {
  it: "Italiano",
  en: "English",
  es: "Español",
};

export const localeFlags: Record<Locale, string> = {
  it: "🇮🇹",
  en: "🇬🇧",
  es: "🇪🇸",
};

export function isValidLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/**
 * Costruisce un path locale-aware.
 * Why: utility per generare href consistenti dentro Client Components che
 * conoscono il locale tramite useLocale(). Esempio: localePath("it", "/dashboard") → "/it/dashboard"
 */
export function localePath(locale: Locale, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") return `/${locale}`;
  return `/${locale}${normalized}`;
}
