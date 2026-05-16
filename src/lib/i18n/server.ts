import "server-only";
import { getDictionary, type Dictionary } from "./dictionaries";
import { defaultLocale, type Locale } from "./config";

type AnyRecord = { [key: string]: unknown };

function getNested(obj: unknown, path: string): unknown {
  if (!path) return obj;
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as AnyRecord)) {
      return (acc as AnyRecord)[key];
    }
    return undefined;
  }, obj);
}

export interface Translator {
  t: (key: string) => string;
  raw: <T = unknown>(key: string) => T;
}

/**
 * getTranslations — helper Server Component per accedere alle traduzioni.
 *
 * Why: API simmetrica a useTranslations() lato client, ma async perché il
 * dictionary è caricato server-side. Il namespace permette accessi corti:
 *   const { t } = await getTranslations(locale, "marketing.hero");
 *   t("title") // → "Scopri i colori..."
 *
 * Fallback: se la chiave manca nel locale corrente, si tenta il `defaultLocale`
 * (IT). Questo permette di rilasciare EN/ES parzialmente tradotti senza che
 * la UI esponga chiavi letterali agli utenti.
 *
 * Per accedere a strutture non-stringa (array di oggetti) usare raw<T>().
 */
export async function getTranslations(
  locale: Locale,
  namespace?: string
): Promise<Translator & { dict: Dictionary }> {
  const dict = await getDictionary(locale);
  const fallback =
    locale === defaultLocale ? dict : await getDictionary(defaultLocale);

  const base = namespace ? getNested(dict, namespace) : dict;
  const baseFallback = namespace ? getNested(fallback, namespace) : fallback;

  return {
    dict,
    t: (key: string): string => {
      const val = getNested(base, key);
      if (typeof val === "string") return val;

      const fallbackVal = getNested(baseFallback, key);
      if (typeof fallbackVal === "string") {
        if (process.env.NODE_ENV !== "production" && locale !== defaultLocale) {
          const fullPath = namespace ? `${namespace}.${key}` : key;
          console.warn(`[i18n] Missing "${fullPath}" for "${locale}" — using "${defaultLocale}" fallback`);
        }
        return fallbackVal;
      }

      if (process.env.NODE_ENV !== "production") {
        const fullPath = namespace ? `${namespace}.${key}` : key;
        // eslint-disable-next-line no-console
        console.warn(`[i18n] Missing translation: "${fullPath}" (no fallback)`);
      }
      return key;
    },
    raw: <T = unknown>(key: string): T => {
      const val = getNested(base, key);
      if (val !== undefined) return val as T;
      return getNested(baseFallback, key) as T;
    },
  };
}
