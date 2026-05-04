"use client";

import { useState } from "react";

/**
 * Card per visualizzare un dossier completato nella dashboard.
 *
 * Why: Client Component perché ha interazioni (expand, copy hex).
 * Riceve dati pre-processati dal Server Component dashboard.
 */

interface DossierCardProps {
  dossier: {
    id: number;
    status: string;
    classified_season: string | null;
    classification_result: {
      analysis?: {
        skinTone?: string;
        hairColor?: string;
        eyeColor?: string;
        undertone?: string;
        contrast?: string;
      };
    } | null;
    created_at: string;
    generated_dossier_path: string | null;
  };
  dossierImageUrl: string | null;
}

/** Mappa sotto-stagione → colore badge */
const SEASON_COLORS: Record<string, string> = {
  "primavera-chiara": "bg-amber-50 text-amber-700 border-amber-200",
  "primavera-calda": "bg-orange-50 text-orange-700 border-orange-200",
  "primavera-brillante": "bg-rose-50 text-rose-700 border-rose-200",
  "estate-chiara": "bg-sky-50 text-sky-700 border-sky-200",
  "estate-fredda": "bg-blue-50 text-blue-700 border-blue-200",
  "estate-tenue": "bg-slate-50 text-slate-600 border-slate-200",
  "autunno-tenue": "bg-stone-50 text-stone-700 border-stone-200",
  "autunno-caldo": "bg-amber-50 text-amber-800 border-amber-300",
  "autunno-profondo": "bg-red-50 text-red-800 border-red-200",
  "inverno-profondo": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "inverno-freddo": "bg-cyan-50 text-cyan-700 border-cyan-200",
  "inverno-brillante": "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
};

export default function DossierCard({
  dossier,
  dossierImageUrl,
}: DossierCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const seasonKey = dossier.classified_season ?? "";
  const seasonLabel = seasonKey.replace("-", " ");
  const badgeClass = SEASON_COLORS[seasonKey] ?? "bg-gray-50 text-gray-700 border-gray-200";
  const analysis = dossier.classification_result?.analysis;

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/10 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Dossier Image */}
      {dossierImageUrl && (
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-cream-dark">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            </div>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dossierImageUrl}
            alt={`Dossier ${seasonLabel}`}
            className={`h-full w-full object-cover transition-opacity duration-500 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setImageLoaded(true)}
          />
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Season badge */}
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize ${badgeClass}`}>
            {seasonLabel || dossier.status}
          </span>
          <span className="text-xs text-muted-light">
            {new Date(dossier.created_at).toLocaleDateString("it-IT", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>

        {/* Analysis details */}
        {analysis && (
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            {analysis.skinTone && (
              <div>
                <span className="text-muted-light text-xs">Incarnato</span>
                <p className="text-ink">{analysis.skinTone}</p>
              </div>
            )}
            {analysis.hairColor && (
              <div>
                <span className="text-muted-light text-xs">Capelli</span>
                <p className="text-ink">{analysis.hairColor}</p>
              </div>
            )}
            {analysis.eyeColor && (
              <div>
                <span className="text-muted-light text-xs">Occhi</span>
                <p className="text-ink">{analysis.eyeColor}</p>
              </div>
            )}
            {analysis.undertone && (
              <div>
                <span className="text-muted-light text-xs">Sottotono</span>
                <p className="text-ink capitalize">{analysis.undertone}</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <a
            href={`/dossier/${dossier.id}`}
            className="flex-1 rounded-full bg-accent px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Vedi dettaglio
          </a>
          {dossierImageUrl && (
            <a
              href={dossierImageUrl}
              download={`armocromia-dossier-${dossier.id}.webp`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-accent/20 px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent/5"
            >
              Scarica
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
