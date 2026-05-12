"use client";

import { useActionState, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { analyzePhoto, type AnalyzePhotoState } from "@/app/(app)/dashboard/actions";
import { UPLOAD_CONSTANTS, ANALYSIS_MODES } from "@/lib/armocromia/schemas";
import ProgressStepper from "./ProgressStepper";

/**
 * Componente upload foto premium con drag-and-drop, anteprima, e invocazione AI.
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
  const [selectedMode, setSelectedMode] = useState<string>("infografica");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const currentStep = isPending ? 2 : state.status === "success" ? 4 : 0;

  const handleFile = useCallback((file: File | null) => {
    if (!file) return;

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

  // Successo → redirect automatico dopo breve delay
  if (state.status === "success") {
    // Redirect al dossier se disponibile
    if (state.dossierId) {
      setTimeout(() => router.push(`/dossier/${state.dossierId}`), 1500);
    }

    return (
      <div className="rounded-2xl border border-success/20 bg-success-light p-8 text-center animate-scale-in">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <svg className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="font-serif text-xl text-ink">Analisi completata!</h3>
        <p className="mt-2 text-muted">
          Il tuo dossier cromatico è pronto. Reindirizzamento in corso…
        </p>
        {/* Progress bar */}
        <div className="mt-4 mx-auto h-1 w-32 overflow-hidden rounded-full bg-success/20">
          <div className="h-full w-full rounded-full bg-success" style={{ animation: "progress-indeterminate 1.5s ease-in-out" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Progress Stepper — visibile solo durante l'elaborazione */}
      {isPending && (
        <div className="rounded-2xl border border-accent/10 bg-white p-6 shadow-xs animate-fade-in">
          <ProgressStepper currentStep={currentStep} />
          <div className="mt-5 text-center">
            <p className="text-sm text-ink font-medium">
              Stiamo creando il tuo dossier personalizzato
            </p>
            <p className="mt-1 text-xs text-muted animate-pulse-soft">
              L&apos;intelligenza artificiale sta analizzando la tua foto…
            </p>
          </div>
          {/* Indeterminate progress bar */}
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-accent/10">
            <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-accent-light to-accent" style={{ animation: "progress-indeterminate 2s ease-in-out infinite" }} />
          </div>
        </div>
      )}

      {/* Errore */}
      {state.status === "error" && (
        <div className="flex items-start gap-3 rounded-xl border border-error/20 bg-error-light px-5 py-4 text-sm animate-slide-up">
          <svg className="mt-0.5 h-5 w-5 shrink-0 text-error" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <div>
            <p className="font-medium text-ink">Qualcosa è andato storto</p>
            <p className="mt-0.5 text-muted">{state.error}</p>
          </div>
        </div>
      )}

      {/* Form upload */}
      {!isPending && (
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="analysisMode" value={selectedMode} />

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
                ? "border-accent bg-accent/5 scale-[1.01] shadow-glow"
                : preview
                  ? "border-success/30 bg-success-light/30"
                  : "border-accent/15 bg-white hover:border-accent/30 hover:bg-accent/[0.02] hover:shadow-xs"
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
              <div className="flex flex-col items-center gap-5 sm:flex-row">
                {/* Preview circolare */}
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl shadow-md ring-2 ring-accent/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="Anteprima foto"
                    className="h-full w-full object-cover"
                  />
                  {/* Success indicator */}
                  <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-success text-white shadow-sm">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2 sm:items-start">
                  <p className="font-medium text-ink">{fileName}</p>
                  <p className="text-sm text-success">Foto pronta per l&apos;analisi</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearPreview();
                    }}
                    className="mt-1 text-sm font-medium text-muted-light hover:text-danger transition-colors"
                  >
                    Cambia foto
                  </button>
                </div>
              </div>
            ) : (
              <>
              <div className="flex flex-col items-center gap-4 py-6">
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300 ${isDragOver ? "bg-accent/15 scale-110" : "bg-accent/8"}`}>
                  <svg
                    className={`h-7 w-7 text-accent transition-transform duration-300 ${isDragOver ? "scale-110" : ""}`}
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
                  <p className="mt-1.5 text-sm text-muted">
                    oppure <span className="text-accent font-medium cursor-pointer hover:underline">sfoglia i file</span>
                  </p>
                  <p className="mt-4 text-xs text-muted-light">
                    JPEG, PNG o WebP · Max {UPLOAD_CONSTANTS.maxFileSizeMB}MB
                  </p>
                </div>
              </div>

              {/* Mobile camera capture button */}
              <div className="sm:hidden mt-4 pt-4 border-t border-accent/10">
                <label className="flex items-center justify-center gap-3 rounded-xl border-2 border-accent/20 bg-accent/5 px-6 py-4 text-sm font-medium text-accent cursor-pointer active:scale-[0.98] transition-transform">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                  </svg>
                  Scatta una foto
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handleInputChange}
                    className="hidden"
                  />
                </label>
              </div>
              </>
            )}
          </div>

          {/* Selettore modalità analisi */}
          {preview && (
            <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <label className="block text-sm font-medium text-ink mb-3">
                Scegli il tipo di analisi
              </label>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                {ANALYSIS_MODES.map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => setSelectedMode(mode.value)}
                    className={`
                      relative rounded-xl border-2 p-4 text-left transition-all duration-200
                      ${selectedMode === mode.value
                        ? "border-accent bg-accent/5 shadow-md ring-1 ring-accent/20"
                        : "border-accent/8 bg-white hover:border-accent/20 hover:bg-accent/[0.02]"
                      }
                    `}
                  >
                    {selectedMode === mode.value && (
                      <div className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent">
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      </div>
                    )}
                    <span className="text-2xl">{mode.icon}</span>
                    <p className="mt-2 font-medium text-ink text-sm">{mode.label}</p>
                    <p className="mt-1 text-xs text-muted leading-relaxed">{mode.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Note opzionali */}
          {preview && (
            <div className="animate-slide-up" style={{ animationDelay: "0.15s" }}>
              <label htmlFor="userNotes" className="block text-sm font-medium text-ink mb-2">
                Note (opzionale)
              </label>
              <input
                id="userNotes"
                name="userNotes"
                type="text"
                placeholder="Es. Ho i capelli tinti, il colore naturale è castano"
                maxLength={500}
                className="w-full rounded-xl border border-accent/15 bg-white px-4 py-3 text-sm text-ink placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15 transition-all"
              />
            </div>
          )}

          {/* Submit */}
          {preview && (
            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-xl bg-gradient-to-r from-accent to-accent-hover px-8 py-4 text-base font-medium text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg animate-slide-up"
              style={{ animationDelay: "0.2s" }}
            >
              {isPending ? "Analisi in corso..." : `${ANALYSIS_MODES.find(m => m.value === selectedMode)?.icon} Genera ${ANALYSIS_MODES.find(m => m.value === selectedMode)?.label} ✨`}
            </button>
          )}
        </form>
      )}
    </div>
  );
}
