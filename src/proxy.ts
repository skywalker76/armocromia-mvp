import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { locales, defaultLocale, isValidLocale } from "@/lib/i18n/config";

/**
 * Next.js Proxy — intercetta ogni request per:
 *  1. Refreshare la sessione Supabase (cookie SSR)
 *  2. Routing i18n: redirect dei path senza locale a /<locale>/...
 *
 * Why: in Next.js 16+, proxy.ts sostituisce middleware.ts come file convention.
 *
 * Path esclusi dal locale prefix:
 *  - /api/*           → route handler language-agnostic
 *  - /auth/callback   → Supabase callback (post-magic-link redirect)
 *  - /_next/*         → asset Next
 *  - /sw.js           → service worker
 *  - file con estensione (favicon, manifest, immagini)
 */

const NO_LOCALE_PREFIXES = ["/api", "/auth/callback", "/_next", "/sw.js"];

function shouldSkipLocale(pathname: string): boolean {
  if (NO_LOCALE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  // File con estensione (favicon.ico, manifest.json, icon-192.png, ecc.)
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) {
    return true;
  }
  return false;
}

function detectLocale(request: NextRequest): string {
  // 1. Cookie persistente con la scelta dell'utente
  const cookie = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookie && isValidLocale(cookie)) return cookie;

  // 2. Negotiation da Accept-Language
  const acceptLang = request.headers.get("accept-language") ?? "";
  for (const entry of acceptLang.split(",")) {
    const code = entry.trim().split(/[-;]/)[0]?.toLowerCase();
    if (code && isValidLocale(code)) return code;
  }

  return defaultLocale;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Path tecnici (API, callback, static) — solo sessione, no locale
  if (shouldSkipLocale(pathname)) {
    return await updateSession(request);
  }

  // Path già con locale (/it/..., /en/..., /es/...)
  const hasLocale = locales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  );

  if (hasLocale) {
    return await updateSession(request);
  }

  // Path "nudo" (/, /dashboard, /privacy, ...) → redirect a /<locale>/<path>
  const locale = detectLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Static assets (svg, png, jpg, jpeg, gif, webp)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
