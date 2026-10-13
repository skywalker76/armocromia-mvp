import { createAdminClient } from "@/lib/supabase/admin";
import { classifyPhoto } from "@/lib/fal/classify";
import {
  generateDossierImage,
  verifyDossierImageQuality,
  type DossierMode,
} from "@/lib/fal/generate-dossier";
import { getPaletteBySubSeason } from "@/lib/armocromia/palettes";
import { type Locale } from "@/lib/i18n/config";
import { sendEmail } from "@/lib/emails/resend";
import {
  getDossierReadyEmailHtml,
  getAdminErrorEmailHtml,
  PALETTE_DISPLAY_BY_LOCALE,
  MACRO_SEASON_BY_LOCALE,
  getMacroSeason,
} from "@/lib/emails/templates";

const LOW_CONFIDENCE_MESSAGES: Record<Locale, string> = {
  it: "La foto caricata non permette un'analisi armocromatica affidabile (illuminazione insufficiente, filtri pesanti o volto non chiaramente visibile). Carica una foto a colori con luce naturale e viso ben visibile.",
  en: "The uploaded photo does not allow a reliable color analysis (insufficient lighting, heavy filters, or face not clearly visible). Please upload a color photo in natural daylight with your face clearly visible.",
  es: "La foto subida no permite un análisis de colorimetría fiable (iluminación insuficiente, filtros intensos o rostro no claramente visible). Sube una foto en color con luz natural y el rostro bien visible.",
};

/**
 * Pipeline condivisa di classificazione AI e generazione dossier.
 *
 * Why: questa logica viene invocata in background sia dalla Server Action di
 * verifica del pagamento (immediata al redirect) sia dall'API webhook di Stripe
 * (paracadute asincrono). Eseguire la pipeline con createAdminClient garantisce
 * type-safety ed immunità da cookie di sessione scaduti in background.
 */
