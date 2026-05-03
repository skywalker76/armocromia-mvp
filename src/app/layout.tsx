import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: {
    default: "Armocromia — I colori che ti fanno splendere",
    template: "%s | Armocromia",
  },
  description:
    "Scopri la tua armocromia personale con un dossier visivo professionale. Analisi cromatica personalizzata con palette colori, outfit e makeup su misura.",
  // Why: lang="it" per SEO Italia
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${playfairDisplay.variable} ${inter.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
