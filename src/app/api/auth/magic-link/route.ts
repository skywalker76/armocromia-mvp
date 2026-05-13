import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * POST /api/auth/magic-link
 *
 * Why: Invia un OTP a 6 cifre via email. Il path resta "magic-link" per
 * retrocompatibilità dei bookmark, ma il comportamento è OTP-only.
 *
 * Supabase invia automaticamente un codice numerico a 6 cifre quando
 * emailRedirectTo è ASSENTE dalle options.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const email = body?.email;

  if (!email || typeof email !== "string") {
    return NextResponse.json(
      { error: "Email obbligatoria." },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // Why: SENZA emailRedirectTo, Supabase invia un codice OTP a 6 cifre
      // invece di un magic link cliccabile. Questo elimina il problema PKCE
      // (code_verifier mismatch quando si apre il link in un browser diverso).
      shouldCreateUser: true,
    },
  });

  if (error) {
    console.error("[send-otp] Supabase error:", JSON.stringify({
      message: error.message,
      status: error.status,
      code: error.code,
    }));

    // Why: distinguiamo rate limit (429) da errori generici per dare feedback
    // chiaro all'utente — "aspetta" vs "riprova".
    // Supabase non sempre restituisce status 429, a volte solo il messaggio.
    const isRateLimit =
      error.status === 429 ||
      error.code === "over_email_send_rate_limit" ||
      error.message?.toLowerCase().includes("rate limit");
    if (isRateLimit) {
      return NextResponse.json(
        { error: "Troppi tentativi. Attendi qualche minuto e riprova." },
        { status: 429 }
      );
    }

    // Why: errore generico (es. configurazione SMTP mancante o server down)
    return NextResponse.json(
      { error: "Impossibile inviare il codice. Riprova." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
