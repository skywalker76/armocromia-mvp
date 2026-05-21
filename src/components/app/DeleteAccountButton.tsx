"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { deleteAccount } from "@/app/[lang]/(app)/dashboard/actions";
import { showToast } from "@/components/ui/Toast";
import { useLocale } from "@/lib/i18n/locale-context";

// Dizionario di traduzione locale per garantire isolamento e sicurezza sintattica
const TRANSLATIONS = {
  it: {
    buttonText: "Elimina account e dati",
    title: "Diritto all'Oblio",
    subtitle: "Cancellazione Definitiva GDPR",
    description:
      "Stai per richiedere l'eliminazione permanente di tutti i tuoi dati personali ai sensi dell'Art. 17 del GDPR. Questa azione è immediata, irreversibile e distruggerà fisicamente tutti i tuoi dossier generati, le immagini caricate e le informazioni di profilo da ogni database e storage.",
    warningLabel: "QUESTA OPERAZIONE È IRREVERSIBILE",
    confirmPlaceholder: "Digita ELIMINA per confermare",
    confirmWord: "ELIMINA",
    cancel: "Annulla",
    confirm: "Elimina per sempre",
    deleting: "Eliminazione in corso…",
    successToast: "Tutti i tuoi dati sono stati eliminati. Addio.",
    errorTitle: "Cancellazione non riuscita",
  },
  en: {
    buttonText: "Delete account & data",
    title: "Right to be Forgotten",
    subtitle: "GDPR Permanent Deletion",
    description:
      "You are requesting the permanent deletion of your personal data under Article 17 of the GDPR. This action is immediate, irreversible, and will physically destroy all your generated dossiers, uploaded photos, and profile details from all databases and storage.",
    warningLabel: "THIS OPERATION CANNOT BE UNDONE",
    confirmPlaceholder: "Type DELETE to confirm",
    confirmWord: "DELETE",
    cancel: "Cancel",
    confirm: "Delete permanently",
    deleting: "Deleting data…",
    successToast: "All your data has been successfully deleted. Farewell.",
    errorTitle: "Deletion failed",
  },
  es: {
    buttonText: "Eliminar cuenta y datos",
    title: "Derecho al Olvido",
    subtitle: "Eliminación Permanente GDPR",
    description:
      "Está solicitando la eliminación permanente de sus datos personales según el Artículo 17 del GDPR. Esta acción es inmediata, irreversible y destruirá físicamente todos sus dossiers generados, fotos subidas y detalles de perfil de todas las bases de datos y almacenamiento.",
    warningLabel: "ESTA OPERACIÓN NO SE PUEDE DESHACER",
    confirmPlaceholder: "Escribe ELIMINAR para confirmar",
    confirmWord: "ELIMINAR",
    cancel: "Cancelar",
    confirm: "Eliminar permanentemente",
    deleting: "Eliminando datos…",
    successToast: "Todos sus datos han sido eliminados con éxito. Adiós.",
    errorTitle: "Eliminación fallida",
  },
};

interface DeleteAccountButtonProps {
  className?: string;
  showIcon?: boolean;
}

export default function DeleteAccountButton({ className, showIcon = false }: DeleteAccountButtonProps) {
  const locale = useLocale() as "it" | "en" | "es";
  const t = TRANSLATIONS[locale] || TRANSLATIONS.en;

  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isPending, startTransition] = useTransition();
  const modalRef = useRef<HTMLDivElement>(null);

  // Chiudi la modale con ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleDelete = () => {
    if (confirmText !== t.confirmWord) return;

    startTransition(async () => {
      try {
        const result = await deleteAccount(locale);
        if (result.success) {
          showToast("success", t.successToast);
          
          // Eseguiamo il logout server-side invocando programmaticamente la route di logout
          const res = await fetch("/api/auth/logout", {
            method: "POST",
          });

          // Reindirizza alla homepage
          window.location.href = `/${locale}`;
        } else {
          showToast("error", result.error ?? t.errorTitle);
        }
      } catch (err) {
        console.error("Account deletion failed:", err);
        showToast("error", t.errorTitle);
      }
    });
  };

  const isConfirmed = confirmText === t.confirmWord;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setConfirmText("");
          setIsOpen(true);
        }}
        className={className || "text-xs font-semibold tracking-wider uppercase text-muted-light/60 transition-colors hover:text-danger/80"}
      >
        {showIcon && (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        )}
        <span>{t.buttonText}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop con sfocatura luxury */}
          <div
            className="absolute inset-0 bg-ink/75 backdrop-blur-md transition-opacity duration-300"
            onClick={() => !isPending && setIsOpen(false)}
          />

          {/* Contenitore Modale */}
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-lg overflow-hidden border border-border-dark/30 bg-cream/95 px-8 py-10 shadow-2xl transition-all duration-300 dark:bg-ink/95 rounded-2xl"
          >
            {/* Pulsante di chiusura */}
            <button
              type="button"
              disabled={isPending}
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 text-muted-light transition-colors hover:text-ink dark:hover:text-cream disabled:opacity-50"
              aria-label="Chiudi modale"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header Modale */}
            <div className="mb-6 text-center">
              <span className="text-[10px] font-bold tracking-widest text-danger uppercase">
                {t.subtitle}
              </span>
              <h2 className="mt-2 text-2xl font-serif text-ink dark:text-cream">
                {t.title}
              </h2>
            </div>

            {/* Corpo Modale */}
            <div className="space-y-6">
              <p className="text-sm leading-relaxed text-muted-light/95 dark:text-muted-light/80 text-center">
                {t.description}
              </p>

              {/* Warning box */}
              <div className="border border-danger/20 bg-danger-light/10 p-4 text-center dark:border-danger/30 rounded-lg">
                <span className="text-xs font-extrabold tracking-wider text-danger uppercase">
                  ⚠️ {t.warningLabel}
                </span>
              </div>

              {/* Input di conferma */}
              <div className="space-y-2">
                <label htmlFor="confirmText" className="block text-xs font-semibold text-ink dark:text-cream text-center">
                  {t.confirmPlaceholder}
                </label>
                <input
                  type="text"
                  id="confirmText"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  disabled={isPending}
                  autoComplete="off"
                  className="w-full border border-border-dark/20 bg-transparent px-4 py-3 text-center text-sm font-bold tracking-widest text-danger outline-none transition-all focus:border-danger/50 dark:border-border-dark/40 dark:focus:border-danger/60 rounded-xl"
                  placeholder={t.confirmWord}
                />
              </div>
            </div>

            {/* Footer Modale */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="w-full rounded-xl border border-border-dark/20 px-5 py-3 text-sm font-semibold text-muted-light transition-all hover:bg-muted-light/5 hover:text-ink dark:border-border-dark/40 dark:hover:bg-muted-light/10 dark:hover:text-cream sm:w-auto disabled:opacity-50"
              >
                {t.cancel}
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={!isConfirmed || isPending}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-danger px-6 py-3 text-sm font-semibold text-white transition-all shadow-lg shadow-danger/20 hover:bg-danger-dark active:scale-[0.98] sm:w-auto disabled:opacity-30 disabled:pointer-events-none disabled:shadow-none"
              >
                {isPending ? (
                  <>
                    <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>{t.deleting}</span>
                  </>
                ) : (
                  <span>{t.confirm}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
