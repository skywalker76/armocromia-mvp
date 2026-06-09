import "server-only";
import { fal } from "./client";
import type { SeasonPalette } from "@/lib/armocromia/types";
import type { ClassificationResultParsed } from "@/lib/armocromia/schemas";
import type { Locale } from "@/lib/i18n/config";

/**
 * Genera un'infografica dossier premium con GPT Image 2.
 *
 * Why: il dossier è il deliverable principale del prodotto.
 * Il prompt è strutturato per replicare la qualità di un'analisi
 * cromatica professionale (riferimento: output ChatGPT 5.5).
 *
 * Multilingua (post 18/05/2026):
 * - Le label che appaiono renderizzate nell'immagine sono parametriz-
 *   zate via PROMPT_I18N[locale]. Le istruzioni di design e i vincoli
 *   strutturali (volto identico, layout, sfondo) restano IT perché
 *   GPT Image 2 segue meglio prompt-istruzione in una sola lingua.
 * - Le label dei valori dinamici (sottotono, valore, intensità,
 *   contrasto, displayName stagione) vengono tradotte localmente
 *   tramite le mappe UNDERTONE_BY_LOCALE ecc. + PALETTE_DISPLAY_NAMES.
 * - I color names in palette.json restano IT (loanwords moda
 *   accettati cross-lingua per MVP).
 */

// ═══════════════════════════════════════
// I18N — etichette che appaiono renderizzate nell'immagine
// ═══════════════════════════════════════

interface PromptStrings {
  /** Lingua in cui scrivere TUTTI i testi dell'infografica */
  outputLanguage: string;
  /** Etichetta "Italiano" / "English" / "Spanish" in lingua naturale per il prompt-istruzione */
  outputLanguageNative: string;

  // Valori dinamici tradotti (undertone/value/intensity/contrast)
  undertone: Record<"warm" | "cool" | "neutral", string>;
  value: Record<"light" | "medium" | "dark", string>;
  intensity: Record<"soft" | "medium" | "bright", string>;
  contrast: Record<"low" | "medium-low" | "medium" | "medium-high" | "high", string>;

  // INFOGRAFICA
  infografica: {
    title: string;
    subtitle: string;
    seasonIdealBox: string; // "Stagione ideale" / "Ideal season"
    undertoneLabel: string;
    valueLabel: string;
    intensityLabel: string;
    contrastLabel: string;
    section1BoxColors: string; // "I colori migliori"
    section1FaceText: string;
    section1EyesText: (eyeColor: string) => string;
    section1HairText: (hairColor: string) => string;
    section1SkinText: (skinTone: string) => string;
    section2Title: string; // "Confronto visivo"
    section2GoodBlock: string; // "Colori che valorizzano"
    section2GoodText: string;
    section2BadBlock: string; // "Colori meno armoniosi"
    section2BadText: (avoidColors: string) => string;
    section3Title: string; // "Idee di look in armonia"
    footerTip1: string;
    footerTip2: string;
    footerTip3: (metals: string) => string;
    footerTip4: string;
  };

  // LOOKBOOK
  lookbook: {
    title: string;
    subtitle: (seasonName: string) => string;
    outfit1Name: string;
    outfit1Style: string;
    outfit2Name: string;
    outfit2Style: string;
    outfit3Name: string;
    outfit3Style: string;
    outfit4Name: string;
    outfit4Style: string;
    outfit5Name: string;
    outfit5Style: string;
    outfit6Name: string;
    outfit6Style: string;
    seasonLabel: string;
    undertoneLabel: string;
    paletteLabel: string;
  };

  // GUARDAROBA
  guardaroba: {
    title: string;
    subtitle: (seasonName: string) => string;
    row1Heading: string; // "CAPOSPALLA"
    row1Jacket: string;
    row1Coat: string;
    row1Casual: string;
    row2Heading: string; // "PARTE SUPERIORE"
    row2Shirt: string;
    row2Polo: string;
    row2Tshirt: string;
    row2Sweater: string;
    row3Heading: string; // "PARTE INFERIORE"
    row3FormalPants: string;
    row3Jeans: string;
    row3Chinos: string;
    row4Heading: string; // "ACCESSORI"
    row4Belt: string;
    row4Jewelry: string;
    row4Shoes: string;
    row4Bag: string;
    primaryColors: string;
    neutralColors: string;
    metalsLabel: string;
    rule1Title: string; // "REGOLA BASE"
    rule1Body: (neutrals: string, primary: string) => string;
    rule2Title: string;
    rule2Body: string;
    rule3Title: string;
    rule3Body: (metals: string) => string;
  };
}

