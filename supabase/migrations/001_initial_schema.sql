-- =============================================================================
-- Armocromia MVP — Schema Database (Fase 1)
-- =============================================================================
-- Tabelle: profiles, dossiers, payments
-- Security: RLS abilitato su tutte le tabelle
-- Indexes: su tutte le FK columns
-- Triggers: updated_at automatico
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Helper function — auto-update updated_at
-- ---------------------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. PROFILES — estende auth.users con dati di dominio
-- ---------------------------------------------------------------------------
-- Why: auth.users è gestita da Supabase Auth e non va modificata.
-- Un profilo separato permette di aggiungere campi custom senza
-- conflitti con il sistema di autenticazione.

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Why: nessun indice extra su `id` perché è la PK (già indicizzata).
-- Il profilo ha una relazione 1:1 con auth.users.

comment on table  public.profiles is 'Profilo utente esteso — dati di dominio separati da auth.users';
comment on column public.profiles.id is 'FK → auth.users(id), stessa UUID';

-- RLS
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Why: l'insert lo fa solo il trigger on_auth_user_created (service_role),
-- non l'utente direttamente. Nessuna policy INSERT per authenticated.

-- Trigger updated_at
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- 2. DOSSIERS — cuore del business, un dossier per ordine
-- ---------------------------------------------------------------------------
-- Why: bigint identity per PK perché i dossier non vengono mai esposti
-- come URL pubblici (sono dietro auth). Sequential = meno frammentazione.

create table public.dossiers (
  id                bigint generated always as identity primary key,
  user_id           uuid not null references auth.users(id) on delete cascade,

  -- Stato del workflow
  status            text not null default 'pending_payment'
                    check (status in (
                      'pending_payment',
                      'pending_upload',
                      'processing',
                      'generating',
                      'completed',
                      'failed'
                    )),

  -- Classificazione armocromia
  classified_season text check (classified_season in (
                      'primavera-chiara', 'primavera-calda', 'primavera-brillante',
                      'estate-chiara', 'estate-fredda', 'estate-tenue',
                      'autunno-tenue', 'autunno-caldo', 'autunno-profondo',
                      'inverno-profondo', 'inverno-freddo', 'inverno-brillante'
                    )),

  -- Analisi Vision (risultato JSON della classificazione)
  classification_result jsonb,

  -- File references (Supabase Storage paths)
  original_photo_path   text,
  generated_dossier_path text,

  -- Note opzionali della cliente
  user_notes        text,

  -- Timestamps
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Why: indice su user_id per JOINs e CASCADE veloci (PostgreSQL non lo crea automaticamente sulle FK).
create index dossiers_user_id_idx on public.dossiers (user_id);

-- Why: indice su status per filtrare i dossier in lavorazione (coda di processing).
create index dossiers_status_idx on public.dossiers (status) where status not in ('completed', 'failed');

comment on table  public.dossiers is 'Dossier di analisi cromatica — un record per ogni ordine';
comment on column public.dossiers.status is 'Stato workflow: pending_payment → pending_upload → processing → generating → completed/failed';
comment on column public.dossiers.classified_season is 'Sotto-stagione classificata (12 stagioni armocromia)';
comment on column public.dossiers.original_photo_path is 'Path Supabase Storage della foto caricata dalla cliente';
comment on column public.dossiers.generated_dossier_path is 'Path Supabase Storage del dossier generato (PDF/immagine)';

-- RLS
alter table public.dossiers enable row level security;

create policy "Users can view own dossiers"
  on public.dossiers for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own dossiers"
  on public.dossiers for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own dossiers"
  on public.dossiers for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Why: gli utenti non possono cancellare dossier — soft delete via status se necessario.

-- Trigger updated_at
create trigger dossiers_updated_at
  before update on public.dossiers
  for each row execute function public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- 3. PAYMENTS — record dei pagamenti Stripe
-- ---------------------------------------------------------------------------
-- Why: tabella separata da dossiers perché un pagamento può fallire/essere
-- rimborsato indipendentemente dallo stato del dossier. Relazione 1:1 con dossier.

create table public.payments (
  id                    bigint generated always as identity primary key,
  user_id               uuid not null references auth.users(id) on delete cascade,
  dossier_id            bigint not null references public.dossiers(id) on delete cascade,

  -- Stripe references
  stripe_checkout_session_id  text unique,
  stripe_payment_intent_id    text unique,

  -- Importo e valuta
  amount_cents          integer not null,
  currency              text not null default 'eur',

  -- Stato del pagamento
  status                text not null default 'pending'
                        check (status in (
                          'pending',
                          'completed',
                          'failed',
                          'refunded'
                        )),

  -- Timestamps
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Why: indici su FK columns per JOINs e CASCADE veloci.
create index payments_user_id_idx on public.payments (user_id);
create index payments_dossier_id_idx on public.payments (dossier_id);

comment on table  public.payments is 'Record pagamenti Stripe — un record per ogni checkout session';
comment on column public.payments.amount_cents is 'Importo in centesimi (1999 = €19,99)';
comment on column public.payments.stripe_checkout_session_id is 'ID sessione Stripe Checkout — unique per reconciliazione webhook';

-- RLS
alter table public.payments enable row level security;

create policy "Users can view own payments"
  on public.payments for select
  to authenticated
  using (user_id = auth.uid());

-- Why: INSERT e UPDATE su payments sono gestiti esclusivamente dal webhook Stripe
-- tramite service_role. Nessuna policy INSERT/UPDATE per authenticated.

-- Trigger updated_at
create trigger payments_updated_at
  before update on public.payments
  for each row execute function public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- 4. TRIGGER — auto-crea profilo quando un utente si registra
-- ---------------------------------------------------------------------------
-- Why: quando Supabase Auth crea un utente (via magic link, OAuth, ecc.),
-- questo trigger inserisce automaticamente un record in profiles.
-- Usa security definer per avere i permessi necessari (bypassa RLS).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 5. STORAGE BUCKETS (configurazione via SQL)
-- ---------------------------------------------------------------------------
-- Why: creiamo i bucket per le foto delle clienti e i dossier generati.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('photos', 'photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('dossiers', 'dossiers', false, 52428800, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Storage RLS — photos bucket
create policy "Users can upload own photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can view own photos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage RLS — dossiers bucket
create policy "Users can view own dossiers files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'dossiers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Why: l'upload dei dossier è gestito dal backend (service_role), non dall'utente.
-- Nessuna policy INSERT per authenticated sul bucket dossiers.
