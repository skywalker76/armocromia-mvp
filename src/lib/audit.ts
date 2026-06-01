import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Registro di audit GDPR (accountability, art. 5.2): tracciamo le cancellazioni
 * dei dati personali — erasure account, cancellazione dossier, retention foto.
 *
 * Privacy by design: NON registriamo contenuti personali (niente foto, niente
 * risultati d'analisi), solo metadati — azione, ruolo, riferimento user_id e
 * conteggi. Il record sopravvive alla cancellazione dell'account (la tabella
 * non ha FK verso auth.users) perché serve proprio a provare l'erasure.
 * La tabella audit_log è accessibile solo al ruolo service_role.
 *
 * Best-effort: un fallimento dell'audit NON deve mai bloccare l'operazione
 * utente. Se la tabella non esiste ancora (migration non applicata) l'errore
 * viene solo loggato.
 */

export type AuditActor = "user" | "system" | "admin";

export interface AuditEntry {
  /** Azione registrata, es. "account_deleted", "dossier_deleted". */
  action: string;
  actor: AuditActor;
  /** Soggetto dei dati (resta anche dopo la cancellazione dell'account). */
  userId?: string | null;
  /** Riferimento dell'oggetto, es. id dossier. */
  targetId?: string | number | null;
  /** Metadati non sensibili (conteggi, flag). NO PII. */
  details?: Record<string, unknown> | null;
  ip?: string | null;
}

// Client service_role dedicato e non tipizzato (la tabella audit_log non è nei
// types generati): evita di accoppiare l'audit allo schema tipizzato.
let cached: SupabaseClient | null = null;

function getAuditClient(): SupabaseClient | null {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !key) {
    console.warn("[audit] env Supabase mancanti: audit disabilitato.");
    return null;
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

/** Scrive una riga di audit. Best-effort: non lancia mai. */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const client = getAuditClient();
    if (!client) return;

    const { error } = await client.from("audit_log").insert({
      action: entry.action,
      actor: entry.actor,
      user_id: entry.userId ?? null,
      target_id: entry.targetId != null ? String(entry.targetId) : null,
      details: entry.details ?? null,
      ip: entry.ip ?? null,
    });

    if (error) {
      console.warn(`[audit] insert fallito (action=${entry.action}):`, error.message);
    }
  } catch (err) {
    console.warn(
      `[audit] errore inatteso (action=${entry.action}):`,
      err instanceof Error ? err.message : String(err)
    );
  }
}
