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
});

export type UploadPhotoInput = z.infer<typeof uploadPhotoSchema>;

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
    undertone: z.enum(["caldo", "freddo", "neutro"]),
    contrast: z.enum(["basso", "medio", "alto"]),
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
