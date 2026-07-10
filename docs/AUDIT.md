# AUDIT — Cromea Studio

> Audit tecnico consolidato, 2026-07-10. Fonde i finding **nuovi** (economia unitaria, inventario, RLS riga-per-riga) con quelli **ereditati** dal "Piano Level 9" del 2026-07-09, ciascuno **ri-verificato nel codice** in questa sessione. Ogni voce ha severità, sforzo, origine, file:riga, impatto e rischio-se-ignorato. `[INFERENZA]` = non provato direttamente dal codice.
>
> **Legenda origine:** `nuovo` = emerso oggi · `ereditato-confermato` = del 2026-07-09, verificato vero oggi · `ereditato-corretto` = del 2026-07-09, ridimensionato/confutato oggi.
> **Severità:** Critica / Alta / Media / Bassa · **Sforzo:** S (<½ gg) / M (½-2 gg) / L (>2 gg).
>
> Per ogni finding la scheda operativa eseguibile è in `BACKLOG.md` (stesso ID).

## Indice per severità

| ID | Sev | Sforzo | Origine | Titolo |
|---|---|---|---|---|
| SEC-1 | **Critica** | S+ | nuovo/ereditato-confermato | Service-role key di prod viva in git history, mai ruotata |
| PAY-1 | **Critica** | M | ereditato-confermato | Nessuna riconciliazione: webhook perso = cliente paga e non riceve nulla |
| PAY-2 | **Critica** | M | ereditato-confermato | Pagato-ma-fallito: nessun retry gratis né refund automatico |
| PAY-3 | **Critica** | S | nuovo | Foto sorgente cancellata a 24h a prescindere dallo status → dossier pagato irrecuperabile |
| AI-1 | **Alta** | M | nuovo | Endpoint di classificazione fal `any-llm/vision` DEPRECATO |
| SEC-2 | **Alta** | M | ereditato-confermato | `/demo-access`: auto-login pubblico, account condiviso, password hardcoded |
| LEGAL-1 | **Alta** | M | ereditato-confermato | Privacy/Terms dichiarano Lemon Squeezy come MoR; footer senza P.IVA |
| PAY-4 | **Alta** | S | ereditato-confermato | Webhook non gestisce expired/refunded, non verifica paid/amount, no dedupe event.id |
| AI-2 | **Alta** | S | ereditato-confermato | Infografica: palette inventata dal modello invece dei colori reali |
| SEC-3 | **Media** | S | nuovo | Token API Vercel in chiaro in `scratch/`, non tra i secret ruotati |
| PAY-5 | **Media** | S | nuovo | Race TOCTOU sull'idempotenza webhook → doppia pipeline |
| AI-3 | **Media** | M | ereditato-confermato | Confidence mai usata come gate; nessuna valutazione qualità-foto/capelli tinti |
| GDPR-1 | **Media** | S | ereditato-confermato | Cron retention gira 1×/giorno (reale ~36-48h) e fallisce in silenzio |
| SEC-4 | **Media** | S | ereditato-confermato | Backdoor admin hardcoded + log della allowlist admin a ogni check |
| SEC-5 | **Media** | S | ereditato-confermato/aggravato | Pagina admin: `notFound()` ingoiato dal try/catch → 500 con stack al client |
| WEB-1 | **Media** | S | nuovo | `/[lang]/preview` orfana ma viva e indicizzabile in produzione |
| OPS-1 | **Media** | S | nuovo | Resend: successo simulato se manca `RESEND_API_KEY` (ricevute non inviate) |
| SEC-6 | **Media** | S | ereditato-confermato | Nessun rate limit su `analyzePhoto` e creazione checkout |
| AI-4 | **Media** | S | ereditato-confermato | Nessun QA post-generazione dell'immagine |
| AI-5 | **Bassa** | S | ereditato-confermato | Ordine campi JSON classificazione anti-chain-of-thought |
| PROD-1 | **Bassa** | S | nuovo/confermato | Copy prodotto Stripe promette 3 modalità, ne consegna 1 |
| PAY-6 | **Bassa** | S | ereditato-confermato | Stripe apiVersion 2023-10-16 `as any`; prezzo duplicato in ~10 punti |
| PAY-7 | **Bassa** | S | ereditato-corretto | `payment_method_types:["card"]` blocca payment methods dinamici (non Apple/Google Pay) |
| PAY-8 | **Bassa** | S | ereditato-confermato | `stripe_checkout_session_id` contiene l'URL, non il `cs_...` |
| SEC-7 | **Bassa** | S | ereditato-confermato | CSP con `unsafe-inline`/`unsafe-eval` + whitelist morta lmsqueezy.com |
| OPS-2 | **Bassa** | S | ereditato-confermato | Sentry senza upload source map (stack client minificati) |
| GDPR-2 | **Bassa** | S | nuovo | GA4 `purchase` forgiabile via query param; dossier pending invisibili/immortali |
| CODE-1 | **Bassa** | M | ereditato-confermato | Duplicazioni: `createAdminClient` ×5, status ×2, upload-retry ×2, modo "full" fantasma |
| CODE-2 | **Bassa** | S | ereditato-confermato | Lint rosso (75 err), bug JSX-in-try/catch, `setState` in effect, `.env.local.example` fuorviante |
| REPO-1 | **Bassa** | S | nuovo | File spuri tracciati in git, incl. `dossier_result.json` con dati personali reali |

