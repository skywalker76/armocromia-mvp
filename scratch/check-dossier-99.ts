import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.production.local" });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  dotenv.config({ path: ".env.local" });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase credentials missing in env files.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: dossier, error } = await supabase
    .from("dossiers")
    .select("*")
    .eq("id", 99)
    .single();

  if (error) {
    console.error("Error fetching dossier 99:", error.message);
  } else {
    console.log("Dossier 99:", JSON.stringify(dossier, null, 2));
  }

  const { data: payment, error: pError } = await supabase
    .from("payments")
    .select("*")
    .eq("dossier_id", 99);

  if (pError) {
    console.error("Error fetching payment for dossier 99:", pError.message);
  } else {
    console.log("Payments for dossier 99:", JSON.stringify(payment, null, 2));
  }
}

main();
