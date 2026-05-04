import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Armocromia — I colori che ti fanno splendere",
  description:
    "Scopri la tua armocromia personale con un dossier visivo professionale. Palette colori, outfit suggeriti e makeup su misura per te.",
};

/**
 * Landing page principale — route group (marketing).
 *
 * Stile: editoriale magazine italiano con Playfair Display per i titoli,
 * palette warm tones, layout minimal e raffinato.
 */
export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      {/* === Hero Section === */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-6 py-24 text-center">
        {/* Decorative gradient orb */}
        <div
          className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full opacity-20 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, #D4A99A 0%, #B97A6A 40%, transparent 70%)",
          }}
          aria-hidden="true"
        />

        {/* Content */}
        <div className="relative z-10 max-w-3xl">
          {/* Eyebrow */}
          <p className="mb-6 text-sm font-medium tracking-[0.2em] uppercase text-muted">
            Analisi cromatica personalizzata
          </p>

          {/* Headline */}
          <h1 className="font-serif text-5xl leading-tight tracking-tight text-ink sm:text-6xl md:text-7xl">
            I colori che ti fanno{" "}
            <span className="italic text-accent">splendere</span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
            Scopri la tua armocromia personale con un dossier visivo
            professionale: palette colori, outfit suggeriti e makeup su misura.
          </p>

          {/* CTA */}
          <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="/auth/login"
              className="group inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-base font-medium text-white shadow-lg transition-all duration-300 hover:bg-accent-hover hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
            >
              Inizia ora
              <svg
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                />
              </svg>
            </a>
            <span className="text-sm text-muted-light">
              Solo{" "}
              <span className="font-semibold text-ink">19,99€</span>
              {" "}— una tantum
            </span>
          </div>
        </div>

        {/* Decorative divider */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-3">
            <div className="h-px w-12 bg-accent/30" />
            <div className="h-1.5 w-1.5 rounded-full bg-accent/40" />
            <div className="h-px w-12 bg-accent/30" />
          </div>
        </div>
      </section>

      {/* === Value Props Section === */}
      <section className="bg-cream-dark/50 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-serif text-3xl tracking-tight text-ink sm:text-4xl">
            Il tuo dossier include
          </h2>

          <div className="mt-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
            {/* Card 1 */}
            <div className="group text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 transition-colors duration-300 group-hover:bg-accent/20">
                <svg
                  className="h-7 w-7 text-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M6.75 21A3.75 3.75 0 0 1 3 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 0 0 3.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008Z"
                  />
                </svg>
              </div>
              <h3 className="font-serif text-xl text-ink">
                Palette personalizzata
              </h3>
              <p className="mt-3 text-base leading-relaxed text-muted">
                I colori che esaltano il tuo incarnato, dai toni base ai neutri
                fino agli accenti perfetti per te.
              </p>
            </div>

            {/* Card 2 */}
            <div className="group text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 transition-colors duration-300 group-hover:bg-accent/20">
                <svg
                  className="h-7 w-7 text-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                  />
                </svg>
              </div>
              <h3 className="font-serif text-xl text-ink">
                Outfit suggeriti
              </h3>
              <p className="mt-3 text-base leading-relaxed text-muted">
                Combinazioni di colori per il tuo guardaroba, con esempi
                visuali pensati per il tuo stile quotidiano.
              </p>
            </div>

            {/* Card 3 */}
            <div className="group text-center sm:col-span-2 lg:col-span-1">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 transition-colors duration-300 group-hover:bg-accent/20">
                <svg
                  className="h-7 w-7 text-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
                  />
                </svg>
              </div>
              <h3 className="font-serif text-xl text-ink">
                Consigli makeup
              </h3>
              <p className="mt-3 text-base leading-relaxed text-muted">
                Tonalità ideali per fondotinta, rossetto, ombretto e blush,
                calibrate sulla tua stagione cromatica.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* === Footer === */}
      <footer className="border-t border-accent/10 px-6 py-12">
        <div className="mx-auto max-w-5xl text-center">
          <p className="font-serif text-lg text-ink">Armocromia</p>
          <p className="mt-2 text-sm text-muted-light">
            © {new Date().getFullYear()} — Tutti i diritti riservati
          </p>
        </div>
      </footer>
    </main>
  );
}
