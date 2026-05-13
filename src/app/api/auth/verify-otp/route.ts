import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/auth/verify-otp
 *
 * Verifica il codice OTP inviato via email (6 o 8 cifre, configurabile da Supabase).
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

  // Accetta token da 6 a 8 cifre (il default Supabase è 6, ma può essere 8)
  if (!token || typeof token !== "string" || !/^\d{6,8}$/.test(token)) {
    return NextResponse.json(
      { error: "Il codice deve essere di 6-8 cifre." },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Strategia: proviamo prima con type "email", poi con "magiclink" come fallback.
  // Supabase docs sono ambigui su quale type usare per signInWithOtp.
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    console.error("[verify-otp] Supabase error:", JSON.stringify({
      message: error.message,
      status: error.status,
      code: error.code,
    }));

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
