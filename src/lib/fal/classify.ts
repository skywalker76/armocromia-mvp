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
 *
 * Strategia multilingua (Step 5):
 * - Valori enum (undertone/contrast/value/intensity) → SEMPRE chiavi EN stabili
 *   (warm/cool/neutral, low/medium/high, ecc.). L'UI fa lookup nel dizionario.
 * - Testi liberi (skinTone, whyTheseColors, practicalTips...) → AI genera nel
 *   locale dell'utente (parametro). Evita traduzione automatica scadente.
 */

type ClassifyLocale = "it" | "en" | "es";

const LANGUAGE_NAME: Record<ClassifyLocale, string> = {
  it: "Italian",
  en: "English",
  es: "Spanish",
};

const NOTES_LABEL: Record<ClassifyLocale, string> = {
  it: "Note dal soggetto",
  en: "Subject's notes",
  es: "Notas del sujeto",
};

function buildPrompt(locale: ClassifyLocale): string {
  const lang = LANGUAGE_NAME[locale];
  return `You are an expert color analyst specialized in the "Armocromia" 12 sub-season system. You are analyzing a portrait photo of a person (man or woman) to build their complete color profile.

Carefully analyze:
1. **Skin tone**: warm undertone (golden/peach), cool (pink/blue) or neutral? Light, medium or dark?
2. **Hair**: natural color? Warm or cool highlights? Intensity?
3. **Eyes**: color? Warm or cool? Brightness?
4. **Overall undertone**: warm (golden/yellow/peach) or cool (pink/blue/olive) or neutral?
5. **Natural contrast**: difference between skin, hair and eyes (low / medium-low / medium / medium-high / high)?
6. **Value**: is the subject overall light, medium or dark?
7. **Intensity**: are the subject's natural colors soft/muted, medium or bright/saturated?

Classify into EXACTLY ONE sub-season (use these IDs verbatim, do not translate):
- primavera-chiara, primavera-calda, primavera-brillante
- estate-chiara, estate-fredda, estate-tenue
- autunno-tenue, autunno-caldo, autunno-profondo
- inverno-profondo, inverno-freddo, inverno-brillante

Then explain the REASONING: why those colors flatter and why others don't.
Provide practical tips and look suggestions.

CRITICAL OUTPUT RULES:
- All free-text fields (skinTone, hairColor, eyeColor, whyTheseColors, whyNotOthers, practicalTips, lookSuggestions) MUST be written in ${lang}.
- The enum fields (undertone, contrast, value, intensity) MUST be in English using these EXACT lowercase keys (do NOT translate):
  - undertone: "warm" | "cool" | "neutral"
  - contrast: "low" | "medium-low" | "medium" | "medium-high" | "high"
  - value: "light" | "medium" | "dark"
  - intensity: "soft" | "medium" | "bright"
- subSeason MUST be one of the kebab-case Italian IDs listed above (kept stable across languages as data keys).

REPLY ONLY WITH VALID JSON (no markdown, no code fences):
{
  "subSeason": "<sub-season-id>",
  "confidence": <0.0-1.0>,
  "analysis": {
    "skinTone": "<detailed description in ${lang}>",
    "hairColor": "<detailed description in ${lang}>",
    "eyeColor": "<detailed description in ${lang}>",
    "undertone": "<warm|cool|neutral>",
    "contrast": "<low|medium-low|medium|medium-high|high>",
    "value": "<light|medium|dark>",
    "intensity": "<soft|medium|bright>"
  },
  "reasoning": {
    "whyTheseColors": "<2-3 sentences in ${lang} explaining why the identified season's colors flatter the subject, referencing the analyzed traits>",
    "whyNotOthers": "<2-3 sentences in ${lang} explaining why opposite colors (too cool/warm, too bright/muted) penalize the subject>",
    "practicalTips": [
      "<practical tip 1 in ${lang}>",
      "<practical tip 2 in ${lang}>",
      "<practical tip 3 in ${lang}>",
      "<practical tip 4 in ${lang}>"
    ],
    "lookSuggestions": [
      { "name": "<look name in ${lang}>", "colors": "<color combination in ${lang}>", "description": "<short description in ${lang}>" },
      { "name": "<look name in ${lang}>", "colors": "<color combination in ${lang}>", "description": "<short description in ${lang}>" },
      { "name": "<look name in ${lang}>", "colors": "<color combination in ${lang}>", "description": "<short description in ${lang}>" },
      { "name": "<look name in ${lang}>", "colors": "<color combination in ${lang}>", "description": "<short description in ${lang}>" }
    ]
  }
}`;
}

