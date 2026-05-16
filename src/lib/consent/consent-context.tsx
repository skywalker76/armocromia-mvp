"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  ACCEPT_ALL,
  DEFAULT_DENIED,
  type ConsentState,
} from "./types";
import { readConsent, writeConsent } from "./storage";

/**
 * ConsentProvider — espone lo stato del consenso GDPR a tutti i Client.
 *
 * Why: Server-side non possiamo sapere il consenso (è in localStorage),
 * quindi tutto il sistema gira client-side. Il provider è montato in
 * [lang]/layout.tsx e all'idratazione legge lo stato salvato; se non
 * c'è nulla mostriamo il banner e teniamo gli script analytics OFF.
 *
 * `decided` è true solo dopo che l'utente ha cliccato un bottone —
 * "default denied + decided=false" = ancora da chiedere (mostra banner).
 */

interface ConsentContextValue {
  state: ConsentState;
  /** true se l'utente ha già fatto una scelta (banner non più necessario) */
  decided: boolean;
  /** true se siamo nello stato di idratazione iniziale (evita flash banner) */
  hydrated: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  setState: (next: ConsentState) => void;
  /** Riapre il modale preferenze (consumato da CookiePreferencesModal) */
  openPreferences: () => void;
  /** Chiude il modale preferenze */
  closePreferences: () => void;
  /** Stato del modale (controllato dal provider) */
  preferencesOpen: boolean;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [state, setStateInternal] = useState<ConsentState>(DEFAULT_DENIED);
  const [decided, setDecided] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  // Hydration: leggi consent persistito al mount
  useEffect(() => {
    const stored = readConsent();
    if (stored) {
      setStateInternal(stored.state);
      setDecided(true);
    }
    setHydrated(true);
  }, []);

  const acceptAll = useCallback(() => {
    writeConsent(ACCEPT_ALL);
    setStateInternal(ACCEPT_ALL);
    setDecided(true);
    setPreferencesOpen(false);
  }, []);

  const rejectAll = useCallback(() => {
    writeConsent(DEFAULT_DENIED);
    setStateInternal(DEFAULT_DENIED);
    setDecided(true);
    setPreferencesOpen(false);
  }, []);

  const setState = useCallback((next: ConsentState) => {
    const normalized: ConsentState = { ...next, necessary: true };
    writeConsent(normalized);
    setStateInternal(normalized);
    setDecided(true);
    setPreferencesOpen(false);
  }, []);

  const openPreferences = useCallback(() => setPreferencesOpen(true), []);
  const closePreferences = useCallback(() => setPreferencesOpen(false), []);

  return (
    <ConsentContext.Provider
      value={{
        state,
        decided,
        hydrated,
        acceptAll,
        rejectAll,
        setState,
        openPreferences,
        closePreferences,
        preferencesOpen,
      }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    throw new Error(
      "useConsent must be used within a ConsentProvider ([lang]/layout.tsx)"
    );
  }
  return ctx;
}
