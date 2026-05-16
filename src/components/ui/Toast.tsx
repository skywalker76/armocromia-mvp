"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "@/lib/i18n/translations-context";

export type ToastType = "success" | "error" | "info";

interface ToastData {
  id: string;
  type: ToastType;
  message: string;
}

let toastListeners: Array<(toast: ToastData) => void> = [];

/** Mostra un toast da qualsiasi componente. */
export function showToast(type: ToastType, message: string) {
  const id = `${Date.now()}-${Math.random()}`;
  toastListeners.forEach((fn) => fn({ id, type, message }));
}

const ICONS: Record<ToastType, ReactNode> = {
  success: (
    <svg className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  ),
  error: (
    <svg className="h-5 w-5 text-error" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
    </svg>
  ),
};

const BG: Record<ToastType, string> = {
  success: "bg-success-light border-success/20",
  error: "bg-error-light border-error/20",
  info: "bg-white border-accent/20",
};

/**
 * Container toast — montare UNA VOLTA nel layout root.
 */
export default function ToastContainer() {
  const { t } = useTranslations("app.toast");
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    const handler = (toast: ToastData) => {
      setToasts((prev) => [...prev, toast]);
      // Auto-dismiss
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 4000);
    };
    toastListeners.push(handler);
    return () => {
      toastListeners = toastListeners.filter((fn) => fn !== handler);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 rounded-xl border px-5 py-3.5 shadow-lg ${BG[toast.type]}`}
          style={{ animation: "toast-in 0.3s ease-out" }}
          role="alert"
        >
          {ICONS[toast.type]}
          <p className="text-sm font-medium text-ink">{toast.message}</p>
          <button
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="ml-2 text-muted-light hover:text-ink transition-colors"
            aria-label={t("close")}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
