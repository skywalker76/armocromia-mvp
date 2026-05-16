import type { Metadata } from "next";
import Image from "next/image";
import DossierShowcase from "@/components/marketing/DossierShowcase";
import SeasonCarousel from "@/components/marketing/SeasonCarousel";
import HowItWorks from "@/components/marketing/HowItWorks";
import { isValidLocale, localePath, defaultLocale } from "@/lib/i18n/config";
import { getTranslations } from "@/lib/i18n/server";

export const metadata: Metadata = {
  description:
    "Scopri la tua armocromia personale con un dossier visivo professionale. Palette colori, outfit suggeriti e consigli su misura generati dall'intelligenza artificiale.",
};

const SITE_URL = "https://armocromia-mvp-nine.vercel.app";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Armocromia",
      url: SITE_URL,
      logo: `${SITE_URL}/icon-512.png`,
      sameAs: [],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Armocromia",
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "it-IT",
    },
    {
      "@type": "Service",
      "@id": `${SITE_URL}/#service`,
      name: "Analisi cromatica AI",
      description:
        "Analisi cromatica personalizzata con dossier visivo professionale: palette colori, outfit suggeriti e consigli su misura generati dall'intelligenza artificiale.",
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: "Worldwide",
      serviceType: "Personal color analysis",
      offers: {
        "@type": "Offer",
        price: "29.00",
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        url: `${SITE_URL}/auth/login`,
        category: "DigitalService",
      },
    },
  ],
};

interface HomePageProps {
  params: Promise<{ lang: string }>;
}

const FEATURE2_LOOK_GRADIENTS = [
  "from-blue-900/80 to-blue-800/60",
  "from-amber-700/70 to-orange-600/50",
  "from-rose-900/80 to-red-800/60",
  "from-green-800/70 to-emerald-700/50",
  "from-amber-800/70 to-yellow-700/50",
  "from-orange-800/70 to-amber-700/50",
];

const HERO_AVATAR_GRADIENTS = [
  "from-amber-200 to-orange-300",
  "from-rose-200 to-pink-300",
  "from-sky-200 to-blue-300",
  "from-emerald-200 to-green-300",
];

const PALETTE_HEX = [
  "#C27C5C",
  "#8B4513",
  "#B97A6A",
  "#D4A76A",
  "#6B4423",
  "#C9956B",
  "#A0522D",
  "#DEB887",
];

