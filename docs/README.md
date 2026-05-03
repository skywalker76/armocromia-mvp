# Armocromia MVP

> Servizio B2C italiano di analisi cromatica personalizzata. Genera dossier visivi professionali — infografica A4 stile magazine con palette colori, outfit suggeriti e consigli makeup, a partire dalla foto della cliente.

## Stack Tecnico

| Layer | Tecnologia | Versione |
|-------|-----------|----------|
| Framework | Next.js (App Router) | 16.x |
| Language | TypeScript (strict) | 5.x |
| Styling | Tailwind CSS | 4.x |
| Auth & DB | Supabase (PostgreSQL, Auth, Storage) | latest |
| Pagamenti | Stripe Checkout | _da integrare_ |
| AI - Generazione | fal.ai (GPT Image 2) | latest |
| AI - Classificazione | OpenAI Vision | _da integrare_ |
| Email | Resend | _da integrare_ |
| Deploy | Vercel | _da configurare_ |

## Setup

### Prerequisiti

- Node.js 20+
- npm

### Installazione

```bash
# 1. Clona il repository
git clone <repo-url> armocromia-mvp
cd armocromia-mvp

# 2. Installa le dipendenze
npm install

# 3. Configura le variabili d'ambiente
cp .env.local.example .env.local
# Compila .env.local con le credenziali (vedi sezione sotto)

# 4. Avvia il dev server
npm run dev
```

L'app sarà disponibile su [http://localhost:3000](http://localhost:3000).

## Variabili d'Ambiente

Copia `.env.local.example` in `.env.local` e popola i valori:

| Variabile | Richiesta | Descrizione |
|-----------|-----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | URL del progetto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ | Publishable key Supabase |
| `FAL_KEY` | ✅ | API key fal.ai |
| `STRIPE_SECRET_KEY` | ⏳ | Secret key Stripe (fase pagamento) |
| `OPENAI_API_KEY` | ⏳ | API key OpenAI (fase classificazione) |
| `RESEND_API_KEY` | ⏳ | API key Resend (fase email) |

## Struttura Progetto

```
src/
├── app/                          # App Router Next.js
│   ├── (marketing)/              # Route group — pagine pubbliche
│   │   └── page.tsx              # Landing principale
│   ├── (app)/                    # Route group — area autenticata
│   │   └── dashboard/
│   │       └── page.tsx          # Dashboard utente
│   ├── api/                      # API routes
│   ├── layout.tsx                # Root layout (font, metadata)
│   └── globals.css               # Design system + Tailwind config
├── components/
│   ├── ui/                       # Componenti UI base
│   ├── marketing/                # Componenti landing
│   └── app/                      # Componenti area autenticata
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Client browser
│   │   ├── server.ts             # Client server
│   │   └── proxy.ts              # Helper refresh sessione
│   ├── fal/
│   │   └── client.ts             # Client fal.ai (server-side only)
│   ├── armocromia/
│   │   ├── palette.json          # Tabella 12 stagioni
│   │   └── types.ts              # Tipi dominio armocromia
│   └── utils.ts                  # Utility (cn, ecc.)
├── types/
│   └── database.ts               # Tipi Supabase auto-generati
└── proxy.ts                      # Next.js Proxy (session refresh)
```

## Scripts

```bash
npm run dev       # Dev server (localhost:3000)
npm run build     # Build produzione
npm run start     # Start produzione
npm run lint      # Lint con ESLint
```

## Deployment

> _Da configurare._ Deploy previsto su Vercel con variabili d'ambiente configurate via dashboard.

## License

**All Rights Reserved** — Questo software è proprietario e confidenziale.