export async function runDossierGenerationPipeline({
  dossierId,
  userId,
  photoPath,
  userNotes,
  analysisMode,
  locale,
}: {
  dossierId: number;
  userId: string;
  photoPath: string;
  userNotes: string | null;
  analysisMode: string;
  locale: Locale;
}) {
  const supabase = createAdminClient();
  console.log(`[Pipeline Background] Avvio pipeline AI per dossier=${dossierId} utente=${userId}`);

  try {
    // ── 1. Genera signed URL per la foto originale (valido 1 ora) ──
    const { data: signedUrl } = await supabase.storage
      .from("photos")
      .createSignedUrl(photoPath, 3600);

    if (!signedUrl?.signedUrl) {
      throw new Error("Failed to generate signed URL for photo");
    }

    // ── 2. Classifica con Vision AI (AI-1, AI-3, AI-5) ──
    console.log(`[Pipeline Background] Classificazione foto con Vision AI per dossier=${dossierId}...`);
    const classification = await classifyPhoto(
      signedUrl.signedUrl,
      userNotes || undefined,
      locale
    );

    // Salva subito il risultato diagnostico nel DB
    await supabase
      .from("dossiers")
      .update({
        status: "generating",
        classified_season: classification.subSeason,
        classification_result: classification,
      })
      .eq("id", dossierId);

    // ── 2b. Gate qualità foto e confidenza (AI-3) ──
    if (classification.confidence < 0.45) {
      const issuesDetail =
        classification.photoQualityIssues && classification.photoQualityIssues.length > 0
          ? ` (${classification.photoQualityIssues.join(", ")})`
          : "";
      throw new Error(
        `${LOW_CONFIDENCE_MESSAGES[locale] || LOW_CONFIDENCE_MESSAGES.it}${issuesDetail}`
      );
    }

    if (classification.photoQuality === "poor" || classification.confidence < 0.65) {
      console.warn(
        `[Pipeline Background] Attenzione per dossier=${dossierId}: photoQuality=${classification.photoQuality ?? "n/a"}, confidence=${classification.confidence}. Issues: ${(classification.photoQualityIssues ?? []).join("; ") || "nessuna"}`
      );
    }

    // ── 3. Genera dossier visivo con GPT Image 2 + Post-Gen Vision QA (AI-2, AI-4) ──
    console.log(`[Pipeline Background] Generazione infografica 4K per dossier=${dossierId} (stagione=${classification.subSeason})...`);
    const palette = getPaletteBySubSeason(classification.subSeason);
    const mode = analysisMode as DossierMode;

    let dossierImageUrl = await generateDossierImage(
      palette,
      classification,
      signedUrl.signedUrl,
      mode,
      locale
    );

    const qaResult = await verifyDossierImageQuality(
      dossierImageUrl,
      signedUrl.signedUrl,
      mode
    );

    if (!qaResult.passed) {
      console.warn(
        `[Pipeline Background] Vision QA non superato per dossier=${dossierId} (score=${qaResult.score}, reason: ${qaResult.reason ?? "n/a"}). Rigenerazione automatica (tentativo 2/2)...`
      );
      dossierImageUrl = await generateDossierImage(
        palette,
        classification,
        signedUrl.signedUrl,
        mode,
        locale
      );
    } else {
      console.log(
        `[Pipeline Background] Vision QA superato al primo tentativo per dossier=${dossierId} (score=${qaResult.score})`
      );
    }

    // ── 4. Scarica e upload dossier su Supabase Storage (con retry) ──
    console.log(`[Pipeline Background] Download dossier generato per dossier=${dossierId} da fal.ai...`);
    const dossierResponse = await fetch(dossierImageUrl);
    if (!dossierResponse.ok) {
      throw new Error("Failed to download generated dossier image from fal.ai");
    }
    const dossierBuffer = Buffer.from(await dossierResponse.arrayBuffer());
    const dossierPath = `${userId}/${dossierId}.png`;

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
      console.warn(`[Pipeline Background] Dossier upload attempt ${attempt}/3 failed:`, error.message);
      dossierUploadError = new Error(error.message);
      if (attempt < 3) await new Promise(r => setTimeout(r, attempt * 2000));
    }

    if (dossierUploadError) {
      throw new Error(
        `Dossier storage upload failed after 3 attempts: ${dossierUploadError.message}`
      );
    }

    // ── 5. Aggiorna dossier → completed ──
    console.log(`[Pipeline Background] Completamento con successo per dossier=${dossierId}`);
    await supabase
      .from("dossiers")
      .update({
        status: "completed",
        generated_dossier_path: dossierPath,
        error_message: null, // Reset di eventuali errori da tentativi precedenti o watchdog
      })
      .eq("id", dossierId);

    // ── 6. Invia notifica email all'utente ──
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      const userEmail = userData?.user?.email;
      const userFullName = userData?.user?.user_metadata?.full_name || userEmail?.split("@")[0] || "Ospite";

      if (userEmail) {
        const seasonName = PALETTE_DISPLAY_BY_LOCALE[locale][classification.subSeason] || classification.subSeason;
        const macroKey = getMacroSeason(classification.subSeason);
        const seasonGroup = MACRO_SEASON_BY_LOCALE[locale][macroKey] || macroKey;
        
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.cromeastudio.com";
        const dossierUrl = `${siteUrl}/${locale}/dashboard`;

        const emailContent = getDossierReadyEmailHtml({
          userName: userFullName,
          seasonName,
          seasonGroup,
          dossierUrl,
          locale,
        });

        await sendEmail({
          to: userEmail,
          subject: emailContent.subject,
          html: emailContent.html,
        });
      }
    } catch (emailErr) {
      console.error(`[Pipeline Background] Errore non-bloccante invio email utente per dossier=${dossierId}:`, emailErr);
    }

  } catch (err) {
    console.error(`[Pipeline Background] Errore critico per dossier=${dossierId}:`, err);
    
    // Segna il dossier come fallito salvando l'errore reale
    await supabase
      .from("dossiers")
      .update({
        status: "failed",
        error_message: err instanceof Error ? err.message : String(err),
      })
      .eq("id", dossierId);

    // ── 7. Invia notifica di errore all'admin ──
    try {
      const adminEmails = process.env.ADMIN_EMAILS || "gamatig@gmail.com";
      const list = adminEmails.split(",").map((e) => e.trim());
      
      for (const adminEmail of list) {
        if (!adminEmail) continue;

        const errorContent = getAdminErrorEmailHtml({
          dossierId,
          userId,
          errorMessage: err instanceof Error ? err.message : String(err),
          errorStack: err instanceof Error ? err.stack : undefined,
          createdAt: new Date().toISOString(),
        });

        await sendEmail({
          to: adminEmail,
          subject: errorContent.subject,
          html: errorContent.html,
        });
      }
    } catch (adminEmailErr) {
      console.error(`[Pipeline Background] Errore non-bloccante invio email errore admin per dossier=${dossierId}:`, adminEmailErr);
    }
  }
}
