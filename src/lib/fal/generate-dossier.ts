import "server-only";
import { fal } from "./client";
import type { SeasonPalette } from "@/lib/armocromia/types";
import type { ClassificationResultParsed } from "@/lib/armocromia/schemas";

/**
 * Genera un'infografica dossier premium con GPT Image 2.
 *
 * Why: il dossier è il deliverable principale del prodotto.
 * Il prompt è strutturato per replicare la qualità di un'analisi
 * cromatica professionale (riferimento: output ChatGPT 5.5).
 */

function buildDossierPrompt(
  palette: SeasonPalette,
  analysis: ClassificationResultParsed
): string {
  // Extract values
  const a = analysis.analysis;
  const r = analysis.reasoning;
  const undertoneLabel = a.undertone === "caldo" ? "caldo" : a.undertone === "freddo" ? "freddo" : "neutro";
  const valueLabel = a.value ?? "medio";
  const intensityLabel = a.intensity ?? "soft";
  const contrastLabel = a.contrast ?? "medio";
  
  const seasonName = palette.displayName.toUpperCase();
  const avoidColors = palette.avoidColors.map((c) => c.name).slice(0, 4).join(", ");
  const metals = palette.metals.join(", ");

  return `REGOLA FONDAMENTALE: L'immagine allegata contiene il volto del soggetto. In ASSOLUTO, in OGNI singola foto o ritratto generato in questa infografica, DEVI usare ESATTAMENTE il volto, i tratti somatici, l'età, il genere e l'etnia della persona nella foto allegata.

Genera un'infografica di Analisi Cromatica Personale in ITALIANO, con layout editoriale premium e perfetto, che segua ESATTAMENTE questa struttura e impaginazione:

SFONDO: color crema/avorio molto elegante (#FAF7F2).

═══════════════════════════════════════
HEADER (IN ALTO)
═══════════════════════════════════════
- In alto a sinistra, 4 cerchi collegati da frecce:
  1. "Sottotono: ${undertoneLabel}"
  2. "Valore: ${valueLabel}"
  3. "Intensità: ${intensityLabel}"
  4. "Contrasto: ${contrastLabel}"
- A destra, un box decorato: "Stagione ideale: ${seasonName}"
- Al centro grande titolo: "Analisi Cromatica Personale"
- Sottotitolo: "Esempio applicato su di te" (o "Armonia e stile")

═══════════════════════════════════════
SEZIONE 1: ANALISI E PALETTE
═══════════════════════════════════════
- A SINISTRA: Un grande ritratto a mezzo busto della STESSA IDENTICA persona della foto allegata, con un maglione/top nei colori della stagione.
- AL CENTRO (colonna stretta): 4 icone con testo esplicativo:
  1. Icona Viso: "Il viso comunica armonia e i colori naturali risaltano."
  2. Icona Occhio: "Gli occhi ${a.eyeColor} si armonizzano con la palette."
  3. Icona Capelli: "I capelli ${a.hairColor} sostengono questi toni."
  4. Icona Foglia: "La pelle ${a.skinTone} rende al meglio con questi colori."
- A DESTRA: Box "I colori migliori" con una griglia di swatch colore (quadrati con angoli arrotondati) suddivisi su più righe. Mostra circa 15-18 colori tipici per ${seasonName}, con il nome del colore scritto sotto ogni quadratino.

═══════════════════════════════════════
SEZIONE 2: CONFRONTO VISIVO
═══════════════════════════════════════
Titolo centrale: "Confronto visivo"
Diviso in due grandi blocchi:
- BLOCCO SINISTRO (Verde salvia, icona Cuore): "Colori che valorizzano"
  - 4 ritratti affiancati della STESSA IDENTICA persona della foto allegata.
  - Ognuno indossa un colore DIVERSO, ma tutti perfetti per ${seasonName}.
  - Testo sotto: "La pelle appare luminosa, uniforme e riposata. I colori si fondono armoniosamente con i suoi toni naturali."
- BLOCCO DESTRO (Rosso scuro, icona X): "Colori meno armoniosi"
  - 4 ritratti affiancati della STESSA IDENTICA persona della foto allegata.
  - Ognuno indossa un colore da EVITARE (es. ${avoidColors}).
  - Testo sotto: "I colori sbagliati creano contrasto eccessivo: il viso può apparire spento o meno armonioso."

═══════════════════════════════════════
SEZIONE 3: IDEE DI LOOK IN ARMONIA
═══════════════════════════════════════
Titolo centrale: "Idee di look in armonia"
4 blocchi verticali affiancati. Ogni blocco contiene:
- Testo descrittivo del look (es. "Look quotidiano", "Look elegante", ecc.) e colori usati.
- Foto a figura intera (o trequarti) della STESSA IDENTICA persona della foto allegata con l'outfit.
- Piccole illustrazioni di accessori (borse, scarpe, gioielli) abbinati.
- Breve descrizione dell'effetto (es. "Morbido, luminoso ed elegante").

═══════════════════════════════════════
SEZIONE 4: CONSIGLI PRATICI (FOOTER)
═══════════════════════════════════════
Barra in basso divisa in 4 punti con icone:
1. Icona tessuti: "Scegli tessuti in armonia con la tua intensità."
2. Icona palette: "Preferisci abbinamenti cromatici equilibrati."
3. Icona anelli: "Meglio metalli: ${metals}."
4. Icona X: "Evita colori che non rispettano il tuo sottotono."

FONDAMENTALE: Il design deve essere pulito, professionale e fotografico. In TUTTE e 9 le foto presenti nell'infografica, il volto DEVE essere assolutamente identico a quello della foto allegata.`;
}

