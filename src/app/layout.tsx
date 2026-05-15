import type { Metadata, Viewport } from "next";
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

export const metadata: Metadata = {
  title: {
    default: "Armocromia — I colori che ti fanno splendere",
    template: "%s | Armocromia",
  },
  description:
    "Scopri la tua armocromia personale con un dossier visivo professionale. Analisi cromatica personalizzata con palette colori, outfit e makeup su misura.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Armocromia",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
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
      <body className="min-h-full flex flex-col">
        {children}
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
