# NORTH STAR — Cromea Studio

> Documento di direzione. **Leggilo prima di toccare codice o roadmap.** Aggiornato: 2026-07-10.
> Ogni agente che riprende il progetto senza accesso alla conversazione originale deve poter capire da qui *cos'è* Cromea, *dov'è* oggi e *dove deve arrivare*. Le date sono assolute. Le inferenze sono marcate `[INFERENZA]`.

## Cos'è (una frase)

Cromea Studio è un SaaS B2C che vende, a **€29 one-shot**, un'analisi armocromia personalizzata generata da AI: l'utente carica una foto del viso, il sistema la classifica in una delle 12 sotto-stagioni e consegna un "dossier" visivo (immagine 4K con palette, consigli colore e — a seconda della modalità scelta — infografica, lookbook o guardaroba).

## Per chi

- **Utente primario:** donna 25-50, mercato IT prima, poi ES/EN. Cerca un'alternativa economica alla consulenza di un armocromista (€150-300).
- **Canale moltiplicatore (B2B2C):** parrucchieri e consulenti d'immagine che usano/rivendono l'analisi ai loro clienti. È il canale di crescita designato, non un prodotto separato.

## Stato attuale (onesto, 2026-07-10)

Il prodotto **funziona end-to-end in produzione** (www.cromeastudio.com): upload → classificazione → pagamento Stripe → generazione dossier → consegna. Il nucleo tecnico è solido dove conta sui dati (RLS Supabase corretta, isolamento utenti verificato) e l'**economia unitaria è eccellente** (costo AI ~€0,40/cliente, margine lordo ~96% su €29).

Ma **non è pronto per il go-live in live-mode**, per tre ordini di motivi:

1. **Affidabilità dei pagamenti fragile.** Il webhook Stripe è l'unico trigger della pipeline; non esiste riconciliazione di fallback. Un cliente può pagare €29 e non ricevere nulla, in silenzio — e dopo 24h la sua foto viene cancellata dal cron GDPR, rendendo il dossier irrecuperabile persino dall'admin. Nessun retry/refund automatico per il caso pagato-ma-fallito.
2. **Debito di sicurezza e legale.** La chiave service-role di produzione è trapelata nella git history e mai ruotata. Le pagine Privacy/Terms dichiarano ancora Lemon Squeezy come Merchant of Record, mentre da 2026-06-16 si incassa con Stripe (che è solo PSP, non MoR): questo sposta l'onere IVA/OSS sul venditore e va allineato prima di vendere in live-mode.
3. **Motore di crescita quasi assente.** Acquisizione organica vicina a zero, nessuna prova sociale attiva (le testimonianze sono nascoste — scelta corretta finché non ci sono recensioni reali), nessun funnel di attivazione (quiz/lead magnet).

Stato di gestione: **finestra di attesa fiscale.** Il go-live live-mode è **gated** dalla decisione del commercialista su regime fiscale + registrazione OSS. Fino ad allora Stripe resta in **sandbox** — il che è la condizione ideale per blindare i pagamenti testando tutti i fallimenti senza denaro reale.

### Scorecard (7 dimensioni, baseline 2026-07-09, riconfermata 2026-07-10)

| Dimensione | Oggi | Target | Note |
|---|---|---|---|
| Affidabilità percorso soldi | 4 | 9 | Nessuna riconciliazione; pagato-ma-fallito non gestito |
| Motore di crescita | 4 | 9 | Acquisition ~0, nessuna proof sociale, nessun lead magnet |
| GDPR / compliance | 5 | 9 | Legale disallineato (LS→Stripe); retention reale ~36-48h vs 24h promesse |
| Sicurezza | 6 | 9 | RLS ottima, ma chiave service-role compromessa viva; demo pubblica |
| Qualità output AI (prompt) | 6.5 | 9 | Palette infografica inventata; confidence mai usata come gate |
| Prodotto/marketing (craft) | 7.5 | 9 | Landing curata; copy prodotto fuorviante |
| Codice & architettura | 8 | 9 | tsc/build verdi; nessuna CI; lint rosso; duplicazioni |

## Stato target e metriche di successo

**"9" significa** (Definition of Done sintetica — dettaglio operativo in `ROADMAP.md`):

