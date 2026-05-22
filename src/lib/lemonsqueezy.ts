import "server-only";

/**
 * Helper REST nativo ed estremamente leggero per interagire con le API di Lemon Squeezy
 * in linea con la filosofia anti-slop del progetto (nessuna dipendenza da SDK pesanti).
 *
 * "server-only" garantisce che Turbopack/webpack NON includa mai questo modulo
 * in bundle client-side, dove process.env (server vars) sarebbe undefined.
 */

if (!process.env.LEMON_SQUEEZY_API_KEY) {
  console.warn("[LemonSqueezy] Warning: LEMON_SQUEEZY_API_KEY is not defined.");
}

interface CreateCheckoutParams {
  dossierId: number;
  userId: string;
  userEmail: string;
  analysisMode: string;
  locale: string;
  userName?: string;
}

/**
 * Crea una sessione di checkout su Lemon Squeezy e restituisce la URL di redirect.
 * Passa in modo sicuro i metadati dell'utente e del dossier come parametri custom per la riconciliazione asincrona.
 */
export async function createCheckoutSession({
  dossierId,
  userId,
  userEmail,
  analysisMode,
  locale,
}: CreateCheckoutParams): Promise<string> {
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
  const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
  const variantId = process.env.LEMON_SQUEEZY_VARIANT_ID;

  if (!apiKey || !storeId || !variantId) {
    throw new Error(
      `Lemon Squeezy credentials missing. Check env: API_KEY=${!!apiKey}, STORE_ID=${!!storeId}, VARIANT_ID=${!!variantId}`
    );
  }

  // Costruisci la URL di redirect post-pagamento
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://armocromia-mvp.vercel.app";
  const redirectUrl = `${siteUrl}/${locale}/dashboard?payment_success=true&dossier_id=${dossierId}`;

  console.log(`[LemonSqueezy] Creating checkout for user=${userId} dossier=${dossierId} redirect=${redirectUrl}`);

  const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      "Accept": "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: userEmail || undefined,
            custom: {
              user_id: userId,
              dossier_id: String(dossierId),
              analysis_mode: analysisMode,
              locale: locale,
            },
          },
          checkout_options: {
            embed: false,
            dark: true,
            media: true,
            logo: true,
          },
          product_options: {
            enabled_variants: [parseInt(variantId, 10)],
            redirect_url: redirectUrl,
          },
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: String(storeId),
            },
          },
          variant: {
            data: {
              type: "variants",
              id: String(variantId),
            },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[LemonSqueezy] API Error [${response.status}]:`, errorText);
    throw new Error(`Lemon Squeezy API failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const checkoutUrl = result.data?.attributes?.url;

  if (!checkoutUrl) {
    console.error("[LemonSqueezy] Response lacks URL attributes:", JSON.stringify(result));
    throw new Error("Lemon Squeezy did not return a checkout URL");
  }

  return checkoutUrl;
}
