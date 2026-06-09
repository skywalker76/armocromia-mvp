import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { isValidLocale, localePath, defaultLocale, type Locale } from "@/lib/i18n/config";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";

// Force this route to be rendered dynamically on every request (since it signs in and sets cookies)
export const dynamic = "force-dynamic";

const DEMO_EMAIL = "demo-inspector@cromeastudio.com";
// Secure static password for the underwriter inspector account
const DEMO_PASSWORD = "CromeaDemoInspector2026!";
// L'account founder è la fonte preferita del dossier template: il volto nel
// dossier generato è quello del titolare (consenso implicito), MAI di una cliente.
const FOUNDER_EMAIL = "gamatig@gmail.com";

type AdminClient = SupabaseClient<Database>;

/**
 * Garantisce che l'utente demo abbia un dossier completo, sicuro e self-contained:
 * - original_photo_path SEMPRE null (nessun dato biometrico esposto agli ispettori,
 *   e comunque la foto sorgente viene cancellata dal cron GDPR entro 24h).
 * - generated_dossier_path copiato FISICAMENTE nella cartella storage del demo user.
 *   Why: le policy RLS dello storage permettono signed URL solo su file nella
 *   propria cartella (foldername = auth.uid()), quindi un path che punta alla
 *   cartella di un altro utente risulterebbe in un'immagine rotta in dashboard.
 * - Idempotente e self-healing: rimuove eventuali dossier demo creati in passato
 *   con riferimenti a file di altri utenti.
 */
