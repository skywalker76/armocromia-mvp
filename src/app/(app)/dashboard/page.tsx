import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Armocromia",
  description: "Il tuo pannello personale per gestire l'analisi cromatica.",
};

/**
 * Dashboard utente — area autenticata.
 * Placeholder: verrà implementata con upload foto, stato dossier, download.
 */
export default function DashboardPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          Dashboard
        </h1>
        <p className="mt-4 text-lg text-muted">
          Area riservata — in costruzione.
        </p>
      </div>
    </main>
  );
}
