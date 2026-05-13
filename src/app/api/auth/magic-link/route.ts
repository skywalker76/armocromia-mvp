import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * POST /api/auth/magic-link
 *
 * Why: Route Handler (non Server Action) perché il login è una operazione
 * stateless che non muta dati dell'app — solo autenticazione.
 * Il client invia l'email, il server chiama Supabase Auth.
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
      // Why: emailRedirectTo indica a Supabase dove redirigere dopo il click
      // sul magic link nella email. Deve puntare alla callback route.
      emailRedirectTo: `${getBaseUrl(request)}/auth/callback`,
      // Why: usiamo shouldCreateUser per creare l'utente automaticamente
      // al primo accesso, come promesso nella UI.
      shouldCreateUser: true,
    },
  });

  if (error) {
    console.error("[magic-link] Supabase error:", JSON.stringify({
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

    return NextResponse.json(
      { error: "Impossibile inviare il link. Riprova." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

/**
 * Why: costruiamo la base URL dalla request per supportare sia localhost
 * che il deploy su Vercel senza hardcodare l'URL.
 */
function getBaseUrl(request: NextRequest): string {
  // Priorità: env var > header x-forwarded-host > request URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  const host = request.headers.get("x-forwarded-host") || request.nextUrl.host;
  const protocol = request.headers.get("x-forwarded-proto") || "http";

  return `${protocol}://${host}`;
}
