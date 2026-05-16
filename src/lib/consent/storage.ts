import {
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  type ConsentState,
  type StoredConsent,
} from "./types";

/**
 * Helper di persistenza per il consenso GDPR.
 *
 * Why: localStorage scelto invece dei cookie perché il consenso stesso
 * non è inviato al server (è solo flag client-side per attivare gtag).
 * Survive a browser restart, scoped per origin → cross-tab consistent.
 *
 * SSR-safe: tutti i metodi return undefined / no-op se window non esiste.
 */

export function readConsent(): StoredConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConsent;
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeConsent(state: ConsentState): StoredConsent {
  const stored: StoredConsent = {
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
    state,
  };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(stored));
    } catch {
      // QuotaExceeded / browser strict — degrade silently
    }
  }
  return stored;
}

export function clearConsent(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    // ignore
  }
}
