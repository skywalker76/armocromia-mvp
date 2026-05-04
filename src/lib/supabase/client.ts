import { createBrowserClient } from "@supabase/ssr";

/**
 * Crea un client Supabase per uso nei Client Components (browser).
 *
 * Why: il browser client usa le env vars pubbliche (NEXT_PUBLIC_*)
 * e gestisce automaticamente i cookie di sessione lato client.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase env vars. Copy .env.local.example to .env.local and populate the values."
    );
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
