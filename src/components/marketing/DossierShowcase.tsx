"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale } from "@/lib/i18n/locale-context";
import { useTranslations } from "@/lib/i18n/translations-context";
import { localePath } from "@/lib/i18n/config";
import { useSwipe } from "@/hooks/useSwipe";

/**
 * DossierShowcase — Interactive demo gallery.
 *
 * Client Component per interattività (tab switch, swipe).
 * I dati cromatici (hex palette) sono constants nel codice — il dictionary
 * contiene solo le stringhe traducibili (name, subtitle, features).
 */

type SeasonId = "spring" | "summer" | "autumn" | "winter";

const SEASON_IDS: SeasonId[] = ["spring", "summer", "autumn", "winter"];

const SEASON_VISUALS: Record<SeasonId, { image: string; palette: string[] }> = {
  spring: {
    image: "/demo/dossier-spring.png",
    palette: ["#FF7F7F", "#FFDAB9", "#E6E6FA", "#98FB98", "#FFD700", "#40E0D0", "#FFC0CB", "#F0E68C"],
  },
  summer: {
    image: "/demo/dossier-summer.png",
    palette: ["#B0C4DE", "#DDA0DD", "#C0C0C0", "#E6E6FA", "#778899", "#87CEEB", "#D8BFD8", "#A9A9C8"],
  },
  autumn: {
    image: "/demo/dossier-autumn.png",
    palette: ["#C27C5C", "#8B4513", "#B97A6A", "#D4A76A", "#6B4423", "#C9956B", "#DEB887", "#A0522D"],
  },
  winter: {
    image: "/demo/dossier-winter.png",
    palette: ["#1B365D", "#2C2C2C", "#4A0E4E", "#0B3D2E", "#87CEEB", "#C0C0C0", "#2F4F4F", "#191970"],
  },
};

const SEASON_GLOWS: Record<SeasonId, string> = {
  spring: "from-amber-200/35 via-rose-200/15 to-transparent",
  summer: "from-purple-200/25 via-blue-200/15 to-transparent",
  autumn: "from-orange-300/25 via-amber-900/5 to-transparent",
  winter: "from-blue-950/40 via-slate-900/5 to-transparent",
};

interface DemoCopy {
  name: string;
  subtitle: string;
  features: string[];
}

