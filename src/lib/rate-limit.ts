import "server-only";

/**
 * Rate limiter a finestra fissa, IN-MEMORY (best-effort).
 *
 * Why: difesa-in-profondità a costo zero sopra il rate-limit nativo di
 * Supabase, per contenere abuso/costi sull'invio OTP e brute-force sulla
 * verifica.
 *
 * ⚠️ LIMITE NOTO: lo stato è per-istanza (Vercel Fluid Compute riusa le
 * istanze ma non le condivide) → ferma l'abuso ovvio/burst da una singola
 * sorgente su istanza calda, NON un attaccante distribuito su molte istanze.
 * Per protezione globale servirebbe uno store esterno (es. Upstash Redis via
 * Vercel Marketplace). Accettabile per l'MVP, combinato col limite Supabase.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Pulizia opportunistica: evita la crescita illimitata della Map. */
function sweep(now: number): void {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  /** Secondi da attendere prima del reset della finestra (0 se allowed). */
  retryAfterSec: number;
}

/**
 * Registra un tentativo per `key` e dice se è entro il limite.
 * Ogni chiamata consuma una unità della finestra corrente (anche i tentativi
 * respinti contano: è voluto, penalizza l'abuso).
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);

  // Nessuna finestra attiva (o scaduta) → apri una nuova finestra
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

/**
 * Estrae l'IP del client dagli header impostati da Vercel.
 * Fallback "unknown" se assenti (es. ambiente locale).
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
