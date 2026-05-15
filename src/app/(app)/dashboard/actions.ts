"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { uploadPhotoSchema } from "@/lib/armocromia/schemas";
import { classifyPhoto } from "@/lib/fal/classify";
import { generateDossierImage, type DossierMode } from "@/lib/fal/generate-dossier";
import { getPaletteBySubSeason } from "@/lib/armocromia/palettes";

/**
 * Stato ritornato dalla Server Action per feedback al client.
 *
 * Why: il pattern action-state permette al Client Component di
 * mostrare errori/progresso senza state management complesso.
 */
export type AnalyzePhotoState = {
  status: "idle" | "success" | "error";
  dossierId?: number;
  error?: string;
};

/**
 * Server Action — orchestra il flusso completo di analisi cromatica.
 *
 * Pipeline:
 * 1. Valida input (Zod)
 * 2. Crea record dossier (status: processing)
 * 3. Upload foto su Supabase Storage
 * 4. Classifica con Vision AI
 * 5. Genera dossier visivo con GPT Image 2
 * 6. Upload dossier su Supabase Storage
 * 7. Aggiorna record dossier (status: completed)
 *
 * Why: Server Action invece di API route perché:
 * - Invocazione type-safe dal client
 * - Nessun endpoint REST da gestire
 * - Automatic CSRF protection
 */
export async function analyzePhoto(
  _prevState: AnalyzePhotoState,
  formData: FormData
): Promise<AnalyzePhotoState> {
  const supabase = await createClient();

  // ── 0. Auth check ──
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", error: "Devi effettuare il login" };
  }

  // ── 1. Validazione input ──
  const rawFile = formData.get("photo");
  const rawNotes = formData.get("userNotes");
  const rawMode = formData.get("analysisMode");

  const parsed = uploadPhotoSchema.safeParse({
    file: rawFile,
    userNotes: typeof rawNotes === "string" ? rawNotes : undefined,
    analysisMode: typeof rawMode === "string" ? rawMode : undefined,
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Input non valido";
    return { status: "error", error: firstError };
  }

  const { file, userNotes, analysisMode } = parsed.data;
  let dossierId: number | undefined = undefined;

  try {
    // ── 2. Crea record dossier ──
    const { data: dossier, error: dossierError } = await supabase
      .from("dossiers")
      .insert({
        user_id: user.id,
        status: "processing",
        user_notes: userNotes || null,
      })
      .select("id")
      .single();

    if (dossierError || !dossier) {
      throw new Error(`DB insert failed: ${dossierError?.message}`);
    }

    dossierId = dossier.id;

    // ── 3. Upload foto su Supabase Storage (con retry) ──
    // Why: deriviamo l'estensione DAL MIME (già validato dal Zod schema)
    // invece che dal filename utente. Questo elimina il rischio che un
    // attacker controlli l'estensione del path (defense-in-depth oltre RLS).
    const MIME_TO_EXT: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };
    const fileExt = MIME_TO_EXT[file.type];
    if (!fileExt) {
      throw new Error(`MIME non supportato: ${file.type}`);
    }
    const photoPath = `${user.id}/${dossierId}.${fileExt}`;

    // Converti File in ArrayBuffer per upload affidabile
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    let uploadError: Error | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const { error } = await supabase.storage
        .from("photos")
        .upload(photoPath, fileBuffer, {
          contentType: file.type,
          upsert: true,
        });

      if (!error) {
        uploadError = null;
        break;
      }
      console.warn(`[analyzePhoto] Upload attempt ${attempt}/3 failed:`, error.message);
      uploadError = new Error(error.message);
      if (attempt < 3) await new Promise(r => setTimeout(r, attempt * 2000));
    }

    if (uploadError) {
      throw new Error(`Storage upload failed after 3 attempts: ${uploadError.message}`);
    }

    // Aggiorna path nel record
    await supabase
      .from("dossiers")
      .update({ original_photo_path: photoPath })
      .eq("id", dossierId);

    // Genera signed URL per Vision AI (valido 1 ora)
    const { data: signedUrl } = await supabase.storage
      .from("photos")
      .createSignedUrl(photoPath, 3600);

    if (!signedUrl?.signedUrl) {
      throw new Error("Failed to generate signed URL for photo");
    }

    // ── 4. Classifica con Vision AI ──
    const classification = await classifyPhoto(
      signedUrl.signedUrl,
      userNotes || undefined
    );

    // Aggiorna dossier con risultato classificazione
    await supabase
      .from("dossiers")
      .update({
        status: "generating",
        classified_season: classification.subSeason,
        classification_result: classification,
      })
      .eq("id", dossierId);

    // ── 5. Genera dossier visivo con GPT Image 2 ──
    const palette = getPaletteBySubSeason(classification.subSeason);
    const dossierImageUrl = await generateDossierImage(palette, classification, signedUrl.signedUrl, analysisMode as DossierMode);

    // ── 6. Scarica e upload dossier su Supabase Storage (con retry) ──
    const dossierResponse = await fetch(dossierImageUrl);
    if (!dossierResponse.ok) {
      throw new Error("Failed to download generated dossier image");
    }
    const dossierBuffer = Buffer.from(await dossierResponse.arrayBuffer());
    const dossierPath = `${user.id}/${dossierId}.png`;

    let dossierUploadError: Error | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const { error } = await supabase.storage
        .from("dossiers")
        .upload(dossierPath, dossierBuffer, {
          contentType: "image/png",
          upsert: true,
        });

      if (!error) {
        dossierUploadError = null;
        break;
      }
      console.warn(`[analyzePhoto] Dossier upload attempt ${attempt}/3 failed:`, error.message);
      dossierUploadError = new Error(error.message);
      if (attempt < 3) await new Promise(r => setTimeout(r, attempt * 2000));
    }

    if (dossierUploadError) {
      throw new Error(
        `Dossier storage upload failed after 3 attempts: ${dossierUploadError.message}`
      );
    }

    // ── 7. Aggiorna dossier → completed ──
    await supabase
      .from("dossiers")
      .update({
        status: "completed",
        generated_dossier_path: dossierPath,
      })
      .eq("id", dossierId);

    return { status: "success", dossierId };
  } catch (err) {
    console.error("[analyzePhoto] Pipeline failed:", err);

    // Segna il dossier come fallito se esiste
    if (dossierId) {
      await supabase
        .from("dossiers")
        .update({ status: "failed" })
        .eq("id", dossierId);
    }

    const rawMessage = err instanceof Error ? err.message : "";
    const lower = rawMessage.toLowerCase();

    // Why: @fal-ai/client lancia Error con .message === "Forbidden" (status HTTP
    // grezzo) quando il credito fal.ai è esaurito, la API key è revocata, o il
    // modello non è accessibile. Mostrare "Forbidden" all'utente finale è
    // imbarazzante — mappiamo a un messaggio comprensibile.
    let userMessage: string;
    if (lower === "forbidden" || lower.includes("403")) {
      userMessage =
        "Il servizio di analisi AI è momentaneamente non disponibile. Riprova tra qualche minuto.";
    } else if (lower.includes("429") || lower.includes("rate limit")) {
      userMessage = "Troppe richieste in corso. Attendi qualche istante e riprova.";
    } else if (rawMessage) {
      userMessage = rawMessage;
    } else {
      userMessage = "Si è verificato un errore durante l'analisi. Riprova.";
    }

    return {
      status: "error",
      dossierId,
      error: userMessage,
    };
  }
}

