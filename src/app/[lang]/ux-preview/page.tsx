import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { isValidLocale, localePath, defaultLocale } from "@/lib/i18n/config";
import { MorphingAura } from "@/components/marketing/MorphingAura";
import { DrapingSimulator } from "@/components/marketing/DrapingSimulator";
import { SeasonBentoGrid } from "@/components/marketing/SeasonBentoGrid";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Anteprima UX/UI — Cromea Studio",
    description: "Pagina di anteprima locale per valutare le nuove proposte visive UX/UI per la landing page di Cromea Studio.",
    robots: "noindex, nofollow",
  };
}

interface UxPreviewPageProps {
  params: Promise<{ lang: string }>;
}

export default async function UxPreviewPage({ params }: UxPreviewPageProps) {
  // Sandbox interna: accessibile solo in sviluppo, 404 in produzione.
  if (process.env.NODE_ENV === "production") notFound();

  const { lang } = await params;
  const locale = isValidLocale(lang) ? lang : defaultLocale;

  // Navigation Links
  const backHref = localePath(locale, "/");

  // Localized dictionaries for sandbox preview page
  const dict = {
    it: {
      title: "Laboratorio Proposte Visive UX/UI",
      subtitle: "Valutazione interattiva in locale — Cromea Studio",
      intro: "Questa pagina ti consente di testare ed analizzare in tempo reale le proposte di ottimizzazione visiva elaborate per massimizzare il conversion rate (CRO) e valorizzare l'esperienza dell'analisi cromatica.",
      backBtn: "Torna alla Homepage",
      prop1Title: "Proposta 1 — Simulatore di Draping",
      prop1Desc: "Simulatore interattivo che educa l'utente sul funzionamento pratico dell'armocromia. Consente di cambiare il sottotono del modello e applicare diversi drappi per osservare come cambiano le ombre naturali del viso.",
      prop2Title: "Proposta 2 — Morphing Aura Hero Background",
      prop2Desc: "Alone stagionale pulsante (CSS hardware accelerated) inserito dietro il mockup del dossier nella Hero. Evoca la transizione cromatica fin dal primo secondo di caricamento senza intaccare le performance mobile.",
      prop2Subtitle: "Mockup Dossier con Morphing Aura attiva:",
      prop3Title: "Proposta 3 — Bento Grid Sottogruppi Stagionali",
      prop3Desc: "Riorganizzazione visiva delle 4 stagioni in formato Bento Grid interattivo. Facendo hover/click sulle card si espandono i dettagli scientifici ed i campioni colore reali dei 12 sottogruppi.",
      noteTitle: "Sicurezza del Progetto",
      noteBody: "Tutte le proposte sono isolate all'interno di questa rotta e dei rispettivi componenti. Nessuna modifica ha toccato la landing page ufficiale o interrotto flussi attuali.",
    },
    en: {
      title: "UX/UI Visual Proposals Lab",
      subtitle: "Local interactive evaluation — Cromea Studio",
      intro: "This page allows you to test and analyze in real time the visual optimization proposals designed to maximize conversion rate (CRO) and elevate the color analysis experience.",
      backBtn: "Back to Homepage",
      prop1Title: "Proposal 1 — Draping Simulator",
      prop1Desc: "Interactive simulator that teaches the user the science of seasonal color analysis. It allows changing the model's undertone and applying different colored drapes to observe facial shadow shifts in real time.",
      prop2Title: "Proposal 2 — Morphing Aura Hero Background",
      prop2Desc: "Pulsing seasonal aura (CSS hardware accelerated) positioned behind the dossier mockup in the Hero section. Evokes color harmony shifts from the first second of page load with zero mobile performance overhead.",
      prop2Subtitle: "Dossier Mockup with active Morphing Aura:",
      prop3Title: "Proposal 3 — Seasonal Subgroups Bento Grid",
      prop3Desc: "Visual reorganization of the 4 seasons into an interactive Bento Grid format. Hovering or clicking on the cards expands the scientific characteristics and color swatches of the 12 subgroups.",
      noteTitle: "Project Safety",
      noteBody: "All proposals are isolated inside this route and their respective components. No changes have touched the official landing page or interrupted current live production flows.",
    },
    es: {
      title: "Laboratorio de Propuestas Visuales UX/UI",
      subtitle: "Evaluación interactiva local — Cromea Studio",
      intro: "Esta página te permite probar y analizar en tiempo real las propuestas de optimización visual diseñadas para maximizar la tasa de conversión (CRO) y elevar la experiencia de análisis de color.",
      backBtn: "Volver a la Página de Inicio",
      prop1Title: "Propuesta 1 — Simulador de Draping",
      prop1Desc: "Simulador interactivo que enseña al usuario la ciencia del análisis de color. Permite cambiar el tono de piel del modelo y aplicar diferentes paños de color para observar los cambios en las sombras del rostro.",
      prop2Title: "Propuesta 2 — Morphing Aura Hero Background",
      prop2Desc: "Aura estacional pulsante (acelerada por hardware CSS) colocada detrás del mockup del dossier en la sección Hero. Evoca la armonía del color desde el primer segundo sin afectar el rendimiento móvil.",
      prop2Subtitle: "Mockup del Dossier con Morphing Aura activa:",
      prop3Title: "Propuesta 3 — Bento Grid de Subgrupos Estacionales",
      prop3Desc: "Reorganización visual de las 4 estaciones en un formato Bento Grid interactivo. Al pasar el cursor o hacer clic en las tarjetas, se expanden las características y muestras de color de los 12 subgrupos.",
      noteTitle: "Seguridad del Proyecto",
      noteBody: "Todas las propuestas están aisladas dentro de esta ruta y sus componentes. Ningún cambio ha afectado la página de inicio oficial o interrumpido los flujos de producción actuales.",
    },
  };

  const t = dict[locale as keyof typeof dict] || dict.it;

  return (
    <main className="flex flex-1 flex-col overflow-x-hidden bg-[radial-gradient(circle_at_top_right,_#FFFDF9_0%,_#FAF7F2_50%,_#EFEAE2_100%)] px-6 py-12 md:py-20">
      <div className="mx-auto max-w-5xl w-full space-y-16">
        {/* HEADER */}
        <header className="border-b border-accent/8 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Sandbox Visual Staging
            </span>
            <h1 className="font-serif text-3xl tracking-tight text-ink sm:text-4xl md:text-5xl">
              {t.title}
            </h1>
            <p className="text-sm text-muted-light">
              {t.subtitle}
            </p>
          </div>
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 rounded-xl border border-accent/20 bg-white/60 px-5 py-3 text-sm font-medium text-ink transition-all hover:bg-white active:scale-95 touch-bounce"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            {t.backBtn}
          </Link>
        </header>

        {/* INTRO */}
        <section className="rounded-2xl bg-cream-dark/20 p-6 text-sm text-muted leading-relaxed max-w-4xl">
          {t.intro}
        </section>

        {/* PROPOSAL 1 — DRAPING SIMULATOR */}
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="font-serif text-2xl text-ink md:text-3xl">
              {t.prop1Title}
            </h2>
            <p className="text-sm text-muted-light max-w-3xl leading-relaxed">
              {t.prop1Desc}
            </p>
          </div>
          <DrapingSimulator />
        </section>

        {/* PROPOSAL 2 — MORPHING AURA HERO BACKGROUND */}
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="font-serif text-2xl text-ink md:text-3xl">
              {t.prop2Title}
            </h2>
            <p className="text-sm text-muted-light max-w-3xl leading-relaxed">
              {t.prop2Desc}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-12 items-center">
            {/* Visual simulation box */}
            <div className="md:col-span-6 relative flex items-center justify-center p-8 rounded-3xl border border-accent/8 bg-white/40 overflow-hidden min-h-[360px] shadow-sm">
              {/* Pulsing Seasonal Aura behind */}
              <MorphingAura />

              {/* Simulated Dossier Mockup card floating in front */}
              <div className="relative w-[180px] sm:w-[220px] aspect-[1/1.4] bg-white rounded-xl shadow-lg border border-accent/8 p-3 transform transition-all duration-300 hover:scale-105 hover:-rotate-1 pointer-events-none">
                <div className="w-full h-full border border-accent/4 rounded-lg bg-[radial-gradient(circle_at_top,_#FFFDF9_0%,_#FAF7F2_100%)] flex flex-col justify-between p-2.5">
                  <div className="space-y-1">
                    <span className="text-[7px] uppercase tracking-widest text-accent font-semibold block">Cromea Dossier</span>
                    <span className="text-xs font-serif text-ink block font-medium">Primavera Calda</span>
                  </div>
                  {/* Face outline simulation inside mockup */}
                  <div className="w-full flex-1 flex items-center justify-center py-2">
                    <div className="w-16 h-16 rounded-full bg-amber-100/50 border border-amber-300/20 flex items-center justify-center">
                      <div className="w-8 h-10 rounded-full bg-cream border border-ink/5" />
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <div className="h-2 flex-1 rounded-sm bg-[#B45309]" />
                    <div className="h-2 flex-1 rounded-sm bg-[#F59E0B]" />
                    <div className="h-2 flex-1 rounded-sm bg-[#166534]" />
                    <div className="h-2 flex-1 rounded-sm bg-[#7C2D12]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Explanatory notes */}
            <div className="md:col-span-6 space-y-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-light block">
                {t.prop2Subtitle}
              </span>
              <ul className="space-y-3 text-xs text-muted-light leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 shrink-0" />
                  <span>Spostamento graduale e continuo di colore (24 secondi totali) per toccare tutte le 4 stagioni.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>Animazione implementata interamente tramite hardware acceleration (opacity e scale) su 4 livelli nativi.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>Esclusione istantanea su dispositivi con impostazioni di ridotta animazione attive (Accessibilità WCAG compliant).</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* PROPOSAL 3 — SEASON BENTO GRID */}
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="font-serif text-2xl text-ink md:text-3xl">
              {t.prop3Title}
            </h2>
            <p className="text-sm text-muted-light max-w-3xl leading-relaxed">
              {t.prop3Desc}
            </p>
          </div>
          <SeasonBentoGrid />
        </section>

        {/* STATIC PRE-FLIGHT COMPLIANCE INFOBAR */}
        <footer className="border-t border-accent/8 pt-8 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-muted-light">
          <div>
            <span className="font-semibold text-ink block">{t.noteTitle}</span>
            <p className="mt-1 leading-normal max-w-2xl">
              {t.noteBody}
            </p>
          </div>
          <div className="text-[10px] text-muted-light/60 uppercase tracking-widest">
            Cromea Studio Staging
          </div>
        </footer>
      </div>
    </main>
  );
}
