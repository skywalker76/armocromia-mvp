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

// Why: passiamo la key esplicitamente perché "from_env" non funziona
// in modo affidabile con Next.js Turbopack (non legge FAL_KEY).
const falKey = process.env.FAL_KEY;

if (!falKey) {
  console.warn("[fal] FAL_KEY non configurata — la pipeline AI non funzionerà");
}

fal.config({
  credentials: falKey,
});

export { fal };
