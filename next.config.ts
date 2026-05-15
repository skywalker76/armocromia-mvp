import type { NextConfig } from "next";

/**
 * Content Security Policy
 *
 * Why permissive su script-src: Next.js inietta script inline (hydration boot, Server Actions).
 * Nonce-based CSP è più sicuro ma richiede refactor non banale → MVP: 'unsafe-inline' + 'unsafe-eval'.
 *
 * Whitelist connect-src:
 * - *.supabase.co + wss://*.supabase.co → DB, auth, storage, realtime
 * - *.fal.run + queue.fal.run + *.fal.ai → AI vision/generation
 * - vitals.vercel-insights.com → Web Vitals (se attivato in futuro)
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://*.supabase.co https://*.fal.run https://v3.fal.media",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.fal.run https://*.fal.ai https://queue.fal.run https://v3.fal.media https://vitals.vercel-insights.com",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
