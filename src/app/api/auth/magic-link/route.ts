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
    },
  });

  if (error) {
    console.error("[magic-link] Supabase error:", JSON.stringify({
      message: error.message,
      status: error.status,
      code: error.code,
      name: error.name,
    }));
    console.error("[magic-link] ENV check:", {
      urlSet: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      urlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20),
      keySet: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      keyPrefix: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.substring(0, 15),
    });
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
