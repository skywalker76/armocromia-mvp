import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { waitUntil } from "@vercel/functions";
import { runDossierGenerationPipeline } from "@/lib/armocromia/pipeline";
import { type Locale, isValidLocale, defaultLocale } from "@/lib/i18n/config";
import { sendEmail } from "@/lib/emails/resend";
import { getReceiptEmailHtml } from "@/lib/emails/templates";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minuti max execution duration per background pipeline AI in waitUntil

const webhookSecret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET?.trim();

// Inizializza client Supabase Admin con privilegi service_role per bypassare le policy RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY?.trim(); // service_role key

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("[LemonSqueezy Webhook] Critical: Supabase Admin env vars missing.");
}

const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

function verifySignature(rawBody: string, signature: string | null): boolean {
  if (!webhookSecret || !signature) {
    console.error("[LemonSqueezy Webhook] Missing signature or secret for verification.");
    return false;
  }
  try {
    const hmac = crypto.createHmac("sha256", webhookSecret);
    const digest = hmac.update(rawBody).digest("hex");

    const digestBuffer = Buffer.from(digest, "hex");
    const signatureBuffer = Buffer.from(signature, "hex");

    if (digestBuffer.length !== signatureBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(digestBuffer, signatureBuffer);
  } catch (err) {
    console.error("[LemonSqueezy Webhook] Signature verification failed:", err);
    return false;
  }
}

export async function POST(request: Request) {
  console.log("[LemonSqueezy Webhook] Received post event request.");

  // Recupera il corpo raw del request
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  // Valida la firma HMAC
  if (!verifySignature(rawBody, signature)) {
    console.error("[LemonSqueezy Webhook] Unauthorized request. Invalid signature.");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Parsifica il payload JSON
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (err) {
    console.error("[LemonSqueezy Webhook] Failed to parse JSON body:", err);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = payload.meta?.event_name;
  console.log(`[LemonSqueezy Webhook] Event received: ${eventName}`);

  // Gestisci solo ordini completati con successo (order_created)
  if (eventName !== "order_created") {
    console.log(`[LemonSqueezy Webhook] Event ignored: ${eventName}`);
    return NextResponse.json({ received: true, status: "ignored" }, { status: 200 });
  }

  // Estrai i metadati custom passati in checkout
  const customData = payload.meta?.custom_data;
  if (!customData) {
    console.error("[LemonSqueezy Webhook] Missing custom_data in request payload.");
    return NextResponse.json({ error: "Missing custom_data" }, { status: 400 });
  }

  const userId = customData.user_id;
  const dossierIdStr = customData.dossier_id;
  const analysisMode = customData.analysis_mode || "full";
  const localeStr = customData.locale;

  if (!userId || !dossierIdStr) {
    console.error("[LemonSqueezy Webhook] Custom data lacks userId or dossierId:", customData);
    return NextResponse.json({ error: "Incomplete custom_data attributes" }, { status: 400 });
  }

  const dossierId = parseInt(dossierIdStr, 10);
  if (isNaN(dossierId)) {
    console.error("[LemonSqueezy Webhook] Invalid dossierId numeric format:", dossierIdStr);
    return NextResponse.json({ error: "Invalid dossier_id format" }, { status: 400 });
  }

  const locale: Locale = isValidLocale(localeStr) ? localeStr : defaultLocale;

  if (!supabaseAdmin) {
    console.error("[LemonSqueezy Webhook] Supabase admin client not initialized.");
    return NextResponse.json({ error: "Internal database configuration error" }, { status: 500 });
  }

  try {
    console.log(`[LemonSqueezy Webhook] Reconciling payment for dossier=${dossierId} user=${userId}`);

    // 1. Verifica l'esistenza del dossier ed ottieni i puntatori
    const { data: dossier, error: dossierFetchError } = await supabaseAdmin
      .from("dossiers")
      .select("original_photo_path, user_notes")
      .eq("id", dossierId)
      .single();

    if (dossierFetchError || !dossier) {
      console.error(`[LemonSqueezy Webhook] Dossier ${dossierId} not found:`, dossierFetchError?.message);
      return NextResponse.json({ error: "Dossier not found in DB" }, { status: 404 });
    }

    // 2. Aggiorna lo stato del pagamento
    const orderId = String(payload.data?.id || "");
    const { error: paymentUpdateError } = await supabaseAdmin
      .from("payments")
      .update({
        status: "completed",
        stripe_payment_intent_id: orderId, // Memorizziamo l'ID ordine qui
        updated_at: new Date().toISOString(),
      })
      .eq("dossier_id", dossierId);

    if (paymentUpdateError) {
      console.error(`[LemonSqueezy Webhook] Failed to update payment status for dossier ${dossierId}:`, paymentUpdateError.message);
      return NextResponse.json({ error: "Payment update failed" }, { status: 500 });
    }

    // 3. Aggiorna lo stato del dossier a 'processing'
    const { error: dossierUpdateError } = await supabaseAdmin
      .from("dossiers")
      .update({
        status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", dossierId);

    if (dossierUpdateError) {
      console.error(`[LemonSqueezy Webhook] Failed to update dossier status to processing:`, dossierUpdateError.message);
      return NextResponse.json({ error: "Dossier update failed" }, { status: 500 });
    }

    // 3.5. Recupera l'email e i metadati dell'utente da Supabase Auth Admin per inviare la ricevuta
    try {
      const { data: authUserData } = await supabaseAdmin.auth.admin.getUserById(userId);
      const userEmail = authUserData?.user?.email;
      const displayName = (authUserData?.user?.user_metadata?.display_name || authUserData?.user?.user_metadata?.full_name || userEmail?.split("@")[0] || "Cliente").trim();

      if (userEmail) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://armocromia-mvp-tan.vercel.app";
        const dossierUrl = `${siteUrl}/${locale}/dashboard`;
        const { subject, html } = getReceiptEmailHtml({
          userName: displayName,
          dossierId,
          amount: "€29,00",
          dossierUrl,
          locale,
        });

        waitUntil(
          sendEmail({
            to: userEmail,
            subject,
            html,
          }).then((res) => {
            if (!res.success) {
              console.error(`[LemonSqueezy Webhook] Failed to send receipt email to ${userEmail}:`, res.error);
            } else {
              console.log(`[LemonSqueezy Webhook] Receipt email successfully sent to ${userEmail}`);
            }
          })
        );
      }
    } catch (emailErr) {
      console.error("[LemonSqueezy Webhook] Non-blocking exception during user receipt email creation:", emailErr);
    }

    // 4. Innesca in background la generazione asincrona del dossier biometrico 4K
    console.log(`[LemonSqueezy Webhook] Schedulated background pipeline for dossier=${dossierId}`);

    waitUntil(
      runDossierGenerationPipeline({
        dossierId,
        userId,
        photoPath: dossier.original_photo_path || "",
        userNotes: dossier.user_notes,
        analysisMode,
        locale,
      })
    );

    console.log(`[LemonSqueezy Webhook] Payment confirmed and pipeline successfully queued for dossier ${dossierId}.`);
    return NextResponse.json({ received: true, status: "confirmed", dossierId }, { status: 200 });

  } catch (err) {
    console.error("[LemonSqueezy Webhook] Unhandled exception occurred during reconciliation:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
