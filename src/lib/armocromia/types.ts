/**
 * Tipi TypeScript per il sistema di armocromia.
 * Basato sulla classificazione a 12 stagioni (Colour Me Beautiful / Armocromia method).
 */

// --- Stagioni ---

/** Le 4 macro-stagioni dell'armocromia */
export type MacroSeason = "primavera" | "estate" | "autunno" | "inverno";

/** Le 12 sotto-stagioni (3 per macro-stagione) */
export type SubSeason =
  // Primavera
  | "primavera-chiara"
  | "primavera-calda"
  | "primavera-brillante"
  // Estate
  | "estate-chiara"
  | "estate-fredda"
  | "estate-tenue"
  // Autunno
  | "autunno-tenue"
  | "autunno-caldo"
  | "autunno-profondo"
  // Inverno
  | "inverno-profondo"
  | "inverno-freddo"
  | "inverno-brillante";

// --- Colori e Palette ---

/** Colore in formato hex con label descrittiva */
export interface ColorSwatch {
  hex: string;
  name: string;
  /** Categoria d'uso: base, neutro, accento */
  category: "base" | "neutral" | "accent";
}

/** Palette completa associata a una sotto-stagione */
export interface SeasonPalette {
  subSeason: SubSeason;
  macroSeason: MacroSeason;
  /** Label leggibile (es. "Primavera Chiara") */
  displayName: string;
  /** Descrizione breve della palette */
  description: string;
  /** Colori della palette (flat list per backward compat) */
  colors: ColorSwatch[];
  /** Colori organizzati su 3 livelli gerarchici (se disponibili) */
  colorTiers?: {
    /** Tonalità principali — i 7 colori più valorizzanti */
    primary: ColorSwatch[];
    /** Tonalità secondarie — colori complementari */
    secondary: ColorSwatch[];
    /** Neutri ideali — basi sicure per ogni outfit */
    neutrals: ColorSwatch[];
  };
  /** Colori da evitare */
  avoidColors: ColorSwatch[];
  /** Metalli consigliati */
  metals: ("oro-giallo" | "oro-rosa" | "argento" | "platino")[];
}

// --- Dossier ---

/** Stato di lavorazione del dossier */
export type DossierStatus =
  | "pending_payment"
  | "pending_upload"
  | "processing"
  | "generating"
  | "completed"
  | "failed";

/** Dati del dossier generato per una cliente */
export interface Dossier {
  id: string;
  userId: string;
  status: DossierStatus;
  /** Sotto-stagione classificata (null se non ancora classificata) */
  classifiedSeason: SubSeason | null;
  /** URL foto originale caricata dalla cliente */
  originalPhotoUrl: string | null;
  /** URL del dossier PDF/immagine generato */
  generatedDossierUrl: string | null;
  /** Timestamp di creazione */
  createdAt: string;
  /** Timestamp ultimo aggiornamento */
  updatedAt: string;
}

/** Input per la classificazione Vision */
export interface ClassificationInput {
  /** URL della foto da analizzare */
  photoUrl: string;
  /** Note opzionali della cliente (es. "ho i capelli tinti") */
  userNotes?: string;
}

/** Risultato della classificazione Vision */
export interface ClassificationResult {
  subSeason: SubSeason;
  /** Confidence score 0-1 */
  confidence: number;
  /** Analisi testuale del colorito, capelli, occhi */
  analysis: {
    skinTone: string;
    hairColor: string;
    eyeColor: string;
    undertone: "caldo" | "freddo" | "neutro";
    contrast: "basso" | "medio-basso" | "medio" | "medio-alto" | "alto";
    value?: "chiaro" | "medio" | "scuro";
    intensity?: "morbida" | "media" | "brillante";
  };
  /** Ragionamento dettagliato */
  reasoning: {
    whyTheseColors: string;
    whyNotOthers: string;
    practicalTips: string[];
    lookSuggestions?: Array<{
      name: string;
      colors: string;
      description: string;
    }>;
  };
}
