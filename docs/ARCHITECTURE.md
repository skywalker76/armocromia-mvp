# ARCHITECTURE — Cromea Studio (com'è OGGI)

> Fotografia del sistema al 2026-07-10, verificata nel codice (branch `main`, ultimo commit applicativo `92ca996` del 2026-06-16). Sostituisce la vecchia versione di questo file, che era obsoleta (citava prezzo €19,99 e "OpenAI Vision da integrare"). Ogni percorso è relativo alla root del repo. `[INFERENZA]` marca ciò che non è provato direttamente dal codice.

## Stack

| Livello | Tecnologia | Note |
|---|---|---|
| Framework | **Next.js 16.2.4** (App Router) + React 19.2.4 | i18n custom via segmento `/[lang]/` (IT/EN/ES), **non** next-intl. Vedi `AGENTS.md`: questa versione di Next ha breaking changes — leggere `node_modules/next/dist/docs/` prima di scrivere codice. |
| Hosting | **Vercel** | Auto-deploy da `main` → www.cromeastudio.com. `maxDuration` 600s sul webhook (`api/webhooks/stripe/route.ts:11`). |
| DB + Auth + Storage | **Supabase** (progetto prod ref `xjmhzdwmngzrosuxqfff`) | Postgres con RLS, Auth OTP email, 2 bucket storage privati. |
| AI | **fal.ai** (`@fal-ai/client`) | 2 soli call site (vedi sotto). |
| Pagamenti | **Stripe Checkout** (hosted), SDK `stripe@^22.1.1` | Attualmente in **sandbox**. Migrato da Lemon Squeezy il 2026-06-16 (commit `92ca996`). |
| Email | **Resend** (`src/lib/emails/resend.ts`) | Ricevute + notifiche. L'OTP di login lo invia Supabase via SMTP con una chiave Resend separata. |
| Osservabilità | **Sentry** (`@sentry/nextjs`) | Attivo solo con DSN; upload source map disattivato (`next.config.ts:60-62`). |
| Analytics | **GA4** con Consent Mode v2 | No-op senza `NEXT_PUBLIC_GA_MEASUREMENT_ID`. |

## Componenti principali (mappa mentale)

```
src/app/[lang]/
  (marketing)/page.tsx     -> landing (hero, gallery dossier reali, draping, bento 12 stagioni, pricing, FAQ+JSON-LD)
  auth/login/page.tsx      -> login OTP 6 cifre (NIENTE magic-link nel flusso attuale)
  (app)/                   -> area autenticata (guard nel layout)
    dashboard/             -> upload foto, scelta modalita, checkout, lista dossier, delete account, watchdog stuck
    dossier/[id]/          -> dettaglio dossier completato (immagine 4K + palette interattiva)
    admin/                 -> console admin (tutti i dossier, force-delete, mark-failed) - gate isAdmin -> notFound
  (legal)/privacy, terms   -> testi GDPR (ATTENZIONE: dichiarano ancora Lemon Squeezy come MoR)
  demo-access/route.ts     -> auto-login pubblico account demo (ATTENZIONE: password hardcoded - vedi AUDIT)
  preview/                 -> landing alternativa ORFANA ma viva in prod (ATTENZIONE: indicizzabile)
  ux-preview/              -> sandbox UX, 404 in prod (dev-only)

src/app/api/
  webhooks/stripe/route.ts        -> UNICO trigger della pipeline (checkout.session.completed)
  cron/delete-old-photos/route.ts -> purge GDPR foto >24h (Vercel Cron, 03:00)
  admin/trigger-dossier/route.ts  -> rilancio manuale pipeline (Bearer ADMIN_SECRET)
  auth/{magic-link,verify-otp,logout,dev-login}/route.ts
  dossier-status/[id]/route.ts    -> MORTA (nessun caller; sostituita dalla server action checkDossierStatus)

src/lib/
  fal/classify.ts          -> classificazione foto (fal-ai/any-llm/vision, model gemini-2.5-flash) ATTENZIONE: endpoint DEPRECATO
  fal/generate-dossier.ts  -> generazione immagine dossier (openai/gpt-image-2/edit, 4K)
  armocromia/pipeline.ts   -> orchestrazione classify -> generate -> upload -> completed
  stripe.ts                -> creazione Checkout Session (ATTENZIONE: apiVersion "2023-10-16", currency/price hardcoded)
  supabase/{server,admin,client}.ts, admin.ts, audit.ts -> factory client + gate admin + audit log
  emails/resend.ts, rate-limit.ts (in-memory), consent/
```

## Flusso end-to-end (upload -> analisi -> pagamento -> consegna)

Questo è il percorso critico del business. Numeri di riga verificati.

