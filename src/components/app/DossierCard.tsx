"use client";

import { useState } from "react";
import DeleteDossierButton from "./DeleteDossierButton";

/**
 * Card premium per dossier completato con hover lift, overlay azioni, delete.
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
  /** Index per stagger animation */
  index?: number;
}

/** Mappa stagione → colore badge + icona */
const SEASON_STYLES: Record<string, { class: string; icon: string }> = {
  "primavera-chiara": { class: "bg-amber-50 text-amber-700 border-amber-200", icon: "🌸" },
  "primavera-calda": { class: "bg-orange-50 text-orange-700 border-orange-200", icon: "🌻" },
  "primavera-brillante": { class: "bg-rose-50 text-rose-700 border-rose-200", icon: "🌺" },
  "estate-chiara": { class: "bg-sky-50 text-sky-700 border-sky-200", icon: "☁️" },
  "estate-fredda": { class: "bg-blue-50 text-blue-700 border-blue-200", icon: "❄️" },
  "estate-tenue": { class: "bg-slate-50 text-slate-600 border-slate-200", icon: "🌫️" },
  "autunno-tenue": { class: "bg-stone-50 text-stone-700 border-stone-200", icon: "🍂" },
  "autunno-caldo": { class: "bg-amber-50 text-amber-800 border-amber-300", icon: "🍁" },
  "autunno-profondo": { class: "bg-red-50 text-red-800 border-red-200", icon: "🌰" },
  "inverno-profondo": { class: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: "🌙" },
  "inverno-freddo": { class: "bg-cyan-50 text-cyan-700 border-cyan-200", icon: "💎" },
  "inverno-brillante": { class: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200", icon: "✨" },
};

/** Tempo relativo (italiano) */
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Adesso";
  if (mins < 60) return `${mins} min fa`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h fa`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Ieri";
  if (days < 7) return `${days} giorni fa`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} sett. fa`;
  return new Date(dateStr).toLocaleDateString("it-IT", { day: "numeric", month: "short" });
}

export default function DossierCard({
  dossier,
  dossierImageUrl,
  index = 0,
}: DossierCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const seasonKey = dossier.classified_season ?? "";
  const seasonLabel = seasonKey.replace("-", " ");
  const style = SEASON_STYLES[seasonKey] ?? { class: "bg-gray-50 text-gray-700 border-gray-200", icon: "🎨" };
  const analysis = dossier.classification_result?.analysis;

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-accent/8 bg-white shadow-xs transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-slide-up"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      {/* Image Section */}
      {dossierImageUrl && (
        <a href={`/dossier/${dossier.id}`} className="relative block aspect-[3/4] w-full overflow-hidden bg-cream-dark">
          {/* Skeleton loader */}
          {!imageLoaded && (
            <div className="absolute inset-0 skeleton" />
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dossierImageUrl}
            alt={`Dossier ${seasonLabel}`}
            className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-[1.03] ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setImageLoaded(true)}
          />
          {/* Hover overlay con azioni rapide */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between opacity-0 transition-all duration-300 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0">
            <span className="rounded-full bg-white/90 backdrop-blur-sm px-4 py-2 text-xs font-semibold text-ink shadow-sm">
              Vedi dettaglio →
            </span>
          </div>
        </a>
      )}

      {/* Content */}
      <div className="p-5">
        {/* Top row: Badge + Actions */}
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${style.class}`}>
            <span className="text-sm">{style.icon}</span>
            {seasonLabel || dossier.status}
          </span>
          <div className="flex items-center gap-1">
            <DeleteDossierButton dossierId={dossier.id} seasonLabel={seasonLabel} variant="icon" />
          </div>
        </div>

        {/* Analysis chips */}
        {analysis && (
          <div className="mt-4 flex flex-wrap gap-2">
            {analysis.undertone && (
              <span className="rounded-lg bg-cream px-2.5 py-1 text-xs text-muted">
                {analysis.undertone}
              </span>
            )}
            {analysis.contrast && (
              <span className="rounded-lg bg-cream px-2.5 py-1 text-xs text-muted">
                {analysis.contrast}
              </span>
            )}
          </div>
        )}

        {/* Date */}
        <p
          className="mt-3 text-xs text-muted-light"
          title={new Date(dossier.created_at).toLocaleString("it-IT")}
        >
          {timeAgo(dossier.created_at)}
        </p>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <a
            href={`/dossier/${dossier.id}`}
            className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-center text-sm font-medium text-white transition-all hover:bg-accent-hover hover:shadow-md"
          >
            Apri dossier
          </a>
          {dossierImageUrl && (
            <a
              href={dossierImageUrl}
              download={`armocromia-dossier-${dossier.id}.png`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/15 text-accent transition-all hover:bg-accent/5 hover:border-accent/25"
              title="Scarica PNG"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
