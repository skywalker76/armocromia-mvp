import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { isValidLocale, localePath, defaultLocale, type Locale } from "@/lib/i18n/config";

// Force this route to be rendered dynamically on every request (since it signs in and sets cookies)
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ lang: string }> }
) {
  const { lang } = await params;
  const locale: Locale = isValidLocale(lang) ? lang : defaultLocale;

  const email = "demo-inspector@cromeastudio.com";
  // Secure static password for the underwriter inspector account
  const password = "CromeaDemoInspector2026!";

  const supabase = await createClient();

  // 1. Try to sign in first (Fast path if user already exists)
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    // If sign in failed due to invalid credentials, it means the user does not exist yet.
    // Let's create the user and populate a demo dossier for them.
    if (signInError.message.includes("Invalid login credentials") || signInError.status === 400) {
      try {
        const adminClient = createAdminClient();

        // Create the user in auth.users
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

        if (createError) {
          return new Response(`Error creating demo inspector user: ${createError.message}`, {
            status: 500,
          });
        }

        if (newUser?.user) {
          // Find any existing successful dossier in the system to copy as a high-fidelity template
          const { data: existingDossiers } = await adminClient
            .from("dossiers")
            .select("*")
            .eq("status", "completed")
            .not("classification_result", "is", null)
            .limit(1);

          const existing = existingDossiers?.[0];

          if (existing) {
            // Insert the copied dossier for the new demo user
            const { error: insertError } = await adminClient.from("dossiers").insert({
              user_id: newUser.user.id,
              status: "completed",
              classified_season: existing.classified_season,
              classification_result: existing.classification_result,
              original_photo_path: existing.original_photo_path,
              generated_dossier_path: existing.generated_dossier_path,
              user_notes: "Demo dossier for Lemon Squeezy inspection",
            });

            if (insertError) {
              console.error("Error inserting demo dossier:", insertError.message);
            }
          } else {
            // Fallback: If no dossiers exist in the DB, insert a simple mock dossier structure
            const { error: insertError } = await adminClient.from("dossiers").insert({
              user_id: newUser.user.id,
              status: "completed",
              classified_season: "inverno-brillante",
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
              console.error("Error inserting fallback demo dossier:", insertError.message);
            }
          }
        }

        // 2. Retry sign in with standard client to establish cookies
        const { error: retryError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (retryError) {
          return new Response(`Authentication retry failed: ${retryError.message}`, {
            status: 500,
          });
        }
      } catch (err: any) {
        return new Response(`Bypass creation error: ${err.message || err}`, { status: 500 });
      }
    } else {
      // Return other authentication errors directly
      return new Response(`Authentication Error: ${signInError.message}`, { status: 500 });
    }
  }

  // Redirect to the dashboard in the selected locale
  redirect(localePath(locale, "/dashboard"));
}
