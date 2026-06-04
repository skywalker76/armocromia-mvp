"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/i18n/translations-context";

interface FAQItem {
  q: string;
  a: string;
}

export default function FAQAccordion() {
  const { raw } = useTranslations("marketing.faq");
  const items = raw<FAQItem[]>("items");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="py-2">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i} className="border-b border-accent/10 last:border-b-0">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-accent"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              <span className="text-base font-medium text-ink">{item.q}</span>
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm text-accent transition-transform duration-300 ${
                  isOpen ? "rotate-45" : ""
                }`}
              >
                +
              </span>
            </button>
            <div
              className={`overflow-hidden transition-all duration-400 ease-in-out ${
                isOpen ? "max-h-[300px] pb-5" : "max-h-0"
              }`}
            >
              <p className="text-sm leading-relaxed text-muted pr-12">{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
