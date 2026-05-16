"use client";

import { useState, useRef } from "react";
import { useTranslations } from "@/lib/i18n/translations-context";

/**
 * SeasonCarousel — Esplorazione interattiva delle 4 macro-stagioni.
 *
 * Client Component per interattività (accordion, swipe).
 * I dati visuali (colori, gradient, icona) sono constants nel codice; le
 * stringhe (nome, tagline, sottotono, metalli) arrivano dal dictionary.
 */

type SeasonId = "spring" | "summer" | "autumn" | "winter";

const SEASON_IDS: SeasonId[] = ["spring", "summer", "autumn", "winter"];

const SEASON_VISUALS: Record<SeasonId, { colors: string[]; gradient: string; icon: string }> = {
  spring: {
    colors: ["#FFD700", "#FF7F50", "#98FB98", "#FFDAB9", "#40E0D0"],
    gradient: "from-amber-100 via-rose-50 to-orange-50",
    icon: "🌸",
  },
  summer: {
    colors: ["#B0C4DE", "#DDA0DD", "#C0C0C0", "#E6E6FA", "#778899"],
    gradient: "from-blue-50 via-purple-50 to-slate-100",
    icon: "🌊",
  },
  autumn: {
    colors: ["#C27C5C", "#8B4513", "#B97A6A", "#6B4423", "#DEB887"],
    gradient: "from-orange-50 via-amber-50 to-yellow-50",
    icon: "🍂",
  },
  winter: {
    colors: ["#1B365D", "#2C2C2C", "#4A0E4E", "#87CEEB", "#C0C0C0"],
    gradient: "from-slate-100 via-blue-50 to-indigo-50",
    icon: "❄️",
  },
};

interface SeasonCopy {
  name: string;
  tagline: string;
  undertone: string;
  metals: string;
}

export default function SeasonCarousel() {
  const { t, raw } = useTranslations("marketing.seasons");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [visibleIndex, setVisibleIndex] = useState(0);

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      // Assume each card takes ~85vw + gap, we estimate the index
      const cardWidth = window.innerWidth * 0.85;
      const index = Math.round(scrollLeft / cardWidth);
      setVisibleIndex(Math.min(Math.max(index, 0), SEASON_IDS.length - 1));
    }
  };

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="mt-14 flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-4 pb-4 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible"
      >
      {SEASON_IDS.map((id, i) => {
        const isActive = activeIndex === i;
        const visual = SEASON_VISUALS[id];
        const copy = raw<SeasonCopy>(`list.${id}`);

        return (
          <button
            key={id}
            onClick={() => setActiveIndex(isActive ? null : i)}
            className={`
              snap-center shrink-0 w-[85vw] sm:w-auto sm:min-w-0
              group relative overflow-hidden rounded-2xl border text-left
              transition-all duration-500 ease-out
              ${isActive
                ? "border-accent/20 bg-white shadow-lg ring-1 ring-accent/10"
                : "border-accent/8 bg-white/60 hover:border-accent/15 hover:bg-white hover:shadow-md"
              }
            `}
          >
            {/* Top gradient bar */}
            <div className={`h-1.5 bg-gradient-to-r ${visual.gradient} transition-all duration-300 ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60"}`} />

            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{visual.icon}</span>
                  <h3 className="font-serif text-xl text-ink">{copy.name}</h3>
                </div>
                <svg
                  className={`h-4 w-4 text-muted-light transition-transform duration-300 ${isActive ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>

              <p className="mt-2 text-sm text-muted">{copy.tagline}</p>

              {/* Expandable content */}
              <div
                className={`overflow-hidden transition-all duration-500 ease-out ${isActive ? "mt-5 max-h-[300px] opacity-100" : "mt-0 max-h-0 opacity-0"}`}
              >
                {/* Palette */}
                <div className="flex gap-1.5 mb-5">
                  {visual.colors.map((c, j) => (
                    <div
                      key={j}
                      className="h-10 flex-1 rounded-lg first:rounded-l-xl last:rounded-r-xl shadow-inner transition-transform hover:scale-105"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                {/* Details */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-light">{t("undertoneLabel")}</span>
                    <span className="font-medium text-ink">{copy.undertone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-light">{t("metalsLabel")}</span>
                    <span className="font-medium text-ink">{copy.metals}</span>
                  </div>
                </div>

                {/* Mini CTA */}
                <div className="mt-5 flex items-center gap-2 text-sm font-medium text-accent">
                  {t("discoverPrefix")} {copy.name}
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </div>
            </div>
          </button>
        );
      })}
      </div>

      {/* Mobile Swipe Hint */}
      <div className="sm:hidden flex justify-center mt-2 mb-4">
        <span className="text-xs text-muted-light flex items-center gap-2 swipe-hint-animation">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          {t("swipeHint")}
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </span>
      </div>

      {/* Mobile Dots Indicator */}
      <div className="mt-4 flex justify-center gap-2 sm:hidden">
        {SEASON_IDS.map((id, i) => (
          <div
            key={`dot-${id}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === visibleIndex ? "w-6 bg-accent" : "w-2 bg-accent/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
