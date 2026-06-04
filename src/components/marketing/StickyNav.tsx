"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "@/lib/i18n/translations-context";

const NAV_LINKS = [
  { key: "dossier", href: "#dossier-gallery" },
  { key: "reviews", href: "#recensioni" },
  { key: "howItWorks", href: "#come-funziona" },
  { key: "seasons", href: "#stagioni" },
  { key: "pricing", href: "#prezzo" },
  { key: "faq", href: "#faq" },
  { key: "cta", href: "#inizia" },
];

export default function StickyNav() {
  const { t } = useTranslations("marketing.stickyNav");
  const [visible, setVisible] = useState(false);
  const [activeId, setActiveId] = useState<string>("");

  /* Show/hide based on scroll position */
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Track active section */
  useEffect(() => {
    const ids = NAV_LINKS.map((l) => l.href.slice(1));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      e.preventDefault();
      const id = href.slice(1);
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    []
  );

  return (
    <nav
      className={`fixed top-5 left-1/2 z-50 -translate-x-1/2 transition-all duration-300 ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-4 pointer-events-none"
      }`}
      aria-label="Page navigation"
    >
      <div className="flex gap-1 rounded-full border border-glass-border bg-white/85 px-2 py-1.5 shadow-lg backdrop-blur-xl max-w-[94vw] overflow-x-auto hide-scrollbar">
        {NAV_LINKS.map((link) => (
          <a
            key={link.key}
            href={link.href}
            onClick={(e) => handleClick(e, link.href)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition-all duration-200 ${
              activeId === link.href.slice(1)
                ? "bg-accent text-white"
                : "text-muted-light hover:bg-accent/10 hover:text-accent"
            }`}
          >
            {t(link.key)}
          </a>
        ))}
      </div>
    </nav>
  );
}
