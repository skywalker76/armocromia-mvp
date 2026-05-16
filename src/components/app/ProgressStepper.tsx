"use client";

import { useTranslations } from "@/lib/i18n/translations-context";

/**
 * Stepper visivo per il progresso dell'analisi cromatica.
 *
 * Why: feedback visivo essenziale per un'operazione che dura 15-30s.
 * Ogni step ha un'icona animata che comunica lo stato.
 */

type StepStatus = "pending" | "active" | "done" | "error";

interface Step {
  label: string;
  status: StepStatus;
}

interface ProgressStepperProps {
  currentStep: number;
  error?: boolean;
}

const STEP_KEYS = ["photoUploaded", "analyzing", "generating", "ready"] as const;

export default function ProgressStepper({
  currentStep,
  error = false,
}: ProgressStepperProps) {
  const { t } = useTranslations("app.stepper");

  const steps: Step[] = STEP_KEYS.map((key, i) => ({
    label: t(key),
    status: error && i === currentStep
      ? "error"
      : i < currentStep
        ? "done"
        : i === currentStep
          ? "active"
          : "pending",
  }));

  return (
    <div className="flex items-center justify-between gap-2">
      {steps.map((step, i) => (
        <div key={step.label} className="flex flex-1 items-center">
          {/* Step indicator */}
          <div className="flex flex-col items-center gap-2">
            <div
              className={`
                flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold
                transition-all duration-500 ease-out
                ${step.status === "done"
                  ? "bg-green-500 text-white shadow-lg shadow-green-500/30"
                  : step.status === "active"
                    ? "bg-accent text-white shadow-lg shadow-accent/30 animate-pulse"
                    : step.status === "error"
                      ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                      : "bg-cream-dark text-muted"
                }
              `}
            >
              {step.status === "done" ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              ) : step.status === "error" ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              ) : step.status === "active" ? (
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
                </svg>
              ) : (
                <span>{i + 1}</span>
              )}
            </div>
            <span
              className={`text-xs font-medium text-center leading-tight max-w-[80px]
                ${step.status === "active" ? "text-accent" :
                  step.status === "done" ? "text-green-600" :
                  step.status === "error" ? "text-red-600" :
                  "text-muted-light"}
              `}
            >
              {step.label}
            </span>
          </div>

          {/* Connector line */}
          {i < steps.length - 1 && (
            <div className="relative mx-2 h-0.5 flex-1 bg-cream-dark overflow-hidden rounded-full">
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out
                  ${i < currentStep ? "w-full bg-green-500" : "w-0 bg-accent"}
                `}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