/**
 * Server Action — elimina un dossier con tutti i file associati.
 *
 * Pipeline:
 * 1. Verifica auth
 * 2. Verifica ownership (user_id match)
 * 3. Elimina file da photos bucket
 * 4. Elimina file da dossiers bucket
 * 5. Elimina record DB
 * 6. Revalida la dashboard
 */
export async function deleteDossier(dossierId: number): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non autenticato" };
  }

  try {
    // Fetch dossier to get file paths + verify ownership
    const { data: dossier, error: fetchError } = await supabase
      .from("dossiers")
      .select("id, user_id, original_photo_path, generated_dossier_path")
      .eq("id", dossierId)
      .single();

    if (fetchError || !dossier) {
      return { success: false, error: "Dossier non trovato" };
    }

    if (dossier.user_id !== user.id) {
      return { success: false, error: "Non autorizzato" };
    }

    // Delete files from Storage (best-effort, don't fail if missing)
    const filesToDelete: Array<{ bucket: string; path: string }> = [];
    if (dossier.original_photo_path) {
      filesToDelete.push({ bucket: "photos", path: dossier.original_photo_path });
    }
    if (dossier.generated_dossier_path) {
      filesToDelete.push({ bucket: "dossiers", path: dossier.generated_dossier_path });
    }

    for (const file of filesToDelete) {
      const { error } = await supabase.storage.from(file.bucket).remove([file.path]);
      if (error) {
        console.warn(`[deleteDossier] Failed to delete ${file.bucket}/${file.path}:`, error.message);
      }
    }

    // Delete DB record
    const { error: deleteError } = await supabase
      .from("dossiers")
      .delete()
      .eq("id", dossierId);

    if (deleteError) {
      throw new Error(`DB delete failed: ${deleteError.message}`);
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    console.error("[deleteDossier] Failed:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Errore durante l'eliminazione",
    };
  }
}