1. **Upload (pre-pagamento).** L'utente autenticato in `/dashboard` sceglie una **modalità** (`infografica` default, `lookbook`, `guardaroba` — schema Zod `src/lib/armocromia/schemas.ts:38-41`) e carica una foto. La server action `analyzePhoto` (`dashboard/actions.ts:40-256`) valida (Zod, blocca HEIC), crea un record `dossiers` con status `pending_payment`, carica la foto nel bucket privato `photos` a `{user_id}/{dossier_id}.{ext}` (estensione derivata dal MIME **validato**, non dal filename — difesa in profondità), crea la Stripe Checkout Session e un record `payments` con status `pending`. **Zero chiamate fal.ai qui:** un checkout abbandonato costa €0 di AI.
   - Bug noto: `actions.ts:209` salva l'intera **URL** del checkout nella colonna `stripe_checkout_session_id` (destinata al `cs_...`).
2. **Pagamento.** L'utente paga sulla pagina hosted di Stripe. La `success_url` (`stripe.ts:39`) **non** contiene `{CHECKOUT_SESSION_ID}` → al ritorno l'app non ha modo di verificare la sessione lato server.
3. **Trigger = webhook.** Stripe invia `checkout.session.completed` a `api/webhooks/stripe/route.ts`. Il webhook: verifica la firma (`route.ts:64`), controlla che il `dossier_id` nei metadata appartenga all'utente atteso, applica idempotenza sullo **status** del dossier (`route.ts:131-134`), aggiorna `payments` a `completed`, invia la ricevuta Resend, e lancia la pipeline in background con `waitUntil(runDossierGenerationPipeline(...))` (`route.ts:204-213`). **È l'unico percorso che avvia la generazione** (più il trigger manuale admin).
4. **Pipeline AI** (`src/lib/armocromia/pipeline.ts:23-194`), con service-role:
   - firma una signed URL (1h) della foto e la passa a **`classifyPhoto`** (`classify.ts:123`) → fino a 3 tentativi interni → JSON con sotto-stagione + confidence + analisi;
   - chiama **`generateDossierImage`** (`generate-dossier.ts:702`) → 1 immagine 4K (gpt-image-2), **un solo tentativo, nessun retry**;
   - scarica l'immagine, la carica nel bucket privato `dossiers` a `{userId}/{dossierId}.png`, imposta status `completed`.
   - Nessun QA post-generazione.
5. **Consegna.** L'utente vede il dossier in `/dashboard` e `/dossier/[id]` tramite signed URL (1h) generate dal **suo** client (quindi soggette a RLS). Il polling dello stato durante la generazione usa la server action `checkDossierStatus` (`actions.ts:358`), non l'API route omonima (morta).

**Costo per cliente pagante:** 2 chiamate fal (1 vision ~$0,01 + 1 immagine 4K ~$0,41) ≈ **€0,39-0,41**. Margine lordo su €29 al netto fee Stripe ≈ **96%**. Dettaglio in `AUDIT.md` → Economia unitaria.

## Retention e cancellazione dati (GDPR)

