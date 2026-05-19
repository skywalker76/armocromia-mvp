import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Helper admin — gating della /admin route e accesso service-role a Supabase.
 *
 * Why: l'admin dashboard deve leggere dossier di TUTTI gli utenti (bypass RLS)
 * e fare join con auth.users per la mail. Solo il service role può farlo.
 * Il gating "chi è admin" è basato su una env var comma-separated, perché per
 * un MVP single-founder non serve un sistema RBAC sul DB.
 */

/** Restituisce true se l'email è nella lista ADMIN_EMAILS (env var). */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const raw = (process.env.ADMIN_EMAILS ?? "").replace(/['"]/g, "");
  const allowed = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
}

/**
 * Crea un client Supabase con la service-role key — bypassa RLS.
 * USARE SOLO dopo aver verificato isAdmin(user.email), MAI nei flussi normali.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error("Admin client: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY mancante");
  }
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
