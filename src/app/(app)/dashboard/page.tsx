import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Il tuo pannello personale per gestire l'analisi cromatica.",
};

/**
 * Dashboard utente — area autenticata.
 *
 * Why: Server Component perché legge i dati dal DB (profilo + dossier).
 * L'utente è già autenticato grazie al layout guard di (app).
 */
export default async function DashboardPage() {
  const supabase = await createClient();

  // Why: getUser() è già verificato nel layout, qui lo usiamo per i dati.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Carica i dossier dell'utente
  const { data: dossiers } = await supabase
    .from("dossiers")
    .select("id, status, classified_season, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const hasDossiers = dossiers && dossiers.length > 0;

  return (
    <div className="px-6 py-12">
      <div className="mx-auto max-w-3xl">
        {/* Welcome */}
        <div className="mb-12">
          <p className="text-sm font-medium tracking-[0.15em] uppercase text-muted">
            Il tuo spazio personale
          </p>
          <h1 className="mt-2 font-serif text-3xl tracking-tight text-ink sm:text-4xl">
            Ciao{user?.email ? `, ${user.email.split("@")[0]}` : ""} 👋
          </h1>
        </div>

        {hasDossiers ? (
          /* ── Lista dossier ── */
          <div className="space-y-4">
            <h2 className="font-serif text-xl text-ink">I tuoi dossier</h2>
            {dossiers.map((dossier) => (
              <div
                key={dossier.id}
                className="rounded-2xl border border-accent/10 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-ink">
                      Dossier #{dossier.id}
                    </p>
                    {dossier.classified_season && (
                      <p className="mt-1 text-sm text-muted capitalize">
                        {dossier.classified_season.replace("-", " ")}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={dossier.status} />
                </div>
                <p className="mt-3 text-xs text-muted-light">
                  Creato il{" "}
                  {new Date(dossier.created_at).toLocaleDateString("it-IT", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            ))}
          </div>
        ) : (
          /* ── Stato vuoto ── */
          <div className="rounded-2xl border-2 border-dashed border-accent/20 p-12 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
              <svg
                className="h-7 w-7 text-accent"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
                />
              </svg>
            </div>
            <h2 className="font-serif text-2xl text-ink">
              Nessun dossier ancora
            </h2>
            <p className="mt-3 text-muted leading-relaxed">
              Inizia la tua analisi cromatica personalizzata.
              <br />
              Riceverai un dossier visivo con palette, outfit e makeup su misura.
            </p>
            <button
              disabled
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3.5 text-base font-medium text-white shadow-lg opacity-60 cursor-not-allowed"
            >
              Inizia l&apos;analisi — €19,99
              <span className="text-xs opacity-75">(presto disponibile)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Badge visivo per lo stato del dossier.
 */
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    pending_payment: {
      label: "In attesa di pagamento",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    pending_upload: {
      label: "Carica la foto",
      className: "bg-blue-50 text-blue-700 border-blue-200",
    },
    processing: {
      label: "In analisi",
      className: "bg-purple-50 text-purple-700 border-purple-200",
    },
    generating: {
      label: "Generazione in corso",
      className: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    completed: {
      label: "Completato",
      className: "bg-green-50 text-green-700 border-green-200",
    },
    failed: {
      label: "Errore",
      className: "bg-red-50 text-red-700 border-red-200",
    },
  };

  const { label, className } = config[status] || {
    label: status,
    className: "bg-gray-50 text-gray-700 border-gray-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