const IT: PromptStrings = {
  outputLanguage: "ITALIAN",
  outputLanguageNative: "italiano",
  undertone: { warm: "caldo", cool: "freddo", neutral: "neutro" },
  value: { light: "chiaro", medium: "medio", dark: "scuro" },
  intensity: { soft: "morbida", medium: "media", bright: "brillante" },
  contrast: { low: "basso", "medium-low": "medio-basso", medium: "medio", "medium-high": "medio-alto", high: "alto" },
  infografica: {
    title: "Analisi Cromatica Personale",
    subtitle: "Armonia e stile",
    seasonIdealBox: "Stagione ideale",
    undertoneLabel: "Sottotono",
    valueLabel: "Valore",
    intensityLabel: "Intensità",
    contrastLabel: "Contrasto",
    section1BoxColors: "I colori migliori",
    section1FaceText: "Il viso comunica armonia e i colori naturali risaltano.",
    section1EyesText: (c) => c,
    section1HairText: (c) => c,
    section1SkinText: (c) => c,
    section2Title: "Confronto visivo",
    section2GoodBlock: "Colori che valorizzano",
    section2GoodText: "La pelle appare luminosa, uniforme e riposata. I colori si fondono armoniosamente con i suoi toni naturali.",
    section2BadBlock: "Colori meno armoniosi",
    section2BadText: (c) => `I colori sbagliati (es. ${c}) creano contrasto eccessivo: il viso può apparire spento o meno armonioso.`,
    section3Title: "Idee di look in armonia",
    footerTip1: "Scegli tessuti in armonia con la tua intensità.",
    footerTip2: "Preferisci abbinamenti cromatici equilibrati.",
    footerTip3: (m) => `Meglio metalli: ${m}.`,
    footerTip4: "Evita colori che non rispettano il tuo sottotono.",
  },
  lookbook: {
    title: "IL TUO LOOK BOOK PERSONALE",
    subtitle: (s) => `Stagione: ${s} · Palette personalizzata`,
    outfit1Name: "Business Formale", outfit1Style: "professionale, autorevole",
    outfit2Name: "Casual Elegante", outfit2Style: "rilassato ma curato",
    outfit3Name: "Smart Casual", outfit3Style: "versatile per ogni occasione",
    outfit4Name: "Sera Speciale", outfit4Style: "sofisticato e memorabile",
    outfit5Name: "Weekend", outfit5Style: "naturale e confortevole",
    outfit6Name: "Sport Chic", outfit6Style: "dinamico e moderno",
    seasonLabel: "Stagione",
    undertoneLabel: "Sottotono",
    paletteLabel: "Palette consigliata",
  },
  guardaroba: {
    title: "IL TUO GUARDAROBA IDEALE",
    subtitle: (s) => `Capi essenziali per ${s}`,
    row1Heading: "CAPOSPALLA",
    row1Jacket: "Giacca/blazer",
    row1Coat: "Cappotto",
    row1Casual: "Giubbotto casual",
    row2Heading: "PARTE SUPERIORE",
    row2Shirt: "Camicia formale",
    row2Polo: "Polo/maglia",
    row2Tshirt: "T-shirt basica",
    row2Sweater: "Maglione",
    row3Heading: "PARTE INFERIORE",
    row3FormalPants: "Pantalone formale",
    row3Jeans: "Jeans",
    row3Chinos: "Chino casual",
    row4Heading: "ACCESSORI",
    row4Belt: "Cintura",
    row4Jewelry: "Orologio/gioielli",
    row4Shoes: "Scarpe",
    row4Bag: "Borsa/zaino",
    primaryColors: "Colori principali",
    neutralColors: "Neutri base",
    metalsLabel: "Metalli",
    rule1Title: "REGOLA BASE",
    rule1Body: (n, p) => `I neutri (${n}) sono la base, i colori (${p}) gli accenti`,
    rule2Title: "MAX 3 COLORI",
    rule2Body: "Non più di 3 tonalità per outfit",
    rule3Title: "METALLI GIUSTI",
    rule3Body: (m) => `Preferisci ${m} per cinture, orologi e accessori`,
  },
};

