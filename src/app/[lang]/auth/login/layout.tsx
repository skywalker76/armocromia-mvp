import type { Metadata } from "next";
import { isValidLocale, defaultLocale } from "@/lib/i18n/config";
import { getTranslations } from "@/lib/i18n/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isValidLocale(lang) ? lang : defaultLocale;
  const { t } = await getTranslations(locale, "metadata.login");
  return {
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: false },
  };
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
