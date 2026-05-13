# Handover Tecnico: Armocromia MVP (Next.js 16 + Supabase + fal.ai)
**Target:** Claude 3.7 Opus (o modello analogo)
**Contesto:** Questo documento fornisce un riepilogo estremamente dettagliato di tutte le modifiche architetturali, fix di deploy (Vercel) e configurazioni di pipeline AI (fal.ai + Supabase) effettuate oggi, in modo che tu possa riprendere lo sviluppo con un contesto esatto al 100%.

---

## 1. Stato Attuale dell'Infrastruttura e Deploy (Vercel + GitHub)

Oggi ci siamo concentrati sullo sblocco del deploy su **Vercel** e sulla stabilizzazione della pipeline in produzione. 

### GitOps Workflow
* **Azione:** Invece di usare il comando CLI `vercel --prod` (che andava in timeout con `Unexpected error`), abbiamo spostato l'intero processo su **GitOps**. 
* **Risultato:** Il codice è stato committato e pushato sul branch `main` del repository GitHub (`skywalker76/armocromia-mvp`). Vercel è ora correttamente "linked" al repository e ascolta i push su `main` per triggerare le build automatiche.

### Configurazione Variabili d'Ambiente (Vercel)
* Abbiamo allineato le env vars di produzione nel pannello di Vercel:
  * `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  * `SUPABASE_SECRET_KEY`
  * `FAL_KEY` (per l'API di fal.ai).

### Fix Authentication & Supabase in Produzione
Abbiamo affrontato e risolto diverse criticità emerse post-deploy:
1. **PKCE Code Verifier Mismatch:** Fissato il bug nel callback Auth di Supabase (`/api/auth/callback`) gestendo correttamente il `code_verifier` mismatch che impediva il login via Magic Link in produzione.
2. **Supabase Rate Limit:** Aggiunta logica in `src/app/(app)/auth/login/page.tsx` (o nei file auth correlati) per catturare e mostrare correttamente all'utente i messaggi di Rate Limit di Supabase quando vengono inviati troppi Magic Link.

### Fix Timeout Vercel Serverless Functions
* **Problema:** La generazione AI (Vision + Image Generation) andava in timeout su Vercel (limite default di 10-15s per l'Hobby/Pro plan su Next.js App Router).
* **Soluzione:** Abbiamo alzato il `maxDuration` a **300s** (5 minuti) all'interno delle Server Actions o API Routes coinvolte nella generazione (`generate-dossier` e `classify`). 
* Aggiunta anche una logica di fallback per marcare come "Falliti" (Failed) i dossier rimasti "stuck" (incastrati in processing) nel database Supabase.

---

## 2. Stabilizzazione Pipeline AI (fal.ai)

Abbiamo completamente refattorizzato la logica di Vision AI e Generazione Immagini.

### Fase 1: Vision AI (Classificazione Armocromatica)
* **File:** `src/lib/fal/classify.ts`
* **Cambiamento:** Abbandonato l'endpoint deprecato di OpenRouter (`openrouter/router/vision`).
* **Nuovo Setup:** Integrazione stabile con `fal-ai/any-llm/vision` utilizzando il modello **`google/gemini-2.5-flash`**.
* **Logica:** Implementato un robusto JSON repair e Zod validation (`classificationResultSchema`). L'AI analizza la foto dell'utente per determinare la Stagione e il Sottogruppo armocromatico, restituendo i dati in formato JSON strutturato.

### Fase 2: Prompt Engineering & Generazione Dossier 4K (GPT Image 2)
* **File:** `src/lib/fal/generate-dossier.ts`
* **Cambiamento:** Estrema ingegnerizzazione del prompt per la funzione `buildDossierPrompt`.
* **Face Retention Rigorosa:** Aggiunto un vincolo categorico (`REGOLA FONDAMENTALE`) per obbligare il modello a preservare il volto, il genere, l'etnia e l'età esatti della foto di input, proiettandoli sulle 9 foto dell'infografica.
* **Layout Editoriale:** Strutturato il prompt per forzare una griglia editoriale (Header, Analisi, Confronto Visivo, Consigli Pratici), posizionando gli elementi grafici ("A SINISTRA", "AL CENTRO") per ottenere un'impostazione visiva impaginata in modo professionale.
* **Modalità Supportate:** Il sistema ora orchestra 3 template diversi (Infografica, Lookbook, Guardaroba).

---

## 3. Gestione Dashboard
* **Azione:** Aggiunta la possibilità per l'utente di **cancellare i dossier** direttamente dalla Dashboard.
* **Miglioramento UI:** I dossier in stato "Failed" ora vengono visualizzati chiaramente con l'opzione di poterli rimuovere dalla vista.

---

## 4. Dove Siamo Arrivati & Prossimi Step

**Obiettivo Globale:** MVP SaaS B2C da 19,99€ pronto per i primi clienti reali.

**Cosa FUNZIONA in Produzione (Vercel):**
✅ PWA Infrastructure (Manifest, SW, Metadata).
✅ Magic Link Authentication (Login, Callback, Logout protetti).
✅ Dashboard con query al DB Supabase (tabelle `profiles` e `dossiers`).
✅ Cancellazione dossier e gestione stati "stuck" e "failed".
✅ Backend AI Pipeline (Gemini Flash + GPT Image 2 su Fal.ai) per la classificazione e generazione.
✅ Integrazione Vercel-GitHub con CI/CD funzionante.

**Cosa RESTA DA FARE per il Go-Live (Prossimi Step):**
1. **Integrazione Stripe Checkout:** Manca totalmente l'integrazione di Stripe per l'acquisto (SaaS B2C, pagamento una tantum). Devi implementare Stripe SDK, l'endpoint per la creazione del checkout e il Webhook di ascolto.
2. **Cablaggio UI Upload & Server Action:** Assicurarsi che il flusso dal componente `PhotoUploader.tsx` (quando l'utente carica la foto) inneschi fluidamente tutta la catena lato server (upload storage -> classify -> generate -> salvataggio riga su `dossiers`).
3. **Email Transazionali (SMTP):** Il tier gratuito di Supabase invia i Magic Link con limiti rigidi e spesso va in spam/timeout. L'obiettivo è sostituire l'SMTP default di Supabase con **Resend**.

Buon lavoro!
