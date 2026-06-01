import * as Sentry from "@sentry/nextjs";

/**
 * Instrumentation server-side (Next 16). Carica la config Sentry corretta per
 * il runtime attivo e aggancia la cattura degli errori server.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Cattura automaticamente gli errori di rendering Server Components / Route
// Handlers / Server Actions (no-op se Sentry non è inizializzato).
export const onRequestError = Sentry.captureRequestError;
