import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Layout per l'area autenticata — route group (app).
 *
 * Why: questo layout fa il check auth a livello di gruppo.
 * Tutte le pagine sotto (app)/ ereditano questo guard.
 * Se l'utente non è autenticato, redirect a /auth/login.
 */
export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header — area autenticata */}
      <header className="border-b border-accent/10 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <a
            href="/dashboard"
            className="font-serif text-xl text-ink hover:text-accent transition-colors"
          >
            Armocromia
          </a>

          <div className="flex items-center gap-6">
            <span className="text-sm text-muted hidden sm:block">
              {user.email}
            </span>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="text-sm font-medium text-muted hover:text-ink transition-colors"
              >
                Esci
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
