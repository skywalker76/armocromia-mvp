"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { FormEvent, KeyboardEvent, ClipboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/locale-context";
import { useTranslations } from "@/lib/i18n/translations-context";
import { localePath } from "@/lib/i18n/config";

/**
 * Pagina di login — OTP a 6 cifre via email.
 *
 * Why: "use client" perché gestisce stato del form (email, OTP, loading).
 * Flusso a 2 step:
 *   Step 1: Inserisci email → invio codice
 *   Step 2: Digita codice a 6 cifre → verifica → redirect a dashboard
 */

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

export default function LoginPage() {
  const router = useRouter();
  const locale = useLocale();
  const { t } = useTranslations("auth.login");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // OTP state
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendTimer, setResendTimer] = useState(0);

  // Countdown timer per il "reinvia codice"
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // ── Step 1: Invia codice OTP ──
  async function handleSendOtp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error || t("genericError"));
        return;
      }

      setStatus("idle");
      setStep("otp");
      setResendTimer(RESEND_COOLDOWN_SECONDS);
      // Focus sulla prima casella OTP dopo il render
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch {
      setStatus("error");
      setErrorMessage(t("networkError"));
    }
  }

  // ── Step 2: Verifica codice OTP ──
  const handleVerifyOtp = useCallback(async (code: string) => {
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error || t("otpInvalidCode"));
        // Reset delle caselle OTP per permettere un nuovo tentativo
        setOtp(Array(OTP_LENGTH).fill(""));
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
        return;
      }

      setStatus("success");
      // Breve delay per mostrare l'animazione di successo, poi redirect
      setTimeout(() => router.push(localePath(locale, "/dashboard")), 800);
    } catch {
      setStatus("error");
      setErrorMessage(t("otpNetworkError"));
    }
  }, [email, router, locale, t]);

  // ── Reinvia codice ──
  async function handleResend() {
    if (resendTimer > 0) return;
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setResendTimer(RESEND_COOLDOWN_SECONDS);
        setOtp(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      }
    } catch {
      // silently fail, user can retry
    }
  }

  // ── OTP Input Handlers ──
  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      // Accetta solo cifre
      const digit = value.replace(/\D/g, "").slice(-1);

      const newOtp = [...otp];
      newOtp[index] = digit;
      setOtp(newOtp);

      // Auto-focus sulla casella successiva
      if (digit && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      // Se tutte le caselle sono piene, verifica automaticamente
      const fullCode = newOtp.join("");
      if (fullCode.length === OTP_LENGTH && !newOtp.includes("")) {
        handleVerifyOtp(fullCode);
      }
    },
    [otp, handleVerifyOtp]
  );

  const handleOtpKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      // Backspace: torna alla casella precedente
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      // Frecce
      if (e.key === "ArrowLeft" && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [otp]
  );

  const handleOtpPaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
      if (!pasted) return;

      const newOtp = Array(OTP_LENGTH).fill("");
      for (let i = 0; i < pasted.length; i++) {
        newOtp[i] = pasted[i];
      }
      setOtp(newOtp);

      // Focus sull'ultima casella compilata o sulla successiva vuota
      const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
      inputRefs.current[focusIndex]?.focus();

      // Se il paste ha riempito tutto, verifica automaticamente
      if (pasted.length === OTP_LENGTH) {
        handleVerifyOtp(pasted);
      }
    },
    [handleVerifyOtp]
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      {/* Decorative gradient */}
      <div
        className="pointer-events-none fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full opacity-15 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, #D4A99A 0%, #B97A6A 40%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-12">
          <a href={localePath(locale, "/")} className="font-serif text-2xl text-ink hover:text-accent transition-colors">
            {t("brandLink")}
          </a>
        </div>

        {/* ── SUCCESS STATE ── */}
        {status === "success" && (
          <div className="text-center animate-scale-in">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
              <svg
                className="h-8 w-8 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <h1 className="font-serif text-3xl text-ink">{t("successTitle")}</h1>
            <p className="mt-4 text-muted">{t("successMessage")}</p>
            <div className="mt-4 mx-auto h-1 w-32 overflow-hidden rounded-full bg-green-100">
              <div
                className="h-full w-full rounded-full bg-green-500"
                style={{ animation: "progress-indeterminate 0.8s ease-in-out" }}
              />
            </div>
          </div>
        )}

        {/* ── STEP 2: OTP INPUT ── */}
        {step === "otp" && status !== "success" && (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
              <svg
                className="h-7 w-7 text-accent"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                />
              </svg>
            </div>

            <h1 className="font-serif text-3xl text-ink">{t("otpTitle")}</h1>
            <p className="mt-4 text-muted leading-relaxed">
              {t("otpLeadBefore", { length: OTP_LENGTH })}{" "}
              <span className="font-medium text-ink">{email}</span>
            </p>

            {/* OTP Inputs */}
            <div className="mt-8 flex justify-center gap-3">
              {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={otp[i]}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  onPaste={i === 0 ? handleOtpPaste : undefined}
                  disabled={status === "loading"}
                  className={`
                    h-14 w-12 rounded-xl border-2 bg-white text-center text-2xl font-semibold text-ink
                    transition-all duration-200 focus:outline-none
                    ${status === "error"
                      ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      : otp[i]
                        ? "border-accent/40 focus:border-accent focus:ring-2 focus:ring-accent/20"
                        : "border-accent/15 focus:border-accent focus:ring-2 focus:ring-accent/20"
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                  aria-label={t("otpDigitLabel", { index: i + 1, length: OTP_LENGTH })}
                />
              ))}
            </div>

            {/* Error message */}
            {status === "error" && (
              <p className="mt-4 text-sm text-red-600 animate-slide-up" role="alert">
                {errorMessage}
              </p>
            )}

            {/* Loading indicator */}
            {status === "loading" && (
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t("otpVerifying")}
              </div>
            )}

            {/* Resend + Change email */}
            <div className="mt-8 space-y-3">
              <button
                onClick={handleResend}
                disabled={resendTimer > 0}
                className="text-sm text-accent hover:text-accent-hover transition-colors disabled:text-muted-light disabled:cursor-not-allowed"
              >
                {resendTimer > 0
                  ? t("resendIn", { seconds: resendTimer })
                  : t("resendCta")
                }
              </button>
              <br />
              <button
                onClick={() => {
                  setStep("email");
                  setStatus("idle");
                  setOtp(Array(OTP_LENGTH).fill(""));
                  setErrorMessage("");
                }}
                className="text-sm text-muted hover:text-ink transition-colors"
              >
                {t("changeEmail")}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 1: EMAIL INPUT ── */}
        {step === "email" && status !== "success" && (
          <>
            <h1 className="text-center font-serif text-3xl tracking-tight text-ink sm:text-4xl">
              {t("emailTitle")}
            </h1>
            <p className="mt-4 text-center text-muted">
              {t("emailLeadLine1")}
              <br />
              {t("emailLeadLine2")}
            </p>

            <form onSubmit={handleSendOtp} className="mt-10 space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-ink-light"
                >
                  {t("emailLabel")}
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  className="mt-2 block w-full rounded-xl border border-accent/20 bg-white px-4 py-3 text-ink placeholder:text-muted-light shadow-sm transition-all duration-200 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none"
                />
              </div>

              {/* Error message */}
              {status === "error" && (
                <p className="text-sm text-red-600" role="alert">
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="group relative w-full rounded-xl bg-accent px-6 py-3.5 text-base font-medium text-white shadow-lg transition-all duration-300 hover:bg-accent-hover hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
              >
                {status === "loading" ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    {t("submitSending")}
                  </span>
                ) : (
                  t("submitCta")
                )}
              </button>
            </form>

            {/* Footer link */}
            <p className="mt-10 text-center text-sm text-muted-light">
              {t("footerLine")}{" "}
              <span className="text-muted">
                {t("footerNote")}
              </span>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
