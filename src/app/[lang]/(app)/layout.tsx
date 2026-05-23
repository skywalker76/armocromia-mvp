import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import ToastContainer from "@/components/ui/Toast";
import NavBar from "@/components/app/NavBar";
import { isValidLocale, localePath, defaultLocale } from "@/lib/i18n/config";

// Force Next.js to render this layout dynamically at runtime on every request
export const dynamic = "force-dynamic";

/**
 * Layout per l'area autenticata — route group (app).
 *
 * Why: questo layout fa il check auth a livello di gruppo.
 * Tutte le pagine sotto [lang]/(app)/ ereditano questo guard.
 * Se l'utente non è autenticato, redirect a /[locale]/auth/login?next=<url>.
 * Il parametro ?next= permette alla login page di rimandare l'utente
 * all'URL originale (es. dashboard con payment_success=true) dopo l'auth.
 */
export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isValidLocale(lang) ? lang : defaultLocale;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Preserva l'URL originale (incluso payment_success + dossier_id)
    // così dopo il login l'utente viene rimandato al dossier in elaborazione.
    const headersList = await headers();
    const requestUrl = headersList.get("x-url") ?? headersList.get("x-invoke-path") ?? "";
    const nextParam = requestUrl ? `?next=${encodeURIComponent(requestUrl)}` : "";
    redirect(`${localePath(locale, "/auth/login")}${nextParam}`);
  }

  const userIsAdmin = isAdmin(user.email);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Premium Navbar */}
      <NavBar email={user.email ?? ""} isAdmin={userIsAdmin} />

      {/* Content */}
      <main className="flex-1">{children}</main>

      {/* Toast system */}
      <ToastContainer />
    </div>
  );
}