const EN: PromptStrings = {
  outputLanguage: "ENGLISH",
  outputLanguageNative: "English",
  undertone: { warm: "warm", cool: "cool", neutral: "neutral" },
  value: { light: "light", medium: "medium", dark: "dark" },
  intensity: { soft: "soft", medium: "medium", bright: "bright" },
  contrast: { low: "low", "medium-low": "medium-low", medium: "medium", "medium-high": "medium-high", high: "high" },
  infografica: {
    title: "Personal Color Analysis",
    subtitle: "Harmony and style",
    seasonIdealBox: "Ideal season",
    undertoneLabel: "Undertone",
    valueLabel: "Value",
    intensityLabel: "Intensity",
    contrastLabel: "Contrast",
    section1BoxColors: "Your best colors",
    section1FaceText: "The face conveys harmony and natural colors stand out.",
    section1EyesText: (c) => c,
    section1HairText: (c) => c,
    section1SkinText: (c) => c,
    section2Title: "Visual comparison",
    section2GoodBlock: "Flattering colors",
    section2GoodText: "The skin appears luminous, even and rested. Colors blend harmoniously with the natural tones.",
    section2BadBlock: "Less harmonious colors",
    section2BadText: (c) => `Wrong colors (e.g. ${c}) create excessive contrast: the face may look dull or less harmonious.`,
    section3Title: "Looks in harmony",
    footerTip1: "Choose fabrics that match your intensity.",
    footerTip2: "Prefer balanced color combinations.",
    footerTip3: (m) => `Best metals: ${m}.`,
    footerTip4: "Avoid colors that clash with your undertone.",
  },
  lookbook: {
    title: "YOUR PERSONAL LOOK BOOK",
    subtitle: (s) => `Season: ${s} · Personalized palette`,
    outfit1Name: "Formal Business", outfit1Style: "professional, authoritative",
    outfit2Name: "Casual Elegant", outfit2Style: "relaxed yet polished",
    outfit3Name: "Smart Casual", outfit3Style: "versatile for any occasion",
    outfit4Name: "Special Evening", outfit4Style: "sophisticated and memorable",
    outfit5Name: "Weekend", outfit5Style: "natural and comfortable",
    outfit6Name: "Sport Chic", outfit6Style: "dynamic and modern",
    seasonLabel: "Season",
    undertoneLabel: "Undertone",
    paletteLabel: "Recommended palette",
  },
  guardaroba: {
    title: "YOUR IDEAL WARDROBE",
    subtitle: (s) => `Essential pieces for ${s}`,
    row1Heading: "OUTERWEAR",
    row1Jacket: "Jacket/blazer",
    row1Coat: "Coat",
    row1Casual: "Casual jacket",
    row2Heading: "TOPS",
    row2Shirt: "Formal shirt",
    row2Polo: "Polo/knit",
    row2Tshirt: "Basic t-shirt",
    row2Sweater: "Sweater",
    row3Heading: "BOTTOMS",
    row3FormalPants: "Formal trousers",
    row3Jeans: "Jeans",
    row3Chinos: "Casual chinos",
    row4Heading: "ACCESSORIES",
    row4Belt: "Belt",
    row4Jewelry: "Watch/jewelry",
    row4Shoes: "Shoes",
    row4Bag: "Bag/backpack",
    primaryColors: "Primary colors",
    neutralColors: "Base neutrals",
    metalsLabel: "Metals",
    rule1Title: "BASE RULE",
    rule1Body: (n, p) => `Neutrals (${n}) are the base, colors (${p}) are the accents`,
    rule2Title: "MAX 3 COLORS",
    rule2Body: "No more than 3 tones per outfit",
    rule3Title: "RIGHT METALS",
    rule3Body: (m) => `Prefer ${m} for belts, watches and accessories`,
  },
};

