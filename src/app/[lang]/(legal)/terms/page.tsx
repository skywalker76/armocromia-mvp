import type { Metadata } from "next";
import { isValidLocale, defaultLocale } from "@/lib/i18n/config";
import { getTranslations } from "@/lib/i18n/server";
import { RichText } from "@/components/ui/RichText";

export const metadata: Metadata = {
  title: "Termini di Servizio",
  description:
    "Termini e condizioni di Armocromia: oggetto del servizio, prezzo €29, diritto di recesso 14 giorni, limitazioni di responsabilità.",
  alternates: { canonical: "/terms" },
};

const PRICE = "€29";
const REFUND_DAYS = 14;
const REFUND_EMAIL = "support@antigravity.dev";

export default async function TermsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isValidLocale(lang) ? lang : defaultLocale;

  const { t, raw } = await getTranslations(locale, "legal.terms");
  const { t: tc } = await getTranslations(locale, "legal.common");

  const vars = { price: PRICE, refundDays: REFUND_DAYS, refundEmail: REFUND_EMAIL };

  const sec5Items = raw<string[]>("sec5.items");
  const sec7Items = raw<string[]>("sec7.items");
  const sec8Items = raw<string[]>("sec8.items");
  const sec9Items = raw<string[]>("sec9.items");

  return (
    <>
      <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent">
        {t("eyebrow")}
      </p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight text-ink">
        {t("title")}
      </h1>
      <p className="mt-4 text-sm text-muted">
        {tc("lastUpdatedLabel")} {tc("lastUpdated")}
      </p>

      <section className="mt-12 space-y-4 text-ink/85 leading-relaxed">
        <RichText html={t("intro")} />
      </section>

      <h2 className="mt-12 font-serif text-2xl text-ink">{t("sec1.heading")}</h2>
      <RichText className="mt-4 text-ink/85 leading-relaxed" html={t("sec1.p1", vars)} />

      <h2 className="mt-12 font-serif text-2xl text-ink">{t("sec2.heading")}</h2>
      <RichText className="mt-4 text-ink/85 leading-relaxed" html={t("sec2.p1")} />
      <RichText className="mt-3 text-ink/85 leading-relaxed" html={t("sec2.p2")} />

      <h2 className="mt-12 font-serif text-2xl text-ink">{t("sec3.heading")}</h2>
      <RichText className="mt-4 text-ink/85 leading-relaxed" html={t("sec3.p1")} />

      <h2 className="mt-12 font-serif text-2xl text-ink">{t("sec4.heading")}</h2>
      <RichText className="mt-4 text-ink/85 leading-relaxed" html={t("sec4.p1")} />

      <h2 className="mt-12 font-serif text-2xl text-ink">{t("sec5.heading")}</h2>
      <ul className="mt-4 space-y-3 text-ink/85">
        {sec5Items.map((tpl, i) => (
          <RichText as="li" key={i} html={tpl.replace("{price}", PRICE)} />
        ))}
      </ul>

      <div className="mt-12 rounded-2xl border-2 border-accent/20 bg-white p-6">
        <h2 className="font-serif text-2xl text-ink">
          {t("sec6.heading", vars)}
        </h2>
        <RichText className="mt-4 text-ink/85 leading-relaxed" html={t("sec6.highlight", vars)} />
        <RichText className="mt-3 text-ink/85 leading-relaxed" html={t("sec6.p1", vars)} />
        <RichText className="mt-3 text-sm text-muted" html={t("sec6.p2", vars)} />
      </div>

      <h2 className="mt-12 font-serif text-2xl text-ink">{t("sec7.heading")}</h2>
      <ul className="mt-4 space-y-3 text-ink/85">
        {sec7Items.map((html, i) => (
          <RichText as="li" key={i} html={html} />
        ))}
      </ul>

      <h2 className="mt-12 font-serif text-2xl text-ink">{t("sec8.heading")}</h2>
      <p className="mt-4 text-ink/85 leading-relaxed">{t("sec8.intro")}</p>
      <ul className="mt-4 space-y-2 text-ink/85">
        {sec8Items.map((html, i) => (
          <RichText as="li" key={i} html={html} />
        ))}
      </ul>
      <RichText className="mt-3 text-ink/85 leading-relaxed" html={t("sec8.after")} />

      <h2 className="mt-12 font-serif text-2xl text-ink">{t("sec9.heading")}</h2>
      <ul className="mt-4 space-y-3 text-ink/85">
        {sec9Items.map((html, i) => (
          <RichText as="li" key={i} html={html} />
        ))}
      </ul>

      <h2 className="mt-12 font-serif text-2xl text-ink">{t("sec10.heading")}</h2>
      <RichText className="mt-4 text-ink/85 leading-relaxed" html={t("sec10.p1")} />

      <h2 className="mt-12 font-serif text-2xl text-ink">{t("sec11.heading")}</h2>
      <RichText className="mt-4 text-ink/85 leading-relaxed" html={t("sec11.p1")} />

      <h2 className="mt-12 font-serif text-2xl text-ink">{t("sec12.heading")}</h2>
      <RichText className="mt-4 text-ink/85 leading-relaxed" html={t("sec12.p1")} />
      <RichText className="mt-3 text-ink/85 leading-relaxed" html={t("sec12.p2")} />
      <RichText className="mt-3 text-ink/85 leading-relaxed" html={t("sec12.p3")} />
      <RichText className="mt-3 text-ink/85 leading-relaxed" html={t("sec12.p4")} />

      <h2 className="mt-12 font-serif text-2xl text-ink">{t("sec13.heading")}</h2>
      <RichText className="mt-4 text-ink/85 leading-relaxed" html={t("sec13.p1")} />

      <div className="mt-16 rounded-2xl border border-accent/15 bg-white/60 p-6 text-sm text-muted">
        <RichText html={t("callout.lead", vars)} />
      </div>
    </>
  );
}
