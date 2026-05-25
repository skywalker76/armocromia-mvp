import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { TranslationsProvider } from "@/lib/i18n/translations-context";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getTranslations } from "@/lib/i18n/server";
import { defaultLocale, isValidLocale, locales, type Locale } from "@/lib/i18n/config";
import { ConsentProvider } from "@/lib/consent/consent-context";
import CookieBanner from "@/components/consent/CookieBanner";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";

/**
 * Font Playfair Display — serif editoriale per titoli.
 * Why: evoca l'estetica magazine italiano, eleganza e tradizione tipografica.
 */
const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Font Inter — sans-serif moderno per body text.
 * Why: alta leggibilità su schermo, ottimo per UI e testi lunghi.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Viewport configuration — separata da metadata per Next.js 16.
 * Why: viewport-fit=cover abilita safe area su iPhone con notch/Dynamic Island.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#B97A6A",
};

const SITE_URL = "https://www.cromeastudio.com";

const KEYWORDS_BY_LOCALE: Record<Locale, string[]> = {
  it: [
    "cromea studio",
    "armocromia",
    "analisi cromatica",
    "personal color analysis",
    "palette colori",
    "consulenza immagine",
    "stagione cromatica",
    "AI styling",
  ],
  en: [
    "cromea studio",
    "color analysis",
    "personal color analysis",
    "color season",
    "color palette",
    "image consulting",
    "AI styling",
    "armocromia",
  ],
  es: [
    "cromea studio",
    "análisis cromático",
    "análisis de color personal",
    "armocromía",
    "paleta de colores",
    "consultoría de imagen",
    "estación cromática",
    "AI styling",
  ],
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isValidLocale(lang) ? lang : defaultLocale;
  const { t } = await getTranslations(locale, "metadata.root");

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: t("titleDefault"),
      template: t("titleTemplate"),
    },
    description: t("description"),
    applicationName: "Cromea Studio",
    keywords: KEYWORDS_BY_LOCALE[locale],
    authors: [{ name: "Antigravity" }],
    creator: "Antigravity",
    publisher: "Antigravity",
    manifest: "/manifest.json",
    alternates: {
      canonical: `/${locale}`,
      languages: {
        it: "/it",
        en: "/en",
        es: "/es",
      },
    },
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      url: `${SITE_URL}/${locale}`,
      siteName: "Cromea Studio",
      locale: t("ogLocale"),
      type: "website",
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: "Cromea Studio — I tuoi colori ideali",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("twitterTitle"),
      description: t("twitterDescription"),
      images: ["/opengraph-image"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Cromea Studio",
    },
    icons: {
      icon: "/icon-192.png",
      apple: "/icon-192.png",
    },
  };
}

/**
 * Pre-rendering statico delle route per ogni locale.
 * Why: permette a Next.js di sapere quali [lang] sono validi e generare
 * static params senza indovinare a runtime.
 */
export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  // Why: se l'utente naviga a /xx/* con un locale non supportato, 404 invece
  // di renderizzare in italiano in silenzio — più chiaro per debug.
  if (!isValidLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const fallbackDict =
    lang === defaultLocale ? dict : await getDictionary(defaultLocale);

  return (
    <html
      lang={lang}
      className={`${playfairDisplay.variable} ${inter.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        {/* Self-healing script to detect ChunkLoadErrors (aggressive mobile caches / redeployments) and trigger a hard reload */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(e) {
                if (e.message && (e.message.indexOf('ChunkLoadError') !== -1 || e.message.indexOf('Loading chunk') !== -1)) {
                  console.warn('ChunkLoadError intercepted. Performing self-healing location refresh...');
                  window.location.reload(true);
                }
              }, true);
            `,
          }}
        />
        <LocaleProvider locale={lang}>
          <TranslationsProvider dict={dict} fallbackDict={fallbackDict}>
            <ConsentProvider>
              {children}
              <CookieBanner />
              <GoogleAnalytics />
            </ConsentProvider>
          </TranslationsProvider>
        </LocaleProvider>
        {/* Service Worker registration — only in production */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && location.hostname !== 'localhost') {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