- **Soldi:** zero ordini persi possibili. Ogni pagamento riconciliato ≤15 min anche se il webhook non arriva; ogni fallimento AI ha retry gratuito automatico e, se rifallisce, refund automatico; ogni evento Stripe rilevante (paid/expired/refunded) gestito e idempotente.
- **Sicurezza:** nessuna credenziale viva nel sorgente o in history; nessun endpoint costoso senza rate limit; nessuna rotta di auto-login pubblica.
- **GDPR:** retention foto ≤25h verificata e *allarmata* (mai più fallimento silenzioso); testi legali coerenti con Stripe PSP; sub-processor AI (fal.ai) documentati.
- **Codice:** CI verde obbligatoria su ogni PR; zero riferimenti Lemon Squeezy; endpoint di classificazione fal non deprecato.
- **Crescita:** ≥5 recensioni reali pubblicate; quiz di attivazione con cattura email live; funnel GA4 misurato end-to-end.
- **Business:** regime fiscale deciso, testi legali pubblicati, go-live checklist Stripe completata → passaggio a live-mode = cambio di 3 variabili d'ambiente.

**Metrica di business a 6 mesi (obiettivo dichiarato dal proprietario):** validare il canale di vendita (organico + affiliazioni saloni) **senza ads a perdere**. KPI guida: 500 visite organiche/mese entro 90 giorni dal go-live; conversione visita→acquisto ≥1%; ≥5 recensioni reali.

## Il gap, in punti concreti

1. Costruire riconciliazione pagamenti (redirect + cron) e recovery pagato-ma-fallito (retry gratis → refund).
2. Ruotare la chiave service-role compromessa e ripulire i secret da disco/history.
3. Smettere di cancellare la foto sorgente dei dossier non ancora consegnati.
4. Riallineare Privacy/Terms/footer a Stripe PSP (testi pronti ora, pubblicati al go-live).
5. Migrare l'endpoint di classificazione fal deprecato; correggere la palette inventata nell'infografica; usare la confidence come gate di qualità.
6. Rendere la demo non pubblica/non abusabile.
7. Introdurre una CI (tsc+lint+build) come rete di sicurezza per tutto il resto.
8. Attivare il motore di crescita: quiz lead-magnet, anchoring prezzo, recensioni reali, landing SEO per sotto-stagione.

## Non-obiettivi espliciti (confermati dal proprietario, 2026-07-10)

- **Niente app mobile.** Il prodotto è e resta web.
- **Niente marketplace** (né multi-vendor, né community).
- **Niente prodotto che richieda supporto clienti quotidiano.** Il proprietario ha poche ore serali a settimana: ogni scelta deve privilegiare **automazione e zero manutenzione**. Una feature che genera ticket ricorrenti è, di fatto, un anti-obiettivo.
- **Niente subscription come primo passo.** Prima si validano eventuali **upsell one-shot** (es. report esteso, palette stagionale, bundle delle 3 modalità); la subscription si valuta solo dopo.
- **Niente ads a perdere** in fase di validazione: la crescita parte da organico + affiliazioni.

## Il gate fiscale e cosa sblocca

**Blocco:** decisione del commercialista su (a) regime forfettario vs ordinario e (b) registrazione OSS union (una sola registrazione copre tutti i 27 paesi UE; poi Stripe Tax calcola/raccoglie da sé). Domande già preparate in `ROADMAP.md` → Fase Legale.

**Cosa sblocca la decisione:**
- Pubblicazione dei testi legali riscritti (Privacy/Terms/footer con P.IVA).
- Attivazione `automatic_tax` su Stripe (già sicura da attivare *prima* — non raccoglie IVA finché non esiste una registrazione attiva).
- Go-live checklist Stripe → passaggio a live-mode.

**Cosa NON è gated** (si può e si deve fare durante l'attesa, in sandbox): tutto l'hardening pagamenti, la sicurezza, la qualità prompt, la CI e il motore di crescita.

## Regole di ingaggio (non negoziabili)

1. **Mai push diretto su `main`** — auto-deploya su cromeastudio.com. Ogni lavoro su branch `feat/*`, `fix/*`, `docs/*`.
2. **Vercel Preview** per ogni branch: si testa lì, si merge solo dopo verifica.
3. **Gate di merge:** `npx tsc --noEmit` + `npm run lint` + `npm run build` + smoke test manuale.
4. **Stripe resta in sandbox** finché il commercialista non dà il via.
5. **Migration DB solo additive** in questa fase (niente drop/rename).

Vedi anche: `ARCHITECTURE.md` (come funziona oggi), `AUDIT.md` (tutti i finding), `ROADMAP.md` (cosa fare e in che ordine — **fonte di verità unica** della pianificazione), `BACKLOG.md` (task eseguibili), `CLAUDE.md` (regole operative di codice).
