import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ToastContainer from "@/components/ui/Toast";
import NavBar from "@/components/app/NavBar";
import { isValidLocale, localePath, defaultLocale } from "@/lib/i18n/config";

/**
 * Layout per l'area autenticata — route group (app).
 *
 * Why: questo layout fa il check auth a livello di gruppo.
 * Tutte le pagine sotto [lang]/(app)/ ereditano questo guard.
 * Se l'utente non è autenticato, redirect a /[locale]/auth/login.
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
    redirect(localePath(locale, "/auth/login"));
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Premium Navbar */}
      <NavBar email={user.email ?? ""} />

      {/* Content */}
      <main className="flex-1">{children}</main>

      {/* Toast system */}
      <ToastContainer />
    </div>
  );
}
