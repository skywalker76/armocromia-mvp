"use client";

import { useState } from "react";
import type { FormEvent } from "react";

/**
 * Pagina di login — Magic Link via email.
 *
 * Why: "use client" perché gestisce stato del form (email, loading, messaggi).
 * L'invio del magic link avviene tramite Server Action per non esporre
 * la logica di auth nel bundle client.
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
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
        setErrorMessage(data.error || "Qualcosa è andato storto.");
        return;
      }

      setStatus("sent");
    } catch {
      setStatus("error");
      setErrorMessage("Errore di rete. Riprova tra qualche secondo.");
    }
  }

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
          <a href="/" className="font-serif text-2xl text-ink hover:text-accent transition-colors">
            Armocromia
          </a>
        </div>

        {status === "sent" ? (
          /* ── Stato: email inviata ── */
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
                  d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                />
              </svg>
            </div>
            <h1 className="font-serif text-3xl text-ink">
              Controlla la tua email
            </h1>
            <p className="mt-4 text-muted leading-relaxed">
              Ti abbiamo inviato un link magico a{" "}
              <span className="font-medium text-ink">{email}</span>.
              <br />
              Clicca sul link per accedere.
            </p>
            <button
              onClick={() => {
                setStatus("idle");
                setEmail("");
              }}
              className="mt-8 text-sm text-accent hover:text-accent-hover transition-colors"
            >
              ← Usa un&apos;altra email
            </button>
          </div>
        ) : (
          /* ── Stato: form di login ── */
          <>
            <h1 className="text-center font-serif text-3xl tracking-tight text-ink sm:text-4xl">
              Accedi al tuo dossier
            </h1>
            <p className="mt-4 text-center text-muted">
              Inserisci la tua email e riceverai un link magico per accedere.
              <br />
              Niente password da ricordare.
            </p>

            <form onSubmit={handleSubmit} className="mt-10 space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-ink-light"
                >
                  Email
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
                  placeholder="la-tua@email.it"
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
                    Invio in corso…
                  </span>
                ) : (
                  "Invia link magico"
                )}
              </button>
            </form>

            {/* Footer link */}
            <p className="mt-10 text-center text-sm text-muted-light">
              Non hai ancora un account?{" "}
              <span className="text-muted">
                Verrà creato automaticamente al primo accesso.
              </span>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
