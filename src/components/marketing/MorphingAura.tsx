"use client";

import React, { memo } from "react";

/**
 * MorphingAura — alone stagionale pulsante dietro il dossier nell'hero.
 * Cicla lentamente tra i colori delle 4 stagioni. CSS hardware-accelerated
 * (opacity/transform). Estende oltre il dossier (inset negativo, no clip) così
 * il bagliore sborda come alone attorno al riquadro. Rispetta prefers-reduced-motion.
 */
const MorphingAuraBase: React.FC = () => {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute -inset-16 -z-10 select-none sm:-inset-28">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes aura-fade-spring {
          0%, 100% { opacity: 0.95; }
          25% { opacity: 0; }
          50% { opacity: 0; }
          75% { opacity: 0; }
        }
        @keyframes aura-fade-summer {
          0%, 100% { opacity: 0; }
          25% { opacity: 0.95; }
          50% { opacity: 0; }
          75% { opacity: 0; }
        }
        @keyframes aura-fade-autumn {
          0%, 100% { opacity: 0; }
          25% { opacity: 0; }
          50% { opacity: 0.95; }
          75% { opacity: 0; }
        }
        @keyframes aura-fade-winter {
          0%, 100% { opacity: 0; }
          25% { opacity: 0; }
          50% { opacity: 0; }
          75% { opacity: 0.95; }
        }
        @keyframes aura-breath {
          0%, 100% { transform: scale(1) translate3d(0,0,0); }
          50% { transform: scale(1.1) translate3d(0, -12px, 0); }
        }

        .aura-container {
          animation: aura-breath 12s ease-in-out infinite;
          filter: blur(80px);
          will-change: transform;
        }

        .aura-spring {
          background: radial-gradient(circle, rgba(224, 150, 120, 0.82) 0%, rgba(240, 180, 110, 0.4) 50%, transparent 76%);
          animation: aura-fade-spring 24s ease-in-out infinite;
        }
        .aura-summer {
          background: radial-gradient(circle, rgba(120, 140, 240, 0.82) 0%, rgba(150, 170, 230, 0.4) 50%, transparent 76%);
          animation: aura-fade-summer 24s ease-in-out infinite;
        }
        .aura-autumn {
          background: radial-gradient(circle, rgba(190, 95, 55, 0.82) 0%, rgba(210, 135, 90, 0.4) 50%, transparent 76%);
          animation: aura-fade-autumn 24s ease-in-out infinite;
        }
        .aura-winter {
          background: radial-gradient(circle, rgba(150, 60, 165, 0.72) 0%, rgba(50, 90, 200, 0.4) 50%, transparent 76%);
          animation: aura-fade-winter 24s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .aura-container { animation: none !important; }
          .aura-summer, .aura-autumn, .aura-winter { animation: none !important; opacity: 0 !important; }
          .aura-spring { animation: none !important; opacity: 0.55 !important; }
        }
      ` }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="aura-container relative h-[560px] w-[440px] rounded-full sm:h-[880px] sm:w-[700px]">
          <div className="aura-spring absolute inset-0 rounded-full" />
          <div className="aura-summer absolute inset-0 rounded-full" />
          <div className="aura-autumn absolute inset-0 rounded-full" />
          <div className="aura-winter absolute inset-0 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export const MorphingAura = memo(MorphingAuraBase);
