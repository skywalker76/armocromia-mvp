import type { ReactNode } from "react";
import { isValidLocale, localePath, defaultLocale } from "@/lib/i18n/config";

/**
 * Layout condiviso per le pagine legali (/[lang]/privacy, /[lang]/terms).
 * Header semplice con link al sito, container reading-width, footer minimale.
 */
export default async function LegalLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isValidLocale(lang) ? lang : defaultLocale;
  const homeHref = localePath(locale, "/");
  const privacyHref = localePath(locale, "/privacy");
  const termsHref = localePath(locale, "/terms");

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-accent/10 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <a
            href={homeHref}
            className="font-serif text-xl text-ink transition-colors hover:text-accent"
          >
            Armocromia
          </a>
          <a
            href={homeHref}
            className="text-sm text-muted hover:text-ink transition-colors"
          >
            ← Torna alla home
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <article className="legal-prose">{children}</article>
      </main>

      <footer className="border-t border-accent/10 px-6 py-8">
        <div className="mx-auto max-w-3xl text-center text-xs text-muted-light">
          <p className="font-serif text-base text-ink">Armocromia</p>
          <p className="mt-1">Powered by Antigravity</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
            <a href={privacyHref} className="hover:text-accent transition-colors">
              Privacy Policy
            </a>
            <span>·</span>
            <a href={termsHref} className="hover:text-accent transition-colors">
              Termini di Servizio
            </a>
            <span>·</span>
            <a
              href="mailto:info@antigravity.dev"
              className="hover:text-accent transition-colors"
            >
              Contatti
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