const ES: PromptStrings = {
  outputLanguage: "SPANISH",
  outputLanguageNative: "español",
  undertone: { warm: "cálido", cool: "frío", neutral: "neutro" },
  value: { light: "claro", medium: "medio", dark: "oscuro" },
  intensity: { soft: "suave", medium: "media", bright: "brillante" },
  contrast: { low: "bajo", "medium-low": "medio-bajo", medium: "medio", "medium-high": "medio-alto", high: "alto" },
  infografica: {
    title: "Análisis Cromático Personal",
    subtitle: "Armonía y estilo",
    seasonIdealBox: "Estación ideal",
    undertoneLabel: "Subtono",
    valueLabel: "Valor",
    intensityLabel: "Intensidad",
    contrastLabel: "Contraste",
    section1BoxColors: "Tus mejores colores",
    section1FaceText: "El rostro comunica armonía y los colores naturales destacan.",
    section1EyesText: (c) => c,
    section1HairText: (c) => c,
    section1SkinText: (c) => c,
    section2Title: "Comparación visual",
    section2GoodBlock: "Colores que te realzan",
    section2GoodText: "La piel se ve luminosa, uniforme y descansada. Los colores se funden con armonía con los tonos naturales.",
    section2BadBlock: "Colores menos armónicos",
    section2BadText: (c) => `Los colores incorrectos (p. ej. ${c}) crean un contraste excesivo: el rostro puede parecer apagado o menos armónico.`,
    section3Title: "Ideas de look en armonía",
    footerTip1: "Elige tejidos en armonía con tu intensidad.",
    footerTip2: "Prefiere combinaciones cromáticas equilibradas.",
    footerTip3: (m) => `Mejores metales: ${m}.`,
    footerTip4: "Evita colores que no respeten tu subtono.",
  },
  lookbook: {
    title: "TU LOOK BOOK PERSONAL",
    subtitle: (s) => `Estación: ${s} · Paleta personalizada`,
    outfit1Name: "Business Formal", outfit1Style: "profesional, con autoridad",
    outfit2Name: "Casual Elegante", outfit2Style: "relajado pero cuidado",
    outfit3Name: "Smart Casual", outfit3Style: "versátil para cualquier ocasión",
    outfit4Name: "Noche Especial", outfit4Style: "sofisticado y memorable",
    outfit5Name: "Fin de semana", outfit5Style: "natural y cómodo",
    outfit6Name: "Sport Chic", outfit6Style: "dinámico y moderno",
    seasonLabel: "Estación",
    undertoneLabel: "Subtono",
    paletteLabel: "Paleta recomendada",
  },
  guardaroba: {
    title: "TU ARMARIO IDEAL",
    subtitle: (s) => `Prendas esenciales para ${s}`,
    row1Heading: "PRENDA DE ABRIGO",
    row1Jacket: "Chaqueta/blazer",
    row1Coat: "Abrigo",
    row1Casual: "Cazadora casual",
    row2Heading: "PARTE SUPERIOR",
    row2Shirt: "Camisa formal",
    row2Polo: "Polo/punto",
    row2Tshirt: "Camiseta básica",
    row2Sweater: "Jersey",
    row3Heading: "PARTE INFERIOR",
    row3FormalPants: "Pantalón formal",
    row3Jeans: "Vaqueros",
    row3Chinos: "Chino casual",
    row4Heading: "ACCESORIOS",
    row4Belt: "Cinturón",
    row4Jewelry: "Reloj/joyas",
    row4Shoes: "Zapatos",
    row4Bag: "Bolso/mochila",
    primaryColors: "Colores principales",
    neutralColors: "Neutros base",
    metalsLabel: "Metales",
    rule1Title: "REGLA BASE",
    rule1Body: (n, p) => `Los neutros (${n}) son la base, los colores (${p}) los acentos`,
    rule2Title: "MÁX. 3 COLORES",
    rule2Body: "No más de 3 tonos por outfit",
    rule3Title: "METALES CORRECTOS",
    rule3Body: (m) => `Prefiere ${m} para cinturones, relojes y accesorios`,
  },
};

const PROMPT_I18N: Record<Locale, PromptStrings> = { it: IT, en: EN, es: ES };

