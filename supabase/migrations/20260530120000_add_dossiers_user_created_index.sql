-- Indice per velocizzare l'elenco dossier per-utente nella dashboard.
-- Query calda (dashboard/page.tsx): WHERE user_id = $1 ORDER BY created_at DESC
-- Idempotente e non distruttivo.
CREATE INDEX IF NOT EXISTS idx_dossiers_user_id_created_at
  ON dossiers (user_id, created_at DESC);
