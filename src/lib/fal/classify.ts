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
  return `You are a master color analyst specialized in the Italian "Armocromia" 12 sub-season system. You are analyzing a portrait photo of a person (man or woman) to build their complete, clinically accurate color profile.

Follow this exact step-by-step diagnostic protocol BEFORE choosing the sub-season:

STEP 1 — PHOTO QUALITY & LIGHTING ASSESSMENT:
- Check whether the lighting is natural/neutral daylight or distorted by strong yellow/blue indoor bulbs, heavy color filters, beauty smoothing filters, heavy makeup, or obstructions (sunglasses, hats, deep shadows).
- Rate "photoQuality" as:
  - "good": natural/balanced lighting, clear face, true skin and eye tones visible.
  - "acceptable": slight indoor warmth/coolness or light makeup, but somatic undertone and contrast remain clearly readable.
  - "poor": heavy color filter, black & white, extreme artificial color cast, sunglasses covering eyes, or face not clearly visible.
- List any detected technical limitations in "photoQualityIssues" (written in ${lang}; empty array [] if none).

STEP 2 — SOMATIC & BIOMETRIC ANALYSIS (WATCH OUT FOR DYED HAIR):
1. **Skin tone & Undertone**: Examine the jaw, neck, under-eye area, and overall complexion. Compensate for minor indoor lighting casts. Is the true undertone warm (golden/peach/apricot), cool (pink/rosy/bluish/cool-olive) or neutral?
2. **Hair (DYED HAIR PROTOCOL)**: Many subjects have dyed, bleached, or highlighted hair. NEVER let dyed hair lengths mislead your season choice! Always inspect the hair roots (if visible), eyebrows, and eyelashes to deduce the true natural hair value and temperature. In "hairColor", explicitly describe both the visible hair color and whether roots/eyebrows indicate a different natural base.
3. **Eyes**: Analyze iris color, temperature (warm amber/golden/olive vs cool icy/steel/cocoa), and clarity/brightness (jewel-clear vs soft/muted pattern).
4. **Natural contrast**: Measure the intrinsic value difference between skin, eyebrows/natural hair roots, and eyes ("low" | "medium-low" | "medium" | "medium-high" | "high").
5. **Value**: Overall lightness/depth of the subject's native features ("light" | "medium" | "dark").
6. **Intensity (Chroma)**: Are the subject's natural features soft/muted/velvety ("soft"), balanced ("medium"), or bright/clear/saturated ("bright")?

STEP 3 — DEDUCTIVE REASONING & STYLING:
- Explain WHY the identified season's colors harmonize with the analyzed skin, eyes, and natural contrast ("whyTheseColors"), and why opposite tones penalize the face ("whyNotOthers").
- Provide 4 actionable, specific styling/makeup/fabric tips ("practicalTips") and 4 concrete outfit color combinations ("lookSuggestions").

STEP 4 — FINAL SUB-SEASON VERDICT & CONFIDENCE RUBRIC:
Classify into EXACTLY ONE sub-season (use these IDs verbatim, do not translate):
- primavera-chiara, primavera-calda, primavera-brillante
- estate-chiara, estate-fredda, estate-tenue
- autunno-tenue, autunno-caldo, autunno-profondo
- inverno-profondo, inverno-freddo, inverno-brillante

Assign "confidence" strictly according to this rubric:
- 0.85 to 0.98: Natural daylight ("good" photo quality), unambiguous undertone, value, and chroma.
- 0.65 to 0.84: Slight indoor lighting cast or dyed hair, but eyebrows/roots/skin/eyes allow a solid professional diagnosis.
- 0.45 to 0.64: Borderline photo (strong lighting cast or heavy makeup) where two adjacent sub-seasons are both plausible.
- 0.10 to 0.44: Unusable photo ("poor" photo quality: extreme filter, B&W, covered face/sunglasses, or unreadable features).

CRITICAL OUTPUT RULES:
- All free-text fields (photoQualityIssues, skinTone, hairColor, eyeColor, whyTheseColors, whyNotOthers, practicalTips, lookSuggestions) MUST be written in ${lang}.
- The enum fields (photoQuality, undertone, contrast, value, intensity) MUST be in English using these EXACT lowercase keys (do NOT translate):
  - photoQuality: "good" | "acceptable" | "poor"
  - undertone: "warm" | "cool" | "neutral"
  - contrast: "low" | "medium-low" | "medium" | "medium-high" | "high"
  - value: "light" | "medium" | "dark"
  - intensity: "soft" | "medium" | "bright"
- subSeason MUST be one of the kebab-case Italian IDs listed above (kept stable across languages as data keys).
- Follow the exact field order below (analysis and reasoning BEFORE subSeason and confidence).

REPLY ONLY WITH VALID JSON (no markdown, no code fences):
{
  "photoQuality": "<good|acceptable|poor>",
  "photoQualityIssues": [
    "<optional issue in ${lang}, or leave array empty if none>"
  ],
  "analysis": {
    "skinTone": "<detailed description in ${lang}>",
    "hairColor": "<detailed description in ${lang}, noting natural roots/eyebrows if dyed>",
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
  },
  "subSeason": "<sub-season-id>",
  "confidence": <0.0-1.0>
}`;
}

