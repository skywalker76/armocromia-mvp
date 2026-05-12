import { NextResponse, type NextRequest } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/auth/dev-login?email=...
 *
 * DEV-ONLY: Login diretto senza email — bypassa Magic Link.
 * Usa l'admin API per generare un link, poi lo verifica server-side
 * e imposta la sessione nei cookie.
 *
 * ⚠️  Attiva SOLO in development — bloccata in produzione.
 */
export async function GET(request: NextRequest) {
  // Security: solo in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Only available in development" },
      { status: 403 }
    );
  }

  const email = request.nextUrl.searchParams.get("email");

  if (!email) {
    // Mostra una pagina HTML semplice con form
    return new NextResponse(
      `<!DOCTYPE html>
      <html lang="it">
      <head><title>Dev Login</title>
      <style>body{font-family:system-ui;max-width:400px;margin:100px auto;padding:20px}
      input,button{width:100%;padding:12px;margin:8px 0;border-radius:8px;border:1px solid #ccc;font-size:16px}
      button{background:#b08968;color:white;border:none;cursor:pointer}
      button:hover{background:#96755a}</style></head>
      <body>
        <h2>🔐 Dev Login</h2>
        <p>Accesso diretto senza Magic Link (solo development)</p>
        <form onsubmit="location.href='/api/auth/dev-login?email='+encodeURIComponent(document.getElementById('e').value);return false">
          <input id="e" type="email" placeholder="La tua email" value="gamatig@gmail.com" required>
          <button type="submit">Accedi</button>
        </form>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: "Supabase env vars mancanti" },
      { status: 500 }
    );
  }

  // Admin client con service role key per generare il link
  const admin = createAdminClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Genera magic link (non invia email, restituisce il link)
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (linkError || !linkData) {
    console.error("[dev-login] generateLink error:", linkError?.message);
    return NextResponse.json({ error: linkError?.message }, { status: 500 });
  }

  // Estrai il token dal link generato
  const hashed_token = linkData.properties?.hashed_token;

  if (!hashed_token) {
    return NextResponse.json(
      { error: "Nessun token generato" },
      { status: 500 }
    );
  }

  // Verifica il token OTP e crea la sessione
  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: hashed_token,
  });

  if (verifyError) {
    console.error("[dev-login] verifyOtp error:", verifyError.message);
    return NextResponse.json(
      { error: `Verifica fallita: ${verifyError.message}` },
      { status: 500 }
    );
  }

  // Sessione creata nei cookie → redirect alla dashboard
  const dashboardUrl = request.nextUrl.clone();
  dashboardUrl.pathname = "/dashboard";
  dashboardUrl.search = "";
  return NextResponse.redirect(dashboardUrl);
}
