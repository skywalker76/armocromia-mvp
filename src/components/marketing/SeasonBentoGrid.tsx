"use client";

import React, { useState, memo } from "react";
import { useTranslations } from "@/lib/i18n/translations-context";

/**
 * SeasonBentoGrid — esploratore delle 4 stagioni in formato bento.
 *
 * Click su una card → si espandono i 12 sotto-gruppi con campioni colore reali.
 * Stile e swatch (hex) vivono qui per id stagione; i testi arrivano dall'i18n
 * (marketing.seasonsBento), zippati per indice. Card = <button> accessibile.
 */

interface BentoSubgroupCopy {
  name: string;
  desc: string;
}
interface BentoSeasonCopy {
  name: string;
  tagline: string;
  temp: string;
  contrast: string;
  intensity: string;
  subgroups: BentoSubgroupCopy[];
}

interface SeasonStyle {
  bgGradient: string;
  textColor: string;
  /** una terna di swatch per ciascuno dei 3 sotto-gruppi */
  swatches: string[][];
}

const SEASON_ORDER = ["primavera", "estate", "autunno", "inverno"] as const;

const SEASON_STYLE: Record<string, SeasonStyle> = {
  primavera: {
    bgGradient: "from-amber-100/80 via-orange-100/50 to-cream",
    textColor: "text-amber-900",
    swatches: [
      ["#FBCFE8", "#FED7AA", "#A7F3D0", "#FEF08A"],
      ["#F59E0B", "#F97316", "#EF4444", "#10B981"],
      ["#EC4899", "#F43F5E", "#10B981", "#06B6D4"],
    ],
  },
  estate: {
    bgGradient: "from-indigo-100/80 via-purple-50/50 to-cream",
    textColor: "text-indigo-900",
    swatches: [
      ["#E0E7FF", "#FCE7F3", "#CCFBF1", "#F3E8FF"],
      ["#818CF8", "#EC4899", "#06B6D4", "#94A3B8"],
      ["#A5B4FC", "#F472B6", "#2DD4BF", "#CBD5E1"],
    ],
  },
  autunno: {
    bgGradient: "from-amber-200/60 via-orange-100/40 to-cream",
    textColor: "text-amber-950",
    swatches: [
      ["#78350F", "#7C2D12", "#166534", "#9A3412"],
      ["#B45309", "#D97706", "#15803D", "#C2410C"],
      ["#D97706", "#A16207", "#4D7C0F", "#B45309"],
    ],
  },
  inverno: {
    bgGradient: "from-rose-100/80 via-blue-100/50 to-cream",
    textColor: "text-rose-950",
    swatches: [
      ["#1E3A8A", "#581C87", "#9F1239", "#0284C7"],
      ["#2563EB", "#7C3AED", "#BE185D", "#475569"],
      ["#06B6D4", "#D946EF", "#E11D48", "#0F172A"],
    ],
  },
};

const SeasonBentoGridBase: React.FC = () => {
  const { t, raw } = useTranslations("marketing.seasonsBento");
  const [activeSeason, setActiveSeason] = useState<string | null>(null);

  return (
    <div className="mt-12 grid gap-6 md:grid-cols-2">
      {SEASON_ORDER.map((id) => {
        const copy = raw<BentoSeasonCopy>(`seasons.${id}`);
        const style = SEASON_STYLE[id];
        const isOpen = activeSeason === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setActiveSeason(isOpen ? null : id)}
            aria-expanded={isOpen}
            className={`group relative overflow-hidden rounded-3xl border border-accent/8 p-8 text-left transition-all duration-500 ${
              isOpen
                ? "bg-gradient-to-br shadow-lg ring-1 ring-accent/20 " + style.bgGradient
                : "bg-white/50 hover:bg-white hover:shadow-md"
            }`}
          >
            <div className="flex h-full flex-col justify-between space-y-6">
              <div>
                <div className="flex items-start justify-between">
                  <h3 className={`font-serif text-2xl font-medium ${style.textColor}`}>{copy.name}</h3>
                  <span className="rounded-full bg-cream-dark/40 px-2.5 py-1 text-[10px] uppercase tracking-widest text-muted-light">
                    {t("tagLabel")}
                  </span>
                </div>
                <p className="mt-3 max-w-[45ch] text-sm leading-relaxed text-muted-light">{copy.tagline}</p>
              </div>

              {/* Metriche */}
              <div className="grid grid-cols-3 border-t border-accent/8 pt-4 text-xs">
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-muted-light">{t("metricTemp")}</span>
                  <span className={`mt-1 block font-semibold ${style.textColor}`}>{copy.temp}</span>
                </div>
                <div className="border-x border-accent/8 px-4">
                  <span className="block text-[10px] uppercase tracking-wider text-muted-light">{t("metricContrast")}</span>
                  <span className={`mt-1 block font-semibold ${style.textColor}`}>{copy.contrast}</span>
                </div>
                <div className="pl-4">
                  <span className="block text-[10px] uppercase tracking-wider text-muted-light">{t("metricIntensity")}</span>
                  <span className={`mt-1 block font-semibold ${style.textColor}`}>{copy.intensity}</span>
                </div>
              </div>

              {/* Sotto-gruppi (reveal) */}
              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  isOpen ? "mt-4 max-h-[360px] opacity-100" : "pointer-events-none max-h-0 opacity-0"
                }`}
              >
                <div className="space-y-4 border-t border-accent/12 pt-4">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-light">
                    {t("subgroupsLabel")}
                  </span>
                  <div className="space-y-4">
                    {copy.subgroups.map((sub, i) => (
                      <div
                        key={i}
                        className="flex flex-col justify-between gap-3 rounded-xl bg-white/60 p-3 sm:flex-row sm:items-center"
                      >
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-ink">{sub.name}</span>
                          <p className="max-w-[30ch] text-[10px] leading-normal text-muted-light">{sub.desc}</p>
                        </div>
                        <div className="flex gap-1.5 self-start sm:self-center">
                          {style.swatches[i]?.map((hex, j) => (
                            <span
                              key={j}
                              className="h-5 w-5 rounded-full border border-ink/5 shadow-xs transition-transform duration-300 hover:scale-125"
                              style={{ backgroundColor: hex }}
                              title={hex}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hint */}
              <div className="flex justify-end pt-2 text-[10px] font-medium text-muted-light/60 transition-colors group-hover:text-accent">
                {isOpen ? t("collapseHint") : t("expandHint")}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export const SeasonBentoGrid = memo(SeasonBentoGridBase);
