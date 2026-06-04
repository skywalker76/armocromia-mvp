import { getTranslations } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";

/**
 * Testimonials — prova sociale (recensioni clienti) + rating aggregato.
 *
 * Server Component async, stesso pattern di HowItWorks: riceve `lang` e carica
 * le proprie traduzioni da `marketing.testimonials`.
 *
 * ⚠️  CONTENUTO PLACEHOLDER — Le recensioni in `messages/*.json` sono ESEMPI di
 * struttura. PRIMA DEL LANCIO vanno sostituite con recensioni REALI raccolte dai
 * clienti: in UE le recensioni false sono una pratica commerciale scorretta
 * (Dlgs 206/2005, dir. Omnibus UE 2019/2161). Aggiornare anche ratingValue/
 * ratingSuffix con numeri reali o rimuoverli.
 */

interface TestimonialItem {
  name: string;
  location: string;
  season: string;
  initials: string;
  quote: string;
}

const AVATAR_GRADIENTS = [
  "from-amber-200 to-orange-300",
  "from-rose-200 to-pink-300",
  "from-emerald-200 to-green-300",
  "from-sky-200 to-blue-300",
];

function Stars({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`} aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className="h-4 w-4 text-accent" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.36 4.18a1 1 0 0 0 .95.69h4.4c.97 0 1.37 1.24.59 1.81l-3.56 2.59a1 1 0 0 0-.36 1.12l1.36 4.18c.3.92-.76 1.69-1.54 1.12l-3.56-2.59a1 1 0 0 0-1.18 0l-3.56 2.59c-.78.57-1.84-.2-1.54-1.12l1.36-4.18a1 1 0 0 0-.36-1.12L1.4 9.6c-.78-.57-.38-1.81.59-1.81h4.4a1 1 0 0 0 .95-.69L9.05 2.93Z" />
        </svg>
      ))}
    </div>
  );
}

export default async function Testimonials({ lang }: { lang: Locale }) {
  const { t, raw } = await getTranslations(lang, "marketing.testimonials");
  const items = raw<TestimonialItem[]>("items");

  return (
    <section id="recensioni" className="scroll-mt-20 bg-cream-dark/30 px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent">
            {t("eyebrow")}
          </p>
          <h2 className="mt-4 font-serif text-3xl tracking-tight text-ink sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted">{t("lead")}</p>

          {/* Aggregate rating */}
          <div className="mt-7 inline-flex items-center gap-3 rounded-full border border-accent/15 bg-white/70 px-5 py-2.5 shadow-xs">
            <Stars />
            <span className="text-sm text-ink">
              <span className="font-semibold">{t("ratingValue")}</span>{" "}
              <span className="text-muted">{t("ratingSuffix")}</span>
            </span>
          </div>
        </div>

        {/* Cards */}
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {items.map((item, i) => (
            <figure
              key={item.name}
              className="flex flex-col rounded-2xl border border-accent/8 bg-white/70 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <Stars className="mb-4" />
              <blockquote className="flex-1 text-[15px] leading-relaxed text-ink/85">
                “{item.quote}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-accent/8 pt-5">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]} text-sm font-semibold text-ink/70`}
                >
                  {item.initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {item.name} <span className="font-normal text-muted-light">· {item.location}</span>
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-accent">{item.season}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
