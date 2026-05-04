import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPaletteBySubSeason } from "@/lib/armocromia/palettes";
import type { SubSeason } from "@/lib/armocromia/types";
import PaletteGrid from "./PaletteGrid";

interface DossierPageProps {
  params: Promise<{ id: string }>;
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
 * Pagina dettaglio di un singolo dossier.
 *
 * Why: Server Component — legge dal DB e genera signed URLs.
 * La palette interattiva è delegata al Client Component PaletteGrid.
 */
export default async function DossierPage({ params }: DossierPageProps) {
  const { id } = await params;
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
  const analysis = (dossier.classification_result as {
    analysis?: {
      skinTone?: string;
      hairColor?: string;
      eyeColor?: string;
      undertone?: string;
      contrast?: string;
    };
  })?.analysis;

  return (
    <div className="px-6 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Back link */}
        <a
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink transition-colors mb-8"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Torna alla dashboard
        </a>

        {/* Header */}
        <div className="mb-10 text-center">
          <p className="text-sm font-medium tracking-[0.15em] uppercase text-muted">
            La tua stagione cromatica
          </p>
          <h1 className="mt-3 font-serif text-4xl tracking-tight text-ink sm:text-5xl">
            {palette.displayName}
          </h1>
          <p className="mt-4 mx-auto max-w-xl text-lg text-muted leading-relaxed">
            {palette.description}
          </p>
        </div>

        {/* Dossier Image */}
        {dossierImageUrl && (
          <div className="mb-12 overflow-hidden rounded-2xl shadow-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={dossierImageUrl}
              alt={`Dossier ${palette.displayName}`}
              className="w-full"
            />
          </div>
        )}

        {/* Analysis Card */}
        {analysis && (
          <div className="mb-12 rounded-2xl border border-accent/10 bg-white p-8 shadow-sm">
            <h2 className="font-serif text-xl text-ink mb-6">La tua analisi</h2>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
              {analysis.skinTone && (
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-light">Incarnato</span>
                  <p className="mt-1 text-ink font-medium">{analysis.skinTone}</p>
                </div>
              )}
              {analysis.hairColor && (
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-light">Capelli</span>
                  <p className="mt-1 text-ink font-medium">{analysis.hairColor}</p>
                </div>
              )}
              {analysis.eyeColor && (
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-light">Occhi</span>
                  <p className="mt-1 text-ink font-medium">{analysis.eyeColor}</p>
                </div>
              )}
              {analysis.undertone && (
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-light">Sottotono</span>
                  <p className="mt-1 text-ink font-medium capitalize">{analysis.undertone}</p>
                </div>
              )}
              {analysis.contrast && (
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-light">Contrasto</span>
                  <p className="mt-1 text-ink font-medium capitalize">{analysis.contrast}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Palette interattiva */}
        <PaletteGrid palette={palette} />

        {/* Metalli */}
        <div className="mt-12 rounded-2xl border border-accent/10 bg-white p-8 shadow-sm">
          <h2 className="font-serif text-xl text-ink mb-4">Metalli consigliati</h2>
          <div className="flex flex-wrap gap-3">
            {palette.metals.map((metal) => (
              <span
                key={metal}
                className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-cream px-4 py-2 text-sm font-medium text-ink capitalize"
              >
                <span
                  className="h-4 w-4 rounded-full border border-black/10"
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

        {/* Download CTA */}
        {dossierImageUrl && (
          <div className="mt-12 text-center">
            <a
              href={dossierImageUrl}
              download={`armocromia-${season}-dossier.webp`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-base font-medium text-white shadow-lg transition-all duration-300 hover:bg-accent-hover hover:shadow-xl hover:-translate-y-0.5"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Scarica il tuo dossier
            </a>
          </div>
        )}

        {/* Footer date */}
        <p className="mt-12 text-center text-xs text-muted-light">
          Generato il{" "}
          {new Date(dossier.created_at).toLocaleDateString("it-IT", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