---

## Critica

### SEC-1 — Service-role key di produzione viva in git history, mai ruotata
**Origine:** nuovo (aggrava P23 ereditato). **Sforzo:** S (rotazione) + M (purge history opzionale).
**Evidenza (verificata da hash byte-per-byte in questa sessione):** `scratch/deploy_env.js:9` contiene un JWT `role=service_role`, progetto prod `xjmhzdwmngzrosuxqfff`, exp 2036-05-03. La stringa è **identica** a `SUPABASE_SECRET_KEY` in `.env.local` oggi, ed è presente nella git history al commit `1e0c5f4` (2026-05-23). La memoria di progetto del 30/05 la dava per "non esposta": **falso**.
**Impatto:** questa chiave bypassa tutta la RLS (che è il punto forte del progetto): lettura/scrittura di ogni foto, dossier, utente, pagamento. Chi ha/ha avuto accesso al repo può leggere i dati biometrici di tutti gli utenti.
**Mitigante (confermato dal proprietario 2026-07-10):** il repo è **sempre stato privato** → finestra di esposizione limitata a chi ha avuto accesso al repo. Resta Critica perché la chiave è *ancora valida*.
**Rischio se ignorato:** una singola fuga del repo (fork, collaboratore, backup) = compromissione totale del DB di produzione, con dati GDPR art. 9.
**Azione:** ruotare la chiave su Supabase (o disabilitare le legacy JWT keys e passare alle nuove publishable/secret keys) → aggiornare `SUPABASE_SECRET_KEY` su Vercel prod + locale. Poi rimuovere il file da disco. Purge della history opzionale ma raccomandato.

### PAY-1 — Nessuna riconciliazione: webhook perso = cliente paga e non riceve nulla
**Origine:** ereditato-confermato (P1/P2). **Sforzo:** M.
**Evidenza:** il webhook `api/webhooks/stripe/route.ts:205` è l'**unico** trigger della pipeline (più il trigger admin manuale). Al redirect, `dashboard/page.tsx` + `PhotoUploader.tsx:193-244` fanno solo GA4 + polling, **nessuna verifica Stripe lato server**. La `success_url` (`stripe.ts:39`) non contiene `{CHECKOUT_SESSION_ID}`, quindi la verifica non è nemmeno implementabile senza modificarla. Il commento in `pipeline.ts:17-21` che promette la riconciliazione è **falso** (cita persino "webhook di Lemon Squeezy"). Nessun cron di riconciliazione (`vercel.json:3-8` ha solo il cron GDPR).
**Impatto:** se Stripe non consegna il webhook (o lo consegna al progetto Vercel duplicato), il dossier resta `pending_payment` per sempre. Il safety-net in dashboard copre solo `processing/generating`, mai `pending_payment`.
**Rischio se ignorato:** perdita silenziosa di ordini pagati → refund manuali, recensioni negative, danno reputazionale. È il rischio #1 del business.

