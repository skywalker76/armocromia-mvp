/**
 * Client REST leggero ed asincrono per Resend.
 *
 * Why: Evita dipendenze pesanti o incompatibili in Next.js 16 / React 19,
 * implementando l'interazione diretta con l'API REST di Resend tramite fetch nativo.
 * Include una gestione fail-safe robusta per non rompere l'esperienza utente in locale.
 */

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Cromea Studio <onboarding@resend.dev>";

  console.log(`[Email Engine] Preparazione invio email a: ${to} | Oggetto: "${subject}"`);

  if (!apiKey) {
    console.warn(
      `[Email Engine] [WARNING] RESEND_API_KEY non configurata! L'email NON è stata inviata a Resend.\n` +
      `----------------- CONTENUTO EMAIL (SANDBOX PREVIEW) -----------------\n` +
      `Da: ${fromEmail}\n` +
      `A: ${to}\n` +
      `Oggetto: ${subject}\n` +
      `Contenuto HTML:\n${html}\n` +
      `---------------------------------------------------------------------`
    );
    // Ritorna successo simulato in locale per non interrompere la pipeline di generazione o l'utente
    return { success: true, id: "simulated-local-id" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[Email Engine] Risposta di errore da Resend:", data);
      return { success: false, error: data.message || "Errore sconosciuto da Resend" };
    }

    console.log(`[Email Engine] Email inviata con successo tramite Resend. ID transazione: ${data.id}`);
    return { success: true, id: data.id };
  } catch (error: any) {
    console.error("[Email Engine] Eccezione di rete o parsing durante l'invio email:", error);
    return { success: false, error: error.message || "Eccezione sconosciuta" };
  }
}
