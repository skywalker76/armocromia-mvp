"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale } from "@/lib/i18n/locale-context";
import { localePath } from "@/lib/i18n/config";

/**
 * DossierShowcase — Interactive demo gallery.
 *
 * Mostra i 3 dossier di esempio con tab per navigare tra le stagioni.
 * Client Component per interattività (tab switch, hover).
 */

interface DemoSeason {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  palette: string[];
  features: string[];
}

const DEMO_SEASONS: DemoSeason[] = [
  {
    id: "spring",
    name: "Primavera",
    subtitle: "Luminosità e freschezza",
    image: "/demo/dossier-spring.png",
    palette: ["#FF7F7F", "#FFDAB9", "#E6E6FA", "#98FB98", "#FFD700", "#40E0D0", "#FFC0CB", "#F0E68C"],
    features: ["Palette fresca e vivace", "Oro giallo e rosa", "Outfit in corallo e pesca"],
  },
  {
    id: "summer",
    name: "Estate",
    subtitle: "Delicata, fredda e smorzata",
    image: "/demo/dossier-summer.png",
    palette: ["#B0C4DE", "#DDA0DD", "#C0C0C0", "#E6E6FA", "#778899", "#87CEEB", "#D8BFD8", "#A9A9C8"],
    features: ["Palette soft e polverosa", "Argento e oro bianco", "Outfit in lavanda e grigio perla"],
  },
  {
    id: "autumn",
    name: "Autunno",
    subtitle: "Tonalità calde e avvolgenti",
    image: "/demo/dossier-autumn.png",
    palette: ["#C27C5C", "#8B4513", "#B97A6A", "#D4A76A", "#6B4423", "#C9956B", "#DEB887", "#A0522D"],
    features: ["Palette terra e speziata", "Ori caldi e bronzo", "Outfit in cognac e cammello"],
  },
  {
    id: "winter",
    name: "Inverno",
    subtitle: "Contrasti netti e definiti",
    image: "/demo/dossier-winter.png",
    palette: ["#1B365D", "#2C2C2C", "#4A0E4E", "#0B3D2E", "#87CEEB", "#C0C0C0", "#2F4F4F", "#191970"],
    features: ["Palette fredda e brillante", "Argento e platino", "Outfit in blu e nero puro"],
  },
];

import { useSwipe } from "@/hooks/useSwipe";

export default function DossierShowcase() {
  const locale = useLocale();
  const loginHref = localePath(locale, "/auth/login");
  const [activeIndex, setActiveIndex] = useState(0);
  const active = DEMO_SEASONS[activeIndex];

  const swipeHandlers = useSwipe({
    onSwipeLeft: () => setActiveIndex((prev) => Math.min(prev + 1, DEMO_SEASONS.length - 1)),
    onSwipeRight: () => setActiveIndex((prev) => Math.max(prev - 1, 0)),
  });

  return (
    <div className="mt-16" {...swipeHandlers}>
      {/* Tab selector */}
      <div className="flex justify-center gap-2 mb-10">
        {DEMO_SEASONS.map((season, i) => (
          <button
            key={season.id}
            onClick={() => setActiveIndex(i)}
            className={`
              relative rounded-xl px-6 py-3 text-sm font-medium transition-all duration-300
              ${i === activeIndex
                ? "bg-accent text-white shadow-lg"
                : "bg-white text-muted hover:bg-cream-dark hover:text-ink border border-accent/10"
              }
            `}
          >
            {season.name}
            {i === activeIndex && (
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-6 rounded-full bg-accent/50" />
            )}
          </button>
        ))}
      </div>

      {/* Swipe hint for mobile */}
      <div className="md:hidden flex justify-center mb-6">
        <span className="text-xs text-muted-light flex items-center gap-2 swipe-hint-animation">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Scorri per navigare
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </span>
      </div>

      {/* Content grid */}
      <div className="grid items-center gap-10 lg:grid-cols-5 lg:gap-14">
        {/* Left — Dossier image (3 col) */}
        <div className="lg:col-span-3 relative">
          <div className="relative overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/5 transition-all duration-500">
            <Image
              src={active.image}
              alt={`Dossier di esempio — ${active.name}`}
              width={800}
              height={1000}
              className="w-full transition-opacity duration-300"
            />
          </div>

          {/* Floating season badge */}
          <div className="absolute top-4 right-4 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-accent shadow-md backdrop-blur-sm">
            {active.name}
          </div>
        </div>

        {/* Right — Details (2 col) */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h3 className="font-serif text-2xl text-ink">{active.name}</h3>
            <p className="mt-2 text-muted">{active.subtitle}</p>
          </div>

          {/* Color palette preview */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-light mb-3">
              Palette colori
            </p>
            <div className="flex gap-2">
              {active.palette.map((color, i) => (
                <div
                  key={`${active.id}-${i}`}
                  className="group relative h-12 flex-1 rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-lg cursor-pointer first:rounded-l-2xl last:rounded-r-2xl"
                  style={{ backgroundColor: color }}
                >
                  <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2 py-0.5 text-[10px] font-mono text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {color}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-light mb-3">
              Il dossier include
            </p>
            <ul className="space-y-3">
              {active.features.map((f) => (
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
            Scopri la tua stagione
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </div>
      </div>
      
      {/* Mobile Dots Indicator */}
      <div className="mt-8 flex justify-center gap-2 lg:hidden">
        {DEMO_SEASONS.map((season, i) => (
          <button
            key={`dot-${season.id}`}
            onClick={() => setActiveIndex(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === activeIndex ? "w-6 bg-accent" : "w-2 bg-accent/20"
            }`}
            aria-label={`Vai alla stagione ${season.name}`}
          />
        ))}
      </div>
    </div>
  );
}
