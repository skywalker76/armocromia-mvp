"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteDossier } from "@/app/(app)/dashboard/actions";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { showToast } from "@/components/ui/Toast";

interface DeleteDossierButtonProps {
  dossierId: number;
  seasonLabel?: string;
  /** Redirect dopo eliminazione (default: resta nella stessa pagina) */
  redirectTo?: string;
  /** Variante visiva */
  variant?: "icon" | "text" | "full";
  className?: string;
}

/**
 * Bottone elimina dossier con conferma modale e feedback toast.
 *
 * Why: isolato come componente per essere riusabile sia nella
 * DossierCard che nella pagina dettaglio.
 */
export default function DeleteDossierButton({
  dossierId,
  seasonLabel,
  redirectTo,
  variant = "icon",
  className = "",
}: DeleteDossierButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteDossier(dossierId);
      if (result.success) {
        showToast("success", "Dossier eliminato con successo");
        setShowConfirm(false);
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.refresh();
        }
      } else {
        showToast("error", result.error ?? "Errore durante l'eliminazione");
        setShowConfirm(false);
      }
    });
  };

  const label = seasonLabel ? `"${seasonLabel}"` : `#${dossierId}`;

  return (
    <>
      {variant === "icon" && (
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className={`flex h-9 w-9 items-center justify-center rounded-full text-muted-light transition-all hover:bg-danger-light hover:text-danger ${className}`}
          title="Elimina dossier"
          aria-label="Elimina dossier"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </button>
      )}

      {variant === "text" && (
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className={`text-sm font-medium text-muted-light transition-colors hover:text-danger ${className}`}
        >
          Elimina
        </button>
      )}

      {variant === "full" && (
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className={`inline-flex items-center gap-2 rounded-full border border-danger/20 px-5 py-2.5 text-sm font-medium text-danger transition-all hover:bg-danger-light hover:border-danger/30 ${className}`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
          Elimina dossier
        </button>
      )}

      <ConfirmModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Elimina dossier"
        message={`Stai per eliminare definitivamente il dossier ${label}. Questa azione è irreversibile e tutti i dati associati verranno persi.`}
        confirmLabel="Elimina definitivamente"
        cancelLabel="Annulla"
        variant="danger"
        loading={isPending}
      />
    </>
  );
}