### PAY-2 — Pagato-ma-fallito: nessun retry gratis né refund automatico
**Origine:** ereditato-confermato (P4). **Sforzo:** M.
**Evidenza:** l'UI dei dossier falliti (`dashboard/page.tsx:180-233`) offre **solo** l'eliminazione; il messaggio (`messages/it.json:441`) invita a "riprovare caricando una nuova foto" → nuova `analyzePhoto` → **nuovo checkout da €29**. Nessuna logica di refund in tutto `src/`. Retry gratuito esiste solo via endpoint admin manuale (`trigger-dossier`).
**Impatto:** un cliente che ha già pagato e la cui generazione fallisce deve pagare di nuovo per riprovare. Peggiore esperienza possibile per un utente pagante.
**Rischio se ignorato:** chargeback, refund manuali, passaparola negativo.

### PAY-3 — Foto sorgente cancellata a 24h a prescindere dallo status
**Origine:** nuovo. **Sforzo:** S.
**Evidenza:** `cron/delete-old-photos/route.ts:66-70` cancella ogni foto >24h **senza filtrare per status del dossier**. La pipeline (`pipeline.ts:47-48`) e il trigger admin (`trigger-dossier`) hanno bisogno della foto sorgente (signed URL) per rigenerare.
**Impatto:** un dossier pagato ma `failed`/`pending_payment`/`stuck` da >24h diventa **irrecuperabile persino dall'admin**. Combinato con PAY-1/PAY-2: cliente pagante permanentemente senza prodotto e senza percorso di recupero.
**Rischio se ignorato:** casi di supporto non risolvibili se non con refund + scuse.
**Azione:** escludere dal purge le foto di dossier non in stato terminale positivo (`completed`), o conservarle finché il pagamento associato non è riconciliato/rimborsato.

---

## Alta

### AI-1 — Endpoint di classificazione fal `any-llm/vision` DEPRECATO
**Origine:** nuovo. **Sforzo:** M.
**Evidenza:** `classify.ts:123-129` usa `fal-ai/any-llm/vision` con `model: "google/gemini-2.5-flash"`. La pagina fal del modello lo marca "no longer supported / deprecated" (fonte: https://fal.ai/models/fal-ai/any-llm/vision, consultata 2026-07-10).
**Impatto:** la classificazione è il primo stadio della pipeline; se fal dismette l'endpoint, **ogni** generazione fallisce. È un rischio di continuità del prodotto, indipendente dal costo (~$0,01/chiamata).
**Rischio se ignorato:** rottura totale del prodotto senza preavviso.
**Azione:** migrare a un endpoint vision supportato (verificare il catalogo fal corrente per un modello Gemini/GPT vision non deprecato) e ri-testare il parsing JSON + Zod.

### SEC-2 — `/demo-access`: auto-login pubblico, account condiviso, password hardcoded
**Origine:** ereditato-confermato (P16), aggravato. **Sforzo:** M.
**Evidenza:** `demo-access/route.ts:11-13` ha email + password hardcoded (`CromeaDemoInspector2026!`); l'intera GET (`:167-238`) è un **auto-login pubblico senza segreto**. La ragione (ispezione Lemon Squeezy) è **decaduta** con la migrazione a Stripe.
**Impatto:** chiunque conosca l'URL ottiene una sessione autenticata sull'account demo condiviso. Se l'account demo può usare `analyzePhoto`, un visitatore può caricare una **foto biometrica reale** visibile ai visitatori demo successivi fino al purge (GDPR art. 9). Superficie di abuso costi senza registrazione.
**Rischio se ignorato:** esposizione dati biometrici non controllata + abuso.
**Azione:** rimuovere la rotta (scopo decaduto) oppure metterla dietro secret + rate limit + rendere l'account demo read-only (bloccare `analyzePhoto` per l'email demo).

### LEGAL-1 — Privacy/Terms dichiarano Lemon Squeezy come MoR; footer senza P.IVA
**Origine:** ereditato-confermato (P24). **Sforzo:** M (testi) + gated (pubblicazione).
**Evidenza:** `messages/{it,en,es}.json:757,797,860,861` dichiarano Lemon Squeezy Merchant of Record e processore pagamenti. Footer (`(marketing)/page.tsx:609`, `messages/*:295`) solo copyright, nessuna P.IVA.
**Impatto:** con Stripe (PSP, non MoR) l'onere IVA/OSS torna al venditore; i testi promettono un regime che non esiste più. Esposizione fiscale/legale al momento di vendere in live-mode.
**Rischio se ignorato:** vendite in live-mode con termini legali falsi → contestazioni, sanzioni.
**Azione:** riscrivere i testi (Stripe PSP) **ora**, pubblicarli al go-live con P.IVA nel footer. Vedi ROADMAP → Fase Legale (gated dal commercialista per il regime IVA).

