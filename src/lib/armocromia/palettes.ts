import type { SeasonPalette, SubSeason } from "./types";
import paletteData from "./palette.json";

/**
 * Palette cromatiche per le 12 sotto-stagioni dell'armocromia.
 *
 * Why: i dati vengono da palette.json (statico, versionato).
 * Questo modulo li espone tipizzati con helper di lookup.
 */

const palettes = paletteData.seasons as SeasonPalette[];

/**
 * Ritorna la palette per una sotto-stagione specifica.
 * Throws se la stagione non esiste (bug nei dati).
 */
export function getPaletteBySubSeason(subSeason: SubSeason): SeasonPalette {
  const palette = palettes.find((p) => p.subSeason === subSeason);
  if (!palette) {
    throw new Error(`Palette not found for sub-season: ${subSeason}`);
  }
  return palette;
}

/** Ritorna tutte le 12 palette ordinate per macro-stagione. */
export function getAllPalettes(): SeasonPalette[] {
  return palettes;
}

/** Mappa sotto-stagione → display name leggibile */
export function getSeasonDisplayName(subSeason: SubSeason): string {
  return getPaletteBySubSeason(subSeason).displayName;
}
