@AGENTS.md

# CLAUDE.md — Regole operative di Cromea Studio

> Istruzioni permanenti per qualsiasi agente (Claude o altro) che lavora su questo repo. Non sono descrittive: sono vincolanti. Aggiornato 2026-07-10.

## PRIMA di toccare codice — obbligatorio

1. Leggi **`docs/NORTH_STAR.md`** (cos'è il progetto, dove deve andare, non-obiettivi) e **`docs/ROADMAP.md`** (cosa fare e in che ordine — fonte di verità unica della pianificazione).
2. Per un task specifico, leggi la sua scheda in **`docs/BACKLOG.md`** (stesso ID di `docs/AUDIT.md`): contiene file da toccare, criteri di accettazione e "cosa NON toccare".
3. Ricorda l'avviso di `AGENTS.md`: **questa è Next.js 16, con breaking changes** rispetto al tuo training. Leggi la guida pertinente in `node_modules/next/dist/docs/` prima di scrivere codice Next. Rispetta i deprecation notice.

## Regole di ingaggio (non negoziabili)

1. **MAI push diretto su `main`.** `main` auto-deploya su produzione (www.cromeastudio.com). Ogni lavoro su branch `feat/*`, `fix/*`, `docs/*`, `chore/*`.
2. **Vercel Preview** per ogni branch: testa lì. **Non fare merge senza approvazione del proprietario.**
3. **Gate di merge (tutti e 4):** `npx tsc --noEmit` (deve essere pulito) · `npm run lint` (0 errori) · `npm run build` (deve passare) · smoke test manuale sulla Preview del flusso toccato.
4. **Stripe resta in SANDBOX** finché il commercialista non dà il via al live-mode. La finestra fiscale è il momento per testare i fallimenti di pagamento senza denaro reale.
5. **Migration DB solo ADDITIVE** (niente drop/rename di colonne o policy in questa fase). Le migration vivono in `supabase/migrations/`, in ordine cronologico, mai alterate a posteriori.
6. **Nessun secret nel codice o negli script committati.** I secret stanno nelle env (Vercel + `.env.local` locale, gitignored). Se trovi un secret nel sorgente, è un incidente: segnalalo, non committarlo.

## Stato dei gate oggi (2026-07-10)

- `tsc --noEmit`: **pulito**. Mantienilo così.
- `npm run build`: **passa**. Mantienilo così.
- `npm run lint`: **75 errori** (in gran parte `require()` in `scratch/`, più errori reali). Vedi `AUDIT.md` CODE-2. Finché il lint non è verde **non** c'è CI: sei tu il gate. Non introdurre nuovi errori lint.
- **Nessuna CI** (`.github/workflows` assente). Introdurla è il task `CI` in `BACKLOG.md` (dopo CODE-2).

## Convenzioni e pattern del progetto

- **i18n:** routing custom `/[lang]/` (IT/EN/ES), **non** next-intl. Usa i pattern `useLocale`/`localePath` esistenti. Le stringhe cliente-facing stanno in `src/messages/{it,en,es}.json` — aggiorna **tutte e tre** le lingue insieme.
- **Server actions:** i file `"use server"` esportano SOLO `async function`. `maxDuration` va sulla `page.tsx`, non sull'action.
- **`router.refresh()` dentro una transition di `useActionState`** viene accodato: per feedback in volo usa un banner client-side, non affidarti al refresh.
- **Client Supabase:** usa `createClient` da `src/lib/supabase/server.ts` (client utente, rispetta RLS) per tutto ciò che riguarda dati dell'utente. Il client **service-role** (`src/lib/supabase/admin.ts`, `server-only`) bypassa la RLS: usalo SOLO in webhook/cron/admin/pipeline e MAI con input utente non validato. Non creare nuove factory admin inline (ne esistono già troppe — vedi CODE-1).
- **RLS è la difesa primaria** dei dati utente ed è corretta: non aggirarla con service-role per comodità. Ogni tabella è scoping `auth.uid()`; ogni bucket è privato con signed URL.
- **Storage:** foto in bucket `photos`, dossier in `dossiers`, entrambi privati. Path `{user_id}/{dossier_id}.{ext}`, estensione derivata dal **MIME validato**, mai dal filename utente. Servi sempre con `createSignedUrl` (scadenza 1h), mai `getPublicUrl`.
- **Pagamento pre-generazione:** si incassa prima di chiamare fal.ai (protegge il margine ~96%). Non introdurre chiamate AI nel flusso pre-pagamento o nella demo (la demo usa un template pinnato a costo zero).

## Gestione errori

- **Non ingoiare gli errori in un HTTP 200.** Un cron/endpoint che fallisce parzialmente deve segnalarlo (stato != 200 e/o alert), non fingere successo (vedi GDPR-1, OPS-1 in AUDIT).
- **Non renderizzare stack/message al client.** Logga server-side; al client va un messaggio generico (vedi SEC-5).
- **Non costruire JSX dentro try/catch** (React non lo cattura; è anche un errore ESLint bloccante). Metti i gate/`notFound()` prima del try.
- Il webhook Stripe deve restare **idempotente** e verificare la firma. La pipeline gira in `waitUntil`: ogni fallimento va reso recuperabile (retry/watchdog), mai silenzioso.

## Come testare le modifiche

- **Sempre** in sandbox Stripe. Usa **Stripe CLI** per simulare eventi (`checkout.session.completed`, `.expired`, `charge.refunded`, e replay dello stesso `event.id` per l'idempotenza).
- **Flussi di pagamento:** verifica in Preview i percorsi anomali, non solo l'happy path — webhook perso, pagato-ma-fallito, refund. Sono il rischio #1 del business.
- **RLS:** `npm run test:rls` (smoke test cross-user delete). Se tocchi le policy, estendi questo test.
- **fal.ai:** in dev puoi mockare la pipeline; verifica sempre il parsing JSON + Zod dopo aver toccato `classify.ts`.
- **i18n:** verifica la rotta nelle 3 lingue.

## Trappole note (non ripetere questi errori)

- **`main` = produzione.** Un push accidentale deploya. È già successo che il webhook puntasse al progetto Vercel **duplicato** (`armocromia-mvp.vercel.app`) invece di cromeastudio.com: verifica sempre di stare guardando il progetto giusto.
- **`.env.local.example` è fuorviante:** elenca var morte (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `OPENAI_API_KEY`) e ne omette di obbligatorie. Il set reale è in `docs/ARCHITECTURE.md`.
- **Modo dossier `"full"`:** non è una modalità reale, degrada a `infografica`. Non usarlo.
- **`fal-ai/any-llm/vision` è DEPRECATO** (classify.ts): va migrato (AI-1). Non costruirci sopra.
- **La memoria/documentazione storica può essere sbagliata:** la nota "Supabase key non esposta" del 30/05 era falsa (la chiave era ed è in git history). Verifica sempre contro il codice/realtà attuale prima di dare per buono un fatto.
- **PowerShell è la shell primaria** (Windows). Attenzione alle differenze di sintassi rispetto a bash.

## Dopo aver finito un task

- Aggiorna lo stato nella scheda `docs/BACKLOG.md` (TODO → DONE) e, se cambia la direzione, riporta la modifica in `docs/ROADMAP.md` (che resta la fonte di verità).
- Se scopri un fatto non ovvio e persistente sul progetto, salvalo nella memoria persistente dell'agente (vedi `C:\Users\gamat\.claude\projects\...\memory\`), non solo nei doc di sessione.