// ═══════════════════════════════════════
// PROMPT: LOOK BOOK
// ═══════════════════════════════════════

function buildLookbookPrompt(
  palette: SeasonPalette,
  analysis: ClassificationResultParsed
): string {
  const a = analysis.analysis;
  const tiers = palette.colorTiers ?? {
    primary: palette.colors.filter((c) => c.category === "accent" || c.category === "base").slice(0, 7),
    secondary: palette.colors.filter((c) => c.category === "neutral" || c.category === "accent").slice(0, 7),
    neutrals: palette.colors.filter((c) => c.category === "neutral" || c.category === "base").slice(0, 7),
  };

  const formatColors = (arr: typeof palette.colors) =>
    arr.map((c) => `${c.name} (${c.hex})`).join(", ");

  return `REGOLA FONDAMENTALE: Nella foto allegata c'è il soggetto reale. DEVI riprodurre ESATTAMENTE lo stesso volto, gli stessi tratti somatici, lo stesso colore di pelle, capelli e occhi della persona nella foto allegata in OGNI outfit. Non inventare MAI un volto diverso. Non cambiare genere, età o etnia.

Crea un LOOK BOOK PERSONALE in ITALIANO, con layout editoriale premium stile rivista di moda.

TITOLO in alto: "IL TUO LOOK BOOK PERSONALE"
Sottotitolo: "Stagione: ${palette.displayName} · Palette personalizzata"

═══════════════════════════════════════
6 OUTFIT COMPLETI — uno per ogni card
═══════════════════════════════════════

Ogni card mostra:
- La STESSA IDENTICA persona dalla foto allegata (stesso volto!) con l'outfit indossato
- Nome del look (es. "Casual Elegante", "Business Meeting", "Weekend", "Sera Speciale", "Smart Casual", "Relax Chic")
- 3-4 piccoli swatch colore sotto la foto con i colori usati nell'outfit
- Una breve descrizione dell'abbinamento (1 riga)

OUTFIT 1 — BUSINESS FORMALE:
Completo nei colori: ${formatColors(tiers.primary.slice(0, 3))}
Stile: professionale, autorevole

OUTFIT 2 — CASUAL ELEGANTE:
Combinazione di: ${formatColors(tiers.primary.slice(2, 5))}
Stile: rilassato ma curato

OUTFIT 3 — SMART CASUAL:
Mix di: ${formatColors(tiers.secondary.slice(0, 3))}
Stile: versatile per ogni occasione

OUTFIT 4 — SERA SPECIALE:
Tonalità: ${formatColors(tiers.primary.slice(0, 2))}, accento ${formatColors(tiers.secondary.slice(0, 1))}
Stile: sofisticato e memorabile

OUTFIT 5 — WEEKEND:
Colori: ${formatColors(tiers.neutrals.slice(0, 3))}
Stile: naturale e confortevole

OUTFIT 6 — SPORT CHIC:
Palette: ${formatColors(tiers.secondary.slice(1, 4))}
Stile: dinamico e moderno

═══════════════════════════════════════
BARRA INFERIORE
═══════════════════════════════════════
Stagione: ${palette.displayName}
Sottotono: ${a.undertone}
Palette consigliata: ${formatColors(tiers.primary.slice(0, 5))}

═══════════════════════════════════════
STILE GRAFICO:
═══════════════════════════════════════
- Layout a griglia 2x3 o 3x2 con card eleganti
- Sfondo chiaro e pulito (#FAF7F2)
- Ogni card ha bordo sottile e ombra leggera
- Foto a mezzo busto per ogni outfit
- Swatch colore tondi sotto ogni foto
- Testo in italiano
- FONDAMENTALE: OGNI persona in OGNI card DEVE avere lo STESSO IDENTICO volto della foto allegata`;
}

