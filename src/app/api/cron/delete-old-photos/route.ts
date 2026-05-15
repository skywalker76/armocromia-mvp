import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/cron/delete-old-photos
 *
 * Cron job orario (vedi vercel.json) che cancella dal bucket `photos`
 * tutte le foto utente più vecchie di 24h.
 *
 * Why: GDPR art. 5 + 9 — minimizzazione dei dati biometrici. Le foto
 * servono solo all'AI per estrarre i tratti, dopo l'analisi non hanno
 * motivo di esistere. Il dossier resta (è il prodotto), la foto sorgente
 * sparisce entro 24h.
 *
 * Auth: Vercel Cron invia `Authorization: Bearer ${CRON_SECRET}`.
 * Configurare CRON_SECRET nelle env vars Vercel (generare con `openssl rand -hex 32`).
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const RETENTION_HOURS = 24;
const BUCKET = "photos";

export async function GET(request: NextRequest) {
  // ── Auth: solo Vercel Cron può chiamare questo endpoint ──
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }

  if (authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Supabase admin client ──
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: "Supabase env vars missing" },
      { status: 500 }
    );
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const cutoff = Date.now() - RETENTION_HOURS * 60 * 60 * 1000;

  let deleted = 0;
  let errors = 0;
  const errorMessages: string[] = [];

  try {
    // Top-level "folders" = user.id directories
    const { data: folders, error: foldersError } = await admin.storage
      .from(BUCKET)
      .list("", { limit: 1000, sortBy: { column: "name", order: "asc" } });

    if (foldersError) {
      return NextResponse.json(
        { error: `List folders failed: ${foldersError.message}` },
        { status: 500 }
      );
    }

    for (const folder of folders ?? []) {
      // Skip files at root level (only process folders, which have id === null in Supabase storage)
      if (folder.id !== null) continue;

      const { data: files, error: filesError } = await admin.storage
        .from(BUCKET)
        .list(folder.name, { limit: 1000 });

      if (filesError) {
        errors++;
        errorMessages.push(`${folder.name}: ${filesError.message}`);
        continue;
      }

      const toDelete = (files ?? [])
        .filter((f) => f.created_at && new Date(f.created_at).getTime() < cutoff)
        .map((f) => `${folder.name}/${f.name}`);

      if (toDelete.length === 0) continue;

      const { error: removeError } = await admin.storage
        .from(BUCKET)
        .remove(toDelete);

      if (removeError) {
        errors++;
        errorMessages.push(`Remove ${folder.name}: ${removeError.message}`);
      } else {
        deleted += toDelete.length;
      }
    }

    return NextResponse.json({
      success: true,
      deleted,
      errors,
      errorMessages: errorMessages.slice(0, 10),
      retentionHours: RETENTION_HOURS,
      cutoff: new Date(cutoff).toISOString(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: `Cron failed: ${msg}`, deleted, errors },
      { status: 500 }
    );
  }
}
