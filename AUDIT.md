# Armocromia MVP — Audit pre-produzione

**Data:** 2026-05-15
**Auditor:** Silicon Valley senior team (UX/UI, perf, a11y, security, code, SEO)
**URL testato:** https://armocromia-mvp-nine.vercel.app
**Scope:** aree pubbliche (landing, /auth/login, /privacy, /terms) — flussi autenticati non testati
**Verdetto sintetico:** **NON pronto per produzione**. MVP solido nelle fondamenta, ma con **6 blocker P0** che vanno chiusi prima di andare live.

---

## 🎯 Executive summary

Armocromia ha un'idea forte, una landing curata e un'ingegneria sottostante competente (Supabase RLS, server actions tipizzate, TypeScript strict, PWA configurata). Il problema **non è l'idea né il codice di base** — è che mancano i guardrail di "pubblicazione": link rotti visibili, contrasti sotto WCAG AA, social sharing senza preview, zoom mobile disabilitato, niente sitemap/robots, e qualche fragilità sulla sicurezza che andrebbe sistemata prima di esporre l'app al traffico reale e ai pagamenti.

**Potenziale del prodotto:** alto. La nicchia (armocromia/personal color analysis) ha domanda organica documentata, un competitor leader chiaro (Colorwise, House of Colour), e un modello "one-shot purchase" che evita la trappola subscription. La differenziazione "AI in 90 secondi" è credibile **se la qualità del dossier regge**. La principale incognita non testata in questo audit è proprio la **qualità output dell'AI** — è il vero make-or-break.

**Tempo stimato per andare live in modo decente:** **2-3 giorni di lavoro focalizzato** sui P0. Tutto il resto può seguire post-launch in modalità iterativa.

---

## 🔴 P0 — Blocker per produzione (chiudere prima di pubblicare)

### 1. Link footer rotti — `/privacy` e `/terms` ritornano 404
**File:** `src/app/(marketing)/page.tsx` (footer) — pagine mancanti in `src/app/privacy/` e `src/app/terms/`
**Evidenza:** navigato live, entrambe 404. Sono linkate dal footer di ogni pagina.
**Impatto:**
- 🛑 **GDPR non conforme**: privacy policy obbligatoria per processing di foto biometriche (incarnato/lineamenti → dati personali ex art. 9 GDPR).
- Cookie/consent: il sito usa Supabase auth cookies → serve almeno informativa.
- Trust signal disastroso: un utente che clicca "Privacy" prima di lasciare email vede 404 e abbandona.
- Apple/Google App Store rejection automatica se questo va anche su mobile.
**Fix:** Scrivi le due pagine (anche minimal MD-driven). Includere: titolare trattamento, finalità (analisi cromatica), base giuridica (consenso art. 6.1.a + 9.2.a per biometric), retention dossier/foto, diritti GDPR, contatto DPO/responsabile, riferimento a fal.ai come sub-processor, riferimento a Supabase (EU region — bene).

### 2. Viewport blocca lo zoom utente — viola WCAG 1.4.4
**File:** `src/app/layout.tsx` (viewport meta)
**Evidenza:** `<meta name="viewport" content="...maximum-scale=1, user-scalable=no...">`
**Impatto:**
- Utenti ipovedenti non possono ingrandire la pagina sul telefono.
- Apple iOS lo ignora dal 2019 ma Android e screen-magnifier lo rispettano → barriera reale.
- Audit WCAG/EAA (European Accessibility Act, in vigore 2025) → bloccante per chiunque venda servizi in UE.
**Fix:** Cambia in `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`. Punto. Quel `maximum-scale=1, user-scalable=no` non risolve nessun problema reale, e in iOS 26 nemmeno è onorato.

### 3. Contrasti sotto WCAG AA — 12 elementi falliscono
**File:** Tailwind theme + `src/app/(marketing)/page.tsx`
**Evidenza misurata:**
| Elemento | Foreground | Background | Ratio | Richiesto |
|---|---|---|---|---|
| Eyebrow text "Cosa riceverai", "Le 4 stagioni", "Pronto a..." | `#B97A6A` | white | **3.47:1** | 4.5:1 |
| "Powered by Antigravity", "Nessun abbonamento..." | `#B8A090` | white | **2.48:1** | 4.5:1 |
| Button "Primavera/Estate/..." white text | white | `#B97A6A` | **3.47:1** | 4.5:1 |
| Body sottolineato in palette | `#B8A090` | white | **2.48:1** | 4.5:1 |

