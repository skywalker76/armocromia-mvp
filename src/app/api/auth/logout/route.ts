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

  // Why: redirect alla homepage dopo il logout con status 303 (See Other).
  // 303 forza il browser a seguire il redirect con GET; il default 307 di
  // NextResponse.redirect preserva il POST, e il proxy i18n redirige
  // ulteriormente verso /<locale>/, dove però non esiste handler POST → errore.
  const homeUrl = request.nextUrl.clone();
  homeUrl.pathname = "/";
  homeUrl.search = "";
  return NextResponse.redirect(homeUrl, 303);
}
