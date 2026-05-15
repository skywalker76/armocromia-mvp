import "server-only";
import type { Locale } from "./config";

/**
 * getDictionary — carica le traduzioni per il locale richiesto.
 *
 * Why: pattern Next.js 16 ufficiale (vedi node_modules/next/dist/docs/01-app/02-guides/internationalization.md).
 * Lazy import per non caricare JSON delle altre lingue nel bundle.
 *
 * In Step 1 i JSON sono placeholder vuoti. Le traduzioni vere arrivano da Step 2.
 */
const dictionaries = {
  it: () => import("@/messages/it.json").then((m) => m.default),
  en: () => import("@/messages/en.json").then((m) => m.default),
  es: () => import("@/messages/es.json").then((m) => m.default),
} as const;

export type Dictionary = Awaited<ReturnType<(typeof dictionaries)["it"]>>;

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]();
}
