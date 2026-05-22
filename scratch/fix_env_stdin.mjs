/**
 * fix_env_stdin.mjs
 * Imposta le variabili d'ambiente su Vercel usando stdin piping tramite child_process.spawn
 * per evitare qualsiasi problema di escaping della shell su Windows.
 *
 * Usage: node scratch/fix_env_stdin.mjs
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

// ─── Leggi .env.local ──────────────────────────────────────────────────────
function loadEnvLocal(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const vars = {};
  for (const line of content.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]+)="(.+)"\s*$/);
    if (m) vars[m[1]] = m[2];
  }
  return vars;
}

const localEnv = loadEnvLocal('c:\\Antigravity\\armocromia-mvp\\.env.local');

// ─── Variabili da impostare ────────────────────────────────────────────────
const ENV_VARS = [
  { key: 'LEMON_SQUEEZY_API_KEY',       value: localEnv['LEMON_SQUEEZY_API_KEY'],   envs: ['production', 'development'] },
  { key: 'LEMON_SQUEEZY_STORE_ID',      value: '383875',                             envs: ['production', 'development'] },
  { key: 'LEMON_SQUEEZY_VARIANT_ID',    value: '1690779',                            envs: ['production', 'development'] },
  { key: 'LEMON_SQUEEZY_WEBHOOK_SECRET',value: 'ArmoSecretWebhook2026!',             envs: ['production', 'development'] },
  { key: 'NEXT_PUBLIC_SITE_URL',        value: 'https://armocromia-mvp-nine.vercel.app', envs: ['production'] },
  { key: 'SUPABASE_SECRET_KEY',         value: localEnv['SUPABASE_SECRET_KEY'],      envs: ['production', 'development'] },
  { key: 'ADMIN_EMAILS',                value: 'gamatig@gmail.com',                  envs: ['production', 'development'] },
];

// ─── Helper: esegui vercel env con spawn e stdin ───────────────────────────
function vercelEnvCmd(args, stdinValue) {
  return new Promise((resolve, reject) => {
    const proc = spawn('npx', ['vercel', ...args], {
      cwd: 'c:\\Antigravity\\armocromia-mvp',
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', d => { stdout += d; process.stdout.write(d); });
    proc.stderr.on('data', d => { stderr += d; process.stderr.write(d); });

    // Scrivi il valore su stdin (evita escaping della shell)
    if (stdinValue !== undefined) {
      proc.stdin.write(stdinValue + '\n');
      proc.stdin.end();
    }

    proc.on('close', code => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`Exit ${code}: ${stderr}`));
    });
    proc.on('error', reject);
  });
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  for (const { key, value, envs } of ENV_VARS) {
    if (!value) {
      console.error(`\n⚠️  SKIP ${key} — value is empty in .env.local!`);
      continue;
    }

    // 1. Rimuovi le istanze esistenti per tutti gli ambienti
    for (const env of envs) {
      console.log(`\n🗑️  Removing ${key} [${env}]...`);
      try {
        await vercelEnvCmd(['env', 'rm', key, env, '-y'], undefined);
      } catch (e) {
        console.log(`   (no existing entry or already deleted)`);
      }
    }

    // 2. Aggiungi con stdin per ciascun ambiente
    for (const env of envs) {
      console.log(`\n✅ Adding ${key} [${env}] via stdin...`);
      try {
        // vercel env add KEY ENV legge il valore da stdin
        await vercelEnvCmd(['env', 'add', key, env, '--force'], value);
        console.log(`   ✓ ${key} [${env}] set!`);
      } catch (e) {
        console.error(`   ❌ Failed ${key} [${env}]: ${e.message}`);
      }
    }
  }

  console.log('\n\n🔍 Verification — pulling production env...');
  try {
    await vercelEnvCmd(['env', 'pull', '--environment', 'production', '.env.verify.final'], undefined);
    const content = readFileSync('c:\\Antigravity\\armocromia-mvp\\.env.verify.final', 'utf8');
    console.log('\n--- Production env values ---');
    for (const line of content.split('\n')) {
      if (line.match(/^(LEMON_SQUEEZY|SUPABASE_SECRET|ADMIN_EMAILS|NEXT_PUBLIC_SITE_URL)/)) {
        const isEmpty = line.endsWith('=""');
        console.log(isEmpty ? `  ⚠️  ${line} ← EMPTY!` : `  ✓  ${line.substring(0, 60)}...`);
      }
    }
  } catch (e) {
    console.error('Verification pull failed:', e.message);
  }

  console.log('\n🚀 Done! Now run: npx vercel --prod --yes');
}

main().catch(err => {
  console.error('\n❌ Fatal:', err.message);
  process.exit(1);
});