// Mapping displayName palette (kebab IT → display nella lingua target)
const PALETTE_DISPLAY_BY_LOCALE: Record<Locale, Record<string, string>> = {
  it: {
    "primavera-chiara": "Primavera Chiara",
    "primavera-calda": "Primavera Calda",
    "primavera-brillante": "Primavera Brillante",
    "estate-chiara": "Estate Chiara",
    "estate-fredda": "Estate Fredda",
    "estate-tenue": "Estate Tenue",
    "autunno-tenue": "Autunno Tenue",
    "autunno-caldo": "Autunno Caldo",
    "autunno-profondo": "Autunno Profondo",
    "inverno-profondo": "Inverno Profondo",
    "inverno-freddo": "Inverno Freddo",
    "inverno-brillante": "Inverno Brillante",
  },
  en: {
    "primavera-chiara": "Light Spring",
    "primavera-calda": "Warm Spring",
    "primavera-brillante": "Bright Spring",
    "estate-chiara": "Light Summer",
    "estate-fredda": "Cool Summer",
    "estate-tenue": "Soft Summer",
    "autunno-tenue": "Soft Autumn",
    "autunno-caldo": "Warm Autumn",
    "autunno-profondo": "Deep Autumn",
    "inverno-profondo": "Deep Winter",
    "inverno-freddo": "Cool Winter",
    "inverno-brillante": "Bright Winter",
  },
  es: {
    "primavera-chiara": "Primavera Clara",
    "primavera-calda": "Primavera Cálida",
    "primavera-brillante": "Primavera Brillante",
    "estate-chiara": "Verano Claro",
    "estate-fredda": "Verano Frío",
    "estate-tenue": "Verano Suave",
    "autunno-tenue": "Otoño Suave",
    "autunno-caldo": "Otoño Cálido",
    "autunno-profondo": "Otoño Profundo",
    "inverno-profondo": "Invierno Profundo",
    "inverno-freddo": "Invierno Frío",
    "inverno-brillante": "Invierno Brillante",
  },
};

const METAL_BY_LOCALE: Record<Locale, Record<string, string>> = {
  it: { "oro-giallo": "oro giallo", "oro-rosa": "oro rosa", argento: "argento", platino: "platino" },
  en: { "oro-giallo": "yellow gold", "oro-rosa": "rose gold", argento: "silver", platino: "platinum" },
  es: { "oro-giallo": "oro amarillo", "oro-rosa": "oro rosa", argento: "plata", platino: "platino" },
};

// ═══════════════════════════════════════
// PROMPT: INFOGRAFICA
// ═══════════════════════════════════════

function buildDossierPrompt(
  palette: SeasonPalette,
  analysis: ClassificationResultParsed,
  locale: Locale
): string {
  const L = PROMPT_I18N[locale];
  const a = analysis.analysis;

  const undertoneLabel = L.undertone[a.undertone];
  const valueLabel = a.value ? L.value[a.value] : L.value.medium;
  const intensityLabel = a.intensity ? L.intensity[a.intensity] : L.intensity.medium;
  const contrastLabel = L.contrast[a.contrast];

  const seasonName = PALETTE_DISPLAY_BY_LOCALE[locale][palette.subSeason].toUpperCase();
  const avoidColors = palette.avoidColors.map((c) => c.name).slice(0, 4).join(", ");
  const metals = palette.metals.map((m) => METAL_BY_LOCALE[locale][m]).join(", ");

  return `FUNDAMENTAL RULE: The attached image contains the subject's face. ABSOLUTELY, in EVERY single photo or portrait generated in this infographic, you MUST use EXACTLY the face, somatic traits, age, gender and ethnicity of the person in the attached photo.

Generate a Personal Color Analysis infographic in ${L.outputLanguage} (${L.outputLanguageNative}), with a perfect premium editorial layout that follows EXACTLY this structure and pagination:

BACKGROUND: very elegant cream/ivory (#FAF7F2).

═══════════════════════════════════════
HEADER (TOP)
═══════════════════════════════════════
- Top-left, 4 circles connected by arrows (write in ${L.outputLanguageNative}):
  1. "${L.infografica.undertoneLabel}: ${undertoneLabel}"
  2. "${L.infografica.valueLabel}: ${valueLabel}"
  3. "${L.infografica.intensityLabel}: ${intensityLabel}"
  4. "${L.infografica.contrastLabel}: ${contrastLabel}"
- Right, a decorated box: "${L.infografica.seasonIdealBox}: ${seasonName}"
- Center large title: "${L.infografica.title}"
- Subtitle: "${L.infografica.subtitle}"

═══════════════════════════════════════
SECTION 1: ANALYSIS AND PALETTE
═══════════════════════════════════════
- LEFT: A large half-bust portrait of the EXACT SAME person from the attached photo, wearing a top in the season's colors.
- CENTER (narrow column): 4 icons with explanatory text in ${L.outputLanguageNative}:
  1. Face icon: "${L.infografica.section1FaceText}"
  2. Eye icon: "${L.infografica.section1EyesText(a.eyeColor)}"
  3. Hair icon: "${L.infografica.section1HairText(a.hairColor)}"
  4. Leaf icon: "${L.infografica.section1SkinText(a.skinTone)}"
- RIGHT: Box titled "${L.infografica.section1BoxColors}" with a grid of color swatches (rounded squares) on multiple rows. Show about 15-18 typical colors for ${seasonName}, with the color name written below each square (color names in Italian — kept as fashion loanwords).

═══════════════════════════════════════
SECTION 2: VISUAL COMPARISON
═══════════════════════════════════════
Center title: "${L.infografica.section2Title}"
Divided into two large blocks:
- LEFT BLOCK (Sage green, Heart icon): "${L.infografica.section2GoodBlock}"
  - 4 portraits side by side of the EXACT SAME person from the attached photo.
  - Each wears a DIFFERENT color, all perfect for ${seasonName}.
  - Text below (in ${L.outputLanguageNative}): "${L.infografica.section2GoodText}"
- RIGHT BLOCK (Dark red, X icon): "${L.infografica.section2BadBlock}"
  - 4 portraits side by side of the EXACT SAME person from the attached photo.
  - Each wears a color to AVOID.
  - Text below (in ${L.outputLanguageNative}): "${L.infografica.section2BadText(avoidColors)}"

═══════════════════════════════════════
SECTION 3: LOOK IDEAS
═══════════════════════════════════════
Center title: "${L.infografica.section3Title}"
4 vertical blocks side by side. Each block contains:
- Descriptive look text (write category labels in ${L.outputLanguageNative}) and colors used.
- Full-figure (or three-quarter) photo of the EXACT SAME person from the attached photo wearing the outfit.
- Small illustrations of matching accessories (bags, shoes, jewelry).
- Brief description of the effect (in ${L.outputLanguageNative}).

═══════════════════════════════════════
SECTION 4: PRACTICAL TIPS (FOOTER)
═══════════════════════════════════════
Bottom bar split in 4 points with icons (write in ${L.outputLanguageNative}):
1. Fabric icon: "${L.infografica.footerTip1}"
2. Palette icon: "${L.infografica.footerTip2}"
3. Rings icon: "${L.infografica.footerTip3(metals)}"
4. X icon: "${L.infografica.footerTip4}"

CRITICAL: The design must be clean, professional and photographic. In ALL 9 photos present in the infographic, the face MUST be absolutely identical to the one in the attached photo. ALL labels and texts MUST be written in ${L.outputLanguage} (${L.outputLanguageNative}).`;
}

