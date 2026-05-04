"use server";

import { createClient } from "@/lib/supabase/server";
import { uploadPhotoSchema } from "@/lib/armocromia/schemas";
import { classifyPhoto } from "@/lib/fal/classify";
import { generateDossierImage } from "@/lib/fal/generate-dossier";
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

  const parsed = uploadPhotoSchema.safeParse({
    file: rawFile,
    userNotes: typeof rawNotes === "string" ? rawNotes : undefined,
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Input non valido";
    return { status: "error", error: firstError };
  }

  const { file, userNotes } = parsed.data;
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

    // ── 3. Upload foto su Supabase Storage ──
    const fileExt = file.name.split(".").pop() ?? "jpg";
    const photoPath = `${user.id}/${dossierId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("photos")
      .upload(photoPath, file, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
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
    const dossierImageUrl = await generateDossierImage(palette, classification);

    // ── 6. Scarica e upload dossier su Supabase Storage ──
    const dossierResponse = await fetch(dossierImageUrl);
    if (!dossierResponse.ok) {
      throw new Error("Failed to download generated dossier image");
    }
    const dossierBlob = await dossierResponse.blob();
    const dossierPath = `${user.id}/${dossierId}.webp`;

    const { error: dossierUploadError } = await supabase.storage
      .from("dossiers")
      .upload(dossierPath, dossierBlob, {
        contentType: "image/webp",
        upsert: true,
      });

    if (dossierUploadError) {
      throw new Error(
        `Dossier storage upload failed: ${dossierUploadError.message}`
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

    const message =
      err instanceof Error ? err.message : "Errore durante l'analisi";

    return {
      status: "error",
      dossierId,
      error: message,
    };
  }
}
