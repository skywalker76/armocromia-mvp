import * as Sentry from "@sentry/nextjs";

/**
 * Init Sentry per il runtime Edge (es. il proxy/middleware Next 16).
 * Gated sulla DSN come la config server. Solo error-monitoring.
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
