const { createClient } = require("@supabase/supabase-js");

async function run() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  console.log("Supabase URL:", url);
  console.log("Supabase key length:", key ? key.length : 0);

  if (!url || !key) {
    console.error("Variabili d'ambiente mancanti!");
    return;
  }

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    console.log("1. Querying dossiers...");
    const { data: dossiers, error: dossiersError } = await admin
      .from("dossiers")
      .select("id, user_id, status, classified_season, classification_result, user_notes, original_photo_path, generated_dossier_path, created_at, error_message")
      .order("created_at", { ascending: false })
      .limit(10);

    if (dossiersError) {
      console.error("Dossiers query error:", dossiersError);
    } else {
      console.log(`Dossiers query success: found ${dossiers.length} dossiers`);
      if (dossiers.length > 0) {
        console.log("Sample dossier:", dossiers[0]);
      }
    }

    console.log("\n2. Querying user list (listUsers)...");
    const { data: usersPage, error: usersError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 10,
    });

    if (usersError) {
      console.error("listUsers error:", usersError);
    } else {
      console.log(`listUsers success: found ${usersPage.users.length} users`);
      if (usersPage.users.length > 0) {
        console.log("Sample user:", {
          id: usersPage.users[0].id,
          email: usersPage.users[0].email
        });
      }
    }

    console.log("\n3. Testing Promise.all stats...");
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const [
      totalUsersRes,
      totalDossiersRes,
    ] = await Promise.all([
      admin.auth.admin.listUsers({ page: 1, perPage: 1 }),
      admin.from("dossiers").select("id", { count: "exact", head: true }),
    ]);

    console.log("Stats test passed!");
    console.log("Total users in res:", totalUsersRes.data ? "yes" : "no", "error:", totalUsersRes.error);
    console.log("Total dossiers count:", totalDossiersRes.count, "error:", totalDossiersRes.error);

  } catch (err) {
    console.error("Exception thrown:", err);
  }
}

run();
