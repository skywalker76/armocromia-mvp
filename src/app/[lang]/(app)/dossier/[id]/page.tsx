import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPaletteBySubSeason } from "@/lib/armocromia/palettes";
import type { SubSeason } from "@/lib/armocromia/types";
import PaletteGrid from "./PaletteGrid";
import DeleteDossierButton from "@/components/app/DeleteDossierButton";
import { isValidLocale, localePath, defaultLocale } from "@/lib/i18n/config";

interface DossierPageProps {
  params: Promise<{ id: string; lang: string }>;
}

export async function generateMetadata({
  params,
}: DossierPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Dossier #${id} — Armocromia`,
    description: "Il tuo dossier cromatico personalizzato.",
  };
}

/**
 * Pagina dettaglio di un singolo dossier — layout editoriale premium.
 *
 * Why: Server Component — legge dal DB e genera signed URLs.
 * La palette interattiva è delegata al Client Component PaletteGrid.
 */
export default async function DossierPage({ params }: DossierPageProps) {
  const { id, lang } = await params;
  const locale = isValidLocale(lang) ? lang : defaultLocale;
  const dashboardHref = localePath(locale, "/dashboard");
  const dossierId = parseInt(id, 10);

  if (isNaN(dossierId)) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: dossier } = await supabase
    .from("dossiers")
    .select("*")
    .eq("id", dossierId)
    .eq("user_id", user.id)
    .single();

  if (!dossier || dossier.status !== "completed") {
    notFound();
  }

  // Signed URLs
  let dossierImageUrl: string | null = null;
  if (dossier.generated_dossier_path) {
    const { data } = await supabase.storage
      .from("dossiers")
      .createSignedUrl(dossier.generated_dossier_path, 3600);
    dossierImageUrl = data?.signedUrl ?? null;
  }

  let originalPhotoUrl: string | null = null;
  if (dossier.original_photo_path) {
    const { data } = await supabase.storage
      .from("photos")
      .createSignedUrl(dossier.original_photo_path, 3600);
    originalPhotoUrl = data?.signedUrl ?? null;
  }

  // Palette data
  const season = dossier.classified_season as SubSeason;
  const palette = getPaletteBySubSeason(season);
  const classResult = dossier.classification_result as {
    analysis?: {
      skinTone?: string;
      hairColor?: string;
      eyeColor?: string;
      undertone?: string;
      contrast?: string;
      value?: string;
      intensity?: string;
    };
    reasoning?: {
      whyTheseColors?: string;
      whyNotOthers?: string;
      practicalTips?: string[];
      lookSuggestions?: Array<{
        name: string;
        colors: string;
        description: string;
      }>;
    };
  };
  const analysis = classResult?.analysis;
  const reasoning = classResult?.reasoning;

  // Suppress unused variable warning
  void originalPhotoUrl;

  return (
    <div className="px-6 py-10 sm:py-14">
      <div className="mx-auto max-w-4xl">
        {/* ── Breadcrumb ── */}
        <nav className="mb-8 flex items-center gap-2 text-sm animate-fade-in">
          <a
            href={dashboardHref}
            className="font-medium text-muted hover:text-ink transition-colors"
          >
            Dashboard
          </a>
          <svg className="h-3.5 w-3.5 text-muted-light" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
          <span className="text-ink font-medium">
            Dossier #{dossierId}
          </span>
        </nav>

        {/* ── Hero Header ── */}
        <div className="mb-12 text-center animate-slide-up">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent">
            Armocromia · Il tuo profilo cromatico
          </p>
          <h1 className="mt-4 font-serif text-4xl tracking-tight text-ink sm:text-5xl">
            {palette.displayName}
          </h1>
          <p className="mt-4 mx-auto max-w-xl text-lg text-muted leading-relaxed">
            {palette.description}
          </p>

          {/* Flow diagram */}
          {analysis && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm">
              {[
                { label: "Sottotono", value: analysis.undertone },
                { label: "Valore", value: analysis.value },
                { label: "Intensità", value: analysis.intensity },
                { label: "Contrasto", value: analysis.contrast },
              ].filter(d => d.value).map((d, i, arr) => (
                <span key={d.label} className="flex items-center gap-2">
                  <span className="inline-flex flex-col items-center rounded-xl border border-accent/12 bg-white px-4 py-2.5 shadow-xs">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-light">{d.label}</span>
                    <span className="font-medium text-ink capitalize">{d.value}</span>
                  </span>
                  {i < arr.length - 1 && (
                    <svg className="h-3.5 w-3.5 text-muted-light/50" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  )}
                </span>
              ))}
              <svg className="h-3.5 w-3.5 text-muted-light/50" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-accent to-accent-hover px-5 py-2.5 text-sm font-bold text-white shadow-md">
                {palette.displayName}
              </span>
            </div>
          )}
        </div>

        {/* ── Dossier Image ── */}
        {dossierImageUrl && (
          <div className="mb-14 overflow-hidden rounded-2xl shadow-xl animate-slide-up" style={{ animationDelay: "0.1s" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={dossierImageUrl}
              alt={`Dossier ${palette.displayName}`}
              className="w-full"
            />
          </div>
        )}

        {/* ── Analysis Card ── */}
        {analysis && (
          <div className="mb-12 rounded-2xl border border-accent/8 bg-white p-8 shadow-xs animate-slide-up" style={{ animationDelay: "0.15s" }}>
            <h2 className="font-serif text-xl text-ink mb-6 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0 1 19.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 0 0 4.5 10.5a7.464 7.464 0 0 1-1.15 3.993m1.989 3.559A11.209 11.209 0 0 0 8.25 10.5a3.75 3.75 0 1 1 7.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 0 1-3.6 9.75m6.633-4.596a18.666 18.666 0 0 1-2.485 5.33" />
                </svg>
              </div>
              La tua analisi
            </h2>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
              {[
                { label: "Incarnato", value: analysis.skinTone, icon: "🎨" },
                { label: "Capelli", value: analysis.hairColor, icon: "💇" },
                { label: "Occhi", value: analysis.eyeColor, icon: "👁️" },
                { label: "Sottotono", value: analysis.undertone, icon: "🌡️" },
                { label: "Contrasto", value: analysis.contrast, icon: "◐" },
              ].filter(d => d.value).map((d) => (
                <div key={d.label} className="rounded-xl bg-cream/60 p-4 text-center">
                  <span className="text-lg">{d.icon}</span>
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-light">{d.label}</p>
                  <p className="mt-1 text-sm text-ink font-medium capitalize">{d.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Ragionamento ── */}
        {reasoning && (
          <div className="mb-12 rounded-2xl border border-accent/8 bg-white p-8 shadow-xs animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <h2 className="font-serif text-xl text-ink mb-6">Perché questa stagione ti valorizza</h2>
            <div className="grid gap-8 md:grid-cols-2">
              <div className="rounded-xl bg-success-light/50 p-6">
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-success mb-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success/15 text-success">✓</span>
                  Colori che ti valorizzano
                </h3>
                <p className="text-ink/80 leading-relaxed">{reasoning.whyTheseColors}</p>
              </div>
              <div className="rounded-xl bg-error-light/50 p-6">
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-error mb-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-error/15 text-error">✗</span>
                  Colori da evitare
                </h3>
                <p className="text-ink/80 leading-relaxed">{reasoning.whyNotOthers}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Palette interattiva ── */}
        <div className="animate-slide-up" style={{ animationDelay: "0.25s" }}>
          <PaletteGrid palette={palette} />
        </div>

        {/* ── Metalli ── */}
        <div className="mt-12 rounded-2xl border border-accent/8 bg-white p-8 shadow-xs">
          <h2 className="font-serif text-xl text-ink mb-5 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
              <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
              </svg>
            </div>
            Metalli consigliati
          </h2>
          <div className="flex flex-wrap gap-3">
            {palette.metals.map((metal) => (
              <span
                key={metal}
                className="inline-flex items-center gap-2 rounded-xl border border-accent/10 bg-cream/70 px-4 py-2.5 text-sm font-medium text-ink capitalize transition-all hover:shadow-xs hover:border-accent/20"
              >
                <span
                  className="h-5 w-5 rounded-full border border-black/8 shadow-inner"
                  style={{
                    background:
                      metal === "oro-giallo" ? "linear-gradient(135deg, #FFD700, #DAA520)" :
                      metal === "oro-rosa" ? "linear-gradient(135deg, #E8B4B8, #D4A0A0)" :
                      metal === "argento" ? "linear-gradient(135deg, #E8E8E8, #C0C0C0)" :
                      "linear-gradient(135deg, #F0F0F0, #D5D5D5)",
                  }}
                />
                {metal.replace("-", " ")}
              </span>
            ))}
          </div>
        </div>

        {/* ── Consigli Pratici ── */}
        {reasoning?.practicalTips && reasoning.practicalTips.length > 0 && (
          <div className="mt-12 rounded-2xl border border-accent/8 bg-white p-8 shadow-xs">
            <h2 className="font-serif text-xl text-ink mb-6">Consigli pratici</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {reasoning.practicalTips.map((tip, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl bg-cream/50 p-4">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent text-xs font-bold">
                    {i + 1}
                  </span>
                  <p className="text-sm text-ink/80 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Idee di Look ── */}
        {reasoning?.lookSuggestions && reasoning.lookSuggestions.length > 0 && (
          <div className="mt-12 rounded-2xl border border-accent/8 bg-white p-8 shadow-xs">
            <h2 className="font-serif text-xl text-ink mb-6">Idee di look in armonia</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {reasoning.lookSuggestions.map((look, i) => (
                <div key={i} className="rounded-xl bg-cream/50 p-5 text-center transition-all hover:shadow-xs hover:bg-cream/80">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-light mb-1.5">
                    {look.name}
                  </p>
                  <p className="text-sm font-semibold text-ink mb-2">{look.colors}</p>
                  <p className="text-xs text-ink/60 leading-relaxed">{look.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Actions Footer ── */}
        <div className="mt-14 flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          {/* Download */}
          {dossierImageUrl && (
            <a
              href={dossierImageUrl}
              download={`armocromia-${season}-dossier.png`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-accent to-accent-hover px-8 py-4 text-base font-medium text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Scarica il tuo dossier
            </a>
          )}

          {/* Delete */}
          <DeleteDossierButton
            dossierId={dossierId}
            seasonLabel={palette.displayName}
            redirectTo="/dashboard"
            variant="full"
          />
        </div>

        {/* ── Footer date ── */}
        <p className="mt-10 text-center text-xs text-muted-light/60">
          Generato il{" "}
          {new Date(dossier.created_at).toLocaleDateString("it-IT", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
          {" · "}Armocromia AI by Antigravity
        </p>
      </div>
    </div>
  );
}
