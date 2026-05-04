import "server-only";
import { fal } from "@fal-ai/client";

/**
 * Client fal.ai per generazione immagini (GPT Image 2).
 *
 * Why: il client fal.ai è configurato server-side only per non esporre
 * la API key nel browser. Tutte le chiamate a fal.ai devono passare
 * da API routes o Server Actions.
 *
 * IMPORTANTE: non importare questo file in Client Components.
 */

// Why: fal.ai legge automaticamente FAL_KEY dalle env vars.
// La configurazione esplicita è necessaria solo se vuoi override.
fal.config({
  // Why: credentials "from_env" è il default, ma lo rendiamo esplicito
  // per chiarezza. Legge process.env.FAL_KEY automaticamente.
  credentials: "from_env",
});

export { fal };
