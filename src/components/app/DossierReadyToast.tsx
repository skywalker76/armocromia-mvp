"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-context";
import { useTranslations } from "@/lib/i18n/translations-context";
import { localePath } from "@/lib/i18n/config";

/**
 * DossierReadyToast — Premium In-App Notification
 * 
 * Un toast animato per notificare l'utente quando l'IA ha completato
 * l'analisi e il dossier è pronto. Include haptic feedback e micro-animazioni.
 */

interface DossierReadyToastProps {
  isOpen: boolean;
  onClose: () => void;
  dossierId?: string;
  autoDismissMs?: number;
}

export default function DossierReadyToast({
  isOpen,
  onClose,
  dossierId = "new",
  autoDismissMs = 8000,
}: DossierReadyToastProps) {
  const locale = useLocale();
  const { t } = useTranslations("app.dossierReady");
  const dossierHref = localePath(locale, `/dossier/${dossierId}`);
  const [isVisible, setIsVisible] = useState(false);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      
      // Trigger haptic feedback when opening
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        // Doppio tap leggero per notifica
        navigator.vibrate([100, 50, 100]);
      }
      
      // Allow DOM to update before triggering animation
      requestAnimationFrame(() => {
        setIsVisible(true);
      });

      // Auto dismiss timer
      if (autoDismissMs > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(onClose, 400); // Wait for exit animation
        }, autoDismissMs);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsRendered(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoDismissMs, onClose]);

  if (!isRendered) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center sm:bottom-8 sm:left-auto sm:right-8 sm:justify-end">
      <div 
        className={`
          relative flex w-full max-w-sm items-start gap-4 overflow-hidden rounded-2xl bg-white p-4 shadow-xl ring-1 ring-black/5
          transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-8 opacity-0 scale-95"}
        `}
      >
        {/* Confetti element (CSS animated) */}
        <div className="absolute -top-2 left-8 h-2 w-2 rounded-full bg-accent/40 [animation:confetti-burst_1.5s_ease-out_forwards]" />
        <div className="absolute top-2 left-12 h-2 w-2 rounded-full bg-accent/20 [animation:confetti-burst_2s_ease-out_forwards]" />
        
        {/* Progress Bar for auto-dismiss */}
        <div className="absolute bottom-0 left-0 h-1 bg-cream-dark w-full">
          <div 
            className="h-full bg-accent"
            style={{ 
              animation: `progress-indeterminate ${autoDismissMs}ms linear forwards` 
            }}
          />
        </div>

        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success-light text-success">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1 pt-0.5">
          <h4 className="font-serif text-lg font-medium text-ink">{t("title")}</h4>
          <p className="mt-1 text-sm text-muted">
            {t("body")}
          </p>
          <div className="mt-3 flex gap-3">
            <Link
              href={dossierHref}
              className="text-sm font-semibold text-accent hover:text-accent-hover transition-colors touch-bounce"
              onClick={() => {
                setIsVisible(false);
                setTimeout(onClose, 400);
              }}
            >
              {t("viewCta")}
            </Link>
          </div>
        </div>

        {/* Close Button */}
        <button 
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 400);
          }}
          className="shrink-0 rounded-lg p-1.5 text-muted-light hover:bg-cream hover:text-ink transition-colors touch-bounce"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
