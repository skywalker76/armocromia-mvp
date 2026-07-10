# ROADMAP — Cromea Studio

> **Fonte di verità UNICA della pianificazione**, dal 2026-07-10. Riconcilia il "Piano Level 9" (vault, 2026-07-09) con i finding nuovi di questa sessione. Se il vault e questo file divergono, **vale questo file**. Milestone ordinate per priorità rispetto alla North Star (vedi `NORTH_STAR.md`), non in astratto. Ogni ID rimanda alla scheda eseguibile in `BACKLOG.md`.
>
> **Principio di ordinamento:** prima si ferma l'emorragia (dati esposti, ordini persi), poi si mette in sicurezza il denaro e la qualità del prodotto, poi la rete di sicurezza (CI), poi il legale (gated), infine la crescita. "Portare il codice da 8 a 9 vale meno che portare la crescita da 4 a 9": l'effort segue l'impatto.
>
> **Vincoli permanenti:** mai push su `main` · branch + Vercel Preview · gate `tsc`+`lint`+`build`+smoke · Stripe in sandbox fino al via del commercialista · migration solo additive. Dettaglio in `CLAUDE.md`.

## Sequenza delle milestone

| # | Milestone | Blocca? | Sblocca | Sforzo |
|---|---|---|---|---|
| **M0** | Sicurezza d'emergenza | **Eseguibile SUBITO** | Riduce il rischio #1 (dati) prima di ogni altro lavoro | S |
| **M1** | Blindare il denaro | No (sandbox) | Go-live affidabile; zero ordini persi | M-L |
| **M2** | Qualità dossier & continuità AI | No | Meno refund, prodotto coerente, pipeline non deprecata | M |
| **M3** | Sicurezza & GDPR (resto) | No | Chiusura debito sicurezza/privacy | M |
| **M4** | CI & igiene codice | No | Rete di sicurezza per tutte le milestone | M |
| **M5** | Legale & fiscale | **Gated (commercialista)** | Passaggio a live-mode | M |
| **M6** | Motore di crescita | No | Acquisizione + attivazione + revenue | L |

M0→M1→M2 sono la spina dorsale e vanno in quest'ordine. M3 e M4 possono procedere in parallelo a M2. M5 è pronto nei contenuti ma pubblicabile solo dopo il commercialista. M6 parte quando la spina dorsale è stabile.

---

## M0 — Sicurezza d'emergenza (ESEGUIBILE SUBITO)

**Obiettivo verificabile:** nessuna credenziale di produzione viva raggiungibile da repo/disco; nessun dato personale reale in git; nessun dossier pagato reso irrecuperabile dal cron.
**Perché prima di tutto:** sono azioni a rischio-codice ~zero (ops + cancellazioni) che chiudono le esposizioni peggiori. Non dipendono dal fisco né dalla sandbox.
**Cosa sblocca:** permette di lavorare su tutto il resto senza una falla aperta sui dati di prod.
**Dipendenze:** accesso ai dashboard Supabase e Vercel (azione del proprietario).

- **SEC-1** — Ruotare la service-role key Supabase (o disabilitare le legacy JWT keys) → aggiornare `SUPABASE_SECRET_KEY` su Vercel prod + locale → rimuovere `scratch/deploy_env.js`. Purge history: opzionale ma raccomandato.
- **SEC-3** — Revocare/rigenerare il token API Vercel in `scratch/fix_env_api.mjs`; rimuovere gli script scratch contenenti secret.
- **PAY-3** — Escludere dal cron GDPR le foto dei dossier non `completed` (o non ancora riconciliati) → un pagato-ma-fallito resta recuperabile. **Nota:** questa è l'unica voce M0 che tocca codice applicativo (una condizione nella query del cron): va fatta su branch con il solito gate.
- **REPO-1 (parziale)** — `git rm` di `dossier_result.json` (dato personale reale). Il resto dell'igiene repo va in M4.

