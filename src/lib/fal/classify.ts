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

const CLASSIFICATION_PROMPT = `Sei un esperto analista cromatico specializzato nel sistema "Armocromia" a 12 sotto-stagioni. Stai analizzando la foto ritratto di una persona (uomo o donna) per creare il suo profilo cromatico completo.

Analizza attentamente:
1. **Incarnato**: sottotono caldo (dorato/pesca), freddo (rosato/blu) o neutro? Chiaro, medio o scuro?
2. **Capelli**: colore naturale? Riflessi caldi o freddi? Intensità?
3. **Occhi**: colore? Caldi o freddi? Brillantezza?
4. **Sottotono generale**: caldo (golden/yellow/peach) o freddo (pink/blue/olive) o neutro?
5. **Contrasto naturale**: differenza tra pelle, capelli e occhi (basso / medio-basso / medio / medio-alto / alto)?
6. **Valore**: il soggetto è complessivamente chiaro, medio o scuro?
7. **Intensità**: i colori naturali del soggetto sono morbidi/desaturati, medi o brillanti/saturati?

Classifica in ESATTAMENTE UNA sotto-stagione:
- primavera-chiara, primavera-calda, primavera-brillante
- estate-chiara, estate-fredda, estate-tenue
- autunno-tenue, autunno-caldo, autunno-profondo
- inverno-profondo, inverno-freddo, inverno-brillante

Poi spiega il RAGIONAMENTO: perché quei colori valorizzano e perché altri penalizzano.
Fornisci consigli pratici e suggerimenti di look.

RISPONDI SOLO CON JSON VALIDO (no markdown, no code fences):
{
  "subSeason": "<sub-season-id>",
  "confidence": <0.0-1.0>,
  "analysis": {
    "skinTone": "<descrizione dettagliata in italiano dell'incarnato>",
    "hairColor": "<descrizione dettagliata in italiano dei capelli>",
    "eyeColor": "<descrizione dettagliata in italiano degli occhi>",
    "undertone": "<caldo|freddo|neutro>",
    "contrast": "<basso|medio-basso|medio|medio-alto|alto>",
    "value": "<chiaro|medio|scuro>",
    "intensity": "<morbida|media|brillante>"
  },
  "reasoning": {
    "whyTheseColors": "<2-3 frasi in italiano che spiegano perché i colori della stagione identificata valorizzano il soggetto, riferendosi alle caratteristiche analizzate>",
    "whyNotOthers": "<2-3 frasi in italiano che spiegano perché i colori opposti (troppo freddi/caldi, troppo brillanti/spenti) penalizzano il soggetto>",
    "practicalTips": [
      "<consiglio pratico 1 in italiano>",
      "<consiglio pratico 2 in italiano>",
      "<consiglio pratico 3 in italiano>",
      "<consiglio pratico 4 in italiano>"
    ],
    "lookSuggestions": [
      { "name": "<nome look>", "colors": "<combinazione colori>", "description": "<breve descrizione>" },
      { "name": "<nome look>", "colors": "<combinazione colori>", "description": "<breve descrizione>" },
      { "name": "<nome look>", "colors": "<combinazione colori>", "description": "<breve descrizione>" },
      { "name": "<nome look>", "colors": "<combinazione colori>", "description": "<breve descrizione>" }
    ]
  }
}`;

export async function classifyPhoto(
  photoUrl: string,
  userNotes?: string
): Promise<ClassificationResultParsed> {
  const prompt = userNotes
    ? `${CLASSIFICATION_PROMPT}\n\nNote dal soggetto: "${userNotes}"`
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
