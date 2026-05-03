import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Aggiorna la sessione Supabase su ogni request.
 *
 * Why: il proxy intercetta ogni request e fa il refresh del token JWT
 * se necessario, sincronizzando i cookie tra browser e server.
 * Senza questo, gli utenti verrebbero disconnessi casualmente
 * quando il token scade.
 *
 * IMPORTANTE: non mettere codice tra createServerClient e getClaims().
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Why: con Fluid compute, creare sempre un nuovo client per ogni request.
  // Non mettere il client in una variabile globale.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value)
          );
        },
      },
    }
  );

  // IMPORTANTE: non inserire codice tra createServerClient e getClaims().
  // Un errore qui potrebbe causare logout casuali.
  //
  // Why: getClaims() valida il JWT contro le chiavi pubbliche del progetto,
  // più sicuro di getSession() che non fa revalidation.
  await supabase.auth.getClaims();

  // Why: Non forziamo redirect a /login qui perché le route (marketing)
  // devono essere accessibili senza autenticazione. La protezione delle
  // route autenticate sarà gestita nei layout delle route group (app).

  return supabaseResponse;
}
