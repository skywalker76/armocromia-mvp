import type { Metadata } from "next";
import { isValidLocale, localePath, defaultLocale } from "@/lib/i18n/config";
import { getTranslations } from "@/lib/i18n/server";
import { RichText } from "@/components/ui/RichText";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isValidLocale(lang) ? lang : defaultLocale;
  const { t } = await getTranslations(locale, "metadata.privacy");
  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: `/${locale}/privacy` },
  };
}

interface ProcessorRow {
  provider: string;
  role: string;
  location: string;
}

interface PurposeRow {
  purpose: string;
  basis: string;
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isValidLocale(lang) ? lang : defaultLocale;
  const homeUrl = localePath(locale, "/");

  const { t, raw } = await getTranslations(locale, "legal.privacy");
  const { t: tc } = await getTranslations(locale, "legal.common");

  const intro = raw<string[]>("intro");
  const sec2Items = raw<string[]>("sec2.items");
  const sec3Rows = raw<PurposeRow[]>("sec3.rows");
  const sec4Items = raw<string[]>("sec4.items");
  const sec6Rows = raw<ProcessorRow[]>("sec6.rows");
  const sec7Items = raw<string[]>("sec7.items");

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
        {intro.map((html, i) => (
          <RichText key={i} html={i === 0 ? html.replace("{homeUrl}", homeUrl) : html} />
        ))}
      </section>

      <h2 className="mt-12 font-serif text-2xl text-ink">{t("sec1.heading")}</h2>
      <div className="mt-4 space-y-2 text-ink/85">
        <RichText html={t("sec1.p1")} />
        <RichText html={t("sec1.p2")} />
      </div>

      <h2 className="mt-12 font-serif text-2xl text-ink">{t("sec2.heading")}</h2>
      <p className="mt-4 text-ink/85 leading-relaxed">{t("sec2.intro")}</p>
      <ul className="mt-4 space-y-3 text-ink/85">
        {sec2Items.map((html, i) => (
          <RichText as="li" key={i} html={html} />
        ))}
      </ul>

      <h2 className="mt-12 font-serif text-2xl text-ink">{t("sec3.heading")}</h2>
      <div className="mt-4 overflow-hidden rounded-xl border border-accent/15">
        <table className="w-full text-sm text-ink/85">
          <thead className="bg-cream-dark/40">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">{t("sec3.tableHeadPurpose")}</th>
              <th className="px-4 py-3 text-left font-semibold">{t("sec3.tableHeadBasis")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-accent/10">
            {sec3Rows.map((row, i) => (
              <tr key={i}>
                <td className="px-4 py-3 align-top">{row.purpose}</td>
                <RichText as="td" className="px-4 py-3 align-top" html={row.basis} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <RichText className="mt-4 text-ink/85 leading-relaxed" html={t("sec3.after")} />

      <h2 className="mt-12 font-serif text-2xl text-ink">{t("sec4.heading")}</h2>
      <ul className="mt-4 space-y-3 text-ink/85">
        {sec4Items.map((html, i) => (
          <RichText as="li" key={i} html={html} />
        ))}
      </ul>

      <h2 className="mt-12 font-serif text-2xl text-ink">{t("sec5.heading")}</h2>
      <RichText className="mt-4 text-ink/85 leading-relaxed" html={t("sec5.p1")} />

      <h2 className="mt-12 font-serif text-2xl text-ink">{t("sec6.heading")}</h2>
      <p className="mt-4 text-ink/85 leading-relaxed">{t("sec6.intro")}</p>
      <div className="mt-4 overflow-hidden rounded-xl border border-accent/15">
        <table className="w-full text-sm text-ink/85">
          <thead className="bg-cream-dark/40">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">{t("sec6.tableHeadProvider")}</th>
              <th className="px-4 py-3 text-left font-semibold">{t("sec6.tableHeadRole")}</th>
              <th className="px-4 py-3 text-left font-semibold">{t("sec6.tableHeadLocation")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-accent/10">
            {sec6Rows.map((row, i) => (
              <tr key={i}>
                <td className="px-4 py-3 align-top">{row.provider}</td>
                <td className="px-4 py-3 align-top">{row.role}</td>
                <td className="px-4 py-3 align-top">{row.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <RichText className="mt-4 text-ink/85 leading-relaxed" html={t("sec6.after")} />

      <h2 className="mt-12 font-serif text-2xl text-ink">{t("sec7.heading")}</h2>
      <p className="mt-4 text-ink/85 leading-relaxed">{t("sec7.intro")}</p>
      <ul className="mt-4 space-y-2 text-ink/85">
        {sec7Items.map((html, i) => (
          <RichText as="li" key={i} html={html} />
        ))}
      </ul>
      <RichText className="mt-4 text-ink/85 leading-relaxed" html={t("sec7.after")} />

      <h2 className="mt-12 font-serif text-2xl text-ink">{t("sec8.heading")}</h2>
      <RichText className="mt-4 text-ink/85 leading-relaxed" html={t("sec8.p1")} />

      <h2 className="mt-12 font-serif text-2xl text-ink">{t("sec9.heading")}</h2>
      <RichText className="mt-4 text-ink/85 leading-relaxed" html={t("sec9.p1")} />

      <h2 className="mt-12 font-serif text-2xl text-ink">{t("sec10.heading")}</h2>
      <RichText className="mt-4 text-ink/85 leading-relaxed" html={t("sec10.p1")} />

      <div className="mt-16 rounded-2xl border border-accent/15 bg-white/60 p-6 text-sm text-muted">
        <RichText html={t("callout.lead")} />
      </div>
    </>
  );
}
