import "server-only";
import type { Locale } from "./config";
import itDict from "@/messages/it.json";

/**
 * getDictionary — carica le traduzioni per il locale richiesto.
 *
 * Why: pattern Next.js 16 ufficiale (vedi node_modules/next/dist/docs/01-app/02-guides/internationalization.md).
 * Lazy import per non caricare JSON delle altre lingue nel bundle quando non servono.
 *
 * Il JSON italiano è la fonte di verità per la struttura — `Dictionary` è inferito da `it.json`.
 * Le traduzioni EN/ES devono mantenere la stessa shape (controllo a Step 3/4).
 */
const dictionaries = {
  it: () => Promise.resolve(itDict),
  en: () => import("@/messages/en.json").then((m) => m.default as unknown as Dictionary),
  es: () => import("@/messages/es.json").then((m) => m.default as unknown as Dictionary),
} as const;

export type Dictionary = typeof itDict;

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]();
}
