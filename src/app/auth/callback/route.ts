import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * GET /auth/callback
 *
 * Why: Supabase invia l'utente qui dopo il click sul magic link.
 * Supporta DUE flussi:
 *   1. PKCE (code flow): /auth/callback?code=xxx
 *   2. Token hash (implicit): /auth/callback?token_hash=xxx&type=magiclink
 *
 * Il flusso PKCE può fallire con "code challenge does not match" quando i
 * cookie del code_verifier non sopravvivono al round-trip email→browser
 * (es. email aperta in app diversa, cookie SameSite, ecc.).
 * In quel caso, il fallback su token_hash risolve il problema.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as "magiclink" | "email" | null;

  const supabase = await createClient();

  // Why: prima proviamo il flusso PKCE standard (code exchange).
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback] Code exchange error:", error.message);

      // Why: se il PKCE fallisce per code_verifier mismatch, non redirigiamo
      // subito — potrebbe esserci un token_hash nella stessa request.
      if (!tokenHash) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/auth/login";
        loginUrl.searchParams.set("error", "auth_failed");
        return NextResponse.redirect(loginUrl);
      }
      // else: cade nel blocco token_hash sotto
    } else {
      // Success via code exchange
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = "/dashboard";
      dashboardUrl.search = "";
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // Why: fallback al flusso token_hash — Supabase include token_hash quando
  // il magic link usa il formato implicit (o come fallback dal PKCE).
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type === "magiclink" ? "magiclink" : "email",
    });

    if (error) {
      console.error("[auth/callback] Token hash verify error:", error.message);
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/auth/login";
      loginUrl.searchParams.set("error", "auth_failed");
      return NextResponse.redirect(loginUrl);
    }

    // Success via token hash
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  // Why: nessun code né token_hash — redirect alla login.
  console.error("[auth/callback] No code or token_hash in callback URL");
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/auth/login";
  return NextResponse.redirect(loginUrl);
}
