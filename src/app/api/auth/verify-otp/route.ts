import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/auth/verify-otp
 *
 * Why: Verifica il codice OTP a 6 cifre inviato via email.
 * Se il codice è corretto, Supabase crea automaticamente la sessione
 * (imposta i cookie di auth) — il client può poi redirigere a /dashboard.
 */
export async function POST(request: Request) {
  const body = await request.json();
  const email = body?.email;
  const token = body?.token;

  if (!email || typeof email !== "string") {
    return NextResponse.json(
      { error: "Email obbligatoria." },
      { status: 400 }
    );
  }

  if (!token || typeof token !== "string" || token.length !== 6) {
    return NextResponse.json(
      { error: "Il codice deve essere di 6 cifre." },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    // Why: DEVE essere "magiclink" (non "email") perché il token è stato
    // generato da signInWithOtp(). Il type "email" è per la conferma signup.
    type: "magiclink",
  });

  if (error) {
    console.error("[verify-otp] Supabase error:", JSON.stringify({
      message: error.message,
      status: error.status,
      code: error.code,
    }));

    // Why: Supabase restituisce "Token has expired or is invalid" come messaggio
    // generico. Usiamo il code per distinguere i casi quando possibile.
    const isExpired = error.code === "otp_expired";
    if (isExpired) {
      return NextResponse.json(
        { error: "Il codice è scaduto. Richiedine uno nuovo." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Codice non valido. Controlla e riprova." },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