### PAY-4 — Webhook: non gestisce expired/refunded, non verifica paid/amount, no dedupe event.id
**Origine:** ereditato-confermato (P6). **Sforzo:** S.
**Evidenza:** `webhooks/stripe/route.ts:73-76` ignora ogni evento diverso da `checkout.session.completed`; nessun check `payment_status === "paid"` né `amount_total`; unica idempotenza = status del dossier, nessuna dedupe su `event.id`.
**Impatto:** un rimborso (`charge.refunded`) non aggiorna il DB; una sessione scaduta lascia record orfani; senza check `amount_total` un importo manomesso non verrebbe rilevato [INFERENZA: basso rischio con Checkout hosted].
**Rischio se ignorato:** stato pagamenti divergente dalla realtà Stripe; refund non riconciliati.

### AI-2 — Infografica: palette inventata dal modello invece dei colori reali
**Origine:** ereditato-confermato (P13). **Sforzo:** S.
**Evidenza:** `generate-dossier.ts:456` per l'infografica dice "Show about 15-18 typical colors for ${seasonName}" senza passare nome+hex; lookbook (`:534-563`) e guardaroba (`:616-647`) invece passano `formatColors` = `name (hex)` dai colori curati in `palettes.json`.
**Impatto:** l'infografica è la modalità **default** e il deliverable principale: i suoi colori sono inventati dal modello e possono differire da quelli mostrati sul sito → incoerenza interna al prodotto, percepibile dal cliente.
**Rischio se ignorato:** dossier incoerenti → refund, sfiducia.
**Azione:** passare nome+hex reali della palette anche al prompt infografica, come già fanno le altre due modalità.

---

## Media

### SEC-3 — Token API Vercel in chiaro in `scratch/`, non tra i secret ruotati
**Origine:** nuovo. **Sforzo:** S. **Evidenza:** `scratch/fix_env_api.mjs:13` contiene un token API Vercel (`vca_...`); non risulta tra i secret ruotati a maggio. Anche il webhook secret LS compare in vari script scratch. **Impatto:** un token Vercel valido consente operazioni sul progetto (env, deploy). **Azione:** revocare/rigenerare il token su Vercel; rimuovere gli script scratch con secret.

