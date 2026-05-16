"use client";

import { useEffect, useState } from "react";
import { useConsent } from "@/lib/consent/consent-context";
import { useTranslations } from "@/lib/i18n/translations-context";
import { ACCEPT_ALL, DEFAULT_DENIED, type ConsentState } from "@/lib/consent/types";

/**
 * CookiePreferencesModal — pannello granulare per gestire ogni categoria.
 *
 * Why: requisito GDPR EU — l'utente deve poter scegliere PER CATEGORIA,
 * non solo accetta-tutto/rifiuta-tutto. Il banner espone il modale
 * tramite il pulsante "Personalizza"; il footer link lo apre direttamente
 * anche dopo una scelta già fatta.
 */
export default function CookiePreferencesModal() {
  const { state, acceptAll, rejectAll, setState, closePreferences } = useConsent();
  const { t } = useTranslations("consent.preferences");
  const { t: tCat } = useTranslations("consent.categories");

  // Stato locale del modale → permette di modificare i toggle prima di
  // confermare. Inizializzato dallo state corrente del context.
  const [draft, setDraft] = useState<ConsentState>(state);

  // Re-sync se lo state esterno cambia mentre il modale è aperto
  // (es. user clicca "accetta tutto" dal banner contemporaneamente).
  useEffect(() => {
    setDraft(state);
  }, [state]);

  // Lock body scroll + Escape to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePreferences();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [closePreferences]);

  const handleSave = () => {
    setState(draft);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-prefs-title"
    >
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fade-in"
        onClick={closePreferences}
      />
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 shadow-xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="cookie-prefs-title" className="font-serif text-2xl text-ink">
              {t("title")}
            </h2>
            <p className="mt-2 text-sm text-muted leading-relaxed">
              {t("body")}
            </p>
          </div>
          <button
            type="button"
            onClick={closePreferences}
            className="shrink-0 rounded-lg p-1.5 text-muted-light hover:bg-cream hover:text-ink transition-colors"
            aria-label={t("close")}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {/* Necessary — always on, no toggle */}
          <div className="rounded-xl border border-accent/10 bg-cream/40 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-medium text-ink">{tCat("necessary.title")}</h3>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  {tCat("necessary.description")}
                </p>
              </div>
              <span className="shrink-0 inline-flex items-center rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                {t("alwaysOn")}
              </span>
            </div>
          </div>

          {/* Analytics */}
          <CategoryToggle
            title={tCat("analytics.title")}
            description={tCat("analytics.description")}
            checked={draft.analytics}
            onChange={(checked) => setDraft({ ...draft, analytics: checked })}
          />

          {/* Marketing */}
          <CategoryToggle
            title={tCat("marketing.title")}
            description={tCat("marketing.description")}
            checked={draft.marketing}
            onChange={(checked) => setDraft({ ...draft, marketing: checked })}
          />
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={rejectAll}
            className="flex-1 rounded-xl border border-accent/20 bg-white px-5 py-3 text-sm font-medium text-ink transition-colors hover:bg-cream"
          >
            {t("rejectAll")}
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(ACCEPT_ALL);
              acceptAll();
            }}
            className="flex-1 rounded-xl border border-accent/20 bg-white px-5 py-3 text-sm font-medium text-ink transition-colors hover:bg-cream"
          >
            {t("acceptAll")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 rounded-xl bg-gradient-to-r from-accent to-accent-hover px-5 py-3 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg"
          >
            {t("save")}
          </button>
        </div>

        {/* Hidden re-export per evitare unused warning */}
        <span hidden>{JSON.stringify(DEFAULT_DENIED).length}</span>
      </div>
    </div>
  );
}

function CategoryToggle({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="rounded-xl border border-accent/10 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-medium text-ink">{title}</h3>
          <p className="mt-1 text-xs text-muted leading-relaxed">
            {description}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          className={`shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            checked ? "bg-accent" : "bg-accent/20"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
              checked ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
