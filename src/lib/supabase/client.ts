import { createBrowserClient } from "@supabase/ssr";

/**
 * Crea un client Supabase per uso nei Client Components (browser).
 *
 * Why: il browser client usa le env vars pubbliche (NEXT_PUBLIC_*)
 * e gestisce automaticamente i cookie di sessione lato client.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
