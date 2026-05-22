/**
 * fix_env_api.mjs
 * Imposta le variabili d'ambiente di produzione su Vercel tramite REST API.
 * Usa fetch nativo di Node.js — zero shell escaping, zero ambiguità.
 *
 * Usage: node scratch/fix_env_api.mjs
 */

import { readFileSync } from 'fs';
import { createRequire } from 'module';

// ─── CONFIG ────────────────────────────────────────────────────────────────
const VERCEL_TOKEN = "vca_5hDj1mpyhYID3pP8t4O3fQlFIQVSED7iKNgUkLTjtyP4CrOX7x3MNXf3";
const PROJECT_ID   = "prj_v9GXt6n0BwyAqxqyww0Z86zHjdDx";
const TEAM_ID      = "team_ZUvzM5gzvLiq063cE99CrElw";

// ─── ENV VARS TO SET ───────────────────────────────────────────────────────
// ATTENZIONE: i valori sono letti dal file .env.local locale per evitare
// qualsiasi problema di escaping nella shell.
function loadEnvLocal() {
  const content = readFileSync('c:\\Antigravity\\armocromia-mvp\\.env.local', 'utf8');
  const vars = {};
  for (const line of content.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]+)="(.*)"\s*$/);
    if (m) vars[m[1]] = m[2];
  }
  return vars;
}

const localEnv = loadEnvLocal();

const ENV_VARS = [
  {
    key:    'LEMON_SQUEEZY_API_KEY',
    value:  localEnv['LEMON_SQUEEZY_API_KEY'],
    target: ['production', 'development'],
    type:   'encrypted',
  },
  {
    key:    'LEMON_SQUEEZY_STORE_ID',
    value:  '383875',
    target: ['production', 'development'],
    type:   'encrypted',
  },
  {
    key:    'LEMON_SQUEEZY_VARIANT_ID',
    value:  '1690779',
    target: ['production', 'development'],
    type:   'encrypted',
  },
  {
    key:    'LEMON_SQUEEZY_WEBHOOK_SECRET',
    value:  'ArmoSecretWebhook2026!',
    target: ['production', 'development'],
    type:   'encrypted',
  },
  {
    key:    'NEXT_PUBLIC_SITE_URL',
    value:  'https://armocromia-mvp-nine.vercel.app',
    target: ['production'],
    type:   'plain',
  },
  {
    key:    'SUPABASE_SECRET_KEY',
    value:  localEnv['SUPABASE_SECRET_KEY'],
    target: ['production', 'development'],
    type:   'encrypted',
  },
  {
    key:    'ADMIN_EMAILS',
    value:  'gamatig@gmail.com',
    target: ['production', 'development'],
    type:   'plain',
  },
];

// ─── API HELPERS ───────────────────────────────────────────────────────────
const BASE = `https://api.vercel.com`;
const headers = {
  Authorization: `Bearer ${VERCEL_TOKEN}`,
  'Content-Type': 'application/json',
};

async function listEnv() {
  const res = await fetch(
    `${BASE}/v9/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}&decrypt=true`,
    { headers }
  );
  if (!res.ok) throw new Error(`listEnv failed: ${res.status} ${await res.text()}`);
  return (await res.json()).envs || [];
}

async function deleteEnv(envId) {
  const res = await fetch(
    `${BASE}/v9/projects/${PROJECT_ID}/env/${envId}?teamId=${TEAM_ID}`,
    { method: 'DELETE', headers }
  );
  if (!res.ok) throw new Error(`deleteEnv ${envId} failed: ${res.status} ${await res.text()}`);
}

async function createEnv(key, value, target, type) {
  const body = JSON.stringify({ key, value, target, type });
  const res = await fetch(
    `${BASE}/v10/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`,
    { method: 'POST', headers, body }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(`createEnv ${key} failed: ${res.status} ${JSON.stringify(data)}`);
  return data;
}

// ─── MAIN ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔍 Fetching existing env vars from Vercel...\n');
  const existing = await listEnv();

  // Log existing state
  for (const v of existing) {
    console.log(`  Existing: ${v.key} [${v.target?.join(',')}] = "${v.value?.substring(0,30) || ''}..."`);
  }

  console.log('\n🗑️  Removing existing entries for our keys...\n');
  for (const envVar of ENV_VARS) {
    const matches = existing.filter(e => e.key === envVar.key);
    for (const match of matches) {
      console.log(`  Deleting ${match.key} [${match.target?.join(',')}] (id: ${match.id})`);
      await deleteEnv(match.id);
    }
  }

  console.log('\n✅ Creating env vars with correct values via REST API...\n');
  for (const envVar of ENV_VARS) {
    if (!envVar.value) {
      console.error(`  ⚠️  SKIP ${envVar.key} — value is empty!`);
      continue;
    }
    console.log(`  Setting ${envVar.key} [${envVar.target.join(',')}] = "${envVar.value.substring(0, 30)}..."`);
    await createEnv(envVar.key, envVar.value, envVar.target, envVar.type);
    console.log(`  ✓ ${envVar.key} set successfully`);
  }

  console.log('\n🎉 All env vars set. Verifying...\n');
  const updated = await listEnv();
  for (const v of updated.filter(e => ENV_VARS.some(ev => ev.key === e.key))) {
    const val = v.value || '';
    const preview = val.length > 0 ? `"${val.substring(0,40)}..."` : '⚠️  EMPTY!';
    console.log(`  ${v.key} [${v.target?.join(',')}] = ${preview}`);
  }
}

main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
