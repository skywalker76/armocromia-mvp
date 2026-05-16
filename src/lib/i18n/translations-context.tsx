"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Dictionary } from "./dictionaries";

/**
 * TranslationsProvider — espone il dictionary corrente + fallback ai Client Components.
 *
 * Why: Server Components possono fare `await getTranslations(locale, ns)`,
 * ma Client Components non possono awaitare dynamic imports. Il provider è
 * inizializzato in app/[lang]/layout.tsx (Server Component) passando il
 * dictionary pre-caricato — i Client figli leggono via useTranslations(ns).
 *
 * Fallback: il provider riceve sia il dict del locale corrente (`dict`) sia
 * quello del defaultLocale (`fallbackDict`). Se una chiave manca nel locale
 * corrente, useTranslations ricade sul fallback.
 *
 * Il dictionary completo viaggia nel payload RSC. Il sito è piccolo (~10KB
 * di JSON), quindi accettiamo il tradeoff in cambio di una DX uniforme.
 */

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

interface DictionaryBundle {
  dict: Dictionary;
  fallbackDict: Dictionary;
}

const TranslationsContext = createContext<DictionaryBundle | null>(null);

export function TranslationsProvider({
  dict,
  fallbackDict,
  children,
}: {
  dict: Dictionary;
  fallbackDict: Dictionary;
  children: ReactNode;
}) {
  return (
    <TranslationsContext.Provider value={{ dict, fallbackDict }}>
      {children}
    </TranslationsContext.Provider>
  );
}

export interface ClientTranslator {
  t: (key: string) => string;
  raw: <T = unknown>(key: string) => T;
}

/**
 * useTranslations — accedi alle traduzioni nel client.
 *
 * Uso:
 *   const { t } = useTranslations("marketing.hero");
 *   <button>{t("cta")}</button>
 *
 * Per dati strutturati (array, oggetti) usa raw<T>():
 *   const features = raw<string[]>("features");
 */
export function useTranslations(namespace?: string): ClientTranslator {
  const ctx = useContext(TranslationsContext);
  if (!ctx) {
    throw new Error(
      "useTranslations must be used within a TranslationsProvider (app/[lang]/layout.tsx)"
    );
  }

  return useMemo(() => {
    const base = namespace ? getNested(ctx.dict, namespace) : ctx.dict;
    const baseFallback = namespace
      ? getNested(ctx.fallbackDict, namespace)
      : ctx.fallbackDict;

    return {
      t: (key: string): string => {
        const val = getNested(base, key);
        if (typeof val === "string") return val;

        const fallbackVal = getNested(baseFallback, key);
        if (typeof fallbackVal === "string") return fallbackVal;

        if (process.env.NODE_ENV !== "production") {
          const fullPath = namespace ? `${namespace}.${key}` : key;
          console.warn(`[i18n] Missing translation: "${fullPath}"`);
        }
        return key;
      },
      raw: <T = unknown>(key: string): T => {
        const val = getNested(base, key);
        if (val !== undefined) return val as T;
        return getNested(baseFallback, key) as T;
      },
    };
  }, [ctx, namespace]);
}
