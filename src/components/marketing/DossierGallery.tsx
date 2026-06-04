"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "@/lib/i18n/translations-context";

interface DossierItem {
  id: string;
  image: string;
  season: string;
  variant: string;
  badge: string;
  gender: "female" | "male";
}

const DOSSIERS: DossierItem[] = [
  {
    id: "autunno-profondo",
    image: "/demo/dossier-real-autunno-profondo.webp",
    season: "autumn",
    variant: "Autunno Profondo",
    badge: "🍂",
    gender: "female",
  },
  {
    id: "inverno-freddo",
    image: "/demo/dossier-real-inverno-freddo.webp",
    season: "winter",
    variant: "Inverno Freddo",
    badge: "❄️",
    gender: "male",
  },
  {
    id: "primavera-calda",
    image: "/demo/dossier-real-primavera-calda.webp",
    season: "spring",
    variant: "Primavera Calda",
    badge: "🌸",
    gender: "female",
  },
  {
    id: "autunno-tenue",
    image: "/demo/dossier-real-autunno-tenue.webp",
    season: "autumn",
    variant: "Autunno Tenue",
    badge: "🍂",
    gender: "female",
  },
];

export default function DossierGallery() {
  const { t } = useTranslations("marketing.dossierGallery");
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  /* Track scroll position for dots */
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const onScroll = () => {
      const scrollLeft = container.scrollLeft;
      const cardWidth = container.firstElementChild
        ? (container.firstElementChild as HTMLElement).offsetWidth +
          24 /* gap */
        : 1;
      setActiveIndex(Math.round(scrollLeft / cardWidth));
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  /* Close lightbox on Escape */
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox]);

  return (
    <>
      {/* Scrollable gallery */}
      <div
        ref={scrollRef}
        className="mt-12 flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 hide-scrollbar"
      >
        {DOSSIERS.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setLightbox(d.image)}
            className="group relative w-[280px] sm:w-[320px] lg:w-[360px] shrink-0 snap-center cursor-pointer"
          >
            <div className="overflow-hidden rounded-2xl border border-black/5 shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:scale-[1.02]">
              <Image
                src={d.image}
                alt={`${t("expandAlt")} — ${d.variant}`}
                width={360}
                height={640}
                className="w-full object-cover"
                sizes="(max-width: 640px) 280px, (max-width: 1024px) 320px, 360px"
              />
            </div>
            {/* Season badge */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full border border-white/40 bg-white/90 px-3 py-1.5 text-xs font-semibold text-ink shadow-md backdrop-blur-md">
              <span>{d.badge}</span>
              <span>{d.variant}</span>
            </div>
            {/* Male badge */}
            {d.gender === "male" && (
              <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full border border-white/40 bg-white/90 px-2.5 py-1.5 text-xs font-medium text-muted shadow-md backdrop-blur-md">
                👔 {t("badgeMale")}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Dots indicator */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {DOSSIERS.map((d, i) => (
          <button
            key={d.id}
            type="button"
            onClick={() => {
              scrollRef.current?.children[i]?.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
                inline: "center",
              });
            }}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === activeIndex
                ? "w-6 bg-accent"
                : "w-2 bg-accent/25 hover:bg-accent/40"
            }`}
            aria-label={`${d.variant}`}
          />
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm sm:p-8"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="fixed right-4 top-4 z-[60] flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink shadow-lg backdrop-blur-md transition-transform hover:scale-110"
            aria-label={t("closeAlt")}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
          <div
            className="relative max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={lightbox}
              alt={t("expandAlt")}
              width={800}
              height={1400}
              className="w-full rounded-xl shadow-2xl"
              priority
            />
          </div>
        </div>
      )}
    </>
  );
}
