# Armocromia — TODO operativo

Tabella ordinata per **ROI** (impatto alto + sforzo basso prima). Spunta man mano.

**Legenda:**
- **Impatto:** 🔴 critico (blocca launch) · 🟠 alto · 🟡 medio · 🟢 basso
- **Sforzo:** S = <1h · M = 1-4h · L = 4-8h · XL = >1 giorno
- **Tipo:** 🛡️ sicurezza · ⚖️ legale · ♿ a11y · 🎨 design · 📈 conversione · 🔍 SEO · ⚡ perf · 🧹 pulizia · 💻 code

---

## 🚨 SPRINT 0 — Blocker per pubblicare (chiudere TUTTO prima del live)

| # | Cosa fare | Tipo | Impatto | Sforzo | File / Dove |
|---|---|---|---|---|---|
| 1 | **Sbloccare zoom mobile**: rimuovi `maximum-scale=1, user-scalable=no` dal viewport | ♿ | 🔴 | S (5min) | `src/app/layout.tsx` |
| 2 | **Title senza duplicato "Armocromia"**: usa `title.template = "%s \| Armocromia"` + `title.default = "..."` | 🔍 | 🟠 | S (10min) | `src/app/layout.tsx` |
| 3 | **Aggiungi `robots.txt`** | 🔍 | 🟠 | S (10min) | `public/robots.txt` |
| 4 | **Aggiungi `sitemap.ts`** (App Router nativo) | 🔍 | 🟠 | S (15min) | `src/app/sitemap.ts` |
| 5 | **Rimuovi SVG scaffold inutili** (`next.svg`, `vercel.svg`, `window.svg`, `globe.svg`, `file.svg`) | 🧹 | 🟢 | S (5min) | `public/` |
| 6 | **Rendi `/api/auth/dev-login` davvero inerte in prod**: doppio gate `VERCEL_ENV !== "production"` + token env, rimuovi email hardcoded | 🛡️ | 🔴 | S (30min) | `src/app/api/auth/dev-login/route.ts` |
| 7 | **Fail-fast su `FAL_KEY` mancante**: throw chiaro all'init | 🛡️ | 🟠 | S (15min) | `src/lib/fal/client.ts` |
| 8 | **Whitelist estensioni upload foto**: `["jpg","jpeg","png","webp"]` server-side | 🛡️ | 🟠 | S (15min) | `src/app/(app)/dashboard/actions.ts:93` |
| 9 | **OTP regex stringi a 6 cifre**: `^\d{6}$` invece di `^\d{6,8}$` | 💻 | 🟡 | S (5min) | `src/app/api/auth/verify-otp/route.ts` |
| 10 | **Open Graph completo**: ogTitle, ogDescription, ogImage 1200×630, twitter card | 🔍📈 | 🔴 | M (1h, serve creare `og-image.png`) | `src/app/layout.tsx` + `public/og-image.png` |
| 11 | **Console.log/warn solo in dev**: wrappare con `if (NODE_ENV === 'development')` | 🛡️ | 🟡 | M (1h) | `src/app/(app)/dashboard/actions.ts` |
| 12 | **CSP headers** in `next.config.ts`: allowlist supabase + fal | 🛡️ | 🟠 | M (1.5h) | `next.config.ts` |
| 13 | **Contrasti WCAG**: scurire `#B97A6A` → `#7A4F3F` per eyebrow + body; testare ogni token con stark.co | ♿🎨 | 🔴 | M (2h) | Tailwind theme + componenti |
| 14 | **Pagina `/privacy`**: GDPR compliant per foto biometriche (titolare, finalità, base giuridica art. 9, retention, sub-processor fal.ai + Supabase EU, diritti) | ⚖️ | 🔴 | L (4h, va scritta seriamente o farla rivedere) | `src/app/privacy/page.tsx` |
| 15 | **Pagina `/terms`**: Termini di servizio + refund policy chiara ("soddisfatti o rimborsati" = come?) | ⚖️ | 🔴 | L (4h) | `src/app/terms/page.tsx` |
| 16 | **Test RLS DELETE policies**: smoke test che utente A NON può cancellare dossier di utente B | 🛡️💻 | 🔴 | L (3h) | `tests/` (da creare) |

**Stima totale Sprint 0:** ~20-24h (~3 giorni focalizzati).

---

## 🎯 SPRINT 1 — Migliorano conversion / qualità (settimana 1-2 post-launch)