export async function classifyPhoto(
  photoUrl: string,
  userNotes?: string,
  locale: ClassifyLocale = "it"
): Promise<ClassificationResultParsed> {
  const basePrompt = buildPrompt(locale);
  const prompt = userNotes
    ? `${basePrompt}\n\n${NOTES_LABEL[locale]}: "${userNotes}"`
    : basePrompt;

  const result = await fal.subscribe("fal-ai/any-llm/vision", {
    input: {
      image_url: photoUrl,
      prompt,
      model: "google/gemini-2.5-flash",
    },
  });

  // Why: la risposta è un oggetto con campo "output" (stringa)
  const rawOutput =
    typeof result.data === "string"
      ? result.data
      : (result.data as { output?: string }).output ?? JSON.stringify(result.data);

  // Pulizia robusta: rimuove markdown fences, estrae JSON dal testo
  let cleaned = rawOutput
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  // Se il modello ha aggiunto testo prima/dopo il JSON, estrai il blocco {}
  if (!cleaned.startsWith("{")) {
    const startIdx = cleaned.indexOf("{");
    if (startIdx >= 0) {
      cleaned = cleaned.slice(startIdx);
    }
  }
  // Taglia tutto dopo l'ultima parentesi graffa chiusa
  const lastBrace = cleaned.lastIndexOf("}");
  if (lastBrace >= 0 && lastBrace < cleaned.length - 1) {
    cleaned = cleaned.slice(0, lastBrace + 1);
  }

  // Ripara virgole trailing prima di } o ] (errore comune dei LLM)
  cleaned = cleaned.replace(/,\s*([\]}])/g, "$1");

  // Sostituisci virgolette smart/curve con virgolette normali
  cleaned = cleaned.replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"');
  cleaned = cleaned.replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'");

  // ── Bilancia parentesi mancanti ──
  // L'AI spesso omette la } finale di sotto-oggetti come "reasoning"
  cleaned = balanceBraces(cleaned);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Tentativo di repair: gestisci virgolette non escaped e newline
    try {
      let repaired = repairJsonString(cleaned);
      repaired = balanceBraces(repaired);
      parsed = JSON.parse(repaired);
    } catch (e2) {
      console.error("[classify] FULL Raw AI output:", rawOutput);
      throw new Error(
        `Classificazione AI non valida: ${e2 instanceof Error ? e2.message : "JSON parse error"}. Riprova.`
      );
    }
  }

  // Valida con Zod — se l'AI ha risposto male, qui scoppia (gestito dal caller)
  try {
    return classificationResultSchema.parse(parsed);
  } catch (zodErr) {
    console.error("[classify] Zod validation failed. Parsed JSON:", JSON.stringify(parsed, null, 2));
    throw zodErr;
  }
}

/**
 * Bilancia parentesi graffe/quadre mancanti in JSON.
 * L'AI spesso omette la } finale dei sotto-oggetti.
 */
function balanceBraces(input: string): string {
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escaped = false;

  for (const ch of input) {
    if (escaped) { escaped = false; continue; }
    if (ch === "\\") { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") openBraces++;
    if (ch === "}") openBraces--;
    if (ch === "[") openBrackets++;
    if (ch === "]") openBrackets--;
  }

  let result = input;
  // Aggiungi ] mancanti prima delle } mancanti
  while (openBrackets > 0) { result += "]"; openBrackets--; }
  while (openBraces > 0) { result += "}"; openBraces--; }
  return result;
}

/**
 * Ripara un JSON malformato generato da un LLM.
 * Gestisce: newline dentro stringhe, virgolette non escaped, etc.
 */
function repairJsonString(input: string): string {
  // Strategia: ricostruisci il JSON carattere per carattere,
  // tracciando se siamo dentro una stringa o no.
  const chars = [...input];
  const result: string[] = [];
  let inString = false;
  let escaped = false;

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];

    if (escaped) {
      result.push(ch);
      escaped = false;
      continue;
    }

    if (ch === "\\") {
      result.push(ch);
      escaped = true;
      continue;
    }

    if (ch === '"') {
      if (!inString) {
        // Apertura stringa
        inString = true;
        result.push(ch);
      } else {
        // Potrebbe essere chiusura stringa o virgoletta interna
        // Guardiamo cosa segue (skip whitespace)
        let nextNonWs = "";
        for (let j = i + 1; j < chars.length; j++) {
          if (chars[j] !== " " && chars[j] !== "\t" && chars[j] !== "\n" && chars[j] !== "\r") {
            nextNonWs = chars[j];
            break;
          }
        }
        // Se dopo la virgoletta c'è : , } ] o fine file → chiusura stringa
        if (nextNonWs === ":" || nextNonWs === "," || nextNonWs === "}" || nextNonWs === "]" || nextNonWs === "") {
          inString = false;
          result.push(ch);
        } else {
          // Virgoletta interna → escape
          result.push('\\"');
        }
      }
      continue;
    }

    // Newline dentro una stringa → escape
    if (inString && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && i + 1 < chars.length && chars[i + 1] === "\n") {
        i++; // skip \n after \r
      }
      result.push("\\n");
      continue;
    }

    result.push(ch);
  }

  return result.join("");
}
