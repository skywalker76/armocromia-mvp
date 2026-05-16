"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { useConsent } from "@/lib/consent/consent-context";

/**
 * GoogleAnalytics — GA4 con Google Consent Mode v2.
 *
 * Why: tutti gli script analytics partono con `default 'denied'` (richiesto
 * dal GDPR per traffic UE). Quando l'utente esprime il consenso, facciamo
 * `gtag('consent', 'update', { analytics_storage: 'granted' })` — gtag
 * inizia a inviare hits solo da quel momento.
 *
 * gtag stub viene caricato sempre per registrare il consent mode default,
 * ma il main script (gtag.js) viene caricato solo se NEXT_PUBLIC_GA_MEASUREMENT_ID
 * è configurato. Se manca → no-op, perfetto per dev locale.
 *
 * Pageview tracking: Next.js App Router non emette navigation events nativi
 * intercettabili da gtag config, quindi catturiamo pathname+searchParams
 * via hook e mandiamo `gtag('event', 'page_view')` su ogni cambio.
 */

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Gtag = (...args: any[]) => void;

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dataLayer: any[];
    gtag: Gtag;
  }
}

export default function GoogleAnalytics() {
  if (!GA_ID) return null;
  return (
    <>
      <ConsentSync />
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>

      {/* Stub: definisce dataLayer e gtag PRIMA che il main script carichi,
          così possiamo settare il consent default subito. */}
      <Script
        id="ga-consent-default"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('consent', 'default', {
              'ad_storage': 'denied',
              'ad_user_data': 'denied',
              'ad_personalization': 'denied',
              'analytics_storage': 'denied',
              'functionality_storage': 'granted',
              'security_storage': 'granted',
              'wait_for_update': 500
            });
            gtag('js', new Date());
            gtag('config', '${GA_ID}', { send_page_view: false });
          `,
        }}
      />

      <Script
        id="ga-script"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      />
    </>
  );
}

/**
 * Sincronizza il consenso dell'utente con gtag consent update.
 * Why: ogni volta che cambia state.analytics, mandiamo l'update — così
 * il gtag inizia a tracciare (granted) o smette (denied).
 */
function ConsentSync() {
  const { state, hydrated } = useConsent();

  useEffect(() => {
    if (!hydrated) return;
    if (typeof window === "undefined" || !window.gtag) return;
    window.gtag("consent", "update", {
      analytics_storage: state.analytics ? "granted" : "denied",
      ad_storage: state.marketing ? "granted" : "denied",
      ad_user_data: state.marketing ? "granted" : "denied",
      ad_personalization: state.marketing ? "granted" : "denied",
    });
  }, [state.analytics, state.marketing, hydrated]);

  return null;
}

/**
 * Manda page_view ad ogni cambio di rotta App Router.
 * Why: `send_page_view: false` nel config iniziale (per non sparare prima
 * del consent update + double-count on hydration). Qui mandiamo a mano
 * solo quando gtag esiste e siamo in browser.
 */
function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined" || !window.gtag || !GA_ID) return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    window.gtag("event", "page_view", {
      page_path: url,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}