- **Foto sorgente:** cancellata dal bucket `photos` dal cron `delete-old-photos` (Vercel Cron, `0 3 * * *`) quando il dossier ha >24h; il record DB viene anonimizzato (`original_photo_path = null`). Retention *reale* ~36-48h (il cron gira una volta al giorno alle 03:00) vs le "24 ore" promesse in privacy. Il cron **non filtra per status**: cancella anche la foto di un dossier ancora `pending_payment`/`failed` → dossier pagato-ma-fallito irrecuperabile dopo 24h (vedi `AUDIT.md`).
- **Dossier generato:** conservato finché l'account è attivo; l'utente può cancellarlo dalla dashboard. La privacy lo dichiara (`messages/*.json:777`).
- **Cancellazione account (diritto all'oblio):** `deleteAccount` (`dashboard/actions.ts:432-565`) elimina file + dossier + payments + profile + auth user + scrive audit.
- **audit_log:** tabella con RLS on e zero policy (accessibile solo a service-role), `user_id` **senza FK** per sopravvivere all'erasure (corretto per GDPR art. 5.2).

## Modello dati (Supabase)

Tabelle `public`: `profiles`, `dossiers`, `payments`, `audit_log`. Bucket storage: `photos` (privato, 10MB, image/*), `dossiers` (privato, 50MB, pdf+image). **RLS abilitata su tutte le 4 tabelle**, ogni policy scoping `auth.uid()`, **zero policy per il ruolo anon**. `payments` è write-protected (solo service-role scrive lo stato). Dettaglio policy-per-policy in `AUDIT.md` → sezione RLS. **Isolamento utenti verificato: un utente non può leggere/modificare dati di un altro.**

## Decisioni architetturali implicite, rese esplicite

| Decisione | Perché (motivazione ricostruita) |
|---|---|
| **i18n custom `/[lang]/` invece di next-intl** | Scelta del 2026-05-16 per aderire a "vanilla Next 16"; pattern `useLocale`/`localePath`. Trade-off: meno magia, più codice manuale, ma nessuna dipendenza che rompa con le breaking-change di Next 16. |
| **Webhook come unico trigger della pipeline** | Semplicità: `waitUntil` post-webhook è il minimo che funziona. **Debito accettato ma mai ripagato** — il commento in `pipeline.ts:17-21` promette una riconciliazione al redirect che non esiste. È il rischio #1 del business (vedi ROADMAP Fase 1). |
| **Generazione AI in `waitUntil` (fire-and-forget)** | Evita di far attendere il webhook (Stripe ritenterebbe). Costo: se il processo muore, nessun retry automatico; serve un watchdog server-side (assente). |
| **service-role solo `server-only`** | Le 3 factory importano `"server-only"` → impossibile bundlarle nel client. Difesa reale contro il leak della chiave via bundle. (Ma la chiave è trapelata via git history: vedi AUDIT.) |
| **Pagamento pre-generazione** | Si incassa prima di spendere in AI → protegge il margine (nessun costo AI su checkout abbandonato). Effetto collaterale: il caso pagato-ma-fallito diventa il peggiore da gestire (cliente ha pagato, prodotto assente). |
| **Una sola immagine per acquisto** (non le 3 modalità insieme) | Confermato dal proprietario 2026-07-10 come comportamento *voluto*: il cliente sceglie 1 modalità. La descrizione prodotto Stripe che promette "palette, guardaroba e lookbook" è un **errore di copy da correggere**, non un bug di pipeline. |
| **Storia pagamenti: Lemon Squeezy → Stripe** | Nato con Lemon Squeezy (Merchant of Record: gestiva IVA per conto del venditore). LS entrò in review e non approvò; il 2026-06-16 si è migrati a **Stripe Checkout sandbox**. **Conseguenza chiave:** Stripe è un PSP, **non** un MoR → l'onere IVA/OSS torna al venditore. Da qui il gate fiscale e il disallineamento legale dei testi (vedi AUDIT/ROADMAP). Il checkout è isolato in `lib/stripe.ts`: un eventuale ritorno a un MoR (Paddle) resterebbe economico. |
| **EUR-only** | Confermato 2026-07-10: al lancio si incassa solo in EUR (mercato IT/ES iniziale); multi-currency è milestone post-validazione, malgrado la nota del 15/05. `currency: "eur"` hardcoded in `stripe.ts:50` è quindi *coerente* con la decisione attuale, non un bug — ma va centralizzato. |
| **Demo self-contained via template pinnato** | `/demo-access` copia fisicamente un dossier pre-generato (`DEMO_TEMPLATE_DOSSIER_ID`, default #47) nello storage dell'account demo, senza chiamare fal.ai (costo €0) e senza esporre foto biometriche reali. Nata per l'ispezione Lemon Squeezy, ora **scopo decaduto**. |

## Variabili d'ambiente attese (realtà vs `.env.local.example`)

`.env.local.example` è **fuorviante**: elenca variabili morte (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `OPENAI_API_KEY` — non usate da nessun file `src/`) e **omette** variabili realmente obbligatorie. Set reale richiesto in produzione (verificato dagli usi nel codice):

- **Supabase:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY` (service-role, usata da webhook/cron/admin/pipeline).
- **fal.ai:** `FAL_KEY`.
- **Stripe:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
- **Admin/cron:** `ADMIN_EMAILS`, `ADMIN_SECRET`, `CRON_SECRET`.
- **Demo:** `DEMO_TEMPLATE_DOSSIER_ID`.
- **Email:** `RESEND_API_KEY`, `RESEND_FROM_EMAIL`.
- **Osservabilità/analytics (opzionali):** `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN` (assente → no source map), `NEXT_PUBLIC_GA_MEASUREMENT_ID`.

Sul filesystem esistono ~12 file `.env.*` (copie multiple di secret in chiaro): gitignored, ma da consolidare. Vedi `AUDIT.md`.

## Note operative infrastruttura

- **[INFERENZA, da memoria di progetto]** Esiste un secondo progetto Vercel collegato allo stesso repo (`armocromia-mvp.vercel.app`, env vecchie): quello *vero* è cromeastudio.com. Testare sempre sul dominio, non sul .vercel.app duplicato.
- Auto-deploy via `git push` su `main` funziona. Nessuna GitHub Action presente (`.github/workflows` assente) → **nessuna CI** oggi (vedi ROADMAP Fase CI).