### PAY-5 — Race TOCTOU sull'idempotenza webhook → doppia pipeline
**Origine:** nuovo. **Sforzo:** S. **Evidenza:** `webhooks/stripe/route.ts:131-164` fa read-status poi update senza compare-and-set (manca `.eq("status","pending_payment")` nell'update). **Impatto:** due delivery concorrenti possono avviare entrambe la pipeline → doppio costo fal + doppia email. [INFERENZA: probabilità bassa, la 200 immediata via `waitUntil` riduce i re-invii.] **Azione:** UPDATE condizionale sullo status (atomic compare-and-set) come lock.

### AI-3 — Confidence mai usata come gate; nessuna valutazione qualità-foto/capelli tinti
**Origine:** ereditato-confermato (P12). **Sforzo:** M. **Evidenza:** `classify.ts:38-96` non valuta luce/filtri/trucco; capelli solo "natural color?" (`:42`) senza istruzioni per capelli tinti; `confidence` (`:70`) usata solo come display in `admin/AdminTable.tsx:115-117`, mai come soglia in `src/`. **Impatto:** una foto filtrata/truccata produce un dossier €29 potenzialmente sbagliato senza warning. **Azione:** campo `photoQuality` nel JSON + istruzioni per capelli tinti (giudicare da radici/sopracciglia/incarnato) + soglia confidence sotto cui non consegnare (email "carica foto in luce naturale" + rigenerazione gratuita).

### GDPR-1 — Cron retention gira 1×/giorno e fallisce in silenzio
**Origine:** ereditato-confermato (P18). **Sforzo:** S. **Evidenza:** `vercel.json:6` `"0 3 * * *"`; `cron/delete-old-photos/route.ts:21` RETENTION_HOURS=24 → worst case ~48h, media ~36h, vs "entro 24 ore" (`it.json:776`). Errori parziali → HTTP 200 `success:true` (`:160-168`); 500 solo su crash totale. Nessun alert. **Impatto:** promessa di retention non mantenuta + fallimenti invisibili. **Azione:** cron ogni ora; alert (email/Sentry) su errori parziali; allineare la promessa o l'implementazione.

### SEC-4 — Backdoor admin hardcoded + log della allowlist a ogni check
**Origine:** ereditato-confermato (P17 parziale). **Sforzo:** S. **Evidenza:** `lib/admin.ts:22-25` aggiunge sempre `gamatig@gmail.com` agli admin, in *qualsiasi* ambiente; `:30` logga email utente + intera lista admin a ogni check. **Impatto:** admin non revocabile via config; PII/target nei log Vercel. **Azione:** rimuovere il fallback hardcoded (usare solo `ADMIN_EMAILS`); togliere il log della allowlist.

### SEC-5 — Pagina admin: `notFound()` ingoiato dal try/catch → 500 con stack al client
**Origine:** ereditato-confermato/aggravato (P17 + NUOVO). **Sforzo:** S. **Evidenza:** `admin/page.tsx:29-31` (`notFound()` dentro il try iniziato a `:23`) + catch `:207-234` che renderizza message+stack al client (`:218-221`). **Impatto:** un utente autenticato non-admin che visita `/[lang]/admin` riceve una 500 con stack e path interni invece del 404 previsto → rivela l'esistenza della pagina. È anche il bug ESLint bloccante `react-hooks/error-boundaries`. **Azione:** spostare `notFound()`/gate fuori dal try; non renderizzare JSX dentro try/catch; non esporre stack al client.

### WEB-1 — `/[lang]/preview` orfana ma viva e indicizzabile in produzione
**Origine:** nuovo. **Sforzo:** S. **Evidenza:** `preview/page.tsx:48-357` landing alternativa "Cinematic Hero" scartata; nessun link in ingresso (grep 0), **nessun gate NODE_ENV né noindex** → raggiungibile e indicizzabile su cromeastudio.com/it/preview. **Impatto:** contenuto duplicato per la SEO, superficie non presidiata. **Azione:** eliminare la rotta (e i componenti usati solo da lei) o gate-arla dev-only + noindex, come `/ux-preview`.

### OPS-1 — Resend: successo simulato se manca `RESEND_API_KEY`
**Origine:** nuovo. **Sforzo:** S. **Evidenza:** `resend.ts:21-33` se manca la chiave ritorna **successo simulato** e stampa l'intera email nei log. **Impatto:** in prod senza chiave, ricevute e notifiche "sembrano" inviate ma non partono; PII (email completa) nei log. **Azione:** in produzione fallire esplicitamente (o alert) se la chiave manca; non loggare il corpo email.

### SEC-6 — Nessun rate limit su `analyzePhoto` e creazione checkout
**Origine:** ereditato-confermato (P20). **Sforzo:** S. **Evidenza:** `dashboard/actions.ts:40-256` non chiama `rateLimit`; il limiter (`src/lib/rate-limit.ts`, in-memory per-istanza) è usato solo su magic-link/verify-otp. **Impatto:** un utente autenticato può creare N dossier `pending_payment` con N upload da 10MB → costi storage/DB. **Azione:** applicare il limiter (o Upstash Redis condiviso) su `analyzePhoto` e creazione checkout.

### AI-4 — Nessun QA post-generazione dell'immagine
**Origine:** ereditato-confermato (P15). **Sforzo:** S. **Evidenza:** `pipeline.ts:80-122` fa download→upload→`completed` senza alcun check su testo renderizzato, volto, palette. **Impatto:** GPT-Image sbaglia spesso testi/layout; un output degradato arriva al cliente senza filtro. **Azione:** una chiamata vision economica post-generazione che valuti leggibilità testo + coerenza → 1 retry sotto soglia prima della consegna.

---

## Bassa

### AI-5 — Ordine campi JSON classificazione anti-chain-of-thought
**Origine:** ereditato-confermato (P11). **Sforzo:** S. **Evidenza:** `classify.ts:68-71` mette `subSeason` come **primo** campo del template JSON, prima di `confidence`/`analysis`/`reasoning`. Il modello si impegna sulla stagione prima di analizzare. **Azione (costo zero):** riordinare lo schema (analysis → reasoning → confidence → subSeason).

### PROD-1 — Copy prodotto Stripe promette 3 modalità, ne consegna 1
**Origine:** nuovo/confermato dal proprietario. **Sforzo:** S. **Evidenza:** `stripe.ts:53` descrive "Dossier ... con palette, guardaroba e lookbook", ma ogni acquisto genera **1** immagine della modalità scelta. **Decisione proprietario (2026-07-10):** il comportamento (1 modalità) è corretto → è il **copy** a essere fuorviante. **Azione:** riscrivere la descrizione prodotto Stripe e ogni copy correlato per riflettere "una modalità a scelta". (Le altre 2 modalità come upsell/bundle sono un'opzione di crescita, vedi ROADMAP Fase Crescita.)

### PAY-6 — Stripe apiVersion 2023-10-16 `as any`; prezzo duplicato in ~10 punti
**Origine:** ereditato-confermato/sottostimato (P8/P10). **Sforzo:** S. **Evidenza:** `stripe.ts:12` e `webhooks/stripe/route.ts:31` `apiVersion:"2023-10-16" as any` (SDK v22 tipizza un'API 2025-xx → divergenza tipi/runtime). Il valore 2900/€29 è duplicato in ~10 punti: `stripe.ts:55`, `actions.ts:206`, `webhooks/stripe/route.ts:178`, `PhotoUploader.tsx:208-211`, `terms/page.tsx:21`, `(marketing)/page.tsx:63`, `opengraph-image.tsx:108`, `messages/{it,en,es}.json`. **Azione:** aggiornare apiVersion coerente con l'SDK (rimuovere `as any`); centralizzare `PRICE_CENTS` con derivazioni per display.

### PAY-7 — `payment_method_types:["card"]` blocca i payment methods dinamici
**Origine:** ereditato-corretto (P9). **Sforzo:** S. **Evidenza:** `stripe.ts:46` hardcoda `["card"]`. **Correzione al finding originale:** NON blocca Apple/Google Pay (che compaiono come wallet della modalità card); blocca i **dynamic payment methods** gestiti da Dashboard (Link, Klarna, iDEAL, Bancontact…). **Azione:** rimuovere `payment_method_types` e usare i metodi dinamici da Dashboard → più opzioni di pagamento, potenziale +conversione.

### PAY-8 — `stripe_checkout_session_id` contiene l'URL, non il `cs_...`
**Origine:** ereditato-confermato (P5). **Sforzo:** S. **Evidenza:** `dashboard/actions.ts:209` salva `session.url` intera nella colonna del session id. **Impatto contenuto:** il webhook riconcilia per `dossier_id`, ma la colonna "mente" e impedisce un lookup diretto per session id. **Azione:** salvare `session.id` (`cs_...`).

### SEC-7 — CSP con `unsafe-inline`/`unsafe-eval` + whitelist morta lmsqueezy.com
**Origine:** ereditato-confermato (P21/P25). **Sforzo:** S (rimozione LS) + M (CSP nonce). **Evidenza:** `next.config.ts:17,21` contiene entrambi `unsafe-inline`/`unsafe-eval` e la whitelist `https://lmsqueezy.com` ormai morta. **Azione:** rimuovere lmsqueezy.com subito; migrare a CSP nonce-based (sforzo M) come hardening successivo.

### OPS-2 — Sentry senza upload source map
**Origine:** ereditato-confermato (P22). **Sforzo:** S. **Evidenza:** `next.config.ts:60-62` commento esplicito "nessun authToken → upload source map saltato". **Impatto:** stack client minificati → debug in prod quasi cieco lato browser. **Azione:** configurare `SENTRY_AUTH_TOKEN` per l'upload.

### GDPR-2 — GA4 `purchase` forgiabile; dossier pending invisibili/immortali
**Origine:** nuovo. **Sforzo:** S. **Evidenza:** `PhotoUploader.tsx:195-218` traccia l'acquisto sul solo query param `payment_success=true` senza conferma server → revenue analytics gonfiabili. `dashboard/page.tsx:96-104` filtra solo completed/processing/generating/failed → i checkout abbandonati lasciano record `dossiers`+`payments` orfani che l'utente non vede né elimina. **Azione:** tracciare `purchase` solo dopo conferma server; job di cleanup dei `pending_payment` scaduti.

### CODE-1 — Duplicazioni e modo "full" fantasma
**Origine:** ereditato-confermato (P26). **Sforzo:** M. **Evidenza:** 5 modi di ottenere un admin client (`lib/admin.ts:39`, `lib/supabase/admin.ts:12` + 3 inline: webhook `:35-43`, cron `:51-53`, `deleteAccount` `actions.ts:534-537`); 2 endpoint di status (`api/dossier-status/[id]` morto vs `checkDossierStatus` vivo); upload-retry duplicato (`actions.ts:156-176` vs `pipeline.ts:89-111`); modo `"full"` (`actions.ts:193`, `webhook:88`, `trigger-dossier:99`) non nell'enum → degrada silenziosamente a infografica (`pipeline.ts:76`). **Azione:** un solo `createAdminClient` typed; eliminare la route status morta; helper upload condiviso; rimuovere il modo "full".

### CODE-2 — Lint rosso, bug JSX-in-try/catch, setState in effect, example fuorviante
**Origine:** ereditato-confermato. **Sforzo:** S (scratch) + M (fix reali). **Evidenza:** `npm run lint` = 75 errori (la maggior parte `require()` in `scratch/` — vanno esclusi da ESLint); errori reali: JSX-in-try/catch admin (=SEC-5), vari `react-hooks/set-state-in-effect` (NavBar, PhotoUploader, ProgressStepper, CinematicHero, DossierReadyToast), `no-explicit-any` in webhook/stripe/resend, `LocaleSwitcher` immutability. `tsc --noEmit` invece è **pulito** e `npm run build` **passa**. `.env.local.example` elenca var morte e omette var obbligatorie (vedi ARCHITECTURE). **Azione:** escludere `scratch/` da ESLint; correggere gli errori reali file per file; riscrivere `.env.local.example`.

### REPO-1 — File spuri tracciati in git, incl. dato personale reale
**Origine:** nuovo. **Sforzo:** S. **Evidenza:** tracciati in git nella root: `dossier_result.json` (classification_result reale = descrizione fisica di una persona), `AUDIT.md` (vecchio, 15/05, obsoleto), `Armocromia-Opus-Handover.md` (13/05, obsoleto), `test-admin.js`, `lint-output.txt`, `TODO.md`, e vari screenshot `.png` (~10MB). `docs/Cromea-Landing-Standalone.html` pesa 6,1MB. **Azione:** rimuovere dal repo (git rm) i file spuri; `dossier_result.json` è prioritario (dato personale). Nota: questo `AUDIT.md` **sostituisce** il vecchio omonimo in root.

---

## Punti di forza — NON toccare nei refactoring

1. **RLS su tutte e 4 le tabelle**, scoping `auth.uid()` su ogni operazione, **zero policy per anon**. Isolamento utenti verificato.
2. **`payments` write-protected** (solo service-role scrive lo stato) e **`audit_log` con RLS on + zero policy + no FL su user_id** (sopravvive all'erasure). Pattern corretti.
3. **Bucket entrambi privati + signed URL 1h ovunque**, nessun `getPublicUrl`.
4. **Le 3 factory service-role sono `server-only`**; **`trigger-dossier` con `timingSafeEqual` + fail-closed**; **dev-login con doppio gate** `NODE_ENV`+`VERCEL_ENV`.
5. **Webhook Stripe** verifica firma + ownership dossier↔metadata + idempotenza (da irrobustire con PAY-5, ma la base è solida).
6. **Estensione file derivata dal MIME validato**, non dal filename utente.
7. **Economia unitaria eccellente** (~96% margine): pagamento pre-generazione + demo a costo zero via template pinnato. Non reintrodurre costi AI nel flusso demo o pre-pagamento.
8. **Testimonianze nascoste deliberatamente** finché non ci sono recensioni reali (corretto per la normativa UE). Non riattivare con placeholder.
9. **Classificazione con 3 retry interni** + validazione Zod a enum chiusi.
10. `tsc` pulito e `build` verde: la base TypeScript è sana.
