import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/cron/delete-old-photos
 *
 * Cron job giornaliero/orario che cancella dal bucket `photos`
 * tutte le foto utente originali più vecchie di 24h e anonimizza il DB.
 *
 * Why: GDPR art. 5 + 9 — minimizzazione dei dati biometrici sensibili. Le foto
 * originali servono solo all'AI per estrarre i tratti e generare il dossier.
 * Dopo l'analisi, la foto sorgente sparisce entro 24h. Il dossier resta (è il prodotto).
 *
 * Auth: Vercel Cron invia `Authorization: Bearer ${CRON_SECRET}`.
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
  const cutoffISO = new Date(cutoff).toISOString();

  let dbCleared = 0;
  let filesDeleted = 0;
  let errors = 0;
  const errorMessages: string[] = [];

  try {
    // ── 1. Database-driven Cleanup & Anonymization (GDPR) ──
    // Selezioniamo i dossier con foto caricata creata da oltre 24 ore
    const { data: dossiers, error: dbError } = await admin
      .from("dossiers")
      .select("id, original_photo_path")
      .lt("created_at", cutoffISO)
      .not("original_photo_path", "is", null);

    if (dbError) {
      errors++;
      errorMessages.push(`DB Query dossiers failed: ${dbError.message}`);
    } else if (dossiers && dossiers.length > 0) {
      const pathsToDelete = dossiers
        .map((d) => d.original_photo_path)
        .filter((path): path is string => !!path);

      if (pathsToDelete.length > 0) {
        // Rimuoviamo fisicamente dal bucket "photos"
        const { data: removedFiles, error: removeError } = await admin.storage
          .from(BUCKET)
          .remove(pathsToDelete);

        if (removeError) {
          errors++;
          errorMessages.push(`Storage batch remove failed: ${removeError.message}`);
        } else {
          filesDeleted += removedFiles?.length ?? 0;
        }

        // Anonimizzazione in database: impostiamo original_photo_path a null
        const { error: updateError } = await admin
          .from("dossiers")
          .update({ original_photo_path: null })
          .in("id", dossiers.map((d) => d.id));

        if (updateError) {
          errors++;
          errorMessages.push(`DB Anonymization update failed: ${updateError.message}`);
        } else {
          dbCleared += dossiers.length;
        }
      }
    }

    // ── 2. Orphaned Storage Cleanup (Fallback di Sicurezza) ──
    // Identifichiamo e puliamo eventuali file in storage rimasti orfani (es. upload falliti, bozze non salvate)
    const { data: folders, error: foldersError } = await admin.storage
      .from(BUCKET)
      .list("", { limit: 1000, sortBy: { column: "name", order: "asc" } });

    if (foldersError) {
      errors++;
      errorMessages.push(`Storage list folders failed: ${foldersError.message}`);
    } else if (folders) {
      for (const folder of folders) {
        // Saltiamo i file alla root, processiamo solo le cartelle degli utenti (id === null)
        if (folder.id !== null) continue;

        const { data: files, error: filesError } = await admin.storage
          .from(BUCKET)
          .list(folder.name, { limit: 1000 });

        if (filesError) {
          errors++;
          errorMessages.push(`Storage list files for folder ${folder.name} failed: ${filesError.message}`);
          continue;
        }

        const orphanPaths = (files ?? [])
          .filter((f) => f.created_at && new Date(f.created_at).getTime() < cutoff)
          .map((f) => `${folder.name}/${f.name}`);

        if (orphanPaths.length > 0) {
          const { data: removedOrphans, error: orphanRemoveError } = await admin.storage
            .from(BUCKET)
            .remove(orphanPaths);

          if (orphanRemoveError) {
            errors++;
            errorMessages.push(`Storage remove orphans in ${folder.name} failed: ${orphanRemoveError.message}`);
          } else {
            filesDeleted += removedOrphans?.length ?? 0;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      dbCleared,
      filesDeleted,
      errors,
      errorMessages: errorMessages.slice(0, 10),
      retentionHours: RETENTION_HOURS,
      cutoff: cutoffISO,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: `Cron execution crashed: ${msg}`, dbCleared, filesDeleted, errors },
      { status: 500 }
    );
  }
}