export default function DossierShowcase() {
  const locale = useLocale();
  const { t, raw } = useTranslations("marketing.showcase");
  const loginHref = localePath(locale, "/auth/login");
  const [activeIndex, setActiveIndex] = useState(0);

  const activeId = SEASON_IDS[activeIndex];
  const activeVisual = SEASON_VISUALS[activeId];
  const activeCopy = raw<DemoCopy>(`demos.${activeId}`);

  const swipeHandlers = useSwipe({
    onSwipeLeft: () => setActiveIndex((prev) => Math.min(prev + 1, SEASON_IDS.length - 1)),
    onSwipeRight: () => setActiveIndex((prev) => Math.max(prev - 1, 0)),
  });

  return (
    <div className="mt-16" {...swipeHandlers}>
      {/* Tab selector */}
      <div className="flex justify-center gap-2 mb-10">
        {SEASON_IDS.map((id, i) => {
          const copy = raw<DemoCopy>(`demos.${id}`);
          return (
            <button
              key={id}
              onClick={() => setActiveIndex(i)}
              className={`
                relative rounded-xl px-6 py-3 text-sm font-medium transition-all duration-300
                ${i === activeIndex
                  ? "bg-accent text-white shadow-lg"
                  : "bg-white text-muted hover:bg-cream-dark hover:text-ink border border-accent/10"
                }
              `}
            >
              {copy.name}
              {i === activeIndex && (
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-6 rounded-full bg-accent/50" />
              )}
            </button>
          );
        })}
      </div>

      {/* Swipe hint for mobile */}
      <div className="md:hidden flex justify-center mb-6">
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

      {/* Content grid */}
      <div className="grid items-center gap-10 lg:grid-cols-5 lg:gap-14">
        {/* Left — Dossier image (3 col) */}
        <div className="lg:col-span-3 relative px-4 sm:px-0 flex justify-center items-center">
          {/* Glowing Aura Ambient Background */}
          <div
            className={`absolute -inset-4 sm:-inset-10 -z-10 rounded-[3rem] bg-gradient-to-tr blur-3xl opacity-75 transition-all duration-700 ${SEASON_GLOWS[activeId]}`}
          />

          {/* Underlay card 2 (Editorial pile) */}
          <div className="absolute inset-0 rounded-2xl border border-black/5 bg-cream/35 shadow-md rotate-3 scale-[0.97] opacity-55 translate-x-3 translate-y-2 pointer-events-none transition-all duration-500" />
          
          {/* Underlay card 1 (Editorial pile) */}
          <div className="absolute inset-0 rounded-2xl border border-black/5 bg-cream-dark/40 shadow-lg -rotate-2 scale-[0.99] opacity-75 -translate-x-2 pointer-events-none transition-all duration-500" />

          {/* Active Main Card */}
          <div className="relative w-full overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/5 transition-all duration-500 hover:scale-[1.01] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] group/card">
            {/* Elegant glass reflection overlay */}
            <div className="absolute inset-0 z-10 bg-gradient-to-tr from-white/0 via-white/10 to-white/20 pointer-events-none opacity-0 group-hover/card:opacity-100 transition-opacity duration-700" />
            
            <Image
              src={activeVisual.image}
              alt={`${t("imageAltPrefix")} — ${activeCopy.name}`}
              width={800}
              height={1000}
              className="w-full object-cover transition-opacity duration-300"
            />
          </div>

          {/* Floating season badge */}
          <div className="absolute top-6 right-8 rounded-full border border-white/40 bg-white/95 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-accent shadow-lg backdrop-blur-md z-20">
            {activeCopy.name}
          </div>
        </div>

        {/* Right — Details (2 col) */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h3 className="font-serif text-2xl text-ink">{activeCopy.name}</h3>
            <p className="mt-2 text-muted">{activeCopy.subtitle}</p>
          </div>

          {/* Color palette preview */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-light mb-3">
              {t("paletteLabel")}
            </p>
            <div className="flex gap-2.5">
              {activeVisual.palette.map((color, i) => (
                <div
                  key={`${activeId}-${i}`}
                  className="group relative h-12 flex-1 rounded-xl transition-all duration-300 hover:scale-115 hover:shadow-lg cursor-pointer first:rounded-l-2xl last:rounded-r-2xl border border-white/20 ring-1 ring-black/5 shadow-sm"
                  style={{ 
                    backgroundColor: color,
                    boxShadow: "inset 0 2px 4px rgba(255,255,255,0.15), 0 2px 4px rgba(0,0,0,0.05)"
                  }}
                >
                  {/* Subtle inner card metallic gloss sheen */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
                  
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2.5 py-1 text-[10px] font-mono text-white opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 shadow-md z-30">
                    {color}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-light mb-3">
              {t("includesLabel")}
            </p>
            <ul className="space-y-3">
              {activeCopy.features.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-ink/80">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/10">
                    <svg className="h-3.5 w-3.5 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </div>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <a
            href={loginHref}
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent-hover px-6 py-3.5 text-sm font-medium text-white shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
          >
            {t("cta")}
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </div>
      </div>

      {/* Mobile Dots Indicator */}
      <div className="mt-8 flex justify-center gap-2 lg:hidden">
        {SEASON_IDS.map((id, i) => {
          const copy = raw<DemoCopy>(`demos.${id}`);
          return (
            <button
              key={`dot-${id}`}
              onClick={() => setActiveIndex(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === activeIndex ? "w-6 bg-accent" : "w-2 bg-accent/20"
              }`}
              aria-label={`${t("dotAriaPrefix")} ${copy.name}`}
            />
          );
        })}
      </div>
    </div>
  );
}
