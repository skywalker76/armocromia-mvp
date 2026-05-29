import { NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * Endpoint TEMPORANEO di diagnosi del LEMON_SQUEEZY_WEBHOOK_SECRET.
 *
 * Why: il webhook Lemon Squeezy risponde 401 (firma non valida). Per capire se
 * il valore su Vercel combacia con quello impostato su Lemon — senza esporre il
 * segreto — restituiamo solo lunghezza, fingerprint mascherato e un hash sha256.
 *
 * DA RIMUOVERE subito dopo la diagnosi.
 *
 * Uso: GET /api/admin/whsec-check?token=hc_9f3a7c21e8b64d05af1c2e7b
 */
const CHECK_TOKEN = "hc_9f3a7c21e8b64d05af1c2e7b";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("token") !== CHECK_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  const secret = raw?.trim();

  if (!secret) {
    return NextResponse.json({ configured: false });
  }

  const masked =
    secret.length <= 6
      ? "***"
      : `${secret.slice(0, 3)}…${secret.slice(-3)}`;

  return NextResponse.json({
    configured: true,
    length: secret.length,
    hadWhitespace: raw !== secret, // true = c'erano spazi prima/dopo (typo!)
    fingerprint: masked,
    sha256: crypto.createHash("sha256").update(secret).digest("hex").slice(0, 16),
  });
}
