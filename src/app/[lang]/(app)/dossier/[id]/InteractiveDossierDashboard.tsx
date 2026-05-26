"use client";

import { useState } from "react";
import Image from "next/image";
import { type Locale, localePath } from "@/lib/i18n/config";

// Tipi per la profilazione dei dati stagionali dinamici (Boutique Privata & Makeup)
interface CuratedProduct {
  name: string;
  brand: string;
  price: string;
  colors: string[];
  imageBg: string; // Colore o sfumatura CSS simulata
}

interface MakeupInfo {
  complexion: { label: string; value: string }[];
  lipsticks: { name: string; type: string; color: string }[];
  eyes: { name: string; type: string; color: string }[];
}

interface StyleCapsule {
  title: string;
  tagline: string;
  items: { category: string; name: string; colorHex: string }[];
}

// Data store coordinato per le 4 macro-stagioni per boutique legale e makeup
const SEASONAL_CURATIONS: Record<string, {
  products: CuratedProduct[];
  makeup: MakeupInfo;
  capsules: StyleCapsule[];
  tags: string[];
}> = {
  spring: {
    tags: ["Luminous", "Vibrant", "Warm", "Clear"],
    products: [
      { name: "Camicia in Seta Corallo", brand: "Atelier Cromea", price: "300", colors: ["#FF7F7F", "#FFDAB9", "#FFD700"], imageBg: "bg-gradient-to-tr from-rose-300 to-amber-200" },
      { name: "Collana a Catena Dorata", brand: "Maison Cromea", price: "150", colors: ["#FFD700", "#FAF7F2"], imageBg: "bg-gradient-to-tr from-yellow-300 via-amber-200 to-yellow-400" },
      { name: "Blazer Sartoriale Ottanio", brand: "Cromea Collection", price: "335", colors: ["#40E0D0", "#98FB98"], imageBg: "bg-gradient-to-tr from-teal-400 to-emerald-300" }
    ],
    makeup: {
      complexion: [
        { label: "Peach Tint", value: "Tonalità pesca calda" },
        { label: "Luminous Foundation", value: "Finitura radiosa" }
      ],
      lipsticks: [
        { name: "Coral Kiss", type: "Premium gloss lucido", color: "#FF7F7F" },
        { name: "Poppy Bright", type: "Opaco vellutato", color: "#FF4500" },
        { name: "Watermelon Glow", type: "Idratante effetto seta", color: "#FC6C85" }
      ],
      eyes: [
        { name: "Warm Gold", type: "Ombretto metallico", color: "#FFD700" },
        { name: "Emerald Glint", type: "Matita definizione", color: "#50C878" },
        { name: "Soft Brown", type: "Mascara marrone caldo", color: "#8B4513" }
      ]
    },
    capsules: [
      {
        title: "Date Night Elegance",
        tagline: "Sofisticato e luminoso",
        items: [
          { category: "Dress", name: "Abito scivolato in seta corallo", colorHex: "#FF7F7F" },
          { category: "Accessory", name: "Orecchini pendenti dorati", colorHex: "#FFD700" }
        ]
      },
      {
        title: "Weekend Chic",
        tagline: "Casual d'impatto",
        items: [
          { category: "Top", name: "Camicia verde menta leggera", colorHex: "#98FB98" },
          { category: "Pants", name: "Pantalone sartoriale bianco burro", colorHex: "#FAF7F2" }
        ]
      }
    ]
  },
  autumn: {
    tags: ["Warm", "Deep", "Rich", "Earth-toned"],
    products: [
      { name: "Camicia in Crepe Terracotta", brand: "Atelier Cromea", price: "295", colors: ["#C27C5C", "#B97A6A", "#8B4513"], imageBg: "bg-gradient-to-tr from-amber-700 to-orange-500" },
      { name: "Collana Pendente Bronzo", brand: "Maison Cromea", price: "165", colors: ["#D4A76A", "#6B4423"], imageBg: "bg-gradient-to-tr from-yellow-700 to-amber-600" },
      { name: "Cappotto in Lana Cammello", brand: "Cromea Collection", price: "390", colors: ["#DEB887", "#A0522D"], imageBg: "bg-gradient-to-tr from-amber-600 to-yellow-800" }
    ],
    makeup: {
      complexion: [
        { label: "Warm Honey", value: "Tonalità miele dorata" },
        { label: "Matte Foundation", value: "Finitura opaca calda" }
      ],
      lipsticks: [
        { name: "Terracotta Glow", type: "Finitura satinata", color: "#C27C5C" },
        { name: "Rust Red", type: "Rossetto matte profondo", color: "#8B4513" },
        { name: "Nude Caramel", type: "Burro idratante caldo", color: "#C9956B" }
      ],
      eyes: [
        { name: "Mustard Gold", type: "Ombretto shimmery", color: "#D4A76A" },
        { name: "Olive Shadow", type: "Ombretto matte", color: "#556B2F" },
        { name: "Deep Bronze", type: "Matita occhi morbida", color: "#6B4423" }
      ]
    },
    capsules: [
      {
        title: "Date Night Elegance",
        tagline: "Avvolgente e sensuale",
        items: [
          { category: "Dress", name: "Abito lungo terracotta in maglia", colorHex: "#C27C5C" },
          { category: "Blazer", name: "Giacca doppiopetto cioccolato", colorHex: "#6B4423" }
        ]
      },
      {
        title: "Weekend Chic",
        tagline: "Toni della terra eleganti",
        items: [
          { category: "Knit", name: "Maglione over cammello", colorHex: "#DEB887" },
          { category: "Pants", name: "Pantalone verde oliva scuro", colorHex: "#3f4625" }
        ]
      }
    ]
  },
  summer: {
    tags: ["Cool", "Soft", "Muted", "Delicate"],
    products: [
      { name: "Blusa in Chiffon Celeste", brand: "Atelier Cromea", price: "280", colors: ["#B0C4DE", "#E6E6FA", "#87CEEB"], imageBg: "bg-gradient-to-tr from-blue-300 to-purple-200" },
      { name: "Girocollo in Oro Bianco", brand: "Maison Cromea", price: "180", colors: ["#C0C0C0", "#E6E6FA"], imageBg: "bg-gradient-to-tr from-slate-300 to-zinc-100" },
      { name: "Giacca Strutturata Grigio Perla", brand: "Cromea Collection", price: "320", colors: ["#778899", "#A9A9C8"], imageBg: "bg-gradient-to-tr from-slate-400 to-zinc-300" }
    ],
    makeup: {
      complexion: [
        { label: "Cool Alabaster", value: "Sottotono rosa freddo" },
        { label: "Dewy Foundation", value: "Finitura idratata fresca" }
      ],
      lipsticks: [
        { name: "Mauve Petal", type: "Rossetto satinato freddo", color: "#DDA0DD" },
        { name: "Soft Rose", type: "Gloss protettivo", color: "#FFC0CB" },
        { name: "Berry Chill", type: "Lip stain sfumato", color: "#C71585" }
      ],
      eyes: [
        { name: "Soft Lilac", type: "Ombretto polvere", color: "#E6E6FA" },
        { name: "Silver Glow", type: "Punto luce brillante", color: "#E8E8E8" },
        { name: "Slate Charcoal", type: "Matita definizione sfumabile", color: "#708090" }
      ]
    },
    capsules: [
      {
        title: "Date Night Elegance",
        tagline: "Etereo e romantico",
        items: [
          { category: "Dress", name: "Abito midi in seta glicine", colorHex: "#E6E6FA" },
          { category: "Stole", name: "Sciarpa leggera grigio perla", colorHex: "#C0C0C0" }
        ]
      },
      {
        title: "Weekend Chic",
        tagline: "Fresco e rilassante",
        items: [
          { category: "Top", name: "Camicetta azzurro polvere", colorHex: "#B0C4DE" },
          { category: "Skirt", name: "Gonna plissettata pastello", colorHex: "#DDA0DD" }
        ]
      }
    ]
  },
  winter: {
    tags: ["Cool", "Deep", "Intense", "Sharp"],
    products: [
      { name: "Camicia in Raso Blu Reale", brand: "Atelier Cromea", price: "310", colors: ["#1B365D", "#191970", "#87CEEB"], imageBg: "bg-gradient-to-tr from-blue-900 to-slate-900" },
      { name: "Collana Catena Argento massiccio", brand: "Maison Cromea", price: "195", colors: ["#C0C0C0", "#2C2C2C"], imageBg: "bg-gradient-to-tr from-zinc-300 via-slate-200 to-zinc-400" },
      { name: "Blazer Nero Sartoriale Scuro", brand: "Cromea Collection", price: "350", colors: ["#2C2C2C", "#2F4F4F"], imageBg: "bg-gradient-to-tr from-black to-zinc-800" }
    ],
    makeup: {
      complexion: [
        { label: "Cool Porcelain", value: "Sottotono freddo chiaro" },
        { label: "Velvet Foundation", value: "Finitura opaca velluto" }
      ],
      lipsticks: [
        { name: "Deep Ruby", type: "Finitura velluto profonda", color: "#9B111E" },
        { name: "Plum Berry", type: "Matte intenso freddo", color: "#4A0E4E" },
        { name: "Fuchsia Neon", type: "Gloss ultra pigmentato", color: "#FF007F" }
      ],
      eyes: [
        { name: "Icy White", type: "Illuminante metallico freddo", color: "#F0F8FF" },
        { name: "Emerald Green", type: "Matita contorno occhi", color: "#0B3D2E" },
        { name: "Absolute Black", type: "Mascara volume carbon black", color: "#000000" }
      ]
    },
    capsules: [
      {
        title: "Date Night Elegance",
        tagline: "Audace e ad alto contrasto",
        items: [
          { category: "Dress", name: "Abito lungo nero scollato in raso", colorHex: "#2C2C2C" },
          { category: "Jewel", name: "Orecchini in argento brillante", colorHex: "#C0C0C0" }
        ]
      },
      {
        title: "Weekend Chic",
        tagline: "Stile grafico tagliente",
        items: [
          { category: "Coat", name: "Cappottino blu notte dal taglio netto", colorHex: "#1B365D" },
          { category: "Knit", name: "Dolcevita rosso rubino", colorHex: "#9B111E" }
        ]
      }
    ]
  }
};

