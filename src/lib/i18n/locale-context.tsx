"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Locale } from "./config";

/**
 * LocaleContext — espone il locale corrente ai Client Components nested.
 *
 * Why: Server Components ricevono il locale via params.lang, ma Client
 * Components come NavBar/PhotoUploader hanno bisogno di accedervi senza
 * prop drilling. Il LocaleProvider è inizializzato in app/[lang]/layout.tsx.
 *
 * Uso:
 *   const locale = useLocale();
 *   <a href={localePath(locale, "/dashboard")}>...</a>
 */

const LocaleContext = createContext<Locale | null>(null);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): Locale {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error(
      "useLocale must be used within a LocaleProvider (app/[lang]/layout.tsx)"
    );
  }
  return ctx;
}
