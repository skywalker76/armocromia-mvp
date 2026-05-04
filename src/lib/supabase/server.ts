import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Crea un client Supabase per uso nei Server Components, Server Actions, e Route Handlers.
 *
 * Why: il server client accede ai cookie tramite next/headers per leggere/scrivere
 * i token di sessione. Il try/catch in setAll è necessario perché i Server Components
 * non possono scrivere cookie — il proxy si occupa del refresh.
 */
export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase env vars. Copy .env.local.example to .env.local and populate the values."
    );
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Why: il setAll viene chiamato da un Server Component dove i cookie
          // non possono essere scritti. Il proxy si occupa del refresh della sessione.
        }
      },
    },
  });
}