export default async function HomePage({ params }: HomePageProps) {
  const { lang } = await params;
  const locale = isValidLocale(lang) ? lang : defaultLocale;
  const loginHref = localePath(locale, "/auth/login");
  const privacyHref = localePath(locale, "/privacy");
  const termsHref = localePath(locale, "/terms");

  const { t, raw } = await getTranslations(locale, "marketing");

  const trustItems = raw<Array<{ icon: string; text: string }>>("trustBar.items");
  const finalTrust = raw<string[]>("finalCta.trustIndicators");
  const feature1Bullets = raw<string[]>("valueProp.feature1.bullets");
  const feature1Attrs = raw<Array<{ label: string; value: string }>>("valueProp.feature1.attrs");
  const feature2Bullets = raw<string[]>("valueProp.feature2.bullets");
  const feature2Looks = raw<Array<{ name: string; colors: string }>>("valueProp.feature2.looks");

  return (
    <main className="flex flex-1 flex-col overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ═══════════════════════════════════════════════
          HERO — Split Layout (Anti-center bias)
         ═══════════════════════════════════════════════ */}
      <section className="relative min-h-[100dvh] flex items-center px-6 py-20 lg:py-0">
        {/* Ambient gradient orbs */}
        <div
          className="pointer-events-none absolute top-20 left-10 h-[400px] w-[400px] rounded-full opacity-15 blur-[100px]"
          style={{ background: "radial-gradient(circle, #D4A99A 0%, transparent 70%)" }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute bottom-20 right-10 h-[350px] w-[350px] rounded-full opacity-10 blur-[80px]"
          style={{ background: "radial-gradient(circle, #B97A6A 0%, transparent 70%)" }}
          aria-hidden="true"
        />

        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Left — Copy */}
          <div className="relative z-10 animate-fade-in">
            <p className="mb-5 text-xs font-semibold tracking-[0.25em] uppercase text-accent">
              {t("hero.eyebrow")}
            </p>

            <h1 className="font-serif text-3xl leading-[1.1] tracking-tight text-ink sm:text-4xl lg:text-6xl">
              {t("hero.titleBefore")}{" "}
              <span className="relative inline-block">
                <span className="relative z-10 italic text-accent">{t("hero.titleHighlight")}</span>
                <span
                  className="absolute bottom-1 left-0 -z-0 h-3 w-full rounded-sm opacity-20"
                  style={{ background: "linear-gradient(90deg, #D4A99A, #B97A6A)" }}
                  aria-hidden="true"
                />
              </span>
            </h1>

            <p className="mt-7 max-w-lg text-lg leading-relaxed text-muted">
              {t("hero.lead")}
            </p>

            {/* CTA group */}
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a
                href={loginHref}
                className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-accent to-accent-hover px-8 py-4 text-base font-medium text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              >
                {t("hero.cta")}
                <svg
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </a>
              <span className="text-sm text-muted-light">
                <span className="font-semibold text-ink">{t("hero.priceAmount")}</span> {t("hero.priceNote")}
              </span>
            </div>

            {/* Mini social proof */}
            <div className="mt-10 flex items-center gap-5 border-t border-accent/10 pt-6">
              <div className="flex -space-x-2">
                {HERO_AVATAR_GRADIENTS.map((gradient, i) => (
                  <div
                    key={i}
                    className={`h-8 w-8 rounded-full border-2 border-cream bg-gradient-to-br ${gradient}`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted">
                <span className="font-semibold text-ink">{t("hero.socialProofBold")}</span> {t("hero.socialProofRest")}
              </p>
            </div>
          </div>

          {/* Right — Dossier visual */}
          <div className="relative animate-slide-up lg:animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Background glow */}
              <div
                className="absolute inset-0 -m-4 rounded-3xl opacity-50 blur-2xl"
                style={{ background: "linear-gradient(135deg, rgba(212,169,154,0.3), rgba(185,122,106,0.15))" }}
                aria-hidden="true"
              />
              {/* Main dossier image */}
              <div className="relative overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/5">
                <Image
                  src="/demo/dossier-autumn.png"
                  alt={t("hero.heroImageAlt")}
                  width={600}
                  height={750}
                  className="w-full"
                  priority
                />
              </div>
              {/* Floating badge */}
              <div className="hidden sm:block absolute -bottom-3 -left-3 rounded-xl border border-accent/10 bg-white/90 px-4 py-3 shadow-lg backdrop-blur-sm animate-float sm:-left-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                    <svg className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink">{t("hero.badgeResult")}</p>
                    <p className="text-[10px] text-muted">{t("hero.badgeStatus")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          TRUST BAR — Credibilità
         ═══════════════════════════════════════════════ */}
      <section className="border-y border-accent/8 bg-white/50 px-4 sm:px-6 py-6 sm:py-8">
        <div className="mx-auto grid max-w-5xl grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-x-10 gap-y-3 sm:gap-y-4 text-center text-sm text-muted">
          {trustItems.map((item) => (
            <div key={item.text} className="flex items-center gap-2">
              <span className="text-base">{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          DEMO SHOWCASE — Interactive Dossier Gallery
         ═══════════════════════════════════════════════ */}
      <section className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center animate-fade-in">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent">
              {t("showcase.eyebrow")}
            </p>
            <h2 className="mt-4 font-serif text-3xl tracking-tight text-ink sm:text-4xl">
              {t("showcase.title")}
            </h2>
            <p className="mt-5 text-lg text-muted leading-relaxed">
              {t("showcase.lead")}
            </p>
          </div>

          {/* Interactive showcase */}
          <DossierShowcase />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          HOW IT WORKS — 3 Steps
         ═══════════════════════════════════════════════ */}
      <HowItWorks lang={locale} />

      {/* ═══════════════════════════════════════════════
          SEASON EXPLORER — Carousel interattivo
         ═══════════════════════════════════════════════ */}
      <section className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent">
              {t("seasons.eyebrow")}
            </p>
            <h2 className="mt-4 font-serif text-3xl tracking-tight text-ink sm:text-4xl">
              {t("seasons.title")}
            </h2>
            <p className="mt-5 text-lg text-muted leading-relaxed">
              {t("seasons.lead")}
            </p>
          </div>

          <SeasonCarousel />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          VALUE PROPOSITION — Zig-zag layout
         ═══════════════════════════════════════════════ */}
      <section className="bg-white/40 px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl space-y-24">
          {/* Feature 1 */}
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0 1 19.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 0 0 4.5 10.5a7.464 7.464 0 0 1-1.15 3.993m1.989 3.559A11.209 11.209 0 0 0 8.25 10.5a3.75 3.75 0 1 1 7.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 0 1-3.6 9.75m6.633-4.596a18.666 18.666 0 0 1-2.485 5.33" />
                </svg>
              </div>
              <h3 className="font-serif text-2xl text-ink">{t("valueProp.feature1.title")}</h3>
              <p className="mt-4 text-muted leading-relaxed">
                {t("valueProp.feature1.description")}
              </p>
              <ul className="mt-6 space-y-3">
                {feature1Bullets.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-ink/80">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative overflow-hidden rounded-2xl bg-cream-dark/30 p-6 lg:p-8">
              {/* Simulated analysis card */}
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-200" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-light">{t("valueProp.feature1.resultLabel")}</p>
                    <p className="font-serif text-lg text-ink">{t("valueProp.feature1.resultValue")}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {feature1Attrs.map((d) => (
                    <div key={d.label} className="rounded-lg bg-white/70 p-3 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-light">{d.label}</p>
                      <p className="mt-1 text-sm font-medium text-ink">{d.value}</p>
                    </div>
                  ))}
                </div>
                {/* Mini palette */}
                <div className="flex gap-1.5">
                  {PALETTE_HEX.map((c) => (
                    <div key={c} className="h-8 flex-1 rounded-lg first:rounded-l-xl last:rounded-r-xl transition-transform hover:scale-110" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2 — reversed */}
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="order-2 lg:order-1 relative overflow-hidden rounded-2xl bg-cream-dark/30 p-6 lg:p-8">
              {/* Simulated outfit grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {feature2Looks.map((look, i) => (
                  <div key={look.name} className="group relative overflow-hidden rounded-xl aspect-[3/4] cursor-pointer">
                    <div className={`absolute inset-0 bg-gradient-to-br ${FEATURE2_LOOK_GRADIENTS[i]} transition-transform duration-500 group-hover:scale-110`} />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-3">
                      <p className="text-xs font-semibold text-white">{look.name}</p>
                      <p className="text-[10px] text-white/70">{look.colors}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
              </div>
              <h3 className="font-serif text-2xl text-ink">{t("valueProp.feature2.title")}</h3>
              <p className="mt-4 text-muted leading-relaxed">
                {t("valueProp.feature2.description")}
              </p>
              <ul className="mt-6 space-y-3">
                {feature2Bullets.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-ink/80">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FINAL CTA — Closing section
         ═══════════════════════════════════════════════ */}
      <section className="relative px-6 py-24 sm:py-32">
        {/* Background pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage: "radial-gradient(circle at 30% 50%, rgba(212,169,154,0.2) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(185,122,106,0.15) 0%, transparent 50%)",
          }}
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent">
            {t("finalCta.eyebrow")}
          </p>
          <h2 className="mt-4 font-serif text-3xl tracking-tight text-ink sm:text-4xl lg:text-5xl">
            {t("finalCta.title")}
          </h2>
          <p className="mt-6 text-lg text-muted leading-relaxed">
            {t("finalCta.lead")}
          </p>

          <div className="mt-10 flex flex-col items-center gap-5">
            <a
              href={loginHref}
              className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-accent to-accent-hover px-10 py-5 text-lg font-medium text-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 active:scale-[0.98]"
            >
              {t("finalCta.cta")}
              <svg
                className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
                fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </a>
            <p className="text-sm text-muted-light">
              {t("finalCta.subnote")}
            </p>
          </div>

          {/* Trust indicators */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-light">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
              {finalTrust[0]}
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              {finalTrust[1]}
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              {finalTrust[2]}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FOOTER
         ═══════════════════════════════════════════════ */}
      <footer className="border-t border-accent/8 px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center gap-4">
            <p className="font-serif text-lg text-ink">{t("footer.brand")}</p>
            <p className="text-xs text-muted-light">
              {t("footer.tagline")}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-light/80">
              <a href={privacyHref} className="hover:text-accent transition-colors">{t("footer.privacy")}</a>
              <span className="hidden sm:inline">·</span>
              <a href={termsHref} className="hover:text-accent transition-colors">{t("footer.terms")}</a>
              <span className="hidden sm:inline">·</span>
              <a href="mailto:info@antigravity.dev" className="hover:text-accent transition-colors">{t("footer.contact")}</a>
            </div>
            <p className="mt-2 text-xs text-muted-light/50">
              &copy; {new Date().getFullYear()} {t("footer.copyrightSuffix")}
            </p>
          </div>
        </div>
      </footer>
      {/* ═══════════════════════════════════════════════
          MOBILE STICKY CTA — Fixed bottom bar
         ═══════════════════════════════════════════════ */}
      <div className="fixed bottom-0 inset-x-0 z-30 sm:hidden border-t border-accent/10 bg-white/95 backdrop-blur-md px-4 py-3 safe-area-bottom">
        <a
          href={loginHref}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent-hover px-6 py-3.5 text-sm font-medium text-white shadow-lg active:scale-[0.98] transition-transform"
        >
          {t("mobileCta")}
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </a>
      </div>

      {/* Spacer for mobile sticky CTA */}
      <div className="h-20 sm:hidden" />
    </main>
  );
}