async function ensureDemoDossier(adminClient: AdminClient, demoUserId: string): Promise<void> {
  const { data: demoDossiers } = await adminClient
    .from("dossiers")
    .select("id, status, original_photo_path, generated_dossier_path")
    .eq("user_id", demoUserId);

  const isSafe = (d: {
    original_photo_path: string | null;
    generated_dossier_path: string | null;
    status: string;
  }) =>
    d.status === "completed" &&
    d.original_photo_path === null &&
    (d.generated_dossier_path === null || d.generated_dossier_path.startsWith(`${demoUserId}/`));

  const unsafe = (demoDossiers ?? []).filter((d) => !isSafe(d));
  if (unsafe.length > 0) {
    await adminClient
      .from("dossiers")
      .delete()
      .in("id", unsafe.map((d) => d.id));
  }

  const hasValidDemo = (demoDossiers ?? []).some(isSafe);
  if (hasValidDemo) {
    return;
  }

  // Trova il dossier template. Priorità:
  // 1. DEMO_TEMPLATE_DOSSIER_ID (env) — dossier pinnato esplicitamente, con volto
  //    già approvato per uso pubblico (es. #47 Primavera Calda, identico alla Hero
  //    della landing). Why: l'ultimo dossier del founder può essere un test con un
  //    volto qualsiasi (es. attore famoso) non adatto agli ispettori.
  // 2. Fallback: ultimo dossier completato del founder.
  let template: {
    classified_season: string | null;
    classification_result: Json;
    generated_dossier_path: string | null;
  } | null = null;

  const pinnedId = parseInt(process.env.DEMO_TEMPLATE_DOSSIER_ID ?? "", 10);
  if (!Number.isNaN(pinnedId)) {
    const { data: pinned } = await adminClient
      .from("dossiers")
      .select("classified_season, classification_result, generated_dossier_path")
      .eq("id", pinnedId)
      .eq("status", "completed")
      .not("generated_dossier_path", "is", null)
      .limit(1);
    template = pinned?.[0] ?? null;
  }

  if (!template) {
    const { data: usersPage } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 200 });
    const founder = usersPage?.users?.find(
      (u) => u.email?.toLowerCase() === FOUNDER_EMAIL
    );

    if (founder) {
      const { data: founderDossiers } = await adminClient
        .from("dossiers")
        .select("classified_season, classification_result, generated_dossier_path")
        .eq("user_id", founder.id)
        .eq("status", "completed")
        .not("classification_result", "is", null)
        .not("generated_dossier_path", "is", null)
        .order("created_at", { ascending: false })
        .limit(1);
      template = founderDossiers?.[0] ?? null;
    }
  }

  // Copia fisica del file dossier nella cartella del demo user, così le
  // policy storage consentono al demo user di generare la signed URL.
  let demoDossierPath: string | null = null;
  if (template?.generated_dossier_path) {
    const destPath = `${demoUserId}/demo-dossier.png`;
    // Rimuovi l'eventuale file precedente: copy non sovrascrive, e un residuo
    // con contenuto obsoleto resterebbe silenziosamente in uso.
    await adminClient.storage.from("dossiers").remove([destPath]);
    const { error: copyError } = await adminClient.storage
      .from("dossiers")
      .copy(template.generated_dossier_path, destPath);

    if (!copyError) {
      demoDossierPath = destPath;
    } else {
      console.error("[Demo Access] Storage copy failed:", copyError.message);
    }
  }

  if (template) {
    const { error: insertError } = await adminClient.from("dossiers").insert({
      user_id: demoUserId,
      status: "completed",
      classified_season: template.classified_season,
      classification_result: template.classification_result,
      original_photo_path: null,
      generated_dossier_path: demoDossierPath,
      user_notes: "Demo dossier for Lemon Squeezy inspection",
    });
    if (insertError) {
      console.error("[Demo Access] Error inserting demo dossier:", insertError.message);
    }
    return;
  }

  // Fallback: nessun dossier del founder disponibile — mock senza alcuna immagine.
  const { error: insertError } = await adminClient.from("dossiers").insert({
    user_id: demoUserId,
    status: "completed",
    classified_season: "inverno-brillante",
    original_photo_path: null,
    generated_dossier_path: null,
    user_notes: "Demo dossier for Lemon Squeezy inspection",
    classification_result: {
      season: "Inverno Brillante",
      characteristics: {
        undertone: "Freddo",
        value: "Scuro",
        intensity: "Brillante",
        contrast: "Alto"
      },
      explanation: "Il tuo incarnato freddo, abbinato al contrasto elevato tra i capelli scuri e la pelle chiara, ti rende un perfetto Inverno Brillante. I colori puri e freddi faranno risplendere il tuo viso.",
      palette: {
        base_colors: ["#000000", "#FFFFFF", "#0000FF"],
        neutrals: ["#808080", "#C0C0C0"],
        accents: ["#FF007F", "#8A2BE2"]
      }
    }
  });
  if (insertError) {
    console.error("[Demo Access] Error inserting fallback demo dossier:", insertError.message);
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ lang: string }> }
) {
  const { lang } = await params;
  const locale: Locale = isValidLocale(lang) ? lang : defaultLocale;

  const supabase = await createClient();

  // 1. Try to sign in first (Fast path if user already exists)
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });

  if (signInError) {
    // If sign in failed due to invalid credentials, it means the user does not exist yet.
    if (signInError.message.includes("Invalid login credentials") || signInError.status === 400) {
      try {
        const adminClient = createAdminClient();

        // Create the user in auth.users
        const { error: createError } = await adminClient.auth.admin.createUser({
          email: DEMO_EMAIL,
          password: DEMO_PASSWORD,
          email_confirm: true,
        });

        if (createError) {
          return new Response(`Error creating demo inspector user: ${createError.message}`, {
            status: 500,
          });
        }

        // 2. Retry sign in with standard client to establish cookies
        const { error: retryError } = await supabase.auth.signInWithPassword({
          email: DEMO_EMAIL,
          password: DEMO_PASSWORD,
        });

        if (retryError) {
          return new Response(`Authentication retry failed: ${retryError.message}`, {
            status: 500,
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return new Response(`Bypass creation error: ${message}`, { status: 500 });
      }
    } else {
      // Return other authentication errors directly
      return new Response(`Authentication Error: ${signInError.message}`, { status: 500 });
    }
  }

  // 3. Garantisci (idempotente, anche per utenti demo pre-esistenti) un dossier
  // demo sicuro: senza foto biometrica e con file nella cartella del demo user.
  try {
    const { data: sessionData } = await supabase.auth.getUser();
    const demoUserId = sessionData?.user?.id;
    if (demoUserId) {
      const adminClient = createAdminClient();
      await ensureDemoDossier(adminClient, demoUserId);
    }
  } catch (err) {
    // Non bloccare il login demo se la preparazione del dossier fallisce
    console.error("[Demo Access] ensureDemoDossier failed:", err);
  }

  // Redirect to the dashboard in the selected locale
  redirect(localePath(locale, "/dashboard"));
}
