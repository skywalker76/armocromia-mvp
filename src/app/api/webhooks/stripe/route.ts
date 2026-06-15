import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { waitUntil } from "@vercel/functions";
import { runDossierGenerationPipeline } from "@/lib/armocromia/pipeline";
import { type Locale, isValidLocale, defaultLocale } from "@/lib/i18n/config";
import { sendEmail } from "@/lib/emails/resend";
import { getReceiptEmailHtml } from "@/lib/emails/templates";

export const dynamic = "force-dynamic";
export const maxDuration = 600; // 10 min (Vercel Pro) — margine per il pipeline AI in waitUntil

const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY?.trim();

if (!stripeSecretKey) {
  console.error("[Stripe Webhook] Critical: STRIPE_SECRET_KEY is missing.");
}
if (!webhookSecret) {
  console.error("[Stripe Webhook] Critical: STRIPE_WEBHOOK_SECRET is missing.");
}
if (!supabaseUrl || !supabaseServiceKey) {
  console.error("[Stripe Webhook] Critical: Supabase Admin env vars missing.");
}

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16" as any,
    })
  : null;

const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

export async function POST(request: Request) {
  console.log("[Stripe Webhook] Received request.");

  if (!stripe || !webhookSecret) {
    console.error("[Stripe Webhook] Stripe or Webhook Secret not configured.");
    return NextResponse.json({ error: "Configuration error" }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    console.error("[Stripe Webhook] Missing stripe-signature header.");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error(`[Stripe Webhook] Signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  console.log(`[Stripe Webhook] Event received: ${event.type}`);

  // Gestisci solo sessioni completate con successo
  if (event.type !== "checkout.session.completed") {
    console.log(`[Stripe Webhook] Event ignored: ${event.type}`);
    return NextResponse.json({ received: true, status: "ignored" }, { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const metadata = session.metadata;

  if (!metadata) {
    console.error("[Stripe Webhook] Missing metadata in session.");
    return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
  }

  const userId = metadata.user_id;
  const dossierIdStr = metadata.dossier_id;
  const analysisMode = metadata.analysis_mode || "full";
  const localeStr = metadata.locale;

  if (!userId || !dossierIdStr) {
    console.error("[Stripe Webhook] Metadata lacks userId or dossierId:", metadata);
    return NextResponse.json({ error: "Incomplete metadata attributes" }, { status: 400 });
  }

  const dossierId = parseInt(dossierIdStr, 10);
  if (isNaN(dossierId)) {
    console.error("[Stripe Webhook] Invalid dossierId numeric format:", dossierIdStr);
    return NextResponse.json({ error: "Invalid dossier_id format" }, { status: 400 });
  }

  const locale: Locale = isValidLocale(localeStr) ? localeStr : defaultLocale;

  if (!supabaseAdmin) {
    console.error("[Stripe Webhook] Supabase admin client not initialized.");
    return NextResponse.json({ error: "Internal database configuration error" }, { status: 500 });
  }

  try {
    console.log(`[Stripe Webhook] Reconciling payment for dossier=${dossierId} user=${userId}`);

    // 1. Verifica l'esistenza del dossier ed ottieni i puntatori
    const { data: dossier, error: dossierFetchError } = await supabaseAdmin
      .from("dossiers")
      .select("user_id, original_photo_path, user_notes, status")
      .eq("id", dossierId)
      .single();

    if (dossierFetchError || !dossier) {
      console.error(`[Stripe Webhook] Dossier ${dossierId} not found:`, dossierFetchError?.message);
      return NextResponse.json({ error: "Dossier not found in DB" }, { status: 404 });
    }

    // 1.2. Ownership check
    if (dossier.user_id !== userId) {
      console.error(`[Stripe Webhook] Ownership mismatch: dossier ${dossierId} belongs to ${dossier.user_id}, but metadata.user_id=${userId}.`);
      return NextResponse.json({ error: "Dossier ownership mismatch" }, { status: 403 });
    }

    // 1.5. Idempotenza
    if (dossier.status !== "pending_payment") {
      console.log(`[Stripe Webhook] Dossier ${dossierId} already processed (status=${dossier.status}). Skip idempotente.`);
      return NextResponse.json({ received: true, status: "already_processed" }, { status: 200 });
    }

    // 2. Aggiorna lo stato del pagamento
    const paymentIntentId = String(session.payment_intent || session.id);
    const { error: paymentUpdateError } = await supabaseAdmin
      .from("payments")
      .update({
        status: "completed",
        stripe_payment_intent_id: paymentIntentId,
        updated_at: new Date().toISOString(),
      })
      .eq("dossier_id", dossierId);

    if (paymentUpdateError) {
      console.error(`[Stripe Webhook] Failed to update payment status for dossier ${dossierId}:`, paymentUpdateError.message);
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
      console.error(`[Stripe Webhook] Failed to update dossier status to processing:`, dossierUpdateError.message);
      return NextResponse.json({ error: "Dossier update failed" }, { status: 500 });
    }

    // 3.5. Invio email ricevuta
    try {
      const { data: authUserData } = await supabaseAdmin.auth.admin.getUserById(userId);
      const userEmail = authUserData?.user?.email;
      const displayName = (authUserData?.user?.user_metadata?.display_name || authUserData?.user?.user_metadata?.full_name || userEmail?.split("@")[0] || "Cliente").trim();

      if (userEmail) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.cromeastudio.com";
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
              console.error(`[Stripe Webhook] Failed to send receipt email to ${userEmail}:`, res.error);
            } else {
              console.log(`[Stripe Webhook] Receipt email successfully sent to ${userEmail}`);
            }
          })
        );
      }
    } catch (emailErr) {
      console.error("[Stripe Webhook] Non-blocking exception during user receipt email creation:", emailErr);
    }

    // 4. Innesca in background la generazione asincrona del dossier biometrico 4K
    console.log(`[Stripe Webhook] Schedulated background pipeline for dossier=${dossierId}`);

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

    console.log(`[Stripe Webhook] Payment confirmed and pipeline successfully queued for dossier ${dossierId}.`);
    return NextResponse.json({ received: true, status: "confirmed", dossierId }, { status: 200 });

  } catch (err) {
    console.error("[Stripe Webhook] Unhandled exception occurred during reconciliation:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
