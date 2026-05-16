import { z } from "zod";

/**
 * Schema di validazione per il flusso di upload e analisi.
 *
 * Why: validazione Zod sia client-side (feedback istantaneo)
 * che server-side (sicurezza) con gli stessi schema.
 */

/** Tipi MIME accettati per le foto */
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/** Dimensione massima file: 10MB */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Validazione del file foto lato server */
export const uploadPhotoSchema = z.object({
  file: z
    .instanceof(File, { message: "selectPhoto" })
    .refine((f) => f.size > 0, "emptyFile")
    .refine(
      (f) => f.size <= MAX_FILE_SIZE,
      "maxSize"
    )
    .refine(
      (f) => ACCEPTED_IMAGE_TYPES.includes(f.type as typeof ACCEPTED_IMAGE_TYPES[number]),
      "invalidFormat"
    ),
  userNotes: z
    .string()
    .max(500, "notesTooLong")
    .optional()
    .default(""),
  analysisMode: z
    .enum(["infografica", "lookbook", "guardaroba"])
    .optional()
    .default("infografica"),
});

export type UploadPhotoInput = z.infer<typeof uploadPhotoSchema>;

/** Modalità di analisi disponibili */
export type AnalysisMode = UploadPhotoInput["analysisMode"];

/**
 * IDs delle modalità di analisi. Le etichette/descrizioni/icone vivono nel
 * dizionario sotto app.analysisModes.{id}.{label,icon,description} per essere
 * tradotte in IT/EN/ES senza touch al codice.
 */
export const ANALYSIS_MODES = [
  { value: "infografica" as const },
  { value: "lookbook" as const },
  { value: "guardaroba" as const },
] as const;

/**
 * Schema per validare la risposta della Vision AI.
 *
 * Why: la risposta AI è non deterministica, quindi la validiamo
 * con Zod per garantire che il risultato sia strutturato.
 */
export const classificationResultSchema = z.object({
  subSeason: z.enum([
    "primavera-chiara", "primavera-calda", "primavera-brillante",
    "estate-chiara", "estate-fredda", "estate-tenue",
    "autunno-tenue", "autunno-caldo", "autunno-profondo",
    "inverno-profondo", "inverno-freddo", "inverno-brillante",
  ]),
  confidence: z.number().min(0).max(1),
  analysis: z.object({
    skinTone: z.string(),
    hairColor: z.string(),
    eyeColor: z.string(),
    /**
     * Sottotono normalizzato a chiave EN stabile (warm/cool/neutral).
     * Accetta sia il nuovo prompt EN (warm/cool/neutral) sia legacy IT
     * (caldo/freddo/neutro) per non rompere record DB esistenti.
     * Why: l'UI usa questa chiave per il lookup ai.values.undertone.*.
     */
    undertone: z.string().transform((v) => {
      const lower = v.toLowerCase();
      if (lower.includes("warm") || lower.includes("cald") || lower.includes("gold") || lower.includes("pesc")) return "warm" as const;
      if (lower.includes("cool") || lower.includes("fredd") || lower.includes("ros") || lower.includes("blu")) return "cool" as const;
      return "neutral" as const;
    }),
    contrast: z.string().transform((v) => {
      const lower = v.toLowerCase();
      if (lower.includes("medium-low") || lower.includes("medio-basso") || lower.includes("medio basso")) return "medium-low" as const;
      if (lower.includes("medium-high") || lower.includes("medio-alto") || lower.includes("medio alto")) return "medium-high" as const;
      if (lower === "low" || lower === "basso" || (lower.includes("low") && !lower.includes("medium")) || (lower.includes("basso") && !lower.includes("medio"))) return "low" as const;
      if (lower === "high" || lower === "alto" || (lower.includes("high") && !lower.includes("medium")) || (lower.includes("alto") && !lower.includes("medio"))) return "high" as const;
      return "medium" as const;
    }),
    /** Valore: quanto chiaro/scuro è il soggetto complessivamente */
    value: z.string().transform((v) => {
      const lower = v.toLowerCase();
      if (lower.includes("light") || lower.includes("chiar")) return "light" as const;
      if (lower.includes("dark") || lower.includes("scur")) return "dark" as const;
      return "medium" as const;
    }).optional(),
    /** Intensità: quanto saturati sono i colori naturali del soggetto */
    intensity: z.string().transform((v) => {
      const lower = v.toLowerCase();
      if (lower.includes("soft") || lower.includes("morbid") || lower.includes("tenu") || lower.includes("muted")) return "soft" as const;
      if (lower.includes("bright") || lower.includes("brillant") || lower.includes("vivac") || lower.includes("intens")) return "bright" as const;
      return "medium" as const;
    }).optional(),
  }),
  /** Ragionamento dettagliato: spiega il PERCHÉ della classificazione */
  reasoning: z.object({
    /** Perché i colori della stagione identificata valorizzano il soggetto */
    whyTheseColors: z.string(),
    /** Perché i colori opposti penalizzano il soggetto */
    whyNotOthers: z.string(),
    /** Consigli pratici per il soggetto (4-6 bullet) */
    practicalTips: z.array(z.string()),
    /** Suggerimenti di look / combinazioni colore (3-4 outfit ideas) */
    lookSuggestions: z.array(z.object({
      name: z.string(),
      colors: z.string(),
      description: z.string(),
    })).optional(),
  }),
});

export type ClassificationResultParsed = z.infer<typeof classificationResultSchema>;

/** Costanti esportate per uso nei componenti */
export const UPLOAD_CONSTANTS = {
  maxFileSize: MAX_FILE_SIZE,
  maxFileSizeMB: MAX_FILE_SIZE / (1024 * 1024),
  acceptedTypes: ACCEPTED_IMAGE_TYPES,
  acceptString: ACCEPTED_IMAGE_TYPES.join(","),
} as const;
