"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Error boundary del gruppo (app) — copre dashboard e pagine dossier.
 *
 * Why: se il rendering di un flusso autenticato crasha, mostriamo una fallback
 * UI on-brand con possibilità di riprovare, invece di una schermata bianca che
 * farebbe perdere un cliente (potenzialmente pagante). Additivo: invisibile
 * finché non avviene un errore.
 *
 * Robustezza: la lingua è ricavata dal pathname (mai da un context che potrebbe
 * non essere montato), così la boundary non può a sua volta lanciare.
 *
 * NB Next 16.2: la prop di recupero è `unstable_retry` (non più `reset`).
 */

const MESSAGES = {
  it: {
    title: "Qualcosa è andato storto",
    body: "Si è verificato un errore imprevisto. Puoi riprovare: i tuoi dati e i dossier sono al sicuro.",
    retry: "Riprova",
    home: "Torna alla dashboard",
  },
  en: {
    title: "Something went wrong",
    body: "An unexpected error occurred. You can try again — your data and dossiers are safe.",
    retry: "Try again",
    home: "Back to dashboard",
  },
  es: {
    title: "Algo ha salido mal",
    body: "Se ha producido un error inesperado. Puedes volver a intentarlo: tus datos y dosieres están a salvo.",
    retry: "Reintentar",
    home: "Volver al panel",
  },
} as const;

type Lang = keyof typeof MESSAGES;

function resolveLang(pathname: string | null): Lang {
  const seg = pathname?.split("/").filter(Boolean)[0];
  return seg === "en" || seg === "es" ? seg : "it";
}

export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const lang = resolveLang(usePathname());
  const t = MESSAGES[lang];

  useEffect(() => {
    // Log lato client per diagnosi (il digest collega ai log server-side).
    console.error("[app/error boundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-16">
      <div className="glass w-full max-w-md rounded-2xl border border-accent/10 p-8 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-danger-light text-2xl">
          ⚠️
        </div>
        <h2 className="mb-2 text-xl font-semibold text-ink">{t.title}</h2>
        <p className="mb-6 text-sm text-muted">{t.body}</p>
        {error.digest ? (
          <p className="mb-6 font-mono text-[11px] text-muted-light">ref: {error.digest}</p>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => unstable_retry()}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            {t.retry}
          </button>
          <Link
            href={`/${lang}/dashboard`}
            className="rounded-full border border-accent/20 px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-cream-dark"
          >
            {t.home}
          </Link>
        </div>
      </div>
    </div>
  );
}
