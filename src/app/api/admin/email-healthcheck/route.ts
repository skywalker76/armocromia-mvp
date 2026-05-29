import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/emails/resend";

export const dynamic = "force-dynamic";

/**
 * Endpoint TEMPORANEO di verifica chiave Resend.
 *
 * Why: confermare che la env RESEND_API_KEY attiva in produzione (chiave nuova)
 * riesca davvero a inviare un'email, PRIMA di revocare la vecchia chiave leaked.
 * Invia una sola email di prova all'indirizzo indicato e restituisce l'esito grezzo
 * di sendEmail, così possiamo distinguere: chiave valida / chiave assente / chiave errata.
 *
 * DA RIMUOVERE subito dopo la verifica.
 *
 * Uso: GET /api/admin/email-healthcheck?token=hc_9f3a7c21e8b64d05af1c2e7b&to=gamatig@gmail.com
 */
const HEALTHCHECK_TOKEN = "hc_9f3a7c21e8b64d05af1c2e7b";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const to = searchParams.get("to") || "gamatig@gmail.com";

  if (token !== HEALTHCHECK_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await sendEmail({
    to,
    subject: "Cromea Studio — verifica chiave email",
    html: "<p>Se ricevi questa email, la nuova chiave Resend funziona correttamente in produzione. ✅</p>",
  });

  // Interpretazione esplicita dell'esito per il test di rotazione chiave.
  let verdict: string;
  if (result.success && result.id === "simulated-local-id") {
    verdict = "KEY_MISSING"; // RESEND_API_KEY non configurata in env
  } else if (!result.success) {
    verdict = "KEY_INVALID"; // chiave presente ma rifiutata da Resend (probabile typo)
  } else {
    verdict = "KEY_OK"; // email realmente accettata da Resend
  }

  return NextResponse.json({ verdict, result });
}
