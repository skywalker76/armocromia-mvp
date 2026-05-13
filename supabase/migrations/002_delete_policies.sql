-- =============================================================================
-- Armocromia MVP — DELETE Policies (Fase 4)
-- =============================================================================
-- Why: in 001 era stato deciso "no delete" con soft-delete via status.
-- Ma la UI ha sempre avuto DeleteDossierButton che chiama Server Action delete.
-- Senza policy DELETE, RLS rifiuta silenziosamente e il bottone "non funziona".
--
-- Approccio: HARD DELETE perché ogni dossier ha file storage associati che
-- vanno rimossi insieme — un soft delete lascerebbe i file orfani in Storage.
-- L'ownership è garantita dalla policy (user_id = auth.uid()).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. DELETE policy su public.dossiers
-- ---------------------------------------------------------------------------
-- Why: utente può cancellare solo i propri dossier.
create policy "Users can delete own dossiers"
  on public.dossiers for delete
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 2. DELETE policy su storage.objects — bucket photos
-- ---------------------------------------------------------------------------
-- Why: file foto utente memorizzati come "{user_id}/{dossier_id}.{ext}".
-- L'utente può cancellare solo i file nella sua cartella (primo segmento).
create policy "Users can delete own photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- 3. DELETE policy su storage.objects — bucket dossiers
-- ---------------------------------------------------------------------------
-- Why: stessa logica per i dossier generati ("{user_id}/{dossier_id}.png").
create policy "Users can delete own dossiers files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'dossiers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
