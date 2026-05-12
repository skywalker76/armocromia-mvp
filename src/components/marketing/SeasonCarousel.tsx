"use client";

import { useState, useRef } from "react";

/**
 * SeasonCarousel — Esplorazione interattiva delle 4 macro-stagioni.
 *
 * Accordion image slider: le stagioni si espandono al click/hover.
 * Client Component per interattività.
 */

interface Season {
  name: string;
  tagline: string;
  undertone: string;
  colors: string[];
  gradient: string;
  metals: string;
  icon: string;
}

const SEASONS: Season[] = [
  {
    name: "Primavera",
    tagline: "Luminosa, calda e vivace",
    undertone: "Caldo dorato",
    colors: ["#FFD700", "#FF7F50", "#98FB98", "#FFDAB9", "#40E0D0"],
    gradient: "from-amber-100 via-rose-50 to-orange-50",
    metals: "Oro giallo, Oro rosa",
    icon: "🌸",
  },
  {
    name: "Estate",
    tagline: "Delicata, fredda e smorzata",
    undertone: "Freddo rosato",
    colors: ["#B0C4DE", "#DDA0DD", "#C0C0C0", "#E6E6FA", "#778899"],
    gradient: "from-blue-50 via-purple-50 to-slate-100",
    metals: "Argento, Oro bianco",
    icon: "🌊",
  },
  {
    name: "Autunno",
    tagline: "Ricco, caldo e profondo",
    undertone: "Caldo dorato",
    colors: ["#C27C5C", "#8B4513", "#B97A6A", "#6B4423", "#DEB887"],
    gradient: "from-orange-50 via-amber-50 to-yellow-50",
    metals: "Oro giallo, Bronzo, Rame",
    icon: "🍂",
  },
  {
    name: "Inverno",
    tagline: "Deciso, freddo e contrastato",
    undertone: "Freddo bluastro",
    colors: ["#1B365D", "#2C2C2C", "#4A0E4E", "#87CEEB", "#C0C0C0"],
    gradient: "from-slate-100 via-blue-50 to-indigo-50",
    metals: "Argento, Platino",
    icon: "❄️",
  },
];

export default function SeasonCarousel() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [visibleIndex, setVisibleIndex] = useState(0);

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      // Assume each card takes ~85vw + gap, we estimate the index
      const cardWidth = window.innerWidth * 0.85;
      const index = Math.round(scrollLeft / cardWidth);
      setVisibleIndex(Math.min(Math.max(index, 0), SEASONS.length - 1));
    }
  };

  return (
    <div className="relative">
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="mt-14 flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-4 pb-4 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible"
      >
      {SEASONS.map((season, i) => {
        const isActive = activeIndex === i;

        return (
          <button
            key={season.name}
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
            <div className={`h-1.5 bg-gradient-to-r ${season.gradient} transition-all duration-300 ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60"}`} />

            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{season.icon}</span>
                  <h3 className="font-serif text-xl text-ink">{season.name}</h3>
                </div>
                <svg
                  className={`h-4 w-4 text-muted-light transition-transform duration-300 ${isActive ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>

              <p className="mt-2 text-sm text-muted">{season.tagline}</p>

              {/* Expandable content */}
              <div
                className={`overflow-hidden transition-all duration-500 ease-out ${isActive ? "mt-5 max-h-[300px] opacity-100" : "mt-0 max-h-0 opacity-0"}`}
              >
                {/* Palette */}
                <div className="flex gap-1.5 mb-5">
                  {season.colors.map((c, j) => (
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
                    <span className="text-muted-light">Sottotono</span>
                    <span className="font-medium text-ink">{season.undertone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-light">Metalli</span>
                    <span className="font-medium text-ink">{season.metals}</span>
                  </div>
                </div>

                {/* Mini CTA */}
                <div className="mt-5 flex items-center gap-2 text-sm font-medium text-accent">
                  Scopri se sei {season.name}
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
          Scorri per scoprire
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </span>
      </div>

      {/* Mobile Dots Indicator */}
      <div className="mt-4 flex justify-center gap-2 sm:hidden">
        {SEASONS.map((season, i) => (
          <div
            key={`dot-${season.name}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === visibleIndex ? "w-6 bg-accent" : "w-2 bg-accent/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
