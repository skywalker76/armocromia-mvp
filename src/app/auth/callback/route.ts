import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * GET /auth/callback
 *
 * Why: Supabase invia l'utente qui dopo il click sul magic link.
 * Il parametro `code` nella query string è un authorization code
 * che scambiamo per una sessione (cookie-based).
 *
 * Flow: email → click link → /auth/callback?code=xxx → exchange → /dashboard
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");

  // Why: se manca il code, redirect alla login con errore.
  // Succede se l'utente visita /auth/callback direttamente.
  if (!code) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.delete("code");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] Exchange error:", error.message);
    // Why: non esponiamo il messaggio di errore di Supabase all'utente.
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.set("error", "auth_failed");
    return NextResponse.redirect(loginUrl);
  }

  // Why: dopo login riuscito, redirect alla dashboard.
  const dashboardUrl = request.nextUrl.clone();
  dashboardUrl.pathname = "/dashboard";
  dashboardUrl.search = "";
  return NextResponse.redirect(dashboardUrl);
}