// ═══════════════════════════════════════
// PROMPT: GUARDAROBA IDEALE
// ═══════════════════════════════════════

function buildGuardarobaPrompt(
  palette: SeasonPalette,
  analysis: ClassificationResultParsed
): string {
  const a = analysis.analysis;
  const tiers = palette.colorTiers ?? {
    primary: palette.colors.filter((c) => c.category === "accent" || c.category === "base").slice(0, 7),
    secondary: palette.colors.filter((c) => c.category === "neutral" || c.category === "accent").slice(0, 7),
    neutrals: palette.colors.filter((c) => c.category === "neutral" || c.category === "base").slice(0, 7),
  };

  const formatColors = (arr: typeof palette.colors) =>
    arr.map((c) => `${c.name} (${c.hex})`).join(", ");

  const metalList = palette.metals
    .map((m) => m.replace("-", " "))
    .join(", ");

  return `REGOLA FONDAMENTALE: Nella foto allegata c'è il soggetto reale. Quando mostri la persona che indossa i capi, DEVI riprodurre ESATTAMENTE lo stesso volto, tratti somatici, colore di pelle, capelli e occhi. Non inventare MAI un volto diverso. Non cambiare genere, età o etnia.

Crea un'infografica "GUARDAROBA IDEALE" in ITALIANO, con layout editoriale premium.

TITOLO in alto: "IL TUO GUARDAROBA IDEALE"
Sottotitolo: "Capi essenziali per ${palette.displayName}"

═══════════════════════════════════════
GRIGLIA DI CAPI — organizzata per categoria
═══════════════════════════════════════

RIGA 1 — CAPOSPALLA (3 capi):
- Giacca/blazer in ${formatColors(tiers.primary.slice(0, 1))}
- Cappotto in ${formatColors(tiers.neutrals.slice(0, 1))}
- Giubbotto casual in ${formatColors(tiers.secondary.slice(0, 1))}
Ogni capo disegnato in modo piatto/flat lay elegante, con nome e colore sotto.

RIGA 2 — PARTE SUPERIORE (4 capi):
- Camicia formale in ${formatColors(tiers.neutrals.slice(1, 2))}
- Polo/maglia in ${formatColors(tiers.primary.slice(1, 2))}
- T-shirt basica in ${formatColors(tiers.neutrals.slice(0, 1))}
- Maglione in ${formatColors(tiers.secondary.slice(1, 2))}

RIGA 3 — PARTE INFERIORE (3 capi):
- Pantalone formale in ${formatColors(tiers.neutrals.slice(0, 1))}
- Jeans in tonalità ${formatColors(tiers.primary.slice(2, 3))}
- Chino casual in ${formatColors(tiers.secondary.slice(0, 1))}

RIGA 4 — ACCESSORI (4 elementi):
- Cintura in ${formatColors(tiers.neutrals.slice(0, 1))}
- Orologio/gioielli in ${metalList}
- Scarpe in ${formatColors(tiers.neutrals.slice(1, 2))}
- Borsa/zaino in ${formatColors(tiers.primary.slice(0, 1))}

═══════════════════════════════════════
SEZIONE LATERALE — PERSONA + PALETTE
═══════════════════════════════════════
A sinistra o in alto: la STESSA IDENTICA persona dalla foto allegata con un outfit combinato dai capi del guardaroba.
IMPORTANTE: La foto della persona DEVE essere a FIGURA INTERA, dalla testa ai piedi, mostrando l'intero corpo senza tagliare gambe o scarpe. Inquadratura verticale completa che mostri il look completo con tutti gli elementi dell'outfit visibili (capospalla, top, pantaloni, scarpe).
A destra: la palette completa con swatch colori organizzati:
- Colori principali: ${formatColors(tiers.primary)}
- Neutri base: ${formatColors(tiers.neutrals)}
- Metalli: ${metalList}

═══════════════════════════════════════
CONSIGLI ABBINAMENTO (in basso)
═══════════════════════════════════════
3 box con regole:
1. "REGOLA BASE": I neutri (${formatColors(tiers.neutrals.slice(0, 2))}) sono la base, i colori (${formatColors(tiers.primary.slice(0, 2))}) gli accenti
2. "MAX 3 COLORI": Non più di 3 tonalità per outfit
3. "METALLI GIUSTI": Preferisci ${metalList} per cinture, orologi e accessori

═══════════════════════════════════════
STILE GRAFICO:
═══════════════════════════════════════
- Layout a griglia organizzata stile catalogo
- Sfondo chiaro (#FAF7F2)
- Capi mostrati come flat lay (dall'alto, stesi) eleganti
- Swatch colore sotto ogni capo
- Tipografia pulita e moderna
- Tutto in ITALIANO
- FONDAMENTALE: la persona mostrata DEVE avere lo STESSO IDENTICO volto della foto allegata
- FONDAMENTALE: la persona DEVE essere mostrata a FIGURA INTERA (dalla testa ai piedi, includendo gambe e scarpe), MAI tagliata a mezzo busto o a tre quarti`;
}

