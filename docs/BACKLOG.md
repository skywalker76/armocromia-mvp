# BACKLOG — Cromea Studio

> Task autosufficienti derivati da `AUDIT.md`, in ordine di priorità (`ROADMAP.md`). **Un agente che legge solo la scheda deve poter eseguire il task.** Ogni scheda: contesto, file da toccare, criteri di accettazione verificabili, vincoli, cosa NON toccare. I file:riga sono al 2026-07-10 — **verificali prima di editare** (potrebbero shiftare). Stato iniziale: tutti `TODO`.
>
> **Vincoli globali (valgono per OGNI task):** branch dedicato (mai `main`); gate `npx tsc --noEmit` + `npm run lint` + `npm run build` + smoke su Vercel Preview prima del merge; Stripe resta in sandbox; migration DB solo additive. Leggi `NORTH_STAR.md` e `ROADMAP.md` prima di iniziare. Dettaglio in `CLAUDE.md`.

---

## M0 — Sicurezza d'emergenza

### SEC-1 · Ruotare la service-role key Supabase compromessa · Critica · S
**Contesto:** la `SUPABASE_SECRET_KEY` di prod (progetto `xjmhzdwmngzrosuxqfff`) è in chiaro in `scratch/deploy_env.js:9` e nella git history (commit `1e0c5f4`), identica a quella viva. Bypassa tutta la RLS.
**Azione (prevalentemente ops, non codice):**
1. Su Supabase Dashboard → ruotare la service-role key (o disabilitare le legacy JWT keys e migrare alle nuove secret/publishable keys).
2. Aggiornare `SUPABASE_SECRET_KEY` su Vercel (progetto cromeastudio.com) e in `.env.local`.
3. `git rm scratch/deploy_env.js` (e verificare che sia gitignored per il futuro).
4. Opzionale ma raccomandato: purge della history (git filter-repo) per i file con secret.
**Criteri di accettazione:** la vecchia chiave non autentica più contro Supabase (test: una query con la vecchia chiave restituisce 401); l'app in prod continua a funzionare (webhook/cron/admin) con la nuova; `scratch/deploy_env.js` non esiste più.
**NON toccare:** la logica applicativa che usa `createAdminClient` — cambia solo il valore della env.
**Nota:** verificare anche `FAL_KEY`/`STRIPE_*` — da questa sessione non risultano compromessi, ma la memoria del 30/05 era inaffidabile: ricontrollare.

### SEC-3 · Revocare il token API Vercel in scratch · Media · S
**Contesto:** `scratch/fix_env_api.mjs:13` contiene un token `vca_...` non risultante tra i secret ruotati. Altri script scratch contengono il webhook secret LS.
**Azione:** revocare/rigenerare il token su Vercel Dashboard → Account → Tokens; `git rm`/eliminare gli script scratch con secret (`fix_env_api.mjs`, `deploy_env.js`, `deploy-envs-clean.js`, `fix_env_stdin.mjs`, `trigger_dossier_96.mjs`, e gli altri con credenziali).
**Criteri di accettazione:** il token vecchio non è più valido (test: `vercel whoami` con quel token fallisce); nessuno script in `scratch/` contiene JWT/token/secret (grep `eyJ|vca_|sk_|whsec_` = 0).
**NON toccare:** gli script scratch che leggono da env (non contengono valori) possono restare, ma è comunque consigliato ripulire l'intera cartella (vedi REPO-1).

### PAY-3 · Non cancellare le foto di dossier recuperabili · Critica · S
**Contesto:** `cron/delete-old-photos/route.ts:66-70` cancella ogni foto >24h senza filtrare per status. Un dossier pagato ma non `completed` diventa irrecuperabile.
**File:** `src/app/api/cron/delete-old-photos/route.ts`.
**Azione:** aggiungere alla selezione delle foto da cancellare la condizione che il dossier sia in stato terminale sicuro (`completed`) **oppure** che non esista un pagamento `completed` non ancora consegnato/rimborsato. In pratica: non cancellare la foto se il dossier è `pending_payment`/`processing`/`generating`/`failed` con un `payments.status='completed'` associato.
**Criteri di accettazione:** un dossier `failed` con payment `completed` e foto >24h **conserva** la foto (test manuale: creare il caso in sandbox, eseguire il cron via `scratch/run-cron.js` o endpoint, verificare che la foto resti); un dossier `completed` >24h perde la foto come prima; la retention sui dossier consegnati resta invariata.
**Vincolo:** è l'unica voce M0 che tocca codice → branch + gate completo.
**NON toccare:** la logica di anonimizzazione DB (`original_photo_path=null`) per i dossier effettivamente puliti.

