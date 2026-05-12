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
    .instanceof(File, { message: "Seleziona una foto" })
    .refine((f) => f.size > 0, "Il file è vuoto")
    .refine(
      (f) => f.size <= MAX_FILE_SIZE,
      "La foto deve essere al massimo 10MB"
    )
    .refine(
      (f) => ACCEPTED_IMAGE_TYPES.includes(f.type as typeof ACCEPTED_IMAGE_TYPES[number]),
      "Formato non supportato. Usa JPEG, PNG o WebP"
    ),
  userNotes: z
    .string()
    .max(500, "Le note possono essere al massimo 500 caratteri")
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

export const ANALYSIS_MODES = [
  {
    value: "infografica" as const,
    label: "Infografica Completa",
    icon: "📊",
    description: "Analisi cromatica dettagliata con palette, confronto visivo e consigli pratici",
  },
  {
    value: "lookbook" as const,
    label: "Look Book",
    icon: "🎨",
    description: "4-6 outfit completi con la tua foto, ciascuno con palette colori abbinata",
  },
  {
    value: "guardaroba" as const,
    label: "Guardaroba Ideale",
    icon: "👔",
    description: "Griglia di capi essenziali (giacca, camicia, pantaloni, accessori) nei tuoi colori",
  },
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
    undertone: z.string().transform((v) => {
      const lower = v.toLowerCase();
      if (lower.includes("cald") || lower.includes("warm") || lower.includes("gold") || lower.includes("pesc")) return "caldo" as const;
      if (lower.includes("fredd") || lower.includes("cool") || lower.includes("ros") || lower.includes("blu")) return "freddo" as const;
      return "neutro" as const;
    }),
    contrast: z.string().transform((v) => {
      const lower = v.toLowerCase();
      if (lower === "basso" || lower.includes("basso") && !lower.includes("medio")) return "basso" as const;
      if (lower.includes("medio-basso") || lower.includes("medio basso")) return "medio-basso" as const;
      if (lower.includes("medio-alto") || lower.includes("medio alto")) return "medio-alto" as const;
      if (lower === "alto" || (lower.includes("alto") && !lower.includes("medio"))) return "alto" as const;
      return "medio" as const;
    }),
    /** Valore: quanto chiaro/scuro è il soggetto complessivamente */
    value: z.string().transform((v) => {
      const lower = v.toLowerCase();
      if (lower.includes("chiar")) return "chiaro" as const;
      if (lower.includes("scur")) return "scuro" as const;
      return "medio" as const;
    }).optional(),
    /** Intensità: quanto saturati sono i colori naturali del soggetto */
    intensity: z.string().transform((v) => {
      const lower = v.toLowerCase();
      if (lower.includes("morbid") || lower.includes("soft") || lower.includes("tenu")) return "morbida" as const;
      if (lower.includes("brillant") || lower.includes("vivac") || lower.includes("intens")) return "brillante" as const;
      return "media" as const;
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
