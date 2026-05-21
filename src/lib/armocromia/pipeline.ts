import { createAdminClient } from "@/lib/supabase/admin";
import { classifyPhoto } from "@/lib/fal/classify";
import { generateDossierImage, type DossierMode } from "@/lib/fal/generate-dossier";
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

    // ── 2. Classifica con Vision AI ──
    console.log(`[Pipeline Background] Classificazione foto con Vision AI per dossier=${dossierId}...`);
    const classification = await classifyPhoto(
      signedUrl.signedUrl,
      userNotes || undefined,
      locale
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

    // ── 3. Genera dossier visivo con GPT Image 2 ──
    console.log(`[Pipeline Background] Generazione infografica 4K per dossier=${dossierId} (stagione=${classification.subSeason})...`);
    const palette = getPaletteBySubSeason(classification.subSeason);
    const dossierImageUrl = await generateDossierImage(
      palette,
      classification,
      signedUrl.signedUrl,
      analysisMode as DossierMode,
      locale
    );

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
        
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://armocromia-mvp.vercel.app";
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
