"use client";

import { useActionState, useRef, useState, useCallback } from "react";
import { analyzePhoto, type AnalyzePhotoState } from "@/app/(app)/dashboard/actions";
import { UPLOAD_CONSTANTS } from "@/lib/armocromia/schemas";
import ProgressStepper from "./ProgressStepper";

/**
 * Componente upload foto con drag-and-drop, anteprima, e invocazione AI.
 *
 * Why: Client Component perché gestisce stato locale (file preview,
 * drag-over, progress). La mutazione è delegata alla Server Action.
 */

const initialState: AnalyzePhotoState = { status: "idle" };

export default function PhotoUploader() {
  const [state, formAction, isPending] = useActionState(analyzePhoto, initialState);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Why: step tracking per il ProgressStepper.
  // isPending = true per tutta la durata della Server Action,
  // ma non possiamo tracciare i sub-step. Usiamo una stima:
  // 0=upload, 1=analisi, 2=generazione, 3=completato
  const currentStep = isPending ? 2 : state.status === "success" ? 4 : 0;

  const handleFile = useCallback((file: File | null) => {
    if (!file) return;

    // Validazione client-side veloce
    if (file.size > UPLOAD_CONSTANTS.maxFileSize) {
      alert(`La foto deve essere al massimo ${UPLOAD_CONSTANTS.maxFileSizeMB}MB`);
      return;
    }
    if (!UPLOAD_CONSTANTS.acceptedTypes.includes(file.type as typeof UPLOAD_CONSTANTS.acceptedTypes[number])) {
      alert("Formato non supportato. Usa JPEG, PNG o WebP");
      return;
    }

    setFileName(file.name);
    const url = URL.createObjectURL(file);
    setPreview(url);

    // Imposta il file nell'input (necessario per FormData)
    if (fileInputRef.current) {
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInputRef.current.files = dt.files;
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0] ?? null;
      handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      handleFile(file);
    },
    [handleFile]
  );

  const clearPreview = useCallback(() => {
    setPreview(null);
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // Successo → non mostrare più l'uploader
  if (state.status === "success") {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50/50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="font-serif text-xl text-ink">Analisi completata!</h3>
        <p className="mt-2 text-muted">
          Il tuo dossier cromatico è pronto. Ricarica la pagina per visualizzarlo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Progress Stepper — visibile solo durante l'elaborazione */}
      {isPending && (
        <div className="rounded-2xl border border-accent/10 bg-white p-6 shadow-sm">
          <ProgressStepper currentStep={currentStep} />
          <p className="mt-4 text-center text-sm text-muted animate-pulse">
            Stiamo analizzando la tua foto con l&apos;intelligenza artificiale...
          </p>
        </div>
      )}

      {/* Errore */}
      {state.status === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="font-medium">Errore:</span> {state.error}
        </div>
      )}

      {/* Form upload */}
      {!isPending && (
        <form action={formAction} className="space-y-6">
          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !preview && fileInputRef.current?.click()}
            className={`
              relative cursor-pointer rounded-2xl border-2 border-dashed p-8
              transition-all duration-300 ease-out
              ${isDragOver
                ? "border-accent bg-accent/5 scale-[1.01]"
                : preview
                  ? "border-green-300 bg-green-50/30"
                  : "border-accent/20 bg-white hover:border-accent/40 hover:bg-accent/5"
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              name="photo"
              accept={UPLOAD_CONSTANTS.acceptString}
              onChange={handleInputChange}
              className="hidden"
              required
            />

            {preview ? (
              /* Anteprima foto */
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-xl shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="Anteprima foto"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-col items-center gap-2 sm:items-start">
                  <p className="font-medium text-ink">{fileName}</p>
                  <p className="text-sm text-muted">Foto pronta per l&apos;analisi</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearPreview();
                    }}
                    className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
                  >
                    Cambia foto
                  </button>
                </div>
              </div>
            ) : (
              /* Stato vuoto — drop zone */
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                  <svg
                    className="h-7 w-7 text-accent"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
                    />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="font-medium text-ink">
                    Trascina qui la tua foto
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    oppure <span className="text-accent font-medium">sfoglia i file</span>
                  </p>
                  <p className="mt-3 text-xs text-muted-light">
                    JPEG, PNG o WebP • Max {UPLOAD_CONSTANTS.maxFileSizeMB}MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Note opzionali */}
          {preview && (
            <div>
              <label htmlFor="userNotes" className="block text-sm font-medium text-ink mb-2">
                Note (opzionale)
              </label>
              <input
                id="userNotes"
                name="userNotes"
                type="text"
                placeholder="Es. Ho i capelli tinti, il colore naturale è castano"
                maxLength={500}
                className="w-full rounded-xl border border-accent/20 bg-white px-4 py-3 text-sm text-ink placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30 transition-colors"
              />
            </div>
          )}

          {/* Submit */}
          {preview && (
            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-full bg-accent px-8 py-4 text-base font-medium text-white shadow-lg transition-all duration-300 hover:bg-accent-hover hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
            >
              {isPending ? "Analisi in corso..." : "Analizza i miei colori ✨"}
            </button>
          )}
        </form>
      )}
    </div>
  );
}