/**
 * Numero massimo di tentativi di classificazione.
 * Why: l'output di un LLM è non deterministico — una singola risposta
 * malformata o un errore transitorio di fal NON deve far fallire il dossier
 * di un cliente pagante (= refund). Ritentiamo l'intero ciclo.
 */
const MAX_CLASSIFY_ATTEMPTS = 3;

export async function classifyPhoto(
  photoUrl: string,
  userNotes?: string,
  locale: ClassifyLocale = "it"
): Promise<ClassificationResultParsed> {
  const basePrompt = buildPrompt(locale);
  const prompt = userNotes
    ? `${basePrompt}\n\n${NOTES_LABEL[locale]}: "${userNotes}"`
    : basePrompt;

  // Ritenta l'intero ciclo (chiamata fal + parsing/repair + validazione Zod)
  // fino a MAX_CLASSIFY_ATTEMPTS. Il percorso "buono" resta a 1 sola chiamata:
  // i retry scattano solo in caso di errore.
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_CLASSIFY_ATTEMPTS; attempt++) {
    try {
      const result = await fal.subscribe("openrouter/router/vision", {
        input: {
          image_urls: [photoUrl],
          prompt,
          model: "google/gemini-2.5-flash",
        },
      });

      return parseAndValidateClassification(extractRawOutput(result.data));
    } catch (err) {
      lastError = err;
      console.warn(
        `[classify] Tentativo ${attempt}/${MAX_CLASSIFY_ATTEMPTS} fallito: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      // Backoff incrementale prima del tentativo successivo (non dopo l'ultimo)
      if (attempt < MAX_CLASSIFY_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, attempt * 1500));
      }
    }
  }

  throw new Error(
    `Classificazione AI non valida dopo ${MAX_CLASSIFY_ATTEMPTS} tentativi: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }. Riprova.`
  );
}

/**
 * Estrae la stringa di output grezza dalla risposta di fal.
 * Why: la risposta è tipicamente un oggetto con campo "output" (stringa).
 */
function extractRawOutput(data: unknown): string {
  if (typeof data === "string") return data;
  return (data as { output?: string }).output ?? JSON.stringify(data);
}

/**
 * Pulisce, ripara, parsa e valida (Zod) l'output grezzo dell'AI.
 * Throwa se l'output è irrecuperabile o non rispetta lo schema:
 * il caller (classifyPhoto) gestisce il retry.
 */
function parseAndValidateClassification(
  rawOutput: string
): ClassificationResultParsed {

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
      console.error("[classify] Raw AI output non parsabile:", rawOutput);
      throw new Error(
        `JSON parse error: ${e2 instanceof Error ? e2.message : "unknown"}`
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
