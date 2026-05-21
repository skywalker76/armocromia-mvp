import "server-only";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

/**
 * Crea un client Supabase amministrativo (bypass RLS) per elaborazioni asincrone in background.
 *
 * Why: nei webhook di Stripe o nei task asincroni 'waitUntil', non vi è un cookie store attivo
 * o un utente autenticato nel contesto. L'uso della SUPABASE_SECRET_KEY (service role)
 * garantisce che il server possa aggiornare lo stato del dossier e caricare i file in sicurezza.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Missing Supabase admin env vars. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are set."
    );
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