**Definition of Done M0:** chiave ruotata e vecchia non più valida; token Vercel rigenerato; `dossier_result.json` fuori dal repo; cron che non cancella foto di dossier recuperabili (verificato con un test manuale sullo stato).

---

## M1 — Blindare il denaro (Level 9 Fase 1)

**Obiettivo verificabile:** un pagamento va sempre a buon fine o viene rimborsato; nessun dossier resta bloccato senza intervento; ogni evento Stripe rilevante è gestito e idempotente. Testabile **interamente in sandbox** con Stripe CLI.
**Perché ora:** è il rischio #1 del business (cliente paga, non riceve). La finestra fiscale è il momento ideale per testare i fallimenti senza denaro reale.
**Cosa sblocca:** un go-live di cui ci si può fidare.
**Dipendenze:** M0 fatto (per non lavorare su dati esposti). Nessuna dipendenza fiscale.

- **PAY-1** — Riconciliazione: aggiungere `{CHECKOUT_SESSION_ID}` alla `success_url`; al redirect verificare la sessione Stripe lato server e, se `paid` ma dossier `pending_payment`, avviare la pipeline. + **Cron riconciliatore** (ogni 15 min): dossier `pending_payment` con payment `pending` >20 min → interroga Stripe → riconcilia o marca `expired`. Correggere il commento falso in `pipeline.ts:17-21`.
- **PAY-2** — Recovery pagato-ma-fallito: bottone "Rigenera gratis" (server-gated, nessun nuovo checkout) sui dossier `failed` con payment `completed`; se rifallisce → refund automatico via Stripe API + email di scuse. + **Cron watchdog** server-side: dossier `processing`/`generating` >15 min → 1 retry → se rifallisce `failed` + email admin/utente.
- **PAY-4** — Webhook hardening: gestire `checkout.session.expired` e `charge.refunded` (→ `payments.refunded`); verificare `payment_status==="paid"` + `amount_total`; dedupe su `event.id`.
- **PAY-5** — Idempotenza atomica: UPDATE condizionale sullo status come compare-and-set.
- **PAY-8** — Salvare il vero `cs_...` nella colonna session id.
- **AI-1** *(candidato ad anticipo qui)* — Migrare l'endpoint di classificazione fal deprecato: è un rischio di **continuità** (se fal lo dismette, la pipeline muore). Se la finestra di rischio preoccupa, farlo in M1 invece che M2.

**Definition of Done M1:** con Stripe CLI si simulano webhook perso, pagamento scaduto, refund, generazione fallita — e in ogni caso il sistema converge a uno stato corretto (dossier consegnato, `expired`, o refund) senza intervento manuale. Nessun secondo addebito per riprovare.

---

## M2 — Qualità dossier & continuità AI (Level 9 Fase 1.5)

**Obiettivo verificabile:** il dossier consegnato è coerente coi colori reali della palette, non viene consegnato quando la foto è inadeguata, e la pipeline non dipende da un endpoint deprecato.
**Perché ora:** il dossier *è* il prodotto — la sua qualità decide refund e passaparola.
**Cosa sblocca:** riduzione refund → sostenibilità del passaparola (motore di M6).
**Dipendenze:** nessuna dura; beneficia di M1 (recovery) per gestire i casi sotto-soglia.

- **AI-1** — Migrare da `fal-ai/any-llm/vision` a un endpoint vision supportato (se non già anticipato in M1).
- **AI-2** — Passare nome+hex reali della palette al prompt infografica (come lookbook/guardaroba).
- **AI-3** — Rubrica confidence + soglia operativa; valutazione qualità-foto (`photoQuality`); gestione capelli tinti. Sotto soglia → non consegnare, email + rigenerazione gratuita.
- **AI-4** — QA vision post-generazione (leggibilità testo + coerenza) → 1 retry sotto soglia prima della consegna.
- **AI-5** — Riordinare i campi JSON della classificazione (analysis prima di subSeason). Costo zero.
- **PROD-1** — Riscrivere la descrizione prodotto Stripe e i copy correlati: "una modalità a scelta", non tre insieme.

