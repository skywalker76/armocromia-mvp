import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/config";

const BASE_URL = "https://armocromia-mvp-nine.vercel.app";

/**
 * Sitemap multi-locale.
 * Why: ogni route pubblica viene esposta una volta per locale, con hreflang
 * alternates che dicono a Google quale versione mostrare per ogni lingua.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes: Array<{
    path: string;
    changeFrequency: "weekly" | "monthly" | "yearly";
    priority: number;
  }> = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/auth/login", changeFrequency: "monthly", priority: 0.5 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
    { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  ];

  return routes.flatMap(({ path, changeFrequency, priority }) =>
    locales.map((locale) => {
      const segment = path === "/" ? "" : path;
      const url = `${BASE_URL}/${locale}${segment}`;

      // hreflang alternates per i motori di ricerca
      const languages: Record<string, string> = {};
      for (const l of locales) {
        const s = path === "/" ? "" : path;
        languages[l] = `${BASE_URL}/${l}${s}`;
      }

      return {
        url,
        lastModified: now,
        changeFrequency,
        priority,
        alternates: { languages },
      };
    })
  );
}
