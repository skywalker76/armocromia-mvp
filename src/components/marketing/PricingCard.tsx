import { getTranslations } from "@/lib/i18n/server";
import { localePath, isValidLocale, defaultLocale } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";

interface PricingCardProps {
  lang: string;
}

export default async function PricingCard({ lang }: PricingCardProps) {
  const locale = (isValidLocale(lang) ? lang : defaultLocale) as Locale;
  const { t, raw } = await getTranslations(locale, "marketing.pricing");
  const features = raw<string[]>("features");
  const loginHref = localePath(locale, "/auth/login");

  return (
    <section id="prezzo" className="bg-white/40 px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent">
          {t("eyebrow")}
        </p>
        <h2 className="mt-4 font-serif text-3xl tracking-tight text-ink sm:text-4xl">
          {t("title")}
        </h2>
      </div>

      <div className="mx-auto mt-12 max-w-lg">
        <div className="relative overflow-hidden rounded-2xl border border-glass-border bg-glass/80 p-10 shadow-lg backdrop-blur-xl">
          {/* Gradient top stripe */}
          <div
            className="absolute inset-x-0 top-0 h-1"
            style={{ background: "linear-gradient(90deg, #8B5443, #D4A99A)" }}
          />

          {/* Price */}
          <div className="text-center">
            <p className="font-serif text-5xl font-bold text-ink">
              {t("amount")}
            </p>
            <p className="mt-1 text-sm text-muted">{t("period")}</p>
            <p className="mt-2 text-base text-muted-light">{t("subtitle")}</p>
          </div>

          {/* Features */}
          <ul className="mt-8 space-y-0">
            {features.map((feature, i) => (
              <li
                key={i}
                className={`flex items-center gap-3 py-3 text-sm text-ink/85 ${
                  i < features.length - 1 ? "border-b border-accent/8" : ""
                }`}
              >
                <svg
                  className="h-5 w-5 shrink-0 text-success"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m4.5 12.75 6 6 9-13.5"
                  />
                </svg>
                {feature}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <a
            href={loginHref}
            className="group relative mt-8 flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-gradient-to-r from-accent to-accent-hover px-8 py-4 text-base font-medium text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
          >
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-full" />
            {t("cta")}
            <svg
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
              />
            </svg>
          </a>

          {/* Guarantee */}
          <p className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-light">
            <svg
              className="h-4 w-4 text-success"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
              />
            </svg>
            {t("guarantee")}
          </p>
        </div>
      </div>
    </section>
  );
}
