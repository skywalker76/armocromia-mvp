import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * POST /api/auth/logout
 *
 * Why: il logout è un POST (non GET) perché è un'azione che muta lo stato
 * della sessione. Usare GET per il logout è un anti-pattern di sicurezza
 * (possibilità di CSRF via link/immagine).
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  await supabase.auth.signOut();

  // Why: redirect alla homepage dopo il logout.
  const homeUrl = request.nextUrl.clone();
  homeUrl.pathname = "/";
  homeUrl.search = "";
  return NextResponse.redirect(homeUrl);
}
