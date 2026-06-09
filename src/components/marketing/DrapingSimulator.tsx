"use client";

import React, { useState, memo } from "react";
import Image from "next/image";
import { useTranslations } from "@/lib/i18n/translations-context";

/**
 * DrapingSimulator — il "draping" interattivo, cuore dell'armocromia.
 *
 * Stesso viso, drappo di colore che cambia: l'incarnato si illumina con i toni
 * giusti e si spegne con quelli sbagliati. L'effetto è ottenuto componendo, sul
 * ritratto AI (luce neutra), un drappo colorato + un riflesso del colore sulla
 * pelle (mix-blend) + un micro-grading (saturazione/luminosità) coerente col
 * verdetto. Onesto ed educativo: l'esempio mostra UNA carnagione; i colori di
 * OGNI persona si scoprono col dossier (CTA).
 *
 * Accessibile: swatch = <button> con aria-pressed; il drappo/riflesso sono
 * decorativi (aria-hidden). Una sola immagine (~39KB webp), nessun priority.
 * Testi via i18n (marketing.draping).
 */

// hex + verdetto restano nel codice; i nomi arrivano dall'i18n (per indice).
// Esempio calibrato sul ritratto: i toni caldi e ricchi valorizzano, i toni
// freddi e pallidi spengono.
const DRAPES: { hex: string; flatters: boolean }[] = [
  { hex: "#C2410C", flatters: true },
  { hex: "#C99700", flatters: true },
  { hex: "#4D7C0F", flatters: true },
  { hex: "#DB2777", flatters: false },
  { hex: "#8FD3F4", flatters: false },
  { hex: "#B7A7E6", flatters: false },
];

const DrapingSimulatorBase: React.FC = () => {
  const { t, raw } = useTranslations("marketing.draping");
  const names = raw<string[]>("drapes");
  const [active, setActive] = useState<number>(0);
  const drape = DRAPES[active];

  return (
    <div className="mx-auto w-full max-w-4xl rounded-3xl border border-accent/8 bg-white/40 p-6 shadow-lg backdrop-blur-md sm:p-10">
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
        {/* ── Stage: viso + drappo + riflesso ── */}
        <div className="mx-auto w-full max-w-[368px]">
          <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-accent/8 bg-[#e9e7e4] shadow-xl">
            {/* Ritratto base (luce neutra) */}
            <Image
              src="/demo/draping-face-eu.webp"
              alt={t("imageAlt")}
              fill
              sizes="368px"
              className="object-cover object-top transition-[filter] duration-500"
              style={{
                filter: drape.flatters
                  ? "saturate(1.08) brightness(1.03) contrast(1.02)"
                  : "saturate(0.86) brightness(0.97) contrast(0.99)",
              }}
            />

            {/* Riflesso del colore sull'incarnato (bounce light) */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 transition-opacity duration-500"
              style={{
                background: `radial-gradient(85% 52% at 50% 94%, ${drape.hex} 0%, transparent 66%)`,
                mixBlendMode: "soft-light",
                opacity: drape.flatters ? 0.5 : 0.6,
              }}
            />
            {/* Velo di "spegnimento" per i toni che non valorizzano */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-slate-500 transition-opacity duration-500"
              style={{ mixBlendMode: "saturation", opacity: drape.flatters ? 0 : 0.35 }}
            />

            {/* Drappo di tessuto sulle spalle/petto */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] transition-colors duration-500"
              style={{
                backgroundColor: drape.hex,
                clipPath: "polygon(0% 18%, 50% 42%, 100% 18%, 100% 100%, 0% 100%)",
                boxShadow: "inset 0 8px 24px rgba(0,0,0,0.18)",
              }}
            />

            {/* Verdetto */}
            <div className="absolute left-3 top-3 z-10">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold shadow-sm backdrop-blur-md ${
                  drape.flatters
                    ? "bg-success/15 text-success ring-1 ring-success/25"
                    : "bg-ink/10 text-ink/70 ring-1 ring-ink/15"
                }`}
              >
                {drape.flatters ? (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    {t("flatters")}
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                    {t("dims")}
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* ── Controlli + copy ── */}
        <div>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
            {t("eyebrow")}
          </span>
          <h3 className="mt-2 font-serif text-2xl text-ink">{t("title")}</h3>
          <p className="mt-3 text-xs leading-relaxed text-muted-light">{t("lead")}</p>

          {/* Swatches */}
          <div className="mt-6 grid grid-cols-3 gap-3" role="group" aria-label={t("pickLabel")}>
            {DRAPES.map((d, i) => {
              const isActive = i === active;
              const name = names?.[i] ?? "";
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-pressed={isActive}
                  aria-label={`${name} — ${d.flatters ? t("flatters") : t("dims")}`}
                  className={`group flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition-all duration-200 ${
                    isActive
                      ? "border-accent/40 bg-white shadow-sm ring-1 ring-accent/20"
                      : "border-accent/10 bg-white/50 hover:border-accent/25 hover:bg-white"
                  }`}
                >
                  <span
                    className="h-11 w-11 rounded-full shadow-inner ring-1 ring-black/5 transition-transform duration-200 group-hover:scale-105"
                    style={{ backgroundColor: d.hex }}
                  />
                  <span className="text-[10px] font-medium leading-tight text-muted">{name}</span>
                </button>
              );
            })}
          </div>

          {/* CTA tie-in */}
          <div className="mt-6 pt-4 border-t border-accent/5">
            <p className="text-[11px] leading-relaxed text-muted-light">
              <span className="font-semibold text-ink">{t("ctaTitle")}</span> {t("ctaBody")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DrapingSimulator = memo(DrapingSimulatorBase);
