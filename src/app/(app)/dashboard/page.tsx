import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import PhotoUploader from "@/components/app/PhotoUploader";
import DossierCard from "@/components/app/DossierCard";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Il tuo pannello personale per gestire l'analisi cromatica.",
};

/**
 * Dashboard utente — area autenticata.
 *
 * Why: Server Component perché legge i dati dal DB (profilo + dossier)
 * e genera signed URLs per le immagini.
 * L'utente è già autenticato grazie al layout guard di (app).
 */
export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Carica i dossier dell'utente
  const { data: dossiers } = await supabase
    .from("dossiers")
    .select(
      "id, status, classified_season, classification_result, created_at, generated_dossier_path"
    )
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const completedDossiers = dossiers?.filter((d) => d.status === "completed") ?? [];
  const pendingDossiers = dossiers?.filter((d) =>
    ["processing", "generating"].includes(d.status)
  ) ?? [];
  const hasDossiers = (dossiers?.length ?? 0) > 0;

  // Genera signed URLs per i dossier completati
  const dossiersWithUrls = await Promise.all(
    completedDossiers.map(async (dossier) => {
      let imageUrl: string | null = null;
      if (dossier.generated_dossier_path) {
        const { data } = await supabase.storage
          .from("dossiers")
          .createSignedUrl(dossier.generated_dossier_path, 3600);
        imageUrl = data?.signedUrl ?? null;
      }
      return { dossier, imageUrl };
    })
  );

  return (
    <div className="px-6 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Welcome */}
        <div className="mb-12">
          <p className="text-sm font-medium tracking-[0.15em] uppercase text-muted">
            Il tuo spazio personale
          </p>
          <h1 className="mt-2 font-serif text-3xl tracking-tight text-ink sm:text-4xl">
            Ciao{user?.email ? `, ${user.email.split("@")[0]}` : ""} 👋
          </h1>
        </div>

        {/* Dossier in elaborazione */}
        {pendingDossiers.length > 0 && (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50/50 p-6">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 animate-pulse rounded-full bg-amber-500" />
              <p className="font-medium text-amber-800">
                {pendingDossiers.length === 1
                  ? "Un dossier è in elaborazione..."
                  : `${pendingDossiers.length} dossier in elaborazione...`}
              </p>
            </div>
            <p className="mt-2 text-sm text-amber-700">
              Ricarica la pagina tra qualche istante per visualizzare i risultati.
            </p>
          </div>
        )}

        {/* Dossier completati */}
        {completedDossiers.length > 0 && (
          <div className="mb-12">
            <h2 className="mb-6 font-serif text-xl text-ink">I tuoi dossier</h2>
            <div className="grid gap-8 sm:grid-cols-2">
              {dossiersWithUrls.map(({ dossier, imageUrl }) => (
                <DossierCard
                  key={dossier.id}
                  dossier={dossier}
                  dossierImageUrl={imageUrl}
                />
              ))}
            </div>
          </div>
        )}

        {/* Nuova analisi o stato vuoto */}
        <div className="rounded-2xl border border-accent/10 bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <h2 className="font-serif text-2xl text-ink">
              {hasDossiers
                ? "Nuova analisi cromatica"
                : "Inizia la tua analisi cromatica"}
            </h2>
            <p className="mt-2 text-muted leading-relaxed">
              {hasDossiers
                ? "Carica una nuova foto per un'analisi aggiuntiva."
                : "Carica una foto ritratto e riceverai un dossier visivo personalizzato con palette, outfit e makeup su misura."}
            </p>
          </div>
          <PhotoUploader />
        </div>
      </div>
    </div>
  );
}
