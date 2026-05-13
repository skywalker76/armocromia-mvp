import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import PhotoUploader from "@/components/app/PhotoUploader";
import DossierCard from "@/components/app/DossierCard";

/** Pipeline GPT Image 2 /edit richiede 60-180s. Massimo consentito su Vercel Pro = 300. */
export const maxDuration = 300;

export const metadata: Metadata = {
  title: "Dashboard — Armocromia",
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

  // Safety net: marca come 'failed' i dossier rimasti in processing/generating
  // da più di 5 minuti (sintomo di funzione killata da Vercel timeout).
  // Why: senza questo, l'utente vedrebbe "in elaborazione" all'infinito.
  const stuckCutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  await supabase
    .from("dossiers")
    .update({ status: "failed" })
    .eq("user_id", user!.id)
    .in("status", ["processing", "generating"])
    .lt("created_at", stuckCutoff);

  // Carica i dossier dell'utente
  const { data: dossiers } = await supabase
    .from("dossiers")
    .select(
      "id, status, classified_season, classification_result, created_at, generated_dossier_path"
    )
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const completedDossiers =
    dossiers?.filter((d) => d.status === "completed") ?? [];
  const pendingDossiers =
    dossiers?.filter((d) =>
      ["processing", "generating"].includes(d.status)
    ) ?? [];
  const failedDossiers =
    dossiers?.filter((d) => d.status === "failed") ?? [];
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

  const displayName = user?.email ? user.email.split("@")[0] : "Utente";

  // Greeting dinamico
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Buongiorno" : hour < 18 ? "Buon pomeriggio" : "Buonasera";

  return (
    <div className="px-6 py-10 sm:py-14">
      <div className="mx-auto max-w-5xl">
        {/* ── Welcome Header ── */}
        <div className="mb-10 animate-fade-in">
          <p className="text-sm font-medium tracking-[0.15em] uppercase text-muted">
            {greeting}
          </p>
          <h1 className="mt-2 font-serif text-3xl tracking-tight text-ink sm:text-4xl">
            {displayName}
          </h1>
          {hasDossiers && (
            <p className="mt-3 text-muted">
              {completedDossiers.length === 1
                ? "Hai 1 dossier completato"
                : `Hai ${completedDossiers.length} dossier completati`}
              {pendingDossiers.length > 0 &&
                ` · ${pendingDossiers.length} in elaborazione`}
            </p>
          )}
        </div>

        {/* ── Dossier in elaborazione ── */}
        {pendingDossiers.length > 0 && (
          <div className="mb-8 rounded-2xl border border-warning/20 bg-warning-light p-6 animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-warning" />
              </div>
              <p className="font-medium text-ink">
                {pendingDossiers.length === 1
                  ? "Un dossier è in elaborazione…"
                  : `${pendingDossiers.length} dossier in elaborazione…`}
              </p>
            </div>
            <p className="mt-2 text-sm text-muted">
              L&apos;intelligenza artificiale sta generando il tuo dossier
              personalizzato. Ricarica la pagina tra qualche istante.
            </p>
          </div>
        )}

        {/* ── Dossier falliti ── */}
        {failedDossiers.length > 0 && (
          <div className="mb-8 rounded-2xl border border-error/15 bg-error-light p-6 animate-slide-up">
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-error" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              <p className="font-medium text-ink">
                {failedDossiers.length === 1
                  ? "Un&apos;analisi non è andata a buon fine"
                  : `${failedDossiers.length} analisi non riuscite`}
              </p>
            </div>
            <p className="mt-2 text-sm text-muted">
              Puoi riprovare caricando una nuova foto oppure contattare
              il supporto.
            </p>
          </div>
        )}

        {/* ── Dossier completati — Grid ── */}
        {completedDossiers.length > 0 && (
          <div className="mb-14">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-serif text-xl text-ink">I tuoi dossier</h2>
              <span className="rounded-full bg-accent/8 px-3 py-1 text-xs font-semibold text-accent">
                {completedDossiers.length}
              </span>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {dossiersWithUrls.map(({ dossier, imageUrl }, i) => (
                <DossierCard
                  key={dossier.id}
                  dossier={dossier}
                  dossierImageUrl={imageUrl}
                  index={i}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Nuova analisi ── */}
        <div className="rounded-2xl border border-accent/8 bg-white p-8 shadow-xs animate-slide-up">
          {/* Decorative accent line */}
          <div className="mx-auto mb-6 h-1 w-12 rounded-full bg-gradient-to-r from-accent-light to-accent" />
          <div className="mb-6 text-center">
            <h2 className="font-serif text-2xl text-ink">
              {hasDossiers
                ? "Nuova analisi cromatica"
                : "Inizia la tua analisi cromatica"}
            </h2>
            <p className="mt-3 mx-auto max-w-lg text-muted leading-relaxed">
              {hasDossiers
                ? "Carica una nuova foto per scoprire altri abbinamenti e palette personalizzate."
                : "Carica una foto ritratto e l'intelligenza artificiale creerà un dossier visivo personalizzato con palette, outfit e consigli su misura per te."}
            </p>
          </div>
          <PhotoUploader />
        </div>

        {/* ── Footer branding ── */}
        <div className="mt-14 text-center">
          <p className="text-xs text-muted-light/60 tracking-wide">
            Armocromia AI · Powered by Antigravity
          </p>
        </div>
      </div>
    </div>
  );
}
