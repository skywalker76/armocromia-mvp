import "server-only";
import { fal } from "./client";
import {
  classificationResultSchema,
  type ClassificationResultParsed,
} from "@/lib/armocromia/schemas";

/**
 * Classifica una foto nelle 12 sotto-stagioni dell'armocromia
 * usando fal.ai OpenRouter Vision (Gemini 2.5 Flash).
 *
 * Why: usiamo un Vision LLM per analizzare incarnato, capelli e occhi.
 * Il prompt è strutturato per restituire JSON parsabile.
 */

const CLASSIFICATION_PROMPT = `You are an expert color analyst specializing in the "Armocromia" seasonal color analysis system (12 sub-seasons).

Analyze this portrait photo and classify the person into one of the 12 sub-seasons.

Analyze carefully:
1. **Skin tone**: warm, cool, or neutral undertone? Light, medium, or deep?
2. **Hair color**: what is the natural hair color? Warm or cool tones?
3. **Eye color**: what color are the eyes? Warm or cool?
4. **Undertone**: overall warm (golden/yellow/peach) or cool (pink/blue/olive)?
5. **Contrast level**: difference between skin, hair, and eye color (low/medium/high)?

Based on your analysis, classify into exactly ONE sub-season:
- primavera-chiara, primavera-calda, primavera-brillante
- estate-chiara, estate-fredda, estate-tenue
- autunno-tenue, autunno-caldo, autunno-profondo
- inverno-profondo, inverno-freddo, inverno-brillante

RESPOND ONLY WITH VALID JSON (no markdown, no code fences):
{
  "subSeason": "<sub-season-id>",
  "confidence": <0.0-1.0>,
  "analysis": {
    "skinTone": "<description in Italian>",
    "hairColor": "<description in Italian>",
    "eyeColor": "<description in Italian>",
    "undertone": "<caldo|freddo|neutro>",
    "contrast": "<basso|medio|alto>"
  }
}`;

export async function classifyPhoto(
  photoUrl: string,
  userNotes?: string
): Promise<ClassificationResultParsed> {
  const prompt = userNotes
    ? `${CLASSIFICATION_PROMPT}\n\nNote dalla cliente: "${userNotes}"`
    : CLASSIFICATION_PROMPT;

  const result = await fal.subscribe("openrouter/router/vision", {
    input: {
      image_urls: [photoUrl],
      prompt,
      model: "google/gemini-2.5-flash",
    },
  });

  // Why: la risposta è un oggetto con campo "output" (stringa)
  const rawOutput =
    typeof result.data === "string"
      ? result.data
      : (result.data as { output?: string }).output ?? JSON.stringify(result.data);

  // Pulisci eventuale markdown wrapper
  const cleaned = rawOutput
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  const parsed = JSON.parse(cleaned);

  // Valida con Zod — se l'AI ha risposto male, qui scoppia (gestito dal caller)
  return classificationResultSchema.parse(parsed);
}