**Impatto:** illeggibili per ~8% utenti (cataratta, daltonismo, schermi sotto sole). Anche un utente normale farà fatica.
**Fix:**
- Eyebrow + body secondari → scurire a `#7A4F3F` (4.7:1) o portare a font-weight 600 + size 14px (entra in "large text" 3:1).
- Pulsanti stagione → background scurire a `#8A5443` (4.6:1 con white). Oppure mantenere il colore brand ma aggiungere `text-shadow: 0 1px 0 rgba(0,0,0,0.3)` (hack, sub-ottimale).
- Validare ogni token color con [stark.co](https://stark.co) o `npx pa11y` in CI.

### 4. SEO/Social — manca tutto Open Graph, Twitter, JSON-LD, sitemap, robots
**File:** `src/app/layout.tsx`, `public/`
**Evidenza misurata:**
```
ogTitle: undefined
ogImage: undefined
ogDescription: undefined
twitterCard: undefined
canonical: undefined
jsonLd: false
robots.txt: missing
sitemap.xml: missing
```
**Impatto:**
- Quando qualcuno condivide il link su WhatsApp/LinkedIn/Slack/iMessage → preview generica (icona pallida + URL nudo). **Conversion killer**: il prodotto è visivo, l'OG image è la prima impressione.
- Google indicizza chaoticamente senza sitemap; nessun rich snippet senza schema.org `Product`/`Service`.
- Twitter/X card mancante → link condiviso lì appare come testo nudo.
**Fix:** in `src/app/layout.tsx`:
```ts
export const metadata: Metadata = {
  metadataBase: new URL("https://armocromia.app"), // o dominio finale
  title: { default: "Armocromia — I colori che ti fanno splendere", template: "%s | Armocromia" },
  description: "...",
  openGraph: {
    title: "Armocromia — Scopri i colori che ti valorizzano",
    description: "...",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "it_IT",
    type: "website",
  },
  twitter: { card: "summary_large_image", images: ["/og-image.png"] },
  alternates: { canonical: "/" },
};
```
Aggiungi `public/robots.txt` + `app/sitemap.ts` (Next.js App Router supporta nativamente). JSON-LD `Service` schema in `<script type="application/ld+json">`.

### 5. Title duplica "Armocromia" due volte
**File:** `src/app/layout.tsx` + `src/app/(marketing)/page.tsx`
**Evidenza:** `<title>Armocromia — I colori che ti fanno splendere | Armocromia</title>`
**Impatto:** SEO snippet sciatto, segnale di metadata template non configurato bene. Google taglia il titolo dopo ~60 char → "| Armocromia" finale verrà tagliato comunque.
**Fix:** Su `layout.tsx` usa `title.template = "%s | Armocromia"` e `title.default = "Armocromia — I colori che ti fanno splendere"`. Sulla home page non re-impostare il title (lascia il default).

### 6. Sicurezza — findings critici dal code review
(Dettaglio nel report code-review parallelo, riassunto qui)

- **`/api/auth/dev-login`** — endpoint con email hardcoded `gamatig@gmail.com`, gated solo da `NODE_ENV !== "development"`. Se una env var leakate, è backdoor. **Rimuovi prima del go-live oppure aggiungi double-gate (`VERCEL_ENV !== "production"` AND `process.env.DEV_LOGIN_TOKEN === ...`)**.
- **FAL_KEY** senza fail-fast: se manca, crash a runtime con errore generico ("Forbidden") invece di errore chiaro al build/start.
- **Upload foto** — path costruito da `fileExt` lato client senza whitelist. RLS Supabase mitiga, ma aggiungi `allowedExts = ["jpg","jpeg","png","webp"]` esplicito server-side per difesa in profondità.
- **Console.log/warn** in `dashboard/actions.ts` espongono dettagli error in produzione → spostare dietro `if (NODE_ENV === 'development')` o pipe a Sentry.
- **CSP header** mancante → aggiungere in `next.config.ts` con allowlist (`*.supabase.co`, `fal.ai`).
- **RLS DELETE policies**: la migration 002 le aggiunge ma non c'è verifica runtime/test che siano applicate. **Rischio**: se la migration non gira in produzione, gli utenti potrebbero cancellare dossier altrui. Aggiungi test esplicito + assert nella migration.

---

## 🟡 P1 — Importante (fix entro 2 settimane post-launch)

### UX / Conversione
- **CTA "Crea il tuo dossier"** → porta direttamente a `/auth/login` senza spiegare il prezzo. **Friction enorme**: utente non sa quanto costa, non sa cosa riceverà esattamente, ma deve dare l'email. Mostra il prezzo prima del login (anche solo "€X una tantum, soddisfatti o rimborsati").
- **Niente social proof**: "Centinaia di dossier generati" è vago e poco credibile. Sostituire con (a) 3 testimonial con foto + dossier risultante, (b) counter numerico verificabile (`1.247 dossier creati`), (c) trustpilot/Google reviews badge se disponibili.
- **Promessa "Soddisfatti o rimborsati"** ripetuta ma policy refund non spiegata. → Pagina FAQ o sezione dedicata.
- **Tab Primavera/Estate/Autunno/Inverno** — la `aria-selected` non sembra impostata, e il button mostra solo "Primavera" come label senza differenziare quale è attivo (vedi snapshot accessibility).
- **Loader/skeleton** non testato (fuori scope pubblico) — verificare che durante i ~90s di AI ci sia feedback chiaro.
- **Pagina /auth/login** ha title duplicato dalla homepage ("Armocromia — I colori che ti fanno splendere") invece di "Accedi | Armocromia".

### Touch target mobile
- **7 su 19 elementi cliccabili sotto 44×44px** a 375px viewport. Apple HIG e WCAG 2.5.5 (Level AAA) raccomandano min 44×44. Aumentare padding sui bottoni stagione, social link footer, eventuali chip palette.

### Design
- **Eyebrow text 12px** è troppo piccolo (anche risolto il contrasto, resta hard to read). Portare a 13-14px con `letter-spacing: 0.08em` come da convenzione editoriale.
- **CTA bottone primario** — il colore `#B97A6A` (terracotta) è on-brand ma il contrasto su white è borderline (3.47). Considera un primary darker (`#7A4F3F`) e usa il terracotta come accent secondario.
- **Hero "Risultato in meno di 2 minuti"** sotto la CTA: contraddice "~90 secondi" detto poco dopo. Allineare il messaging (suggerirei "in ~90 secondi" ovunque, è più forte).
- **Card stagioni** quasi identiche tra loro nella struttura — opportunità persa: aggiungere una mini-palette di 4 swatch direttamente sulla card, così l'utente vede subito la differenza cromatica.
- **Demo image `dossier-autumn.png`** è l'unico esempio mostrato nell'hero ma poi nella sezione "Quale stagione sei?" appare di nuovo tra le 4 stagioni → ridondante. Mostrare 4 dossier diversi (uno per stagione) costruisce più desiderio.

### Performance
- TTFB 94ms, DOM ready 111ms, load 222ms — **eccellente**. Vercel CDN sta facendo il suo lavoro.
- 8 script tag + 1 immagine main (Next.js bundle splitting OK).
- Service Worker registrato (`/sw.js`) — PWA-ready. Verificare strategy cache (stale-while-revalidate per shell, network-first per dossier).
- Default Next.js scaffold SVG ancora in `public/` (`next.svg`, `vercel.svg`, `window.svg`, `globe.svg`, `file.svg`) → **rimuovere**, sono dead weight indicizzabile.

### Code (dal review parallelo)
- OTP validation regex `^\d{6,8}$` → restringere a `^\d{6}$` (matcha config Supabase corrente).
- Retry fal.ai con linear backoff → passare a exponential + jitter.
- Metadata mancante su `/dashboard` e `/dossier/[id]` (route private) → almeno `robots: { index: false }` per non finire su Google.
- Test suite assente → aggiungere almeno smoke test su server actions critiche (delete authorization).
- `.env.example` mancante → blocca onboarding nuovi dev e self-hosting.

---

## 🟢 P2 — Nice to have

- **JSON-LD structured data**: `Service`, `Product`, `BreadcrumbList`, `FAQPage` (se aggiungi FAQ).
- **Skip-to-content link** per keyboard nav (non vedo `<a href="#main">` nello skeleton).
- **Header semantico**: la landing non ha `<header>` né `<nav>`, solo `<main>` + `<footer>`. Aggiungere logo+nav in header pinned.
- **Microcopy**: "L'AI analizza i tuoi colori" → riformulare "L'intelligenza artificiale ti analizza" è più umano. "Sara, 34 anni" type microcopy nei testimonial.
- **Dark mode**: tema brand è warm/light → opzionale, ma il manifest theme-color è già `#B97A6A`.
- **i18n**: tutto in italiano. Se target è solo IT, ok; altrimenti next-intl + `/en/` route prima di crescere.
- **Pricing page** dedicata + comparison vs competitor (es. "Personal color analysis in salone: €150 · Armocromia: €X").
- **Email transactional design**: l'OTP arriva probabilmente con template Supabase default → personalizzare con brand (Supabase auth → email templates).
- **Account settings**: cambiare email, cancellare account (GDPR right to erasure), scaricare dati.

---

## 💡 Potenziale & raccomandazioni strategiche

### Cosa funziona
1. **Posizionamento chiaro**: "Il personal color analyst in 90 secondi". È specifico, comprensibile, ha un competitor analogico (consulenza in salone €100-300) che è esattamente la giustificazione del prezzo.
2. **Modello business sano**: one-shot purchase invece di subscription → meno friction, meno churn da gestire, viral potential ("guarda il mio dossier" = ad gratuito).
3. **Brand visivo coerente**: palette warm/terracotta, typography editoriale, focus su immagine. Più "Glossier" che "Stripe dashboard". Coerente col target (donne 25-45 con interesse beauty/styling).
4. **Stack tecnico moderno e gestibile**: Next.js App Router + Supabase + fal.ai. Una persona può manutenerlo. Costo infra <€50/mese fino a migliaia di utenti.
5. **Time-to-market basso**: dall'audit, l'MVP è 80% pronto. 2-3 giorni di fix per pubblicare.

### Cosa è rischioso
1. **Qualità AI non auditata**: il valore percepito dipende interamente dalla profondità del dossier. Se il dossier somiglia a uno screenshot di ChatGPT, il prezzo non sta in piedi. **Investire qui prima di scalare il marketing.**
2. **CAC vs ARPU**: con one-shot purchase devi acquisire constantemente. Senza referral loop forte (es. "porta un'amica, sconto 50%") il CAC mangia il margine.
3. **Foto biometriche**: oltre al GDPR, c'è il rischio "Lensa moment" — utenti preoccupati per uso dell'immagine. **Essere espliciti**: "la tua foto viene processata e cancellata entro X giorni, mai usata per training AI".
4. **Difensibilità**: cosa impedisce a un competitor di clonarti in 2 settimane con lo stesso stack? La risposta dev'essere il brand + il dataset di dossier (se permetti opt-in per "case study", costruisci moat) + l'agentic pipeline di analisi (se è proprietaria, non solo un prompt a Gemini).

### Le 3 mosse che farei prima del launch
1. **Chiudere i 6 P0** (1-2 giorni).
2. **Far testare il dossier a 10 amiche/conoscenti del target reale** e raccogliere feedback prima di spendere €1 in ads. Se 8/10 dicono "wow", procedi. Se 5/10, l'AI è il problema da risolvere prima del marketing.
3. **Decidere il pricing chiaramente**: €9 (impulse) o €29 (premium)? Sono due strategie opposte. €19 è il "no-man's land" che non converte. Testare con 2 segmentazioni di traffico.

### Le 3 mosse post-launch (primo mese)
1. **Aggiungere referral**: link tracciato + sconto 30% per chi porta un amico. Armocromia è virale per natura (le persone si confrontano sui colori).
2. **Email post-acquisto**: 7 giorni dopo, "Come stanno andando i colori? Hai trovato un capo perfetto?" → review request + cross-sell (es. "guida shopping per la tua palette" €5).
3. **Affiliate con e-commerce moda** (Yoox, Zalando) — quando consigli "questo colore", linka a item shoppabili. Margine extra senza vendere altro.

---

## 📊 Checklist sintetica go/no-go

| Area | Stato | Pronto per produzione? |
|---|---|---|
| Funzionalità core (testata pubblicamente) | 🟢 Funziona | Sì (con caveat AI quality) |
| Design / Brand | 🟢 Forte | Sì |
| UX flow di conversione | 🟡 Friction su prezzo | Da migliorare ma non bloccante |
| Accessibilità WCAG AA | 🔴 12 fallimenti contrasto + zoom bloccato | **No** |
| SEO / Social sharing | 🔴 Mancano OG, sitemap, robots | **No** |
| Performance | 🟢 TTFB 94ms, load 222ms | Sì |
| Sicurezza | 🟡 6 finding P0/P1 (dettaglio sopra) | **No senza fix dev-login + CSP** |
| Pagine legali (GDPR) | 🔴 404 su privacy + terms | **No, illegale in UE** |
| Code quality | 🟢 TypeScript strict, RLS, error handling | Sì |
| Test coverage | 🔴 Assente | Accettabile per MVP, da fixare in 30gg |

**Decision: NO-GO** finché privacy/terms + viewport zoom + 2 P0 sicurezza non sono chiusi. **48-72h di lavoro al massimo.**

---

## 📁 Allegati screenshot

- `audit-01-landing-desktop.png` — Landing page 1440×900
- `audit-02-landing-mobile.png` — Landing page 375×812
- `audit-03-login.png` — /auth/login 1440×900
