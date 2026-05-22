/**
 * trigger_dossier_96.mjs
 * Script one-shot per sbloccare manualmente il dossier #96
 * Simula il webhook Lemon Squeezy con firma HMAC corretta
 */
import crypto from "crypto";

const WEBHOOK_URL = "https://armocromia-mvp-tan.vercel.app/api/webhooks/lemonsqueezy";
const WEBHOOK_SECRET = "ArmoSecretWebhook2026!";
const DOSSIER_ID = 96;

// Recupera user_id da Supabase per il dossier #96
const SUPABASE_URL = "https://xjmhzdwmngzrosuxqfff.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

async function getUserIdForDossier(dossierId) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/dossiers?id=eq.${dossierId}&select=id,user_id,status,original_photo_path`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  const data = await res.json();
  console.log("Dossier data:", data);
  return data[0];
}

async function triggerWebhook(dossier) {
  const payload = {
    meta: {
      event_name: "order_created",
      custom_data: {
        user_id: dossier.user_id,
        dossier_id: String(dossier.id),
        analysis_mode: "full",
        locale: "it",
      },
    },
    data: {
      id: "manual-trigger-" + Date.now(),
      type: "orders",
    },
  };

  const body = JSON.stringify(payload);
  const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
  const signature = hmac.update(body).digest("hex");

  console.log("Calling webhook with signature:", signature.slice(0, 20) + "...");
  console.log("Payload:", JSON.stringify(payload, null, 2));

  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-signature": signature,
    },
    body,
  });

  const responseText = await res.text();
  console.log(`\nWebhook response: HTTP ${res.status}`);
  console.log("Response body:", responseText);

  if (res.ok) {
    console.log("\n✅ Dossier #96 sbloccato! La pipeline AI è partita in background.");
    console.log("🔄 Vai su https://armocromia-mvp-tan.vercel.app/it/dashboard per vedere il progresso.");
  } else {
    console.log("\n❌ Errore nel trigger. Controlla i log sopra.");
  }
}

async function main() {
  if (!SUPABASE_SERVICE_KEY) {
    console.error("❌ SUPABASE_SERVICE_KEY env var mancante!");
    console.log("Esegui: $env:SUPABASE_SERVICE_KEY='...' prima di runnare questo script");
    process.exit(1);
  }

  console.log(`\n🚀 Trigger manuale dossier #${DOSSIER_ID}...\n`);

  const dossier = await getUserIdForDossier(DOSSIER_ID);
  if (!dossier) {
    console.error(`❌ Dossier #${DOSSIER_ID} non trovato in Supabase!`);
    process.exit(1);
  }

  console.log(`✅ Dossier trovato: status=${dossier.status}, user_id=${dossier.user_id}`);

  if (dossier.status === "completed") {
    console.log("⚠️ Il dossier è già completato! Nessuna azione necessaria.");
    process.exit(0);
  }

  await triggerWebhook(dossier);
}

main().catch(console.error);