// ═══════════════════════════════════════
// PROMPT: LOOK BOOK
// ═══════════════════════════════════════

function buildLookbookPrompt(
  palette: SeasonPalette,
  analysis: ClassificationResultParsed,
  locale: Locale
): string {
  const L = PROMPT_I18N[locale];
  const a = analysis.analysis;
  const undertoneLabel = L.undertone[a.undertone];
  const seasonDisplay = PALETTE_DISPLAY_BY_LOCALE[locale][palette.subSeason];

  const tiers = palette.colorTiers ?? {
    primary: palette.colors.filter((c) => c.category === "accent" || c.category === "base").slice(0, 7),
    secondary: palette.colors.filter((c) => c.category === "neutral" || c.category === "accent").slice(0, 7),
    neutrals: palette.colors.filter((c) => c.category === "neutral" || c.category === "base").slice(0, 7),
  };

  const formatColors = (arr: typeof palette.colors) =>
    arr.map((c) => `${c.name} (${c.hex})`).join(", ");

  return `FUNDAMENTAL RULE: The attached photo contains the real subject. You MUST reproduce EXACTLY the same face, somatic traits, skin color, hair color and eye color of the person in the attached photo in EVERY outfit. NEVER invent a different face. Do not change gender, age or ethnicity.

Create a PERSONAL LOOK BOOK in ${L.outputLanguage} (${L.outputLanguageNative}), with a premium fashion-magazine editorial layout.

TITLE at the top: "${L.lookbook.title}"
Subtitle: "${L.lookbook.subtitle(seasonDisplay)}"

═══════════════════════════════════════
6 COMPLETE OUTFITS — one per card
═══════════════════════════════════════

Each card shows:
- The EXACT SAME person from the attached photo (same face!) wearing the outfit
- Look name (write in ${L.outputLanguageNative})
- 3-4 small color swatches below the photo with the colors used in the outfit
- A short pairing description (1 line, in ${L.outputLanguageNative})

OUTFIT 1 — ${L.lookbook.outfit1Name.toUpperCase()}:
Outfit in colors: ${formatColors(tiers.primary.slice(0, 3))}
Style: ${L.lookbook.outfit1Style}

OUTFIT 2 — ${L.lookbook.outfit2Name.toUpperCase()}:
Combination of: ${formatColors(tiers.primary.slice(2, 5))}
Style: ${L.lookbook.outfit2Style}

OUTFIT 3 — ${L.lookbook.outfit3Name.toUpperCase()}:
Mix of: ${formatColors(tiers.secondary.slice(0, 3))}
Style: ${L.lookbook.outfit3Style}

OUTFIT 4 — ${L.lookbook.outfit4Name.toUpperCase()}:
Tones: ${formatColors(tiers.primary.slice(0, 2))}, accent ${formatColors(tiers.secondary.slice(0, 1))}
Style: ${L.lookbook.outfit4Style}

OUTFIT 5 — ${L.lookbook.outfit5Name.toUpperCase()}:
Colors: ${formatColors(tiers.neutrals.slice(0, 3))}
Style: ${L.lookbook.outfit5Style}

OUTFIT 6 — ${L.lookbook.outfit6Name.toUpperCase()}:
Palette: ${formatColors(tiers.secondary.slice(1, 4))}
Style: ${L.lookbook.outfit6Style}

═══════════════════════════════════════
BOTTOM BAR (write in ${L.outputLanguageNative})
═══════════════════════════════════════
${L.lookbook.seasonLabel}: ${seasonDisplay}
${L.lookbook.undertoneLabel}: ${undertoneLabel}
${L.lookbook.paletteLabel}: ${formatColors(tiers.primary.slice(0, 5))}

═══════════════════════════════════════
GRAPHIC STYLE:
═══════════════════════════════════════
- 2×3 or 3×2 grid layout with elegant cards
- Clean light background (#FAF7F2)
- Each card has a subtle border and light shadow
- Half-bust photo for each outfit
- Round color swatches below each photo
- ALL labels and texts MUST be in ${L.outputLanguage} (${L.outputLanguageNative})
- CRITICAL: EVERY person in EVERY card MUST have the EXACT SAME face as the attached photo`;
}