### REPO-1a · Rimuovere il dato personale reale da git · Bassa · S
**Contesto:** `dossier_result.json` (root) è tracciato in git e contiene un `classification_result` reale (descrizione fisica di una persona).
**Azione:** `git rm dossier_result.json`; aggiungerlo a `.gitignore` se serve tenerlo in locale. (Il resto dell'igiene repo è in REPO-1b, M4.)
**Criteri di accettazione:** `git ls-files | grep dossier_result.json` = vuoto.

---

## M1 — Blindare il denaro

### PAY-1 · Riconciliazione pagamento (redirect + cron) · Critica · M
**Contesto:** il webhook è l'unico trigger; se non arriva, il dossier resta `pending_payment` per sempre. La `success_url` non porta il session id. Il commento `pipeline.ts:17-21` promette una riconciliazione inesistente (e cita Lemon Squeezy).
**File:** `src/lib/stripe.ts` (success_url), `src/app/[lang]/(app)/dashboard/page.tsx` + `actions.ts` (verifica al redirect), nuovo cron in `src/app/api/cron/` + `vercel.json`, `src/lib/armocromia/pipeline.ts` (commento).
**Azione:**
1. Aggiungere `{CHECKOUT_SESSION_ID}` alla `success_url` (`stripe.ts:39`).
2. Al redirect `payment_success`, una server action verifica la sessione Stripe lato server; se `payment_status==="paid"` e dossier `pending_payment` → avvia la pipeline (riusa il percorso del webhook, idempotente).
3. Nuovo **cron riconciliatore** (ogni 15 min): per ogni dossier `pending_payment` con payment `pending` da >20 min, interroga Stripe (`checkout.sessions.retrieve`); se `paid` → riconcilia e avvia pipeline; altrimenti se scaduto → `expired`.
4. Correggere/rimuovere il commento falso in `pipeline.ts:17-21`.
**Criteri di accettazione:** con Stripe CLI, simulando un webhook **non** consegnato ma pagamento avvenuto, il dossier viene generato entro il ciclo di riconciliazione (redirect immediato o cron ≤15 min); un checkout mai pagato finisce `expired`; il percorso è idempotente (nessuna doppia generazione se webhook + redirect + cron convergono).
**Vincolo:** proteggere il nuovo cron con `CRON_SECRET` (come `delete-old-photos`).
**NON toccare:** la verifica firma del webhook (funziona); l'idempotenza esistente (irrobustita da PAY-5).

### PAY-2 · Recovery pagato-ma-fallito (retry gratis → refund) · Critica · M
**Contesto:** oggi un dossier `failed` con payment `completed` non ha percorso di recupero gratuito; l'utente è invitato a pagare di nuovo. Retry solo via endpoint admin manuale.
**File:** `src/app/[lang]/(app)/dashboard/page.tsx` + relativi componenti (UI failed), `dashboard/actions.ts` (nuova server action gated), nuovo cron watchdog, `src/lib/stripe.ts` (refund API).
**Azione:**
1. Server action "Rigenera gratis" visibile **solo** su dossier `failed` con `payments.status='completed'`; ri-verifica ownership + stato pagamento lato server; riavvia la pipeline **senza** nuovo checkout. Richiede la foto sorgente ancora presente (dipende da PAY-3).
2. Se la rigenerazione rifallisce (o la foto non c'è più) → refund automatico via Stripe (`refunds.create`) + email di scuse (Resend) + `payments.status='refunded'`.
3. **Cron watchdog** server-side: dossier `processing`/`generating` da >15 min → 1 retry automatico → se rifallisce `failed` + email admin + email utente. (Sostituisce il watchdog "pigro" lato dashboard, che resta come fallback.)
**Criteri di accettazione:** in sandbox, forzando un fallimento di generazione su un dossier pagato, l'utente può rigenerare senza pagare; se rifallisce riceve un refund reale (visibile nel dashboard Stripe sandbox) e l'email; un dossier stuck viene sbloccato dal watchdog senza visita utente.
**NON toccare:** il flusso di acquisto normale (pre-pagamento).

### PAY-4 · Webhook hardening (expired/refunded, paid/amount, dedupe) · Alta · S
**File:** `src/app/api/webhooks/stripe/route.ts`.
**Azione:** gestire `checkout.session.expired` (→ dossier `expired`) e `charge.refunded` (→ `payments.status='refunded'`); prima di generare verificare `session.payment_status==="paid"` e `amount_total` atteso; dedupe idempotente su `event.id` (tabella/colonna degli eventi processati, additiva).
**Criteri di accettazione:** con Stripe CLI, inviando `checkout.session.expired`, `charge.refunded` e un `checkout.session.completed` **duplicato** (stesso event.id), il DB riflette lo stato corretto e la pipeline parte **una sola volta**.
**Vincolo:** migration additiva per la dedupe (es. tabella `stripe_events`).

### PAY-5 · Idempotenza webhook atomica · Media · S
**File:** `src/app/api/webhooks/stripe/route.ts:131-164`.
**Azione:** trasformare il check-then-update in un UPDATE condizionale (`.eq("status","pending_payment")`) che funga da compare-and-set; procedere con la pipeline solo se l'update ha modificato 1 riga.
**Criteri di accettazione:** due invocazioni concorrenti dello stesso evento avviano la pipeline una sola volta (test: doppio replay ravvicinato con Stripe CLI).

### PAY-8 · Salvare il cs_... corretto · Bassa · S
**File:** `src/app/[lang]/(app)/dashboard/actions.ts:209`.
**Azione:** salvare `session.id` (non `session.url`) in `stripe_checkout_session_id`.
**Criteri di accettazione:** la colonna contiene un valore `cs_...`; un lookup per session id trova il record; il webhook continua a riconciliare correttamente.

---

## M2 — Qualità dossier & continuità AI ✅ (Completato su `feat/m2-dossier-ai-upgrade`)

### AI-1 · Migrare l'endpoint di classificazione fal deprecato · Alta · M · ✅ Completato
**Contesto:** `classify.ts:123-129` usa `fal-ai/any-llm/vision` (deprecato). Se fal lo dismette, ogni generazione fallisce.
**File:** `src/lib/fal/classify.ts`, eventualmente `src/lib/fal/client.ts`.
**Azione:** individuare nel catalogo fal corrente un endpoint vision supportato equivalente (modello Gemini/GPT vision), aggiornare la chiamata e ri-validare il parsing JSON + schema Zod (`schemas.ts`). Verificare che il formato di output resti compatibile.
**Stato:** Migrato a `openrouter/router/vision` (`image_urls: [photoUrl]`, `model: "google/gemini-2.5-flash"`).
**Criteri di accettazione:** la classificazione funziona su ≥5 foto di test con lo stesso schema di output; nessun call site usa un endpoint marcato deprecato; il costo per chiamata resta nell'ordine di ~$0,01 (o documentare la variazione).
**NON toccare:** lo schema di output atteso a valle (la pipeline e l'infografica dipendono dai campi).

### AI-2 · Palette reale nell'infografica · Alta · S · ✅ Completato
**File:** `src/lib/fal/generate-dossier.ts:456` (ramo infografica).
**Azione:** passare al prompt infografica i colori reali (nome+hex) da `palettes.json`, usando lo stesso `formatColors` già impiegato per lookbook (`:534-563`) e guardaroba (`:616-647`).
**Stato:** Estratti helper condivisi `getPaletteTiers` e `formatColors`; passati i 16 colori reali con `#HEX` (`primary`, `accents`, `secondary`, `neutrals`), `avoidColorsWithHex` e `lookSuggestions` nel prompt `buildDossierPrompt`.
**Criteri di accettazione:** su un dossier infografica di test, gli hex mostrati corrispondono a quelli della sotto-stagione in `palettes.json` (non inventati); nessuna regressione su lookbook/guardaroba.

### AI-3 · Confidence come gate + qualità foto + capelli tinti · Media · M · ✅ Completato
**File:** `src/lib/fal/classify.ts` (prompt + schema), `src/lib/armocromia/pipeline.ts` (gate a valle).
**Azione:** aggiungere al prompt la valutazione di illuminazione/filtri/trucco (campo `photoQuality` + `photoQualityIssues`) e le istruzioni per capelli tinti (giudicare da radici/sopracciglia/incarnato); definire una rubrica confidence con ancore esplicite; nella pipeline, sotto una soglia → non consegnare: dossier `needs_better_photo` (o simile), email all'utente + rigenerazione gratuita quando ricarica.
**Stato:** Aggiunti `photoQuality` (`good | acceptable | poor`) e `photoQualityIssues` opzionali in `schemas.ts`; protocollo diagnostico in 4 step in `classify.ts` (inclusa analisi ricrescita/sopracciglia per capelli tinti e rubrica di confidenza); gate `confidence < 0.45` in `pipeline.ts` con messaggio localizzato IT/EN/ES salvato in `error_message`.
**Criteri di accettazione:** una foto in luce calda/filtrata produce confidence bassa e **non** viene consegnato un dossier; una foto buona passa; il caso sotto-soglia genera l'email corretta.
**Vincolo:** `dossiers.status` ha un vincolo CHECK su 6 stati (definito in `supabase/migrations/001_initial_schema.sql`). Introdurre un nuovo stato (es. `needs_better_photo`) significa **modificare il CHECK per aggiungere un valore**: è consentito perché additivo (nessun drop/rename, nessuna perdita dati) — è l'eccezione alla regola "solo additive". In alternativa, per evitare del tutto la modifica del CHECK, usa il campo `error_message` per marcare il caso e non introdurre un nuovo stato. Scegli la prima via se il caso "foto inadeguata" deve avere una UI dedicata.

### AI-4 · QA vision post-generazione · Media · S · ✅ Completato
**File:** `src/lib/armocromia/pipeline.ts:80-122`.
**Azione:** dopo la generazione, una chiamata vision economica valuta leggibilità testo + coerenza (volto/palette); sotto soglia → 1 retry di generazione prima di marcare `completed`.
**Stato:** Implementato `verifyDossierImageQuality` (`openrouter/router/vision`, fail-open su errori di rete) e integrato in `pipeline.ts` con 1 retry automatico di `generateDossierImage` se `!qaResult.passed`.
**Criteri di accettazione:** un output volutamente degradato (mock) innesca il retry; un output buono passa al primo colpo; il costo aggiuntivo è ~1 chiamata vision (~$0,01).

### AI-5 · Riordinare i campi JSON della classificazione · Bassa · S · ✅ Completato
**File:** `src/lib/fal/classify.ts:68-71`.
**Azione:** nel template JSON, mettere `analysis`/`reasoning`/`confidence` **prima** di `subSeason`.
**Stato:** Riordinato il template JSON in `buildPrompt` (`photoQuality` → `photoQualityIssues` → `analysis` → `reasoning` → `subSeason` → `confidence` → `lookSuggestions`).
**Criteri di accettazione:** lo schema Zod continua a validare; su un set di test la distribuzione di confidence/accuratezza non peggiora (idealmente migliora).

### PROD-1 · Correggere il copy prodotto (1 modalità, non 3) · Bassa · S · ✅ Completato
**Contesto:** confermato dal proprietario che il prodotto è **una modalità a scelta**; il copy Stripe è il bug.
**File:** `src/lib/stripe.ts:53` (description), eventuali copy correlati in `messages/*.json`.
**Azione:** riscrivere la descrizione prodotto Stripe e i testi che promettono le tre modalità insieme, per riflettere "una modalità a scelta (infografica, lookbook o guardaroba)".
**Stato:** Aggiornata e localizzata (IT/EN/ES) la descrizione prodotto in `src/lib/stripe.ts` per indicare chiaramente "una modalità a scelta (Infografica, Lookbook o Guardaroba)".
**Criteri di accettazione:** nessun copy cliente-facing promette le 3 modalità in un singolo acquisto da €29.
**NON toccare:** la pipeline (il comportamento a 1 immagine è corretto). Il bundle 3-in-1 è un tema di crescita (M6), non questo task.

---

## M3 — Sicurezza & GDPR (resto)

### SEC-2 · Mettere in sicurezza /demo-access · Alta · M
**File:** `src/app/[lang]/demo-access/route.ts`.
**Azione:** poiché lo scopo (ispezione Lemon Squeezy) è decaduto, **preferire la rimozione** della rotta; se serve tenerla, gate dietro secret (query/header) + rate limit + rendere l'account demo read-only (bloccare `analyzePhoto` per l'email demo). Rimuovere la password hardcoded dal sorgente in ogni caso.
**Criteri di accettazione:** `/demo-access` non è più un auto-login pubblico anonimo; nessuna password in chiaro nel sorgente; se mantenuta, l'account demo non può caricare foto reali.

### SEC-4 · Rimuovere backdoor admin + log allowlist · Media · S
**File:** `src/lib/admin.ts:22-25` (fallback) e `:30` (log).
**Azione:** eliminare il fallback hardcoded `gamatig@gmail.com` (usare solo `ADMIN_EMAILS`, assicurandosi che l'env sia settata in prod); rimuovere il `console.log` della allowlist.
**Criteri di accettazione:** un ambiente senza `ADMIN_EMAILS` non ha admin impliciti; i log non contengono la lista email admin.
**Vincolo:** verificare che `ADMIN_EMAILS` sia presente su Vercel prod PRIMA di rimuovere il fallback (altrimenti si perde l'accesso admin).

### SEC-5 · Admin page: notFound fuori dal try/catch, niente stack al client · Media · S
**File:** `src/app/[lang]/(app)/admin/page.tsx` (gate `:29-31`, try `:23`, catch `:207-234`).
**Azione:** eseguire il gate `isAdmin`/`notFound()` **prima** del try; non costruire JSX dentro il try/catch (risolve il bug ESLint `react-hooks/error-boundaries`); in caso di errore non renderizzare message+stack al client (log server-side + messaggio generico).
**Criteri di accettazione:** un utente autenticato non-admin riceve un 404 (non una 500 con stack); `npm run lint` non segnala più l'errore JSX-in-try/catch su questo file.

### GDPR-1 · Cron retention orario + alert · Media · S
**File:** `vercel.json:6` (schedule), `src/app/api/cron/delete-old-photos/route.ts`.
**Azione:** portare lo schedule a ogni ora; su errori parziali inviare alert (email admin/Sentry) invece di HTTP 200 silenzioso; allineare la promessa "24h" (o l'implementazione) alla realtà.
**Criteri di accettazione:** retention reale ≤25h (verificabile: una foto caricata scompare entro 25h); un errore simulato nel cron produce un alert, non un 200.
**Coordinamento:** rispettare PAY-3 (non cancellare foto di dossier recuperabili).

### SEC-6 · Rate limit su analyzePhoto + checkout · Media · S
**File:** `src/app/[lang]/(app)/dashboard/actions.ts` (analyzePhoto), `src/lib/rate-limit.ts` o nuovo store condiviso.
**Azione:** applicare rate limiting per-utente/IP su `analyzePhoto` e sulla creazione checkout. Valutare Upstash Redis (Vercel Marketplace) per un limiter condiviso tra istanze; in alternativa riusare quello in-memory come minimo.
**Criteri di accettazione:** oltre N richieste in T minuti l'azione viene rifiutata con messaggio chiaro; il limite è documentato.

### OPS-1 · Resend: niente successo simulato in prod · Media · S
**File:** `src/lib/emails/resend.ts:21-33`.
**Azione:** in produzione, se `RESEND_API_KEY` manca → fallire esplicitamente/allertare (non ritornare successo simulato); non loggare il corpo HTML dell'email.
**Criteri di accettazione:** in prod senza chiave, l'invio non riporta successo silenzioso; i log non contengono il corpo email.

### WEB-1 · Eliminare/nascondere /[lang]/preview · Media · S
**File:** `src/app/[lang]/preview/page.tsx` (+ componenti usati solo qui: CinematicHero, DossierShowcase, SeasonCarousel).
**Azione:** eliminare la rotta orfana; se si vuole conservarla, gate `NODE_ENV==="production" && notFound()` + noindex come `/ux-preview`. Rimuovere i componenti e gli asset (`dossier-spring/summer/autumn/winter.png`) se non più referenziati.
**Criteri di accettazione:** `cromeastudio.com/it/preview` restituisce 404 in prod; nessun componente orfano resta importato solo da lì.

### SEC-7a · Rimuovere lmsqueezy.com dalla CSP · Bassa · S
**File:** `next.config.ts:17,21`.
**Azione:** togliere `https://lmsqueezy.com` da script-src e connect-src. (Il CSP nonce-based è SEC-7b, M4.)
**Criteri di accettazione:** la CSP non contiene più riferimenti a lmsqueezy; il sito funziona (smoke test checkout).

### GDPR-2 · purchase GA4 server-confermato + cleanup pending · Bassa · S
**File:** `src/components/app/PhotoUploader.tsx:195-218` (GA4), nuovo cleanup (può integrarsi col cron riconciliatore di PAY-1).
**Azione:** emettere l'evento `purchase` solo dopo conferma server del pagamento; job che elimina i `dossiers`+`payments` in `pending_payment` scaduti.
**Criteri di accettazione:** un `payment_success=true` forgiato in URL non genera un `purchase`; i pending scaduti non si accumulano.

---

## M4 — CI & igiene codice

### CODE-2 · Sistemare il lint (prerequisito CI) · Bassa · S+M
**File:** `eslint.config.mjs` (escludere `scratch/`), poi i file con errori reali, `.env.local.example`.
**Azione:** escludere `scratch/` da ESLint (elimina ~50 errori `require()`); correggere gli errori reali: SEC-5 (JSX-in-try/catch), `react-hooks/set-state-in-effect` (NavBar, PhotoUploader, ProgressStepper, CinematicHero, DossierReadyToast — spesso risolvibili con init lazy o `useState` initializer), `no-explicit-any` (webhook/stripe/route.ts, lib/stripe.ts, resend.ts, InteractiveDossierDashboard), `LocaleSwitcher` immutability; riscrivere `.env.local.example` col set reale (vedi ARCHITECTURE) rimuovendo le var morte.
**Criteri di accettazione:** `npm run lint` esce 0 errori (warning tollerati e giustificati); `.env.local.example` elenca tutte e sole le var richieste.

### CI · GitHub Action tsc+lint+build su ogni PR · Media · S
**File:** nuovo `.github/workflows/ci.yml`.
**Azione:** workflow che su ogni PR esegue `npx tsc --noEmit`, `npm run lint`, `npm run build`. Bloccante dopo CODE-2.
**Criteri di accettazione:** una PR con errore tsc/lint/build viene bloccata; una PR pulita passa.

### CODE-1 · Dedup + rimozione modo "full" · Bassa · M
**File:** `src/lib/admin.ts:39`, `src/lib/supabase/admin.ts:12`, usi inline (webhook, cron, actions.ts), `src/app/api/dossier-status/[id]/route.ts` (morta), `dashboard/actions.ts:156-176` + `pipeline.ts:89-111` (upload), `actions.ts:193`/`webhook:88`/`trigger-dossier:99` (full).
**Azione:** un solo `createAdminClient` typed importato ovunque; eliminare la route status morta; estrarre un helper upload-con-retry condiviso; rimuovere il default `"full"` (usare `"infografica"` esplicito).
**Criteri di accettazione:** una sola definizione di admin client; nessun riferimento a `/api/dossier-status`; nessun `"full"` nel codice; build verde.

### SEC-7b · CSP nonce-based · Bassa · M
**File:** `next.config.ts`, layout.
**Azione:** migrare a CSP con nonce, rimuovendo `unsafe-inline`/`unsafe-eval`.
**Criteri di accettazione:** la CSP non contiene unsafe-*; nessuna regressione (script inline funzionanti via nonce).

### OPS-2 · Sentry source map upload · Bassa · S
**File:** `next.config.ts:60-62`, env.
**Azione:** configurare `SENTRY_AUTH_TOKEN` per l'upload delle source map.
**Criteri di accettazione:** un errore client in prod appare in Sentry con stack simbolicato.

### PAY-6 · Centralizzare prezzo + apiVersion Stripe · Bassa · S
**File:** i ~10 punti con 2900/€29 (vedi AUDIT PAY-6), `src/lib/stripe.ts:12`, `webhooks/stripe/route.ts:31`.
**Azione:** costante unica `PRICE_CENTS` + helper di display; aggiornare `apiVersion` a una coerente con l'SDK v22 e rimuovere `as any`.
**Criteri di accettazione:** un cambio prezzo si fa in 1 punto; nessun `apiVersion ... as any`; build+tsc verdi.

### PAY-7 · Payment methods dinamici · Bassa · S
**File:** `src/lib/stripe.ts:46`.
**Azione:** rimuovere `payment_method_types:["card"]` e abilitare i metodi dinamici da Dashboard Stripe.
**Criteri di accettazione:** il checkout mostra i metodi configurati da Dashboard; smoke test pagamento sandbox ok.

### REPO-1b · Igiene repo · Bassa · S
**File:** root del repo, `docs/`.
**Azione:** `git rm` dei file spuri tracciati (`AUDIT.md` vecchio, `Armocromia-Opus-Handover.md`, `test-admin.js`, `lint-output.txt`, `TODO.md`, screenshot `.png`); valutare la rimozione di `docs/Cromea-Landing-Standalone.html` (6,1MB). Aggiornare `docs/README.md` (obsoleto).
**Criteri di accettazione:** la root non contiene file di debug/screenshot tracciati; `docs/` non contiene lo standalone da 6MB; README aggiornato.
**NON toccare:** i nuovi `docs/*.md` di questo handoff.

---

## M5 — Legale & fiscale (GATED)

### LEGAL-1 · Riscrivere Privacy/Terms per Stripe PSP · Alta · M (testi ora, pubblicazione gated)
**File:** `src/messages/{it,en,es}.json:757,797,860,861` e testi correlati; footer `(marketing)/page.tsx:609` + `messages/*:295`.
**Azione:** riscrivere Privacy/Terms per dichiarare Stripe come **PSP** (non MoR); descrivere il trattamento IVA secondo il regime scelto dal commercialista; predisporre la P.IVA nel footer. Preparare i testi ORA; pubblicarli al go-live.
**Criteri di accettazione:** nessun testo cliente-facing cita Lemon Squeezy come MoR; footer con P.IVA (al go-live); testi coerenti col regime deciso.
**Dipendenza:** decisione commercialista per la parte IVA/OSS. Domande già preparate in ROADMAP M5.

---

## M6 — Crescita

I task di crescita (quiz lead-magnet, anchoring prezzo, recensioni reali → riattivazione Testimonials, landing per sotto-stagione, funnel GA4, bundle 3-modalità upsell, email retention, referral) sono descritti a livello di obiettivo/KPI in `ROADMAP.md` → M6 e nella social strategy del vault. Vanno scomposti in schede quando M1+M2 sono stabili — non prima, per non scalare il refund. Regola non negoziabile: **recensioni solo autentiche** (mai riattivare Testimonials con placeholder).
