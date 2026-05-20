"use client";

import { useState, useEffect } from "react";
import { ZoomIn, ZoomOut, RotateCcw, X } from "lucide-react";

interface DossierImageProps {
  src: string;
  alt: string;
}

export default function DossierImage({ src, alt }: DossierImageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(1);

  // Prevent background scrolling when lightbox is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    setScale(1);
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale((prev) => Math.max(prev - 0.5, 1));
  };

  const handleResetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(1);
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Double tap/click toggle zoom between 1x and 2x
    setScale((prev) => (prev > 1 ? 1 : 2));
  };

  return (
    <>
      {/* Dossier Image Container - Premium Hover Effects */}
      <div 
        onClick={() => setIsOpen(true)}
        className="group relative cursor-zoom-in overflow-hidden rounded-2xl shadow-xl transition-all duration-500 hover:shadow-2xl hover:scale-[1.005]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="w-full h-auto transition-transform duration-700 group-hover:scale-[1.02]"
          loading="eager"
        />
        
        {/* Luxury Floating Hover / Tap Indicator */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/20 group-hover:opacity-100">
          <div className="flex items-center gap-2 rounded-full bg-white/95 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-ink shadow-lg shadow-black/10 backdrop-blur-xs transform translate-y-3 transition-transform duration-300 group-hover:translate-y-0">
            <ZoomIn className="h-4 w-4 text-accent" />
            <span>Tap per ingrandire</span>
          </div>
        </div>
      </div>

      {/* Full-Screen Elite Lightbox Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex flex-col bg-black/98 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          {/* Header & Controls bar */}
          <div className="flex items-center justify-between px-6 py-4 text-white z-10 bg-gradient-to-b from-black/80 to-transparent">
            <span className="text-xs tracking-widest uppercase opacity-75 font-medium max-w-[70%] truncate">
              {alt}
            </span>
            <button
              onClick={handleClose}
              className="rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 active:scale-90 transition-all focus:outline-none focus:ring-2 focus:ring-accent-light"
              aria-label="Chiudi Lightbox"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Interactive Zoom & Pan Container */}
          <div 
            className={`flex-1 overflow-auto p-4 flex cursor-zoom-out ${scale === 1 ? "items-start justify-center" : "items-start justify-start"}`}
            onClick={handleClose}
          >
            {/* 
              4K Infographic View: On mobile it is allowed to expand fully in width 
              enabling natural touch scroll and high density crisp details (no truncation).
            */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              className={`max-w-none rounded-lg shadow-2xl transition-all duration-300 ease-out touch-pan-y touch-pan-x ${
                scale === 1 ? "w-full sm:w-auto sm:max-h-[85vh] md:max-h-[88vh]" : ""
              }`}
              style={{
                width: scale === 1 ? undefined : `${scale * 100}%`,
                maxWidth: scale === 1 ? undefined : "none",
                cursor: scale > 1 ? "zoom-out" : "zoom-in",
              }}
              onClick={handleImageClick}
            />
          </div>

          {/* Zoom controls floating bar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3 w-[90%] max-w-xs pointer-events-none animate-slide-up">
            {/* Info badge */}
            <div className="rounded-full bg-black/80 px-4 py-2 text-[10px] font-medium tracking-wide text-white/95 shadow-md backdrop-blur-xs border border-white/10 text-center">
              {scale > 1 
                ? "💡 Trascina l'immagine per esplorare i dettagli"
                : "💡 Tocca due volte l'immagine o usa i tasti per zoomare"
              }
            </div>

            {/* Controls Row */}
            <div className="flex items-center gap-4 rounded-full bg-white/95 px-5 py-2.5 shadow-xl shadow-black/30 backdrop-blur-xs border border-accent/10 pointer-events-auto">
              <button
                onClick={handleZoomOut}
                disabled={scale <= 1}
                className="rounded-full p-1.5 text-ink hover:bg-black/5 active:scale-90 transition-all disabled:opacity-30 disabled:pointer-events-none"
                aria-label="Zoom indietro"
              >
                <ZoomOut className="h-4.5 w-4.5" />
              </button>

              <span className="text-xs font-mono font-bold text-ink w-12 text-center select-none">
                {Math.round(scale * 100)}%
              </span>

              <button
                onClick={handleZoomIn}
                disabled={scale >= 3}
                className="rounded-full p-1.5 text-ink hover:bg-black/5 active:scale-90 transition-all disabled:opacity-30 disabled:pointer-events-none"
                aria-label="Zoom avanti"
              >
                <ZoomIn className="h-4.5 w-4.5" />
              </button>

              {scale > 1 && (
                <>
                  <div className="h-4 w-px bg-ink/15" />
                  <button
                    onClick={handleResetZoom}
                    className="rounded-full p-1.5 text-accent hover:bg-accent/5 active:scale-90 transition-all"
                    aria-label="Ripristina zoom"
                  >
                    <RotateCcw className="h-4.5 w-4.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
