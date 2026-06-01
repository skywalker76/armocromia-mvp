import * as Sentry from "@sentry/nextjs";

/**
 * Init Sentry per il runtime Node.js (Server Components, Route Handlers,
 * Server Actions, pipeline in waitUntil).
 *
 * Gated sulla DSN: senza NEXT_PUBLIC_SENTRY_DSN, Sentry resta inerte
 * (utile in locale e prima di configurare l'env su Vercel).
 * Solo error-monitoring: niente tracing/replay → resta nel piano free.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0,
    enableLogs: false,
    debug: false,
  });
}