**Definition of Done M2:** su un set di foto di test (buone, filtrate, capelli tinti) la classificazione produce confidence coerenti e blocca i casi sotto soglia; l'infografica mostra gli hex esatti di `palettes.json`; nessun call site fal usa un endpoint deprecato.

*(Strategico, dopo il go-live — non in M2:* architettura "dossier 2.0" ibrida: layout/testi/swatch renderizzati dal codice, l'AI genera solo i ritratti. Testo perfetto, costi AI ridotti, QA banale. Vedi nota in fondo.)*

---

## M3 — Sicurezza & GDPR, resto (Level 9 Fase 2)

**Obiettivo verificabile:** nessuna rotta di auto-login pubblica; admin non esposto; retention foto reale ≤25h e allarmata; endpoint costosi con throttle.
**Cosa sblocca:** chiusura del debito sicurezza/privacy → prerequisito di serenità per il go-live.
**Dipendenze:** indipendente; parallelizzabile con M2/M4.

- **SEC-2** — `/demo-access`: rimuovere (scopo decaduto) o gate secret + rate limit + demo read-only.
- **SEC-4** — Rimuovere backdoor admin hardcoded; togliere il log della allowlist.
- **SEC-5** — Admin page: spostare `notFound()` fuori dal try/catch; niente stack al client (risolve anche il bug ESLint bloccante).
- **GDPR-1** — Cron retention ogni ora; alert su fallimento; allineare la promessa "24h".
- **SEC-6** — Rate limit su `analyzePhoto` + creazione checkout (valutare Upstash Redis condiviso).
- **OPS-1** — Resend: fallire/allertare se manca la chiave in prod; non loggare il corpo email.
- **WEB-1** — `/[lang]/preview`: eliminare o gate dev-only + noindex.
- **SEC-7 (parziale)** — Rimuovere subito la whitelist morta lmsqueezy.com dalla CSP (il nonce-based CSP è hardening successivo).
- **GDPR-2** — `purchase` GA4 solo dopo conferma server; cleanup dei `pending_payment` scaduti.

**Definition of Done M3:** nessuna rotta espone auto-login o stack; retention verificata ≤25h con alert testato; `analyzePhoto` throttlato.

---

## M4 — CI & igiene codice (Level 9 Fase 4)

**Obiettivo verificabile:** ogni PR passa per una CI che esegue tsc+lint+build; lint verde; zero duplicazioni note; repo pulito.
**Perché ora:** la CI è la rete che rende sicure tutte le altre milestone. Idealmente **la si introduce presto** (anche prima di M2/M3) perché protegge tutto il resto — ma richiede prima di sistemare il lint (CODE-2) per non nascere rossa.
**Cosa sblocca:** velocità e sicurezza di ogni modifica futura.
**Dipendenze:** CODE-2 (escludere scratch + fix errori reali) prima di rendere la CI bloccante.

- **CODE-2** — Escludere `scratch/` da ESLint; correggere gli errori reali (SEC-5, setState-in-effect, no-explicit-any, LocaleSwitcher); riscrivere `.env.local.example`.
- **CI** — GitHub Action: tsc + lint + build su ogni PR (bloccante dopo CODE-2).
- **CODE-1** — Dedup: un solo `createAdminClient` typed; eliminare la route status morta; helper upload condiviso; rimuovere il modo "full".
- **SEC-7 (resto)** — CSP nonce-based (togliere unsafe-inline/eval).
- **OPS-2** — Sentry source map upload.
- **PAY-6** — Centralizzare `PRICE_CENTS`; aggiornare apiVersion Stripe (togliere `as any`).
- **PAY-7** — Rimuovere `payment_method_types:["card"]` → payment methods dinamici.
- **REPO-1 (resto)** — `git rm` degli altri file spuri; alleggerire `docs/`.

**Definition of Done M4:** una PR con un errore tsc/lint/build viene bloccata dalla CI; lint verde; nessuna delle duplicazioni elencate in CODE-1 sopravvive.

---

## M5 — Legale & fiscale (Level 9 Fase 3) — **GATED dal commercialista**

**Obiettivo verificabile:** testi legali coerenti con Stripe PSP pubblicati; P.IVA nel footer; regime IVA/OSS deciso; go-live checklist Stripe completata.
**Perché gated:** i testi IVA e la P.IVA dipendono dalle decisioni del commercialista. I contenuti si preparano **ora**; la pubblicazione avviene al via.
**Cosa sblocca:** il passaggio a **live-mode** (= cambio di 3 variabili d'ambiente).
**Dipendenze:** decisione commercialista.

- **LEGAL-1** — Riscrivere Privacy/Terms (IT/EN/ES): Stripe come PSP (non più LS MoR), trattamento IVA secondo regime scelto. Preparare i testi ora.
- **Domande per il commercialista** (già preparate): forfettario vs ordinario; una sola registrazione **OSS union** copre i 27 stati UE (poi Stripe Tax calcola/raccoglie); soglia €10k intra-UE; obbligo esposizione P.IVA.
- **Stripe:** attivare `automatic_tax` (sicuro anche prima delle registrazioni: non raccoglie finché non c'è una registrazione attiva); go-live checklist ufficiale.
- **Piano B documentato:** se il fisco pesa troppo → ritorno a un MoR (Paddle). Il checkout è isolato in `lib/stripe.ts`: swap economico.

**Definition of Done M5:** al via del commercialista, la pubblicazione dei testi + attivazione tax + switch env porta il sito in live-mode con termini veri.

---

## M6 — Motore di crescita (Level 9 Fase 5)

**Obiettivo verificabile (AARRR):** 500 visite organiche/mese entro 90gg; conversione visita→email ≥5%, visita→acquisto ≥1%; ≥5 recensioni reali live; funnel GA4 misurato end-to-end.
**Perché dopo la spina dorsale:** ha senso portare traffico solo quando pagamenti e qualità sono blindati (altrimenti si scala il refund).
**Cosa sblocca:** la validazione del canale di vendita = obiettivo a 6 mesi della North Star.
**Dipendenze:** M1+M2 stabili. Multi-currency (per revenue globale) dipende da M5.

- **Acquisition:** 12 landing per sotto-stagione + articoli pillar SEO (IT poi ES); fix OG/hreflang; Google Search Console; esecuzione della social strategy (vault `Armocromia-Social-Strategy`).
- **Activation:** quiz "Scopri la tua stagione in 2 minuti" (lead magnet + try-before-buy); anchoring prezzo "consulente €150-300 vs Cromea €29"; programma founding users → ≥5 recensioni reali → riattivare Testimonials (componente già pronto).
- **Revenue:** payment methods dinamici (da M4); **bundle 3 modalità** come upsell (il codice le supporta già — vedi PROD-1); eventi GA4 funnel completi; multi-currency (post-M5).
- **Retention:** email post-dossier (Resend) con consigli d'uso + cross-sell delle altre modalità.
- **Referral:** codice sconto "porta un'amica" (post-fiscale).

**Regola:** recensioni **solo autentiche** (Dlgs 206/2005). Mai riattivare Testimonials con placeholder.

**Definition of Done M6:** funnel misurato, quiz live con cattura email, ≥5 recensioni reali, prime landing indicizzate.

---

## Nota strategica — "Dossier 2.0" (post go-live)

Oggi si chiede a gpt-image-2 di renderizzare ~20 stringhe di testo + 15-18 nomi colore nell'immagine: il text-rendering è il suo punto debole (typo, layout). Architettura target: **layout, testi e swatch renderizzati dal codice** (HTML/canvas→PNG: hex esatti, zero typo, brand identico), **l'AI genera solo i ritratti**. Vantaggi: testo perfetto, costi AI ridotti, QA banale. È un progetto a sé (sforzo L), da affrontare dopo che il go-live è stabile — non prima.
