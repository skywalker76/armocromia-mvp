"use client";

import { useState, useCallback } from "react";
import type { SeasonPalette } from "@/lib/armocromia/types";

/**
 * Griglia interattiva dei colori della palette.
 *
 * Why: Client Component per gestire il click-to-copy hex
 * e le animazioni hover. Separato dalla page (Server Component).
 */

interface PaletteGridProps {
  palette: SeasonPalette;
}

export default function PaletteGrid({ palette }: PaletteGridProps) {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const copyHex = useCallback(async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopiedHex(hex);
      setTimeout(() => setCopiedHex(null), 2000);
    } catch {
      // Fallback per browser senza clipboard API
      setCopiedHex(null);
    }
  }, []);

  const baseColors = palette.colors.filter((c) => c.category === "base");
  const neutralColors = palette.colors.filter((c) => c.category === "neutral");
  const accentColors = palette.colors.filter((c) => c.category === "accent");

  return (
    <div className="space-y-8">
      {/* I tuoi colori */}
      <div className="rounded-2xl border border-accent/10 bg-white p-8 shadow-sm">
        <h2 className="font-serif text-xl text-ink mb-6">I tuoi colori</h2>
        <p className="text-sm text-muted mb-6">Clicca su un colore per copiare il codice hex</p>

        {/* Base */}
        {baseColors.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-light mb-3">
              Colori base
            </h3>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {baseColors.map((color) => (
                <ColorSwatch
                  key={color.hex}
                  hex={color.hex}
                  name={color.name}
                  isCopied={copiedHex === color.hex}
                  onCopy={copyHex}
                />
              ))}
            </div>
          </div>
        )}

        {/* Neutrali */}
        {neutralColors.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-light mb-3">
              Neutri
            </h3>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {neutralColors.map((color) => (
                <ColorSwatch
                  key={color.hex}
                  hex={color.hex}
                  name={color.name}
                  isCopied={copiedHex === color.hex}
                  onCopy={copyHex}
                />
              ))}
            </div>
          </div>
        )}

        {/* Accenti */}
        {accentColors.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-light mb-3">
              Accenti
            </h3>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {accentColors.map((color) => (
                <ColorSwatch
                  key={color.hex}
                  hex={color.hex}
                  name={color.name}
                  isCopied={copiedHex === color.hex}
                  onCopy={copyHex}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Colori da evitare */}
      <div className="rounded-2xl border border-red-100 bg-red-50/30 p-8">
        <h2 className="font-serif text-xl text-ink mb-4">Colori da evitare</h2>
        <p className="text-sm text-muted mb-6">
          Questi colori possono spegnere il tuo incarnato
        </p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {palette.avoidColors.map((color) => (
            <ColorSwatch
              key={color.hex}
              hex={color.hex}
              name={color.name}
              isCopied={copiedHex === color.hex}
              onCopy={copyHex}
              isAvoid
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Singolo swatch colore cliccabile */
function ColorSwatch({
  hex,
  name,
  isCopied,
  onCopy,
  isAvoid = false,
}: {
  hex: string;
  name: string;
  isCopied: boolean;
  onCopy: (hex: string) => void;
  isAvoid?: boolean;
}) {
  // Determina se il testo dovrebbe essere chiaro o scuro
  const isLight = isLightColor(hex);

  return (
    <button
      type="button"
      onClick={() => onCopy(hex)}
      className={`
        group relative overflow-hidden rounded-xl transition-all duration-300
        hover:shadow-md hover:-translate-y-0.5 active:translate-y-0
        ${isAvoid ? "opacity-70 hover:opacity-100" : ""}
      `}
      title={`${name} — ${hex}`}
    >
      <div
        className="aspect-square w-full"
        style={{ backgroundColor: hex }}
      >
        {/* Copied feedback */}
        {isCopied && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 animate-in fade-in duration-200">
            <span className="text-xs font-semibold text-white">Copiato!</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className={`absolute inset-0 flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${isLight ? "bg-black/10" : "bg-white/10"}`}>
          <span className={`text-[10px] font-mono ${isLight ? "text-black/60" : "text-white/80"}`}>
            {hex}
          </span>
        </div>
      </div>
      <div className="bg-white px-2 py-1.5">
        <p className="text-[11px] text-ink leading-tight truncate">{name}</p>
      </div>
    </button>
  );
}

/** Determina se un colore hex è chiaro (per contrasto testo) */
function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Formula luminanza relativa (ITU-R BT.709)
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.5;
}
