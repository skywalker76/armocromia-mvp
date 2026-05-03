# Architettura — Armocromia MVP

> Documento tecnico di architettura. Work in progress — verrà aggiornato man mano che il progetto evolve.

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                         │
│                                                                 │
│   (marketing)/ ─── Landing, pricing           React + Tailwind  │
│   (app)/ ──────── Dashboard, upload, dossier  React + Tailwind  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    Next.js App Router
                    (Proxy: session refresh)
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│                     Server (Vercel)                              │
│                                                                 │
│   API Routes ─────────── /api/*                                 │
│   Server Actions ──────── form handling                         │
│   Server Components ───── SSR con Supabase                      │
└──────────┬───────────────┬──────────────────┬───────────────────┘
           │               │                  │
    ┌──────┴──────┐  ┌─────┴─────┐    ┌──────┴──────┐
    │  Supabase   │  │  fal.ai   │    │   Stripe    │
    │  Auth + DB  │  │  GPT Img  │    │  Checkout   │
    │  Storage    │  │           │    │             │
    └─────────────┘  └───────────┘    └─────────────┘
```

## Flow principale

1. **Landing** → Utente arriva, vede offerta
2. **Pagamento** → Stripe Checkout (19,99€)
3. **Upload** → Foto caricata su Supabase Storage
4. **Classificazione** → OpenAI Vision analizza foto → sub-stagione
5. **Generazione** → fal.ai genera mini-ritratti + dossier visivo
6. **Delivery** → Dossier PDF/immagine scaricabile + email

## Convenzioni

- **Route groups**: `(marketing)` per pagine pubbliche, `(app)` per area autenticata
- **Proxy**: usa `proxy.ts` (Next.js 16+) per refresh sessione Supabase
- **Server-side only**: fal.ai e OpenAI mai esposti al client
- **TypeScript strict**: niente `any` impliciti
