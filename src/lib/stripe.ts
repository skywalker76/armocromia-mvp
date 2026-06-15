import "server-only";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();

if (!stripeSecretKey) {
  console.warn("[Stripe] Warning: STRIPE_SECRET_KEY is not defined.");
}

// Inizializza Stripe con la chiave segreta.
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16" as any,
}) : null;

interface CreateStripeCheckoutParams {
  dossierId: number;
  userId: string;
  userEmail: string;
  analysisMode: string;
  locale: string;
}

/**
 * Crea una sessione di checkout su Stripe e restituisce la URL di redirect.
 * Passa i metadati dell'utente e del dossier come metadata della sessione.
 */
export async function createStripeCheckoutSession({
  dossierId,
  userId,
  userEmail,
  analysisMode,
  locale,
}: CreateStripeCheckoutParams): Promise<string> {
  if (!stripe) {
    throw new Error("Stripe client is not initialized. Check STRIPE_SECRET_KEY.");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.cromeastudio.com";
  const successUrl = `${siteUrl}/${locale}/dashboard?payment_success=true&dossier_id=${dossierId}`;
  const cancelUrl = `${siteUrl}/${locale}/dashboard`;

  console.log(`[Stripe] Creating checkout for user=${userId} dossier=${dossierId}`);

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Cromea Studio - Analisi Cromatica",
              description: "Dossier di analisi stagionale personalizzato 4K con palette, guardaroba e lookbook.",
            },
            unit_amount: 2900, // €29.00 in centesimi
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        user_id: userId,
        dossier_id: String(dossierId),
        analysis_mode: analysisMode,
        locale: locale,
      },
      customer_email: userEmail || undefined,
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    if (!session.url) {
      throw new Error("Stripe session URL is null");
    }

    return session.url;
  } catch (err) {
    console.error("[Stripe] Checkout Session creation failed:", err);
    throw err;
  }
}
