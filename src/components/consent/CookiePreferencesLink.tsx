"use client";

import { useConsent } from "@/lib/consent/consent-context";
import { useTranslations } from "@/lib/i18n/translations-context";

/**
 * CookiePreferencesLink — link "Preferenze cookie" da inserire nei footer.
 *
 * Why: requisito GDPR — l'utente deve poter rivedere/modificare il consenso
 * in qualsiasi momento, non solo alla prima visita. Cliccando questo link
 * si riapre il CookiePreferencesModal con lo stato corrente.
 */
export default function CookiePreferencesLink({
  className,
}: {
  className?: string;
}) {
  const { openPreferences } = useConsent();
  const { t } = useTranslations("consent");

  return (
    <button
      type="button"
      onClick={openPreferences}
      className={className ?? "hover:text-accent transition-colors"}
    >
      {t("footerLink")}
    </button>
  );
}
