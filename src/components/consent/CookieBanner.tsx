"use client";

import { useConsent } from "@/lib/consent/consent-context";
import { useLocale } from "@/lib/i18n/locale-context";
import { useTranslations } from "@/lib/i18n/translations-context";
import { localePath } from "@/lib/i18n/config";
import CookiePreferencesModal from "./CookiePreferencesModal";

/**
 * CookieBanner — banner soft bottom non-bloccante, GDPR-compliant.
 *
 * Why: appare solo se l'utente non ha ancora espresso una scelta
 * (decided === false). Default è "denied" → Google Analytics non
 * carica fino a opt-in esplicito. Soft (non oscura il contenuto)
 * per non penalizzare conversion mentre l'utente esplora.
 *
 * Tre azioni rapide: Accetta tutto / Rifiuta / Personalizza (apre
 * modale dettagliato). Il modale è renderizzato anche fuori dal
 * flusso "first visit" perché può essere riaperto dal footer.
 */
export default function CookieBanner() {
  const { decided, hydrated, acceptAll, rejectAll, openPreferences, preferencesOpen } = useConsent();
  const locale = useLocale();
  const { t } = useTranslations("consent.banner");
  const privacyHref = localePath(locale, "/privacy");

  // Evita flash banner pre-hydration (SSR non sa il consenso).
  // Once hydrated && !decided → mostra. Once decided → nascondi.
  const showBanner = hydrated && !decided;

  return (
    <>
      {showBanner && (
        <div
          role="dialog"
          aria-labelledby="cookie-banner-title"
          aria-describedby="cookie-banner-body"
          className="fixed bottom-0 inset-x-0 z-[55] p-4 sm:p-6 pointer-events-none"
        >
          <div className="mx-auto max-w-4xl pointer-events-auto rounded-2xl border border-accent/15 bg-white/95 backdrop-blur-md shadow-2xl ring-1 ring-black/5 p-5 sm:p-6 animate-slide-up">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
              <div className="flex-1 min-w-0">
                <h2
                  id="cookie-banner-title"
                  className="font-serif text-lg text-ink"
                >
                  {t("title")}
                </h2>
                <p
                  id="cookie-banner-body"
                  className="mt-2 text-sm text-muted leading-relaxed"
                >
                  {t("body")}{" "}
                  <a
                    href={privacyHref}
                    className="text-accent hover:underline"
                  >
                    {t("privacyLink")}
                  </a>
                  .
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={acceptAll}
                  className="rounded-xl bg-gradient-to-r from-accent to-accent-hover px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  {t("acceptAll")}
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={rejectAll}
                    className="flex-1 rounded-xl border border-accent/20 bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-cream"
                  >
                    {t("rejectAll")}
                  </button>
                  <button
                    type="button"
                    onClick={openPreferences}
                    className="flex-1 rounded-xl border border-accent/20 bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-cream"
                  >
                    {t("customize")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Il modale è sempre montato (chiuso di default) — si apre via
          openPreferences() sia dal banner che dal footer link. */}
      {preferencesOpen && <CookiePreferencesModal />}
    </>
  );
}
