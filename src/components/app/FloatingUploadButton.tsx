"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "@/lib/i18n/translations-context";

export default function FloatingUploadButton({ 
  targetId = "new-analysis-section" 
}: { 
  targetId?: string 
}) {
  const { t } = useTranslations("app.dashboard");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const targetElement = document.getElementById(targetId);
      if (!targetElement) return;

      const targetRect = targetElement.getBoundingClientRect();
      const isTargetVisible = targetRect.top < window.innerHeight && targetRect.bottom >= 0;

      // Show if we've scrolled down at least 300px AND the target section is NOT visible in the viewport
      if (window.scrollY > 300 && !isTargetVisible) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Check immediately
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [targetId]);

  const scrollToUpload = () => {
    const element = document.getElementById(targetId);
    if (element) {
      // Smooth scroll to the element, accounting for some padding
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToUpload}
      className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-6 z-50 flex items-center gap-2 rounded-full bg-accent px-5 py-3.5 text-sm font-medium text-white shadow-lg shadow-accent/30 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-accent/40 active:translate-y-0 active:shadow-md animate-fade-in focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
      aria-label={t("newAnalysisHeadingAgain")}
    >
      <Plus className="h-5 w-5" />
      <span>{t("newAnalysisHeadingAgain")}</span>
    </button>
  );
}