interface InteractiveDossierDashboardProps {
  dossier: any;
  analysis: any;
  reasoning: any;
  palette: any;
  paletteName: string;
  paletteDesc: string;
  dossierImageUrl: string | null;
  locale: Locale;
  dateFmt: Intl.DateTimeFormat;
}

export default function InteractiveDossierDashboard({
  dossier,
  analysis,
  reasoning,
  palette,
  paletteName,
  paletteDesc,
  dossierImageUrl,
  locale,
  dateFmt
}: InteractiveDossierDashboardProps) {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Rileva la macrostagione (Spring, Summer, Autumn, Winter) per caricare i prodotti boutique corretti
  const dbSeason = dossier.classified_season || "";
  let macroSeason = "spring";
  if (dbSeason.toLowerCase().includes("summer") || dbSeason.toLowerCase().includes("estate")) {
    macroSeason = "summer";
  } else if (dbSeason.toLowerCase().includes("autumn") || dbSeason.toLowerCase().includes("autunno")) {
    macroSeason = "autumn";
  } else if (dbSeason.toLowerCase().includes("winter") || dbSeason.toLowerCase().includes("inverno")) {
    macroSeason = "winter";
  }

  const curation = SEASONAL_CURATIONS[macroSeason] || SEASONAL_CURATIONS.spring;
  const userDisplayName = dossier.profiles?.full_name || dossier.profiles?.email?.split("@")[0] || "User";
  const dashboardHref = localePath(locale, "/dashboard");

  // Traduzioni localizzate rapide per le tab e le etichette interne
  const tLocal = {
    it: {
      dashboard: "Dashboard",
      palette: "Palette",
      style: "Stile",
      shop: "Shop",
      account: "Account",
      title: "Dossier Cromatico Personalizzato",
      seasonTitle: "La Tua Stagione Radiosa",
      paletteTitle: "La Tua Palette Di Base",
      capsuleTitle: "La Capsula di Stile Radiosa",
      makeupTitle: "Makeup & Beauty Consigliati",
      shopTitle: "Selezioni di Stile Premium (Boutique)",
      download: "Scarica Dossier Visivo",
      swatches: "Campioni colore",
      delete: "Elimina Dossier",
      back: "Torna alla Dashboard"
    },
    en: {
      dashboard: "Dashboard",
      palette: "Palette",
      style: "Style",
      shop: "Shop",
      account: "Account",
      title: "Personalized Color Dossier",
      seasonTitle: "Your Radiant Season",
      paletteTitle: "Your Core Palette",
      capsuleTitle: "The Radiant Style Capsule",
      makeupTitle: "Makeup & Beauty Recommendations",
      shopTitle: "Premium Style Selections (Boutique)",
      download: "Download Visual Dossier",
      swatches: "Swatches",
      delete: "Delete Dossier",
      back: "Back to Dashboard"
    },
    es: {
      dashboard: "Panel",
      palette: "Paleta",
      style: "Estilo",
      shop: "Tienda",
      account: "Cuenta",
      title: "Dossier Cromático Personalizado",
      seasonTitle: "Tu Estación Radiante",
      paletteTitle: "Tu Paleta Core",
      capsuleTitle: "Cápsula de Estilo Radiante",
      makeupTitle: "Makeup & Beauty Recomendados",
      shopTitle: "Selecciones de Estilo Premium (Boutique)",
      download: "Descargar Dossier Visual",
      swatches: "Muestras",
      delete: "Eliminar Dossier",
      back: "Volver al Panel"
    }
  }[locale];

  return (
    <div className="min-h-screen bg-[#FAF7F2] font-sans pb-16">
      {/* ── LUXURY INNER FRAME CONTAINER ── */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-8">
        
        {/* ── BREADCRUMB & BACK TO DASHBOARD ── */}
        <nav className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-light">
          <a href={dashboardHref} className="hover:text-accent transition-colors">
            {tLocal.back}
          </a>
          <span className="text-muted-light/40">/</span>
          <span className="text-ink">{paletteName}</span>
        </nav>

        {/* ── INTERACTIVE LUXURY BOARD ── */}
        <div className="overflow-hidden rounded-[2rem] border border-accent/8 bg-white/70 shadow-2xl backdrop-blur-md">
          
          {/* ═══════════════════════════════════════════════
              HEADER — Chroma/Cromea Studio Luxury NavBar
             ═══════════════════════════════════════════════ */}
          <header className="flex flex-col gap-4 border-b border-accent/8 bg-white/50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div className="flex items-center gap-3">
              <span className="font-serif text-2xl font-bold tracking-tight text-ink uppercase">Cromea Studio</span>
              <span className="h-4 w-px bg-accent/20 hidden sm:inline" />
              <span className="hidden sm:inline text-xs font-semibold uppercase tracking-widest text-accent-light">Premium Dossier</span>
            </div>

            {/* TAB MENU */}
            <nav className="flex flex-wrap gap-1 sm:gap-2">
              {["dashboard", "palette", "style", "shop"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    relative rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 touch-bounce
                    ${activeTab === tab
                      ? "bg-accent text-white shadow-md"
                      : "text-muted hover:bg-cream-dark hover:text-ink"
                    }
                  `}
                >
                  {(tLocal as any)[tab]}
                  {activeTab === tab && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full bg-white/50" />
                  )}
                </button>
              ))}
            </nav>

            {/* USER MINI PROFILE */}
            <div className="flex items-center gap-3 sm:border-l sm:border-accent/10 sm:pl-4">
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-accent-light to-accent flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-sm overflow-hidden">
                {dossierImageUrl ? (
                  <Image
                    src={dossierImageUrl}
                    alt={userDisplayName}
                    width={36}
                    height={36}
                    className="object-cover h-full w-full"
                  />
                ) : (
                  userDisplayName.substring(0, 2).toUpperCase()
                )}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-ink">Hi, {userDisplayName}!</p>
                <p className="text-[9px] font-semibold text-accent-light tracking-wide uppercase">{paletteName}</p>
              </div>
            </div>
          </header>

          {/* ═══════════════════════════════════════════════
              TAB CONTENT — Dashboard
             ═══════════════════════════════════════════════ */}
          <div className="p-6 sm:p-8">
            
            {activeTab === "dashboard" && (
              <div className="space-y-8 animate-fade-in">
                {/* HERO TITLE BLOCK */}
                <div className="border-l-4 border-accent pl-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-light">
                    {tLocal.title}
                  </p>
                  <h1 className="mt-1 font-serif text-2xl tracking-tight text-ink sm:text-3.5xl uppercase">
                    {paletteName}: {paletteDesc}
                  </h1>
                </div>

                {/* MAIN GRID LAYOUT */}
                <div className="grid gap-6 lg:grid-cols-3">
                  
                  {/* LEFT COLUMN (Radiant Season & Palette swatches) */}
                  <div className="lg:col-span-1 space-y-6">
                    
                    {/* Your Radiant Season Card */}
                    <div className="rounded-2xl border border-accent/8 bg-cream/40 p-5 shadow-sm text-center relative overflow-hidden group">
                      {/* Sub-season backdrop soft glow */}
                      <div className="absolute -inset-10 -z-10 rounded-full bg-gradient-to-tr from-accent/10 to-transparent blur-2xl opacity-60 animate-breath" />
                      
                      <h3 className="font-serif text-lg font-bold text-ink mb-4">{tLocal.seasonTitle}</h3>
                      
                      {/* Face photo framed in luxury border */}
                      <div className="relative mx-auto h-52 w-44 overflow-hidden rounded-xl shadow-md border-2 border-white ring-1 ring-black/5">
                        {dossierImageUrl ? (
                          <Image
                            src={dossierImageUrl}
                            alt={paletteName}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="h-full w-full bg-cream-dark flex items-center justify-center text-muted">Original Photo</div>
                        )}
                      </div>

                      <p className="mt-4 font-serif text-lg font-bold text-ink">{userDisplayName} - {paletteName}</p>
                      
                      {/* Dynamic Tags */}
                      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                        {curation.tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-white/80 border border-accent/5 px-2.5 py-1 text-[9px] font-bold text-accent tracking-wide uppercase shadow-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Your Core Palette Card */}
                    <div className="rounded-2xl border border-accent/8 bg-white p-5 shadow-sm">
                      <h3 className="font-serif text-base font-bold text-ink mb-3">{tLocal.paletteTitle}</h3>
                      <p className="text-[10px] uppercase text-muted-light font-semibold tracking-wider mb-4">{tLocal.swatches}</p>
                      
                      {/* Swatch grid */}
                      <div className="grid grid-cols-4 gap-2">
                        {palette.colors.slice(0, 12).map((c: any) => (
                          <div
                            key={c.hex}
                            className="group relative aspect-square rounded-xl shadow-xs border border-white/20 transition-transform duration-300 hover:scale-110 cursor-pointer"
                            style={{ backgroundColor: c.hex }}
                          >
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                            {/* Color tooltip */}
                            <span className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[8px] font-mono text-white opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 shadow-md z-30">
                              {c.name}<br />{c.hex}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* RIGHT COLUMN (Style Capsule & Makeup) */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {/* The Radiant Style Capsule */}
                    <div className="rounded-2xl border border-accent/8 bg-white p-6 shadow-sm">
                      <h3 className="font-serif text-lg font-bold text-ink mb-1">{tLocal.capsuleTitle}</h3>
                      <p className="text-xs text-muted leading-relaxed mb-5">Curata nei minimi dettagli per esaltare il tuo contrasto naturale.</p>

                      <div className="grid gap-4 md:grid-cols-2">
                        {curation.capsules.map((cap) => (
                          <div key={cap.title} className="rounded-xl border border-accent/8 bg-cream/35 p-4 relative overflow-hidden group cursor-pointer hover:border-accent/15 transition-all">
                            {/* Visual effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none" />
                            
                            <p className="text-[10px] font-bold uppercase tracking-wider text-accent mb-1">{cap.title}</p>
                            <p className="text-[9px] text-muted-light font-semibold mb-3">{cap.tagline}</p>
                            
                            {/* Capsule Items list */}
                            <div className="space-y-2.5">
                              {cap.items.map((item, j) => (
                                <div key={j} className="flex items-center justify-between rounded-lg bg-white/70 p-2 shadow-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="h-4 w-4 rounded-full border border-black/5" style={{ backgroundColor: item.colorHex }} />
                                    <div>
                                      <p className="text-[10px] font-bold text-ink leading-none">{item.name}</p>
                                      <p className="text-[8px] text-muted-light leading-none mt-0.5">{item.category}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Makeup & Beauty Recommendations */}
                    <div className="rounded-2xl border border-accent/8 bg-white p-6 shadow-sm">
                      <h3 className="font-serif text-lg font-bold text-ink mb-5">{tLocal.makeupTitle}</h3>
                      
                      <div className="grid gap-5 md:grid-cols-3">
                        
                        {/* Complexion */}
                        <div className="rounded-xl border border-accent/6 bg-cream/15 p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-accent mb-3">Complexion</p>
                          <div className="space-y-3">
                            {curation.makeup.complexion.map((item, j) => (
                              <div key={j}>
                                <p className="text-xs font-bold text-ink leading-tight">{item.label}</p>
                                <p className="text-[9px] text-muted-light mt-0.5">{item.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Lipstick swatches */}
                        <div className="rounded-xl border border-accent/6 bg-cream/15 p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-accent mb-3">Lipstick Swatches</p>
                          <div className="space-y-3">
                            {curation.makeup.lipsticks.map((lip, j) => (
                              <div key={j} className="flex items-center gap-2">
                                <span className="h-5 w-5 rounded-full border border-black/10 shadow-sm shrink-0" style={{ backgroundColor: lip.color }} />
                                <div>
                                  <p className="text-[10px] font-bold text-ink leading-none">{lip.name}</p>
                                  <p className="text-[8px] text-muted-light mt-0.5 leading-none">{lip.type}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Eyes */}
                        <div className="rounded-xl border border-accent/6 bg-cream/15 p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-accent mb-3">Eyes</p>
                          <div className="space-y-3">
                            {curation.makeup.eyes.map((eye, j) => (
                              <div key={j} className="flex items-center gap-2">
                                <span className="h-5 w-5 rounded-full border border-black/10 shadow-sm shrink-0" style={{ backgroundColor: eye.color }} />
                                <div>
                                  <p className="text-[10px] font-bold text-ink leading-none">{eye.name}</p>
                                  <p className="text-[8px] text-muted-light mt-0.5 leading-none">{eye.type}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>

                </div>

                {/* BOTTOM ROW — Curated Boutique Shop Selection */}
                <div className="rounded-2xl border border-accent/8 bg-white p-6 shadow-sm">
                  <h3 className="font-serif text-lg font-bold text-ink mb-1">{tLocal.shopTitle}</h3>
                  <p className="text-xs text-muted mb-6">Collezione boutique a tiratura limitata, appositamente selezionata per sposare le tue luci.</p>

                  <div className="grid gap-5 sm:grid-cols-3">
                    {curation.products.map((prod, j) => (
                      <div key={j} className="rounded-xl border border-accent/8 bg-[#FAF7F2]/50 p-4 hover:border-accent/15 transition-all cursor-pointer group/item">
                        {/* Curated product image box */}
                        <div className={`relative aspect-video rounded-lg shadow-sm border border-black/5 flex items-center justify-center text-white text-3xl font-serif mb-4 overflow-hidden`}>
                          <div className={`absolute inset-0 ${prod.imageBg} transition-transform duration-500 group-hover/item:scale-105`} />
                          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
                          <span className="relative z-10 drop-shadow-sm">👗</span>
                        </div>

                        <p className="text-[9px] font-bold uppercase tracking-wider text-accent">{prod.brand}</p>
                        <h4 className="text-xs font-bold text-ink mt-0.5 leading-tight">{prod.name}</h4>
                        
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-xs font-extrabold text-ink">${prod.price}</span>
                          <div className="flex gap-1">
                            {prod.colors.map((c, k) => (
                              <span key={k} className="h-2.5 w-2.5 rounded-full border border-black/5 shadow-xs shrink-0" style={{ backgroundColor: c }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* TAB CONTENT — Palette */}
            {activeTab === "palette" && (
              <div className="space-y-8 animate-fade-in">
                <div className="border-l-4 border-accent pl-5">
                  <h2 className="font-serif text-2xl text-ink uppercase">{paletteName} - {tLocal.palette}</h2>
                  <p className="text-sm text-muted leading-relaxed mt-1">Tutte le sfumature della tua stagione ordinate per sotto-toni e luminosità.</p>
                </div>

                {/* Swatch grid expanded with detailed info */}
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                  {palette.colors.map((c: any, j: number) => (
                    <div key={j} className="rounded-xl border border-accent/8 bg-white p-3 text-center shadow-xs transition-transform hover:-translate-y-0.5">
                      <div className="relative aspect-[3/2] w-full rounded-lg border border-black/5 shadow-inner" style={{ backgroundColor: c.hex }}>
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
                      </div>
                      <p className="mt-3 text-xs font-bold text-ink leading-none">{c.name}</p>
                      <p className="text-[9px] font-mono text-muted-light mt-1 tracking-wider uppercase">{c.hex}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT — Style */}
            {activeTab === "style" && (
              <div className="space-y-8 animate-fade-in">
                <div className="border-l-4 border-accent pl-5">
                  <h2 className="font-serif text-2xl text-ink uppercase">{paletteName} - {tLocal.style}</h2>
                  <p className="text-sm text-muted leading-relaxed mt-1">Linee guida pratiche su come abbinare i tessuti, i metalli e i contrasti.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-accent/8 bg-white p-6 shadow-sm">
                    <h3 className="font-serif text-base font-bold text-ink mb-4">Consigli di Armocromia Generali</h3>
                    <p className="text-xs text-muted-light leading-relaxed mb-4">{reasoning.whyTheseColors}</p>
                    <p className="text-xs text-muted-light leading-relaxed">{reasoning.whyNotOthers}</p>
                  </div>

                  <div className="rounded-2xl border border-accent/8 bg-white p-6 shadow-sm">
                    <h3 className="font-serif text-base font-bold text-ink mb-4">Metalli Consigliati</h3>
                    <div className="flex flex-wrap gap-2.5 mb-6">
                      {palette.metals.map((metal: string) => (
                        <span key={metal} className="inline-flex items-center gap-2 rounded-xl border border-accent/8 bg-[#FAF7F2] px-3.5 py-2 text-xs font-semibold text-ink">
                          <span className="h-4.5 w-4.5 rounded-full border shadow-inner shrink-0" style={{
                            background:
                              metal === "oro-giallo" ? "linear-gradient(135deg, #FFD700, #DAA520)" :
                              metal === "oro-rosa" ? "linear-gradient(135deg, #E8B4B8, #D4A0A0)" :
                              metal === "argento" ? "linear-gradient(135deg, #E8E8E8, #C0C0C0)" :
                              "linear-gradient(135deg, #F0F0F0, #D5D5D5)"
                          }} />
                          {metal.toUpperCase().replace("-", " ")}
                        </span>
                      ))}
                    </div>

                    <h3 className="font-serif text-base font-bold text-ink mb-3">Consigli Pratici per il Guardaroba</h3>
                    <ul className="space-y-2">
                      {reasoning.practicalTips?.slice(0, 4).map((tip: string, j: number) => (
                        <li key={j} className="flex gap-2 text-xs text-muted-light leading-relaxed">
                          <span className="font-bold text-accent shrink-0">{j + 1}.</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT — Shop */}
            {activeTab === "shop" && (
              <div className="space-y-8 animate-fade-in">
                <div className="border-l-4 border-accent pl-5">
                  <h2 className="font-serif text-2xl text-ink uppercase">{paletteName} - {tLocal.shop}</h2>
                  <p className="text-sm text-muted leading-relaxed mt-1">Collezioni speciali create appositamente dai nostri stilisti in esclusiva.</p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                  {curation.products.map((prod, j) => (
                    <div key={j} className="rounded-2xl border border-accent/8 bg-white p-5 shadow-sm hover:border-accent/15 transition-all">
                      <div className={`relative aspect-square w-full rounded-xl shadow-inner border border-black/5 flex items-center justify-center text-white text-5xl font-serif mb-5 overflow-hidden`}>
                        <div className={`absolute inset-0 ${prod.imageBg}`} />
                        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
                        <span className="relative z-10 drop-shadow-md">👗</span>
                      </div>

                      <span className="text-[10px] font-bold uppercase tracking-wider text-accent">{prod.brand}</span>
                      <h3 className="font-serif text-base font-bold text-ink mt-0.5 leading-tight">{prod.name}</h3>
                      <p className="text-[10px] text-muted-light mt-1.5">Disponibile nelle taglie XS, S, M, L, XL in cotone organico e seta cromaticamente conformi.</p>
                      
                      <div className="mt-5 flex items-center justify-between">
                        <span className="text-sm font-extrabold text-ink">${prod.price}</span>
                        <button className="rounded-lg bg-accent text-white px-3.5 py-1.5 text-xs font-bold transition-all hover:bg-accent-hover active:scale-95">
                          Aggiungi
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* ═══════════════════════════════════════════════
              FOOTER — Action block
             ═══════════════════════════════════════════════ */}
          <footer className="border-t border-accent/8 bg-white/50 px-6 py-6 sm:px-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
            {dossierImageUrl && (
              <a
                href={dossierImageUrl}
                download={`cromeastudio-${dbSeason}-dossier.png`}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-accent to-accent-hover px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 touch-bounce"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-out" />
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                {tLocal.download}
              </a>
            )}

            <p className="text-[10px] text-muted-light/60">
              Generated on {dateFmt.format(new Date(dossier.created_at))} &bull; CROMEASTUDIO &copy; {new Date().getFullYear()}
            </p>
          </footer>

        </div>
      </div>
    </div>
  );
}
