/**
 * Smoke test: verifica che le RLS policies impediscano DELETE cross-user.
 *
 * Scenario:
 *   1. Crea utenti test A e B (via admin API)
 *   2. A crea un dossier
 *   3. B tenta di cancellare il dossier di A
 *   4. ASSERT: il delete deve fallire (RLS blocks) OR ritornare 0 righe
 *   5. ASSERT: il dossier di A deve essere ancora presente
 *   6. Cleanup: cancella dossier + utenti test
 *
 * Uso:
 *   npm run test:rls
 *
 * Richiede env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (anon)
 *   SUPABASE_SECRET_KEY (service-role)
 *
 * Why standalone script invece di vitest: nessuna infra di test nel repo,
 * questo va eseguito manualmente prima di ogni deploy critico. Output
 * chiaro pass/fail, exit code 0/1 per CI futuro.
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SERVICE_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
  console.error("❌ Env vars mancanti: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY");
  process.exit(1);
}

const TEST_TAG = `rls-test-${Date.now()}`;
const PASSWORD = "TestPassword123!RlsCheck";

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function userClient() {
  return createClient(SUPABASE_URL!, ANON_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function createTestUser(label: string): Promise<{ id: string; email: string }> {
  const email = `${TEST_TAG}-${label}@test.armocromia.invalid`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`Create user ${label} failed: ${error?.message}`);
  return { id: data.user.id, email };
}

async function signIn(email: string) {
  const client = userClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error || !data.session) throw new Error(`Sign in failed for ${email}: ${error?.message}`);
  return client;
}

async function cleanup(userIds: string[], dossierIds: number[]) {
  if (dossierIds.length > 0) {
    await admin.from("dossiers").delete().in("id", dossierIds);
  }
  for (const id of userIds) {
    await admin.auth.admin.deleteUser(id);
  }
}

let pass = 0;
let fail = 0;
const log = {
  ok: (msg: string) => { console.log(`  ✅ ${msg}`); pass++; },
  ko: (msg: string) => { console.log(`  ❌ ${msg}`); fail++; },
  info: (msg: string) => console.log(`  ℹ️  ${msg}`),
};

async function run() {
  console.log(`\n🧪 RLS DELETE smoke test — tag: ${TEST_TAG}\n`);

  const userIds: string[] = [];
  const dossierIds: number[] = [];

  try {
    // ── 1. Setup utenti A e B ──
    console.log("1️⃣  Setup utenti test...");
    const userA = await createTestUser("alice");
    const userB = await createTestUser("bob");
    userIds.push(userA.id, userB.id);
    log.info(`A=${userA.email.slice(0, 40)}...`);
    log.info(`B=${userB.email.slice(0, 40)}...`);

    // ── 2. A crea un dossier ──
    console.log("\n2️⃣  A crea un dossier...");
    const clientA = await signIn(userA.email);
    const { data: dossierA, error: insertErr } = await clientA
      .from("dossiers")
      .insert({ user_id: userA.id, status: "processing" })
      .select("id")
      .single();

    if (insertErr || !dossierA) {
      log.ko(`Insert dossier come A fallito: ${insertErr?.message}`);
      throw new Error("setup failed");
    }
    dossierIds.push(dossierA.id);
    log.ok(`Dossier creato: id=${dossierA.id}`);

    // ── 3. B tenta delete del dossier di A ──
    console.log("\n3️⃣  B tenta delete del dossier di A (RLS deve bloccare)...");
    const clientB = await signIn(userB.email);
    const { error: deleteErr, count } = await clientB
      .from("dossiers")
      .delete({ count: "exact" })
      .eq("id", dossierA.id);

    if (deleteErr) {
      log.ok(`Supabase ha bloccato il delete con errore: "${deleteErr.message}"`);
    } else if (count === 0) {
      log.ok(`RLS ha silenziosamente filtrato il delete: 0 righe cancellate`);
    } else {
      log.ko(`🚨 CRITICAL: B ha cancellato ${count} righe! RLS DELETE policy ROTTA`);
    }

    // ── 4. Verifica che il dossier di A esista ancora ──
    console.log("\n4️⃣  Verifica dossier di A è ancora presente...");
    const { data: stillThere, error: checkErr } = await admin
      .from("dossiers")
      .select("id, user_id")
      .eq("id", dossierA.id)
      .single();

    if (checkErr || !stillThere) {
      log.ko(`Dossier di A è scomparso! ${checkErr?.message}`);
    } else if (stillThere.user_id !== userA.id) {
      log.ko(`Dossier esiste ma user_id sbagliato`);
    } else {
      log.ok(`Dossier di A intatto (user_id corretto)`);
    }

    // ── 5. A può cancellare il proprio dossier ──
    console.log("\n5️⃣  A cancella il proprio dossier (deve riuscire)...");
    const { error: aDelErr, count: aDelCount } = await clientA
      .from("dossiers")
      .delete({ count: "exact" })
      .eq("id", dossierA.id);

    if (aDelErr) {
      log.ko(`A non può cancellare il proprio dossier: ${aDelErr.message}`);
    } else if (aDelCount === 1) {
      log.ok(`A ha cancellato 1 dossier (il proprio)`);
      dossierIds.pop(); // già cancellato
    } else {
      log.ko(`A ha cancellato ${aDelCount} righe (atteso 1)`);
    }
  } catch (e) {
    log.ko(`Errore inatteso: ${e instanceof Error ? e.message : String(e)}`);
  } finally {
    console.log("\n🧹 Cleanup utenti e dossier...");
    await cleanup(userIds, dossierIds);
    log.info("Cleanup completato");
  }

  console.log(`\n📊 Risultato: ${pass} ok, ${fail} ko\n`);
  process.exit(fail > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error("💥 Test crashed:", e);
  process.exit(2);
});