// ═══════════════════════════════════════
// ROUTER — sceglie il prompt giusto
// ═══════════════════════════════════════

export type DossierMode = "infografica" | "lookbook" | "guardaroba";

export async function generateDossierImage(
  palette: SeasonPalette,
  analysis: ClassificationResultParsed,
  photoUrl: string,
  mode: DossierMode = "infografica"
): Promise<string> {
  let prompt: string;

  switch (mode) {
    case "lookbook":
      prompt = buildLookbookPrompt(palette, analysis);
      break;
    case "guardaroba":
      prompt = buildGuardarobaPrompt(palette, analysis);
      break;
    default:
      prompt = buildDossierPrompt(palette, analysis);
  }

  // Risoluzione massima custom per ogni modalità.
  // Vincoli API: max edge 3840px, max pixel area 8.294.400, multipli di 16.
  const imageSize = mode === "lookbook"
    ? { width: 3840, height: 2160 }   // 16:9 landscape — griglia 2×3 outfit (8.29M px)
    : { width: 2160, height: 3840 };   // 9:16 portrait — infografica / guardaroba (8.29M px)

  const result = await fal.subscribe("openai/gpt-image-2/edit", {
    input: {
      prompt,
      image_urls: [photoUrl],
      image_size: imageSize,
      quality: "high",
      num_images: 1,
      output_format: "png",
    },
  });

  const images = (result.data as { images: Array<{ url: string }> }).images;

  if (!images || images.length === 0) {
    throw new Error("GPT Image 2 did not return any images");
  }

  return images[0].url;
}
