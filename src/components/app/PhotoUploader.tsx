"use client";

import { useActionState, useRef, useState, useCallback, useEffect, useMemo } from "react";
import { createPortal, flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import { analyzePhoto, checkDossierStatus, type AnalyzePhotoState } from "@/app/[lang]/(app)/dashboard/actions";
import { UPLOAD_CONSTANTS, ANALYSIS_MODES, type AnalysisMode } from "@/lib/armocromia/schemas";
import { useLocale } from "@/lib/i18n/locale-context";
import { useTranslations } from "@/lib/i18n/translations-context";
import { localePath } from "@/lib/i18n/config";
import ProgressStepper from "./ProgressStepper";

interface ModeCopy {
  label: string;
  icon: string;
  description: string;
}

/**
 * Componente upload foto premium con drag-and-drop, anteprima, e invocazione AI.
 *
 * Why: Client Component perché gestisce stato locale (file preview,
 * drag-over, progress). La mutazione è delegata alla Server Action.
 */

const initialState: AnalyzePhotoState = { status: "idle" };

interface PhotoUploaderProps {
  userId: string;
  paymentSuccess?: boolean;
  paymentDossierId?: number;
}

export default function PhotoUploader({
  userId,
  paymentSuccess = false,
  paymentDossierId,
}: PhotoUploaderProps) {
  const locale = useLocale();
  const { t } = useTranslations("app.uploader");
  const { t: tErr } = useTranslations("app.errors");
  const { raw: rawMode } = useTranslations("app.analysisModes");
  const [state, formAction, isPending] = useActionState(analyzePhoto, initialState);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<AnalysisMode>("infografica");
  const [userNotes, setUserNotes] = useState<string>("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  // Why: stato locale indipendente da isPending. In Next 16 + React 19
  // useActionState's isPending può tardare ad arrivare al client (transition
  // streaming). Tracciamo "submitting" a mano: settato al click, smontato
  // quando arriva una risposta dalla Server Action (success o error).
  const [submitting, setSubmitting] = useState(false);
  // Why: createPortal richiede document.body — non disponibile in SSR.
  // Guard di mount per renderizzare il Portal solo lato client.
  const [mounted, setMounted] = useState(false);
  // Why: traccia lo stato effettivo ritornato dal database in background.
  const [dossierStatus, setDossierStatus] = useState<string>("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dossierReady, setDossierReady] = useState(false);
  const [dossierFailed, setDossierFailed] = useState(false);
  const [resolvedDossierId, setResolvedDossierId] = useState<number | null>(null);
  const [restoredDossierId, setRestoredDossierId] = useState<string | null>(null);
  const [isRestoredPolling, setIsRestoredPolling] = useState(false);

  // Sincronizza resolvedDossierId con l'id ritornato dalla Server Action appena disponibile
  useEffect(() => {
    if (state.dossierId) {
      setResolvedDossierId(state.dossierId);
    }
  }, [state.dossierId]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    
    // Controlla se c'è una generazione pendente in localStorage per resilienza mobile
    try {
      // Pulisci i vecchi cookie globali non-scopati se presenti per evitare di rimanere bloccati
      localStorage.removeItem("armocromia_pending_dossier_id");
      localStorage.removeItem("armocromia_pending_dossier_start");

      const pendingId = localStorage.getItem(`armocromia_pending_dossier_id_${userId}`);
      const pendingStart = localStorage.getItem(`armocromia_pending_dossier_start_${userId}`);
      
      if (pendingId) {
        console.log(`[PhotoUploader] Ripristinato polling per dossier pendente ID: ${pendingId} per utente: ${userId}`);
        setRestoredDossierId(pendingId);
        setIsRestoredPolling(true);
        
        if (pendingStart) {
          const secondsPassed = Math.floor((Date.now() - parseInt(pendingStart, 10)) / 1000);
          setElapsedSeconds(Math.max(0, secondsPassed));
        }
      }
    } catch (e) {
      console.error("[PhotoUploader] Failed to read from localStorage:", e);
    }
  }, [userId]);

  // Innesca il redirect al checkout se la Server Action restituisce l'URL di Lemon Squeezy
  useEffect(() => {
    if (state.status === "success" && state.checkoutUrl) {
      console.log(`[PhotoUploader] Redirecting user to checkout: ${state.checkoutUrl}`);
      window.location.href = state.checkoutUrl;
    }
  }, [state.status, state.checkoutUrl]);

  // Gestione del ritorno dal checkout con successo (Lemon Squeezy callback)
  useEffect(() => {
    if (paymentSuccess && paymentDossierId) {
      console.log(`[PhotoUploader] Success checkout callback detected for dossier ID: ${paymentDossierId}`);
      
      // Inizializza il polling
      setRestoredDossierId(String(paymentDossierId));
      setIsRestoredPolling(true);
      
      // Salva nel localStorage per tolleranza ai ricaricamenti pagina
      try {
        localStorage.setItem(`armocromia_pending_dossier_id_${userId}`, String(paymentDossierId));
        if (!localStorage.getItem(`armocromia_pending_dossier_start_${userId}`)) {
          localStorage.setItem(`armocromia_pending_dossier_start_${userId}`, String(Date.now()));
        }
      } catch (e) {
        console.error("[PhotoUploader] Failed to write checkout status to localStorage:", e);
      }

      // Ripulisci la query string dell'URL per un'estetica premium ed evitare doppi trigger al reload
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete("payment_success");
        url.searchParams.delete("dossier_id");
        window.history.replaceState({}, document.title, url.toString());
      } catch (e) {
        console.error("[PhotoUploader] Failed to clean URL params:", e);
      }
    }
  }, [paymentSuccess, paymentDossierId, userId]);

  // Why: il PhotoUploader sta in fondo alla dashboard, quindi al click di
  // "Genera" l'utente è scrollato in basso. Quando isPending diventa true il
  // form sparisce e il ProgressStepper appare in cima al container — ma fuori
  // dal viewport. Scrollare on-pending elimina il "nulla succede" percepito.
  useEffect(() => {
    if (isPending) {
      containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [isPending]);

  // Stato unificato: il banner appare sia se isPending è true (caso ideale)
  // sia se submitting è true (fallback se isPending non si propaga al client).
  const inFlight = isPending || submitting;

  // Why: la pipeline è attiva in background solo quando stiamo pollingando in background
  // prima che il dossier diventi completato/fallito (isRestoredPolling).
  // Evitiamo di attivare il polling quando state.status === "success" prima che l'utente paghi.
  const isActivelyPolling = !!isRestoredPolling && !dossierReady && !dossierFailed;
  const isPipelineActive = inFlight || isActivelyPolling;

  // Timer: conta i secondi trascorsi durante l'elaborazione per pilotare
  // la progressione dello stepper e mostrare il tempo all'utente.
  // Rimane attivo per l'intera durata della pipeline in background.
  useEffect(() => {
    if (!isPipelineActive) {
      return;
    }
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPipelineActive]);

  // Progresso dello stepper basato sullo stato effettivo del dossier
  // per evitare salti istantanei allo step 4 e timer bloccati.
  const currentStep = useMemo(() => {
    if (dossierReady || dossierStatus === "completed") return 4;
    if (dossierFailed || dossierStatus === "failed") return 3;
    if (dossierStatus === "generating") return 3;
    if (dossierStatus === "processing") return 2;
    if (inFlight) return 1;
    return 0;
  }, [inFlight, dossierStatus, dossierReady, dossierFailed]);

  // Messaggio di fase contestuale — cambia con lo step attivo
  const phaseMessage = useMemo(() => {
    if (elapsedSeconds < 3) return t("waitPhase1");
    if (elapsedSeconds < 30) return t("waitPhase2");
    return t("waitPhase3");
  }, [elapsedSeconds, t]);

  // Smonta submitting quando la Server Action restituisce un risultato.
  // Min display time 3s: evita flicker se la Server Action torna error
  // istantaneamente (es. validazione fallita) e l'utente non riesce a
  // vedere che il click ha avuto effetto.
  useEffect(() => {
    if (state.status === "success" || state.status === "error") {
      const t = setTimeout(() => setSubmitting(false), 3000);
      return () => clearTimeout(t);
    }
  }, [state.status]);

  // Polling per aggiornare la griglia sullo sfondo mentre la pipeline è attiva
  useEffect(() => {
    if (!isPipelineActive) return;
    const interval = setInterval(() => router.refresh(), 10000);
    return () => clearInterval(interval);
  }, [isPipelineActive, router]);

  const handleFile = useCallback((selected: File | null) => {
    if (!selected) return;

    if (selected.size > UPLOAD_CONSTANTS.maxFileSize) {
      alert(tErr("uploadTooLarge", { mb: UPLOAD_CONSTANTS.maxFileSizeMB }));
      return;
    }
    // Why: lato client accettiamo qualsiasi image/* (incluso HEIC iOS) per non
    // bloccare il picker mobile. Il browser di norma converte HEIC→JPEG durante
    // l'upload, e il server valida comunque con lo schema Zod.
    if (!selected.type.startsWith("image/")) {
      alert(tErr("uploadInvalidImage"));
      return;
    }

    setFile(selected);
    setFileName(selected.name);
    setPreview(URL.createObjectURL(selected));
  }, [tErr]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFile(e.dataTransfer.files[0] ?? null);
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
      handleFile(e.target.files?.[0] ?? null);
    },
    [handleFile]
  );

  const clearPreview = useCallback(() => {
    setFile(null);
    setPreview(null);
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }, []);

  // Why: la submission via <form action={...}> nativa richiede che il File sia
  // dentro un <input name="photo"> al momento del submit. Su iOS Safari non si
  // può assegnare programmaticamente input.files (DataTransfer bloccato), quindi
  // costruiamo la FormData manualmente dallo stato React e la passiamo a
  // formAction() — pattern supportato da useActionState e cross-browser.
  const triggerSubmit = useCallback(() => {
    if (!file || inFlight) return;

    // CRITICAL: flushSync forza il render sincrono di submitting=true PRIMA
    // che formAction() apra la transition di useActionState. Senza questo,
    // React 19 assorbe l'update dentro la stessa transition e l'overlay
    // appare solo a server action completata — quando ormai è troppo tardi.
    flushSync(() => setSubmitting(true));

    // Feedback immediato: scrolla subito in cima. Usiamo "auto" su mobile
    // perché iOS Safari ha bug con behavior:"smooth" durante form submit.
    window.scrollTo({ top: 0, behavior: "auto" });

    const formData = new FormData();
    formData.append("photo", file);
    formData.append("analysisMode", selectedMode);
    formData.append("userNotes", userNotes);
    formData.append("locale", locale);
    formAction(formData);
  }, [file, selectedMode, userNotes, inFlight, formAction, locale]);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      triggerSubmit();
    },
    [triggerSubmit]
  );

  // Successo dalla Server Action → il record è creato ma la pipeline AI
  // è in background (waitUntil). Dobbiamo aspettare che diventi "completed"
  // prima di fare redirect, altrimenti la pagina dossier → 404.
  // Polling ogni 5s tramite Server Action (max 10 minuti = 120 tentativi).

  // Why: usiamo referenze per traduzioni e callbacks per evitare che cambiamenti
  // referenziali estranei (es. tErr ricreata ad ogni render) provochino il reset
  // e la cancellazione continua del loop di polling ad ogni tick del timer!
  const tErrRef = useRef(tErr);
  useEffect(() => {
    tErrRef.current = tErr;
  }, [tErr]);

  useEffect(() => {
    const isRestored = isRestoredPolling && restoredDossierId;
    if (!isRestored) return;

    const targetId: number | "latest" = restoredDossierId === "latest" ? "latest" : Number(restoredDossierId);

    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 120; // 120 × 5s = 10 minuti
    let consecutiveNetworkErrors = 0;
    const MAX_CONSECUTIVE_NETWORK_ERRORS = 5;

    const checkOnce = async (): Promise<boolean> => {
      if (cancelled) return true; // Termina se cancellato
      try {
        // Utilizza la Server Action checkDossierStatus al posto della fetch ad API route
        // per evitare al 100% qualsiasi caching del browser/CDN e problemi di auth dei cookie.
        const data = await checkDossierStatus(targetId);
        consecutiveNetworkErrors = 0; // Reset degli errori al successo di rete

        if (!data) {
          console.warn(`[PhotoUploader Polling] Dossier not found or unauthorized for ID: ${targetId}`);
          try {
            localStorage.removeItem(`armocromia_pending_dossier_id_${userId}`);
            localStorage.removeItem(`armocromia_pending_dossier_start_${userId}`);
          } catch (e) {
            console.error(e);
          }
          if (!cancelled) {
            setIsRestoredPolling(false);
            setRestoredDossierId(null);
            setDossierStatus("processing");
          }
          return true; // Stop polling immediately!
        }

        if (!cancelled) {
          setDossierStatus(data.status);
          if (data.id) {
            setResolvedDossierId(data.id);
          }
        }

        if (data.status === "completed") {
          if (!cancelled) setDossierReady(true);
          return true;
        }

        if (data.status === "failed") {
          if (!cancelled) {
            setErrorMessage(data.error_message || tErrRef.current("genericPipeline"));
            setDossierFailed(true);
          }
          return true;
        }
      } catch (err) {
        consecutiveNetworkErrors++;
        console.error("[PhotoUploader Polling] Exception thrown in polling loop:", err);
        
        // Se si verificano troppi errori di rete consecutivi, considera fallito, 
        // altrimenti continua sperando in un ripristino della connessione (es. galleria mobile)
        if (consecutiveNetworkErrors >= MAX_CONSECUTIVE_NETWORK_ERRORS) {
          if (!cancelled) {
            setErrorMessage(tErrRef.current("genericPipeline"));
            setDossierFailed(true);
          }
          return true;
        }
      }
      return false;
    };

    const poll = async () => {
      while (!cancelled && attempts < MAX_ATTEMPTS) {
        attempts++;
        const isDone = await checkOnce();
        if (isDone) return;
        await new Promise(r => setTimeout(r, 5000));
      }

      // Timeout
      if (!cancelled) {
        setErrorMessage(tErrRef.current("timeout"));
        setDossierFailed(true);
      }
    };

    // Gestione risveglio da background (iOS / Android app suspension)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !cancelled) {
        console.log("[PhotoUploader Polling] App returned to foreground, checking status immediately...");
        checkOnce();
      }
    };

    poll();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => { 
      cancelled = true; 
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [state.status, state.dossierId]);

  // Redirect solo quando il dossier è pronto
  useEffect(() => {
    if (dossierReady && resolvedDossierId) {
      try {
        localStorage.removeItem(`armocromia_pending_dossier_id_${userId}`);
        localStorage.removeItem(`armocromia_pending_dossier_start_${userId}`);
      } catch (e) {
        console.error("[PhotoUploader] Failed to clear localStorage:", e);
      }
      router.push(localePath(locale, `/dossier/${resolvedDossierId}`));
    }
  }, [dossierReady, resolvedDossierId, router, locale, userId]);

  if (isActivelyPolling) {
    // Ancora in elaborazione — mostra stepper + timer
    return (
      <div ref={containerRef} className="space-y-6 scroll-mt-6">
        <div className="rounded-2xl border border-accent/10 bg-white p-6 shadow-xs animate-fade-in">
          <ProgressStepper currentStep={currentStep} elapsedSeconds={elapsedSeconds} />
          <div className="mt-5 text-center">
            <p className="text-sm text-ink font-medium">
              {t("creatingDossier")}
            </p>
            <p key={phaseMessage} className="mt-1 text-xs text-muted animate-fade-in">
              {phaseMessage}
            </p>
          </div>
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-accent/10">
            <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-accent-light to-accent" style={{ animation: "progress-indeterminate 2s ease-in-out infinite" }} />
          </div>
        </div>
      </div>
    );
  }

  if (dossierFailed) {
    try {
      localStorage.removeItem(`armocromia_pending_dossier_id_${userId}`);
      localStorage.removeItem(`armocromia_pending_dossier_start_${userId}`);
    } catch (e) {
      console.error("[PhotoUploader] Failed to clear localStorage:", e);
    }

    return (
      <div className="space-y-6 animate-slide-up">
        <div className="flex items-start gap-3 rounded-xl border border-error/20 bg-error-light px-5 py-4 text-sm">
          <svg className="mt-0.5 h-5 w-5 shrink-0 text-error" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <div>
            <p className="font-medium text-ink">{t("errorTitle")}</p>
            <p className="mt-0.5 text-muted">{errorMessage || t("generationFailed")}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setDossierFailed(false);
            setDossierStatus("processing");
            setErrorMessage(null);
            setIsRestoredPolling(false);
            setRestoredDossierId(null);
            setElapsedSeconds(0);
            clearPreview();
            router.refresh();
          }}
          className="w-full rounded-xl bg-ink px-6 py-4 text-sm font-medium text-white transition-all hover:bg-ink-light active:scale-[0.99] shadow-md flex items-center justify-center gap-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          {t("changePhoto")}
        </button>
      </div>
    );
  }

  if (dossierReady) {
    return (
      <div className="rounded-2xl border border-success/20 bg-success-light p-8 text-center animate-scale-in">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <svg className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="font-serif text-xl text-ink">{t("successTitle")}</h3>
        <p className="mt-2 text-muted">
          {t("successBody")}
        </p>
        {/* Progress bar */}
        <div className="mt-4 mx-auto h-1 w-32 overflow-hidden rounded-full bg-success/20">
          <div className="h-full w-full rounded-full bg-success" style={{ animation: "progress-indeterminate 1.5s ease-in-out" }} />
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-8 scroll-mt-6">
      {/* Overlay full-screen — renderato via Portal su document.body per
          evitare che ancestor con transform/filter (es. animate-slide-up
          sul container "Nuova analisi cromatica") creino un containing
          block che rompe position: fixed. */}
      {inFlight && mounted && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm animate-fade-in"
          role="status"
          aria-live="polite"
        >
          <div className="mx-4 max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl ring-1 ring-accent/10 animate-scale-in">
            {/* Spinner animato */}
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
              <div className="h-10 w-10 rounded-full border-4 border-accent/20 border-t-accent animate-spin" />
            </div>
            <h3 className="font-serif text-xl text-ink">
              {t("creatingDossier")}
            </h3>
            <p className="mt-2 text-sm text-muted leading-relaxed">
              {phaseMessage}
            </p>
            {/* Progress bar indeterminate */}
            <div className="mt-5 h-1 overflow-hidden rounded-full bg-accent/10">
              <div
                className="h-full w-1/3 rounded-full bg-gradient-to-r from-accent-light to-accent"
                style={{ animation: "progress-indeterminate 2s ease-in-out infinite" }}
              />
            </div>
            <p className="mt-4 text-xs text-muted-light">
              ⏱️ {elapsedSeconds}s
            </p>
          </div>
        </div>,
        document.body
      )}

      {/* Progress Stepper — visibile solo durante l'elaborazione */}
      {isPending && (
        <div className="rounded-2xl border border-accent/10 bg-white p-6 shadow-xs animate-fade-in">
          <ProgressStepper currentStep={currentStep} elapsedSeconds={elapsedSeconds} />
          <div className="mt-5 text-center">
            <p className="text-sm text-ink font-medium">
              {t("creatingDossier")}
            </p>
            <p key={phaseMessage} className="mt-1 text-xs text-muted animate-fade-in">
              {phaseMessage}
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
            <p className="font-medium text-ink">{t("errorTitle")}</p>
            <p className="mt-0.5 text-muted">{state.error}</p>
          </div>
        </div>
      )}

      {/* Form upload */}
      {!inFlight && (
        <form onSubmit={handleSubmit} className="space-y-6">
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
              accept="image/*"
              onChange={handleInputChange}
              className="hidden"
            />

            {preview ? (
              <div className="flex flex-col items-center gap-5 sm:flex-row">
                {/* Preview circolare */}
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl shadow-md ring-2 ring-accent/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt={t("previewAlt")}
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
                  <p className="text-sm text-success">{t("photoReady")}</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearPreview();
                    }}
                    className="mt-1 text-sm font-medium text-muted-light hover:text-danger transition-colors"
                  >
                    {t("changePhoto")}
                  </button>
                </div>
              </div>
            ) : (
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
                    {t("dragHere")}
                  </p>
                  <p className="mt-1.5 text-sm text-muted">
                    {t("orBrowse")} <span className="text-accent font-medium cursor-pointer hover:underline">{t("browseFiles")}</span>
                  </p>
                  <p className="mt-4 text-xs text-muted-light">
                    {t("maxSize", { mb: UPLOAD_CONSTANTS.maxFileSizeMB })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Mobile camera capture — fuori dal drop zone per evitare click
              bubbling che innescava entrambi i picker su iOS. */}
          {!preview && (
            <div className="sm:hidden -mt-2">
              <label
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center gap-3 rounded-xl border-2 border-accent/20 bg-accent/5 px-6 py-4 text-sm font-medium text-accent cursor-pointer active:scale-[0.98] transition-transform"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                </svg>
                {t("takePhoto")}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleInputChange}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Selettore modalità analisi */}
          {preview && (
            <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <label className="block text-sm font-medium text-ink mb-3">
                {t("chooseMode")}
              </label>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                {ANALYSIS_MODES.map((mode) => {
                  const copy = rawMode<ModeCopy>(mode.value);
                  return (
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
                      <span className="text-2xl">{copy.icon}</span>
                      <p className="mt-2 font-medium text-ink text-sm">{copy.label}</p>
                      <p className="mt-1 text-xs text-muted leading-relaxed">{copy.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Note opzionali */}
          {preview && (
            <div className="animate-slide-up" style={{ animationDelay: "0.15s" }}>
              <label htmlFor="userNotes" className="block text-sm font-medium text-ink mb-2">
                {t("notesLabel")}
              </label>
              <input
                id="userNotes"
                type="text"
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder={t("notesPlaceholder")}
                maxLength={500}
                className="w-full rounded-xl border border-accent/15 bg-white px-4 py-3 text-sm text-ink placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15 transition-all"
              />
            </div>
          )}

          {/* Submit — type="button" + onClick diretto. Bypassa il form
              onSubmit, che su iOS Safari a volte non scatta correttamente
              quando il form ha solo un file input hidden. */}
          {preview && (
            <button
              type="button"
              onClick={triggerSubmit}
              disabled={inFlight || !file}
              className="w-full rounded-xl bg-gradient-to-r from-accent to-accent-hover px-8 py-4 text-base font-medium text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg animate-slide-up"
              style={{ animationDelay: "0.2s" }}
            >
              {inFlight
                ? t("analyzing")
                : t("generateCta", {
                    icon: rawMode<ModeCopy>(selectedMode).icon,
                    mode: rawMode<ModeCopy>(selectedMode).label,
                  })}
            </button>
          )}
        </form>
      )}
    </div>
  );
}
