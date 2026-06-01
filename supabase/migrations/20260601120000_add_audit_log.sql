-- =============================================================================
-- Armocromia MVP — Audit Log GDPR (accountability)
-- =============================================================================
-- Why: GDPR art. 5.2 (accountability) — registriamo le operazioni di
-- cancellazione dei dati personali (erasure account, cancellazione dossier,
-- retention foto >24h) per poter DIMOSTRARE l'avvenuta cancellazione.
--
-- Privacy by design: NESSUN contenuto personale (foto/analisi) viene salvato,
-- solo metadati — azione, ruolo, riferimento user_id e conteggi. Nessuna FK
-- verso auth.users: il record DEVE sopravvivere alla cancellazione dell'account
-- (è proprio la prova dell'erasure).
--
-- Accesso: tabella riservata al ruolo service_role. RLS ABILITATA senza policy
-- → blocca anon/authenticated; service_role bypassa comunque RLS.
-- Idempotente e non distruttiva.
-- =============================================================================

create table if not exists public.audit_log (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  action      text        not null,          -- es. 'account_deleted', 'dossier_deleted', 'photos_retention_purge'
  actor       text        not null,          -- 'user' | 'system' | 'admin'
  user_id     uuid,                           -- soggetto (NO FK: sopravvive all'erasure)
  target_id   text,                           -- es. dossier id
  details     jsonb,                          -- conteggi/metadati (NO PII)
  ip          text
);

-- Indici per consultazione (per soggetto e cronologica).
create index if not exists idx_audit_log_user_id on public.audit_log (user_id);
create index if not exists idx_audit_log_created_at on public.audit_log (created_at desc);

-- RLS on, nessuna policy → solo service_role (che bypassa RLS) accede.
alter table public.audit_log enable row level security;