// ═══════════════════════════════════════
// PROMPT: GUARDAROBA IDEALE
// ═══════════════════════════════════════

function buildGuardarobaPrompt(
  palette: SeasonPalette,
  analysis: ClassificationResultParsed,
  locale: Locale
): string {
  const L = PROMPT_I18N[locale];
  const a = analysis.analysis;
  const undertoneLabel = L.undertone[a.undertone];
  const seasonDisplay = PALETTE_DISPLAY_BY_LOCALE[locale][palette.subSeason];

  const tiers = palette.colorTiers ?? {
    primary: palette.colors.filter((c) => c.category === "accent" || c.category === "base").slice(0, 7),
    secondary: palette.colors.filter((c) => c.category === "neutral" || c.category === "accent").slice(0, 7),
    neutrals: palette.colors.filter((c) => c.category === "neutral" || c.category === "base").slice(0, 7),
  };

  const formatColors = (arr: typeof palette.colors) =>
    arr.map((c) => `${c.name} (${c.hex})`).join(", ");

  const metalList = palette.metals.map((m) => METAL_BY_LOCALE[locale][m]).join(", ");

  // unused but kept for symmetry; might be used by future variants
  void a; void undertoneLabel;

  return `FUNDAMENTAL RULE: The attached photo contains the real subject. When you show the person wearing the pieces, you MUST reproduce EXACTLY the same face, somatic traits, skin color, hair color and eye color. NEVER invent a different face. Do not change gender, age or ethnicity.

Create an "IDEAL WARDROBE" infographic in ${L.outputLanguage} (${L.outputLanguageNative}), with a premium editorial layout.

TITLE at the top: "${L.guardaroba.title}"
Subtitle: "${L.guardaroba.subtitle(seasonDisplay)}"

═══════════════════════════════════════
GRID OF PIECES — organized by category (write all labels in ${L.outputLanguageNative})
═══════════════════════════════════════

ROW 1 — ${L.guardaroba.row1Heading} (3 pieces):
- ${L.guardaroba.row1Jacket} in ${formatColors(tiers.primary.slice(0, 1))}
- ${L.guardaroba.row1Coat} in ${formatColors(tiers.neutrals.slice(0, 1))}
- ${L.guardaroba.row1Casual} in ${formatColors(tiers.secondary.slice(0, 1))}
Each piece drawn as elegant flat lay, with name and color below.

ROW 2 — ${L.guardaroba.row2Heading} (4 pieces):
- ${L.guardaroba.row2Shirt} in ${formatColors(tiers.neutrals.slice(1, 2))}
- ${L.guardaroba.row2Polo} in ${formatColors(tiers.primary.slice(1, 2))}
- ${L.guardaroba.row2Tshirt} in ${formatColors(tiers.neutrals.slice(0, 1))}
- ${L.guardaroba.row2Sweater} in ${formatColors(tiers.secondary.slice(1, 2))}

ROW 3 — ${L.guardaroba.row3Heading} (3 pieces):
- ${L.guardaroba.row3FormalPants} in ${formatColors(tiers.neutrals.slice(0, 1))}
- ${L.guardaroba.row3Jeans} in ${formatColors(tiers.primary.slice(2, 3))}
- ${L.guardaroba.row3Chinos} in ${formatColors(tiers.secondary.slice(0, 1))}

ROW 4 — ${L.guardaroba.row4Heading} (4 items):
- ${L.guardaroba.row4Belt} in ${formatColors(tiers.neutrals.slice(0, 1))}
- ${L.guardaroba.row4Jewelry} in ${metalList}
- ${L.guardaroba.row4Shoes} in ${formatColors(tiers.neutrals.slice(1, 2))}
- ${L.guardaroba.row4Bag} in ${formatColors(tiers.primary.slice(0, 1))}

═══════════════════════════════════════
SIDE SECTION — PERSON + PALETTE
═══════════════════════════════════════
Left or top: the EXACT SAME person from the attached photo wearing an outfit combined from the wardrobe pieces.
IMPORTANT: The person photo MUST be FULL-FIGURE, head to toe, showing the entire body without cutting legs or shoes. Vertical full-frame shot showing the complete look with all outfit elements visible (outerwear, top, pants, shoes).
Right: full palette with color swatches organized (labels in ${L.outputLanguageNative}):
- ${L.guardaroba.primaryColors}: ${formatColors(tiers.primary)}
- ${L.guardaroba.neutralColors}: ${formatColors(tiers.neutrals)}
- ${L.guardaroba.metalsLabel}: ${metalList}

═══════════════════════════════════════
MATCHING TIPS (at the bottom, write in ${L.outputLanguageNative})
═══════════════════════════════════════
3 boxes with rules:
1. "${L.guardaroba.rule1Title}": ${L.guardaroba.rule1Body(formatColors(tiers.neutrals.slice(0, 2)), formatColors(tiers.primary.slice(0, 2)))}
2. "${L.guardaroba.rule2Title}": ${L.guardaroba.rule2Body}
3. "${L.guardaroba.rule3Title}": ${L.guardaroba.rule3Body(metalList)}

═══════════════════════════════════════
GRAPHIC STYLE:
═══════════════════════════════════════
- Catalog-style organized grid layout
- Light background (#FAF7F2)
- Pieces shown as elegant flat lay (top-down, laid flat)
- Color swatch below each piece
- Clean modern typography
- ALL labels and texts MUST be in ${L.outputLanguage} (${L.outputLanguageNative})
- CRITICAL: the person shown MUST have the EXACT SAME face as the attached photo
- CRITICAL: the person MUST be shown FULL-FIGURE (head to toe, including legs and shoes), NEVER cropped at the bust or three-quarter`;
}

// ═══════════════════════════════════════
// ROUTER — sceglie il prompt giusto
// ═══════════════════════════════════════

export type DossierMode = "infografica" | "lookbook" | "guardaroba";

export async function generateDossierImage(
  palette: SeasonPalette,
  analysis: ClassificationResultParsed,
  photoUrl: string,
  mode: DossierMode = "infografica",
  locale: Locale = "it"
): Promise<string> {
  let prompt: string;

  switch (mode) {
    case "lookbook":
      prompt = buildLookbookPrompt(palette, analysis, locale);
      break;
    case "guardaroba":
      prompt = buildGuardarobaPrompt(palette, analysis, locale);
      break;
    default:
      prompt = buildDossierPrompt(palette, analysis, locale);
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
