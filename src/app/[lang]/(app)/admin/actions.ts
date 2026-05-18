"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdmin } from "@/lib/admin";

/**
 * Server Actions per /admin — tutte gated su isAdmin(user.email).
 *
 * Why: bypassano RLS (usano service role), quindi devono ri-verificare il gate
 * a ogni invocazione — il middleware/layout non basta perché le Server Action
 * sono endpoint POST indipendenti.
 */

type Result = { success: boolean; error?: string };

async function gate(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non autenticato" };
  if (!isAdmin(user.email)) return { ok: false, error: "Accesso negato" };
  return { ok: true };
}

/**
 * Elimina forzata di un dossier (qualsiasi user_id), inclusi i file su Storage.
 */
export async function adminForceDeleteDossier(dossierId: number): Promise<Result> {
  const guard = await gate();
  if (!guard.ok) return { success: false, error: guard.error };

  const admin = createAdminClient();

  const { data: dossier, error: fetchError } = await admin
    .from("dossiers")
    .select("id, original_photo_path, generated_dossier_path")
    .eq("id", dossierId)
    .single();

  if (fetchError || !dossier) {
    return { success: false, error: fetchError?.message ?? "Dossier non trovato" };
  }

  const files: Array<{ bucket: string; path: string }> = [];
  if (dossier.original_photo_path) {
    files.push({ bucket: "photos", path: dossier.original_photo_path });
  }
  if (dossier.generated_dossier_path) {
    files.push({ bucket: "dossiers", path: dossier.generated_dossier_path });
  }

  for (const f of files) {
    const { error } = await admin.storage.from(f.bucket).remove([f.path]);
    if (error) {
      console.warn(`[admin] remove ${f.bucket}/${f.path} fallita:`, error.message);
    }
  }

  const { error: deleteError } = await admin.from("dossiers").delete().eq("id", dossierId);
  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  revalidatePath("/[lang]/admin", "page");
  return { success: true };
}

/**
 * Forza lo stato 'failed' su un dossier (utile per liberare uno "stuck" senza eliminarlo).
 */
export async function adminMarkFailed(dossierId: number): Promise<Result> {
  const guard = await gate();
  if (!guard.ok) return { success: false, error: guard.error };

  const admin = createAdminClient();
  const { error } = await admin
    .from("dossiers")
    .update({ status: "failed" })
    .eq("id", dossierId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/[lang]/admin", "page");
  return { success: true };
}
