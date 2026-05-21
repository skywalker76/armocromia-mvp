"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { uploadPhotoSchema } from "@/lib/armocromia/schemas";
import { getTranslations } from "@/lib/i18n/server";
import { isValidLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { waitUntil } from "@vercel/functions";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { runDossierGenerationPipeline } from "@/lib/armocromia/pipeline";

/**
 * Stato ritornato dalla Server Action per feedback al client.
 *
 * Why: il pattern action-state permette al Client Component di
 * mostrare errori/progresso senza state management complesso.
 */
export type AnalyzePhotoState = {
  status: "idle" | "success" | "error";
  dossierId?: number;
  checkoutUrl?: string;
  error?: string;
};

/**
 * Server Action — orchestra il flusso completo di analisi cromatica.
 *
 * Pipeline:
 * 1. Valida input (Zod)
 * 2. Crea record dossier (status: pending_payment)
 * 3. Upload foto su Supabase Storage
 * 4. Crea sessione Stripe Checkout
 * 5. Registra record in payments (status: pending)
 * 6. Ritorna URL di Stripe Checkout per redirect client
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

  // ── Locale del client (per AI prompt + error messages) ──
  const rawLocale = formData.get("locale");
  const locale: Locale =
    typeof rawLocale === "string" && isValidLocale(rawLocale)
      ? rawLocale
      : defaultLocale;
  const { t: tErr } = await getTranslations(locale, "app.errors");
  const { t: tValidation } = await getTranslations(locale, "app.uploadValidation");

  // ── 0. Auth check ──
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", error: tErr("notAuthenticated") };
  }

  // ── 1. Validazione input ──
  const rawFile = formData.get("photo");
  const rawNotes = formData.get("userNotes");
  const rawMode = formData.get("analysisMode");

  // Log file metadata per diagnostica mobile (visibile nei Vercel logs).
  // Why: senza questo è impossibile distinguere HEIC iPhone da PNG corrotto da
  // file truncato da rete instabile. Niente PII, solo type/size/name.
  if (rawFile instanceof File) {
    console.log(
      `[analyzePhoto] incoming file user=${user.id} type=${rawFile.type} size=${rawFile.size} name=${rawFile.name}`
    );
  } else {
    console.warn(`[analyzePhoto] photo field non è un File: ${typeof rawFile}`);
  }

  // Pre-check HEIC iPhone PRIMA di Zod: Safari iOS spesso invia image/heic o
  // image/heif quando il sistema non ha convertito automaticamente. Il messaggio
  // generico "formato non supportato" non aiuta — diamo istruzioni iPhone-specifiche.
  if (rawFile instanceof File) {
    const t = rawFile.type.toLowerCase();
    const n = rawFile.name.toLowerCase();
    const isHeic =
      t === "image/heic" ||
      t === "image/heif" ||
      t === "image/heic-sequence" ||
      t === "image/heif-sequence" ||
      n.endsWith(".heic") ||
      n.endsWith(".heif");
    if (isHeic) {
      return { status: "error", error: tValidation("heicNotSupported") };
    }
  }

  const parsed = uploadPhotoSchema.safeParse({
    file: rawFile,
    userNotes: typeof rawNotes === "string" ? rawNotes : undefined,
    analysisMode: typeof rawMode === "string" ? rawMode : undefined,
  });

  if (!parsed.success) {
    // Le issues di Zod contengono ora CHIAVI (es. "selectPhoto"); le traduciamo
    // tramite il namespace app.uploadValidation.* — fallback al messaggio raw
    // se per qualche motivo non corrisponde a una chiave nota.
    const firstIssue = parsed.error.issues[0];
    const errorKey = firstIssue?.message ?? "invalidInput";
    const translated = tValidation(errorKey);
    return {
      status: "error",
      error: translated === errorKey ? tErr("invalidInput") : translated,
    };
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

    if (dossierId === undefined) {
      throw new Error("Dossier ID mancante per la generazione");
    }

    // ── 4-7. Task in background (non bloccante) ──
    waitUntil(
      runDossierGenerationPipeline({
        dossierId,
        userId: user.id,
        photoPath,
        userNotes: userNotes || null,
        analysisMode,
        locale,
      })
    );

    // Ritorna immediatamente: la UI è libera, il dossier è in coda.
    return { status: "success", dossierId };
  } catch (err) {
    console.error("[analyzePhoto] Upload/Init failed:", err);

    // Segna il dossier come fallito se esiste
    if (dossierId) {
      await supabase
        .from("dossiers")
        .update({ 
          status: "failed",
          error_message: err instanceof Error ? err.message : String(err)
        })
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
      userMessage = tErr("aiUnavailable");
    } else if (lower.includes("429") || lower.includes("rate limit")) {
      userMessage = tErr("rateLimit");
    } else if (rawMessage) {
      userMessage = rawMessage;
    } else {
      userMessage = tErr("genericPipeline");
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
export async function deleteDossier(
  dossierId: number,
  clientLocale?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const locale: Locale =
    typeof clientLocale === "string" && isValidLocale(clientLocale)
      ? clientLocale
      : defaultLocale;
  const { t: tErr } = await getTranslations(locale, "app.errors");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: tErr("notAuthenticated") };
  }

  try {
    // Fetch dossier to get file paths + verify ownership
    const { data: dossier, error: fetchError } = await supabase
      .from("dossiers")
      .select("id, user_id, original_photo_path, generated_dossier_path")
      .eq("id", dossierId)
      .single();

    if (fetchError || !dossier) {
      return { success: false, error: tErr("dossierNotFound") };
    }

    if (dossier.user_id !== user.id) {
      return { success: false, error: tErr("notAuthorized") };
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

    // Why: passa per [lang] perché la dashboard ora vive sotto /<locale>/dashboard.
    // Il secondo argomento "page" invalida tutte le varianti di locale in una shot.
    revalidatePath("/[lang]/dashboard", "page");
    return { success: true };
  } catch (err) {
    console.error("[deleteDossier] Failed:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : tErr("deleteGeneric"),
    };
  }
}

/**
 * Server Action — verifica lo stato di un dossier specifico per il polling client-side.
 *
 * Why: le Server Actions usano POST, non risentono del caching di rete/Next.js,
 * e trasmettono in modo affidabile i cookie di autenticazione dell'utente su Vercel.
 */
export async function checkDossierStatus(
  dossierId: number | "latest"
): Promise<{ id?: number; status: string; error_message?: string | null } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  let dossier;
  if (dossierId === "latest") {
    const { data } = await supabase
      .from("dossiers")
      .select("id, status, error_message")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    dossier = data;
  } else {
    const { data } = await supabase
      .from("dossiers")
      .select("id, status, error_message")
      .eq("id", dossierId)
      .eq("user_id", user.id)
      .maybeSingle();
    dossier = data;
  }

  if (!dossier) {
    return null;
  }

  return {
    id: dossier.id,
    status: dossier.status,
    error_message: dossier.error_message,
  };
}

/**
 * Server Action — verifica se l'utente autenticato corrente è un amministratore.
 *
 * Why: questa azione POST sicura e non cacheabile viene utilizzata al mount
 * della NavBar client-side per aggirare qualsiasi caching del layout in produzione.
 */
export async function checkAdminStatus(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return false;
  }

  const { isAdmin } = await import("@/lib/admin");
  return isAdmin(user.email);
}



