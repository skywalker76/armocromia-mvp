import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { waitUntil } from "@vercel/functions";
import { runDossierGenerationPipeline } from "@/lib/armocromia/pipeline";
import { defaultLocale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minuti max execution duration per background pipeline AI in waitUntil

/**
 * Endpoint admin temporaneo per triggerare manualmente la generazione di un dossier.
 * Protetto da ADMIN_SECRET, passato nell'header Authorization (NON in query
 * string, così il secret non finisce nei log degli URL / header Referer).
 *
 * Uso: GET /api/admin/trigger-dossier?id=96
 *      header → Authorization: Bearer <ADMIN_SECRET>
 *   es: curl -H "Authorization: Bearer $ADMIN_SECRET" \
 *         "https://www.cromeastudio.com/api/admin/trigger-dossier?id=96"
 */

/**
 * Autorizza la richiesta confrontando il Bearer token con ADMIN_SECRET.
 * Fail-closed: senza ADMIN_SECRET configurato nega sempre. Confronto a tempo
 * costante per non esporre lunghezza/contenuto del secret via timing.
 */
function isAuthorized(request: Request): boolean {
  const expected = process.env.ADMIN_SECRET;
  if (!expected) return false;

  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!provided) return false;

  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);
  if (providedBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}

export async function GET(request: Request) {
  // Verifica secret admin (header Authorization, fail-closed).
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  const dossierId = parseInt(id || "", 10);
  if (isNaN(dossierId)) {
    return NextResponse.json({ error: "Invalid dossier id" }, { status: 400 });
  }

  const supabaseAdmin = createAdminClient();

  // Fetch dossier
  const { data: dossier, error: dossierError } = await supabaseAdmin
    .from("dossiers")
    .select("id, user_id, status, original_photo_path, user_notes")
    .eq("id", dossierId)
    .single();

  if (dossierError || !dossier) {
    return NextResponse.json(
      { error: "Dossier not found", detail: dossierError?.message },
      { status: 404 }
    );
  }

  if (dossier.status === "completed") {
    return NextResponse.json({
      message: "Dossier is already completed — no action needed",
      status: dossier.status,
    });
  }

  // Aggiorna status a processing
  await supabaseAdmin
    .from("dossiers")
    .update({ status: "processing", updated_at: new Date().toISOString() })
    .eq("id", dossierId);

  // Aggiorna payment a completed se esiste
  await supabaseAdmin
    .from("payments")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("dossier_id", dossierId);

  const locale = defaultLocale;

  // Avvia pipeline AI in background
  waitUntil(
    runDossierGenerationPipeline({
      dossierId,
      userId: dossier.user_id,
      photoPath: dossier.original_photo_path || "",
      userNotes: dossier.user_notes,
      analysisMode: "full",
      locale,
    })
  );

  return NextResponse.json({
    message: `✅ Pipeline AI avviata per dossier #${dossierId}`,
    dossierStatus: "processing",
    userId: dossier.user_id,
    photoPath: dossier.original_photo_path,
  });
}