| # | Cosa fare | Tipo | Impatto | Sforzo | Note |
|---|---|---|---|---|---|
| 17 | **Mostra il prezzo prima del login**: badge "€X una tantum" sotto la CTA hero | 📈 | 🟠 | S (30min) | Riduce friction enorme |
| 18 | **Allinea promessa tempo**: scegli "~90 secondi" ovunque (oggi alterni con "meno di 2 minuti") | 📈🎨 | 🟡 | S (15min) | Coerenza |
| 19 | **Touch target mobile ≥44×44px** (7 elementi sotto soglia oggi) | ♿ | 🟠 | M (1h) | Padding maggiore sui chip stagione |
| 20 | **Eyebrow text da 12px → 13-14px + letter-spacing 0.08em** | 🎨♿ | 🟡 | S (30min) | Più leggibile + più editoriale |
| 21 | **Metadata su route private** (`/dashboard`, `/dossier/[id]`): `robots: { index: false }` | 🔍🛡️ | 🟡 | S (30min) | Evita indicizzazione accidentale |
| 22 | **Title pagina `/auth/login`**: "Accedi \| Armocromia" (oggi eredita homepage) | 🔍 | 🟢 | S (5min) | |
| 23 | **Exponential backoff + jitter** nei retry fal.ai (oggi è lineare) | 💻 | 🟡 | M (1h) | Protegge fal.ai da thundering herd |
| 24 | **Header semantico** con `<header>` + logo + (opzionale) nav | ♿🎨 | 🟡 | M (2h) | Oggi manca completamente |
| 25 | **Skip-to-content link** per keyboard nav | ♿ | 🟢 | S (15min) | `<a href="#main" class="sr-only-focusable">` |
| 26 | **`.env.example`** completo con tutte le var richieste | 💻 | 🟡 | S (15min) | Onboarding dev |
| 27 | **JSON-LD `Service` schema** sulla landing | 🔍 | 🟡 | M (1h) | Rich snippet potenziale |
| 28 | **4 demo dossier diversi** (uno per stagione) invece di mostrare solo Autunno | 🎨📈 | 🟠 | M (2h se le immagini esistono già) | Costruisce desiderio |
| 29 | **Email OTP brandizzata** in Supabase auth templates | 🎨 | 🟡 | M (1h) | Oggi è il template default |
| 30 | **Social proof reale**: counter numerico verificabile + 3 testimonial con foto | 📈 | 🟠 | L (4h, serve raccogliere materiale) | "Centinaia di dossier" oggi non è credibile |
| 31 | **JSON repair robusto** in `classify.ts`: log raw output + metric su parse failure rate | 💻 | 🟡 | M (3h) | Oggi euristiche fragili |
| 32 | **Pagina FAQ** (refund, privacy biometria, come funziona AI, quanto dura il dossier) | 📈⚖️ | 🟠 | L (4h) | |

**Stima Sprint 1:** ~25h (1 settimana part-time).

---

## 🚀 SPRINT 2 — Growth / scaling (mese 1)

| # | Cosa fare | Tipo | Impatto | Sforzo | Note |
|---|---|---|---|---|---|
| 33 | **Referral system**: link tracciato + sconto 30% chi porta amico | 📈 | 🟠 | XL (1-2gg) | Armocromia è virale per natura |
| 34 | **Email retention** (D+7): "Come vanno i colori?" + review request | 📈 | 🟡 | XL (1gg, serve setup Resend) | |
| 35 | **Smoke test suite** sulle server actions critiche (delete, upload, classify) | 💻 | 🟠 | XL (1-2gg) | Vitest + Supabase test isolation |
| 36 | **Account settings**: change email, delete account (GDPR), download dati | ⚖️💻 | 🟡 | XL (1gg) | Diritto GDPR all'oblio |
| 37 | **Image CDN/optimization audit**: verifica che `dossier-*.png` non blowup bandwidth | ⚡ | 🟡 | M (2h) | |
| 38 | **Analytics** (PostHog o Plausible): funnel landing → login → upload → payment | 📈 | 🟠 | M (3h) | Senza dati, fly blind |
| 39 | **Pricing A/B**: testa €9 vs €29 su due segmenti di traffico | 📈 | 🟠 | L (4h setup) | Decide il modello business |
| 40 | **i18n EN** se target esce dall'IT | 📈 | XL | next-intl + traduzioni | Da valutare in base a traction |
| 41 | **Affiliate moda** (Yoox/Zalando): item shoppabili per palette | 📈 | 🟢 | XL | Margine extra senza nuovo prodotto |
| 42 | **Dark mode** opzionale | 🎨 | 🟢 | M (3h) | Brand è light-warm, low priority |

---

## 📊 Quick wins (alta resa, sforzo minimo) — fai SUBITO

Se hai solo 2 ore, fai questi nell'ordine:

1. **#1** Viewport zoom (5min) — sblocca a11y
2. **#3 + #4** robots.txt + sitemap.ts (25min) — sblocca SEO
3. **#5** Rimuovi SVG scaffold (5min) — pulizia
4. **#2** Title template (10min) — SEO meta
5. **#6** dev-login double-gate (30min) — chiude backdoor
6. **#9** OTP regex (5min) — micro-fix UX
7. **#17** Prezzo visibile (30min) — conversion boost
8. **#22** Title /auth/login (5min) — SEO

Totale: ~2h, chiude 6 finding tra cui 2 P0 di sicurezza.

---

## 🧭 Decisioni strategiche (registrate 2026-05-15)

| Tema | Decisione |
|---|---|
| Dominio | Custom da comprare prima del launch (provvisorio: `armocromia-mvp-nine.vercel.app`) |
| Prezzo | **€29** one-shot |
| Target | Globale (IT + EN + ES) |
| Payment | Stripe multi-currency + Stripe Tax (IVA EU OSS automatico) |
| Foto retention | Cancellate entro 24h dopo analisi AI (la più prudente) |
| Dossier retention | A vita, con bottone "delete account + data" |
| Refund | 14 giorni "no questions asked" |
| Lingua dossier AI | Auto su locale utente (prompt multilingua) |

---

## 📋 Sprint 0bis — Nuovi task derivati dalle scelte (aggiunti 2026-05-15)

| # | Cosa fare | Tipo | Impatto | Sforzo | Note |
|---|---|---|---|---|---|
| S0-A | **Compra dominio** (`armocromia.app` / `.com` / `.io`) + DNS verso Vercel | 🧹 | 🔴 | S (30min) | Prima di scrivere OG image URL e canonical |
| S0-B | **next-intl setup** + route `/it`, `/en`, `/es` + locale detection da `Accept-Language` | 🔍📈 | 🔴 | L (6h) | Cardine per target globale |
| S0-C | **Traduzioni copy IT → EN + ES** (landing, login, dashboard, dossier, error states, email) | 📈 | 🔴 | L (4-6h) | Iniziare con traduzione AI poi review umano native |
| S0-D | **Prompt Gemini multilingua** in `src/lib/fal/classify.ts`: switch su locale, test JSON repair per ogni lingua | 💻 | 🔴 | L (4h) | Rischio output malformato 3x |
| S0-E | **Stripe Tax setup**: account + indirizzo legale + OSS EU + sales tax USA automatico | ⚖️💻 | 🔴 | L (4h + commercialista) | Obbligatorio per vendere a consumatori EU |
| S0-F | **Stripe multi-currency**: configurare prezzi €29 / $29 / e altre valute principali | 💻 | 🔴 | M (2h) | Da Stripe Dashboard + webhook check |
| S0-G | **Privacy policy multi-giurisdizione**: GDPR (EU) + CCPA (California) + UK GDPR + LGPD (Brasile). Foto retention 24h esplicita | ⚖️ | 🔴 | L (6h, far rivedere a legale) | Sostituisce task #14 originale |
| S0-H | **Terms con refund 14gg + diritto recesso UE** in 3 lingue | ⚖️ | 🔴 | M (3h) | Sostituisce task #15 originale |
| S0-I | **Bottone "Elimina account + dati"** in account settings (diritto oblio) | ⚖️💻 | 🟠 | M (3h) | Cancella user + dossier + foto residue + revoke Stripe |
| S0-J | **Cron retention foto**: job che cancella foto originali >24h dallo storage Supabase | 🛡️💻 | 🔴 | M (2h) | Vercel Cron + Supabase function, oppure scheduled edge function |
| S0-K | **Email transactional in 3 lingue** (OTP, ricevuta acquisto, dossier ready, refund) via Resend | 📈🎨 | 🟠 | L (4h) | Template Supabase auth + Resend per le altre |
| S0-L | **Currency switcher / detection** in UI + checkout | 📈 | 🟡 | M (2h) | IP-based o user choice |
| S0-M | **Comunicare "foto cancellata in 24h"** chiaramente sulla landing + nel flow upload | 📈🛡️ | 🟠 | S (30min) | Trust signal forte |

**Stima aggiuntiva:** +35-40h (~1 settimana focalizzata). Combinato con Sprint 0 originale: **~2 settimane totali pre-launch**.

---

## 🧪 Piano beta tester (10 utenti, da reclutare)

Vedi conversazione separata per il piano dettagliato. In sintesi:
- 5 target primario IT (donne 25-45 interessate a moda/styling)
- 3 target EN (parlanti madrelingua + interesse beauty)
- 2 target ES (idem)
- Incentivo: dossier gratis + 50% sconto vita per amici loro
- Canale: amici/famiglia first, poi Instagram personali, poi 1-2 micro-influencer barter
- Criteri di successo: NPS >8/10 da 7/10 partecipanti
