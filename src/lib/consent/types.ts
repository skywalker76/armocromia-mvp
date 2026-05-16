/**
 * Consent model — GDPR-compliant categorie cookie.
 *
 * Why: separiamo cookie strettamente necessari (sempre attivi, base
 * legale: legittimo interesse / esecuzione contratto) da quelli che
 * richiedono consenso esplicito (analytics, marketing).
 *
 * Versionato: se cambieremo le categorie in futuro (es. aggiungiamo
 * personalization), incrementiamo VERSION e invalidiamo i consensi
 * pregressi per richiedere un nuovo opt-in.
 */

export const CONSENT_VERSION = 1;
export const CONSENT_STORAGE_KEY = "armocromia.consent.v1";

export type ConsentCategory = "necessary" | "analytics" | "marketing";

export interface ConsentState {
  /** Sempre true — necessari al funzionamento (auth, sessione). Non opt-out-able. */
  necessary: true;
  /** Google Analytics, error tracking aggregato. Default: false. */
  analytics: boolean;
  /** Pixel pubblicitari, retargeting. Default: false. Non usato oggi. */
  marketing: boolean;
}

export interface StoredConsent {
  version: number;
  /** ISO timestamp di quando l'utente ha espresso il consenso. */
  timestamp: string;
  state: ConsentState;
}

export const DEFAULT_DENIED: ConsentState = {
  necessary: true,
  analytics: false,
  marketing: false,
};

export const ACCEPT_ALL: ConsentState = {
  necessary: true,
  analytics: true,
  marketing: true,
};
