"use client";

import React, { memo } from "react";

/**
 * MorphingAura — Proposal 2
 * A dynamic, slow-pulsing background glow that cycles through the colors of the four seasons.
 * Utilizes hardware-accelerated CSS animations (transform, opacity) to prevent layout repaints.
 */
const MorphingAuraBase: React.FC = () => {
  return (
    <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden pointer-events-none select-none">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes aura-fade-spring {
          0%, 100% { opacity: 0.7; }
          25% { opacity: 0; }
          50% { opacity: 0; }
          75% { opacity: 0; }
        }
        @keyframes aura-fade-summer {
          0%, 100% { opacity: 0; }
          25% { opacity: 0.7; }
          50% { opacity: 0; }
          75% { opacity: 0; }
        }
        @keyframes aura-fade-autumn {
          0%, 100% { opacity: 0; }
          25% { opacity: 0; }
          50% { opacity: 0.7; }
          75% { opacity: 0; }
        }
        @keyframes aura-fade-winter {
          0%, 100% { opacity: 0; }
          25% { opacity: 0; }
          50% { opacity: 0; }
          75% { opacity: 0.7; }
        }
        @keyframes aura-breath {
          0%, 100% { transform: scale(1) translate3d(0,0,0); }
          50% { transform: scale(1.08) translate3d(0, -10px, 0); }
        }
        
        .aura-container {
          animation: aura-breath 12s ease-in-out infinite;
          filter: blur(80px);
          will-change: transform;
        }
        
        .aura-spring {
          background: radial-gradient(circle, rgba(212, 169, 154, 0.45) 0%, rgba(240, 185, 122, 0.15) 50%, transparent 80%);
          animation: aura-fade-spring 24s ease-in-out infinite;
        }
        
        .aura-summer {
          background: radial-gradient(circle, rgba(165, 180, 252, 0.4) 0%, rgba(180, 198, 224, 0.15) 50%, transparent 80%);
          animation: aura-fade-summer 24s ease-in-out infinite;
        }
        
        .aura-autumn {
          background: radial-gradient(circle, rgba(139, 84, 67, 0.35) 0%, rgba(210, 140, 100, 0.15) 50%, transparent 80%);
          animation: aura-fade-autumn 24s ease-in-out infinite;
        }
        
        .aura-winter {
          background: radial-gradient(circle, rgba(162, 28, 110, 0.25) 0%, rgba(30, 64, 175, 0.15) 50%, transparent 80%);
          animation: aura-fade-winter 24s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .aura-container {
            animation: none !important;
          }
          .aura-spring, .aura-summer, .aura-autumn, .aura-winter {
            animation: none !important;
            opacity: 0 !important;
          }
          .aura-spring {
            opacity: 0.4 !important; /* fallback static */
          }
        }
      ` }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="aura-container relative w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] rounded-full">
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
