import { getTranslations } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";

/**
 * HowItWorks — 3-step visual timeline.
 *
 * Server Component async — riceve `lang` dal parent (marketing page) e carica
 * le traduzioni autonomamente. Le icone restano in JSX perché sono SVG inline
 * legate alla logica visuale, non al testo.
 */

interface StepCopy {
  number: string;
  title: string;
  description: string;
  tip: string;
}

const STEP_ICONS = [
  <svg key="0" className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
  </svg>,
  <svg key="1" className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
  </svg>,
  <svg key="2" className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>,
];

export default async function HowItWorks({ lang }: { lang: Locale }) {
  const { t, raw } = await getTranslations(lang, "marketing.howItWorks");
  const steps = raw<StepCopy[]>("steps");

  return (
    <section className="bg-cream-dark/40 px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent">
            {t("eyebrow")}
          </p>
          <h2 className="mt-4 font-serif text-3xl tracking-tight text-ink sm:text-4xl">
            {t("title")}
          </h2>
        </div>

        <div className="mt-16 space-y-0">
          {steps.map((step, i) => (
            <div key={step.number} className="relative flex gap-8">
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-accent shadow-sm ring-1 ring-accent/10">
                  {STEP_ICONS[i]}
                </div>
                {i < steps.length - 1 && (
                  <div className="mt-2 w-px flex-1 bg-gradient-to-b from-accent/20 to-accent/5" />
                )}
              </div>

              {/* Content */}
              <div className={`pb-14 ${i === steps.length - 1 ? "pb-0" : ""}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-bold text-accent/60 tracking-widest">{step.number}</span>
                </div>
                <h3 className="font-serif text-xl text-ink">{step.title}</h3>
                <p className="mt-3 max-w-md text-muted leading-relaxed">
                  {step.description}
                </p>
                {/* Tip badge */}
                <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/80 px-3 py-1.5 text-xs font-medium text-accent shadow-xs ring-1 ring-accent/8">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                  </svg>
                  {step.tip}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
