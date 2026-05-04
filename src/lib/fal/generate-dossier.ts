import "server-only";
import { fal } from "./client";
import type { SeasonPalette } from "@/lib/armocromia/types";
import type { ClassificationResultParsed } from "@/lib/armocromia/schemas";

/**
 * Genera un'immagine dossier visivo personalizzata con GPT Image 2.
 *
 * Why: il dossier è il deliverable principale del prodotto.
 * GPT Image 2 genera una tavola cromatica elegante con i colori
 * della palette della cliente, il nome della stagione e consigli.
 */

function buildDossierPrompt(
  palette: SeasonPalette,
  analysis: ClassificationResultParsed
): string {
  const colorList = palette.colors
    .map((c) => `${c.name} (${c.hex})`)
    .join(", ");

  const avoidList = palette.avoidColors
    .map((c) => `${c.name} (${c.hex})`)
    .join(", ");

  const metalList = palette.metals
    .map((m) => m.replace("-", " "))
    .join(", ");

  return `Create an elegant, premium color analysis board (moodboard style) for a personal color consultation.

TITLE at the top in elegant serif font: "${palette.displayName}"
SUBTITLE: "La tua armocromia personale"

LAYOUT: Clean, editorial magazine style on a cream/ivory background.

COLOR SWATCHES SECTION:
Display these colors as elegant rounded rectangles in a grid, each with its name below:
${colorList}

ANALYSIS BOX (elegant card):
- Incarnato: ${analysis.analysis.skinTone}
- Capelli: ${analysis.analysis.hairColor}
- Occhi: ${analysis.analysis.eyeColor}
- Sottotono: ${analysis.analysis.undertone}
- Contrasto: ${analysis.analysis.contrast}

AVOID SECTION (smaller, labeled "Colori da evitare"):
${avoidList}

METALS SECTION (small icons):
Metalli consigliati: ${metalList}

FOOTER: Small text "Armocromia — Il tuo dossier personale"

STYLE: Italian editorial design, luxury feel, Vogue Italia aesthetic. Clean typography, generous whitespace, harmonious layout. No photos of people. Sophisticated and professional.`;
}

export async function generateDossierImage(
  palette: SeasonPalette,
  analysis: ClassificationResultParsed
): Promise<string> {
  const prompt = buildDossierPrompt(palette, analysis);

  const result = await fal.subscribe("openai/gpt-image-2", {
    input: {
      prompt,
      image_size: "portrait_4_3",
      quality: "high",
      num_images: 1,
      output_format: "webp",
    },
  });

  const images = (result.data as { images: Array<{ url: string }> }).images;

  if (!images || images.length === 0) {
    throw new Error("GPT Image 2 did not return any images");
  }

  return images[0].url;
}
