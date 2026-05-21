"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/locale-context";
import { locales, localeNames, localeFlags, type Locale, isValidLocale } from "@/lib/i18n/config";

/**
 * Selettore di lingua premium (LocaleSwitcher) in stile "Editorial Luxury".
 *
 * Why: Fornisce all'utente l'abilità di passare fluidamente tra IT, EN ed ES
 * preservando il pathname corrente, impostando un cookie persistente NEXT_LOCALE
 * per il proxy, e offrendo un design premium con animazioni e glassmorphism.
 */
export default function LocaleSwitcher() {
  const currentLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Chiudi dropdown al click esterno
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === currentLocale) {
      setIsOpen(false);
      return;
    }

    // Salva la scelta nel cookie per il proxy
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

    // Ricostruisci il pathname preservando la rotta
    const segments = pathname.split("/");
    if (segments.length > 1 && isValidLocale(segments[1])) {
      segments[1] = newLocale;
    } else {
      // Fallback nel caso in cui non ci sia il locale nel pathname (non dovrebbe accadere per via del proxy)
      segments.unshift("", newLocale);
    }

    const newPath = segments.join("/");
    setIsOpen(false);
    
    // Refresh della rotta per aggiornare lo stato server
    router.push(newPath);
    router.refresh();
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border border-accent/10 bg-white/70 px-3 py-1.5 text-sm font-medium text-ink backdrop-blur-md transition-all hover:bg-cream hover:border-accent/20 active:scale-98 shadow-sm"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="text-base select-none">{localeFlags[currentLocale]}</span>
        <span className="uppercase tracking-wider text-xs font-semibold">{currentLocale}</span>
        <svg
          className={`h-3 w-3 text-muted-light transition-transform duration-300 ease-out ${
            isOpen ? "rotate-180 text-accent" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={3}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-40 origin-top-right rounded-xl border border-accent/10 bg-white py-1.5 shadow-lg ring-1 ring-black/5 animate-slide-down focus:outline-none">
          <div className="px-3 py-1 border-b border-accent/8 mb-1">
            <span className="text-[10px] font-bold tracking-widest text-muted-light uppercase">
              Lingua / Language
            </span>
          </div>
          {locales.map((locale) => {
            const isSelected = locale === currentLocale;
            return (
              <button
                key={locale}
                onClick={() => handleLocaleChange(locale)}
                className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-sm transition-colors ${
                  isSelected
                    ? "bg-cream text-accent font-semibold"
                    : "text-ink hover:bg-cream-light hover:text-accent-dark"
                }`}
                role="menuitem"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base select-none">{localeFlags[locale]}</span>
                  <span className="font-medium text-xs tracking-wide">{localeNames[locale]}</span>
                </div>
                {isSelected && (
                  <svg
                    className="h-3.5 w-3.5 text-accent animate-fade-in"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
