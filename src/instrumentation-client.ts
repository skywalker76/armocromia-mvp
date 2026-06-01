import * as Sentry from "@sentry/nextjs";

/**
 * Instrumentation client-side (Next 16): cattura gli errori nel browser
 * dell'utente — il "buco" che l'email-admin server-side non vede.
 *
 * Gated sulla DSN: senza NEXT_PUBLIC_SENTRY_DSN resta inerte.
 * Solo error-monitoring (niente tracing/replay) → piano free.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0,
    enableLogs: false,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    debug: false,
  });
}

// Breadcrumb di navigazione (no-op se Sentry non è inizializzato).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
