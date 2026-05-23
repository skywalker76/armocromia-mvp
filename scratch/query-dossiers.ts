import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = "https://xjmhzdwmngzrosuxqfff.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseServiceKey) {
  console.error("Missing SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  console.log("Fetching dossier 96 status...");
  const { data: dossier, error: dossierError } = await supabaseAdmin
    .from("dossiers")
    .select("id, status, error_message, classified_season, classification_result, created_at, updated_at")
    .eq("id", 98)
    .single();

  if (dossierError) {
    console.error("Error fetching dossier 98:", dossierError);
    return;
  }

  console.log("Dossier 98:", JSON.stringify(dossier, null, 2));
}

main().catch(console.error);
