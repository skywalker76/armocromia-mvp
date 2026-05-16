"use client";

import { useEffect, useRef, useCallback } from "react";
import { useTranslations } from "@/lib/i18n/translations-context";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  loading?: boolean;
}

/**
 * Modale di conferma premium con overlay blur, focus trap e animazioni.
 */
export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = "default",
  loading = false,
}: ConfirmModalProps) {
  const { t } = useTranslations("app.confirmModal");
  const { t: tDelete } = useTranslations("app.delete");
  const resolvedConfirm = confirmLabel ?? t("defaultConfirm");
  const resolvedCancel = cancelLabel ?? t("defaultCancel");
  const modalRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus trap + Escape to close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    },
    [onClose, loading]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      // Focus cancel button on open
      setTimeout(() => cancelRef.current?.focus(), 100);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  const isDanger = variant === "danger";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-sm animate-fade-in"
        onClick={loading ? undefined : onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-xl animate-scale-in"
      >
        {/* Icon */}
        <div
          className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full ${
            isDanger ? "bg-danger-light" : "bg-accent/10"
          }`}
        >
          {isDanger ? (
            <svg className="h-7 w-7 text-danger" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          ) : (
            <svg className="h-7 w-7 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
            </svg>
          )}
        </div>

        {/* Content */}
        <h3
          id="confirm-modal-title"
          className="text-center font-serif text-xl text-ink"
        >
          {title}
        </h3>
        <p className="mt-3 text-center text-sm text-muted leading-relaxed">
          {message}
        </p>

        {/* Actions */}
        <div className="mt-8 flex gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-full border border-accent/20 px-5 py-3 text-sm font-medium text-ink transition-all hover:bg-cream-dark hover:border-accent/30 disabled:opacity-50"
          >
            {resolvedCancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-full px-5 py-3 text-sm font-medium text-white transition-all disabled:opacity-60 ${
              isDanger
                ? "bg-danger hover:bg-danger/90 shadow-md"
                : "bg-accent hover:bg-accent-hover shadow-md"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {tDelete("deleting")}
              </span>
            ) : (
              resolvedConfirm
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
