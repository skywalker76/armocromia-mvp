const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const envs = {
  LEMON_SQUEEZY_WEBHOOK_SECRET: "ArmoSecretWebhook2026!",
  LEMON_SQUEEZY_STORE_ID: "383875",
  LEMON_SQUEEZY_VARIANT_ID: "1690779",
  NEXT_PUBLIC_SITE_URL: "https://armocromia-mvp-tan.vercel.app",
  ADMIN_EMAILS: "gamatig@gmail.com",
  NEXT_PUBLIC_SUPABASE_URL: "https://xjmhzdwmngzrosuxqfff.supabase.co",
};

// Also load from .env.local to get the long secret keys
const envLocalPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, "utf8");
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const firstEq = trimmed.indexOf("=");
    if (firstEq === -1) return;
    const key = trimmed.slice(0, firstEq).trim();
    let val = trimmed.slice(firstEq + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    }
    if (val.startsWith("'") && val.endsWith("'")) {
      val = val.slice(1, -1);
    }
    if (key === "LEMON_SQUEEZY_API_KEY" || key === "SUPABASE_SECRET_KEY" || key === "FAL_KEY" || key === "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") {
      envs[key] = val;
    }
  });
}

const keys = Object.keys(envs);
console.log("Starting env deployment. Keys to deploy:", keys);

async function deployKey(key, value) {
  return new Promise((resolve, reject) => {
    console.log(`\n--- Deploying ${key} to Vercel (Production) ---`);
    // First delete if exists, to avoid duplicate or prompt issues
    const rmProc = spawn("npx", ["vercel", "env", "rm", key, "production", "-y"], {
      stdio: "inherit",
      shell: true,
    });

    rmProc.on("close", () => {
      // Now add it back
      const addProc = spawn("npx", ["vercel", "env", "add", key, "production"], {
        stdio: ["pipe", "inherit", "inherit"],
        shell: true,
      });

      // Write exactly the value to stdin and close it
      addProc.stdin.write(value);
      addProc.stdin.end();

      addProc.on("close", (code) => {
        if (code === 0) {
          console.log(`✅ Successfully deployed ${key}`);
          resolve();
        } else {
          console.error(`❌ Failed to deploy ${key} (code ${code})`);
          reject(new Error(`Failed with code ${code}`));
        }
      });
    });
  });
}

async function main() {
  for (const key of keys) {
    if (!envs[key]) {
      console.warn(`⚠️ Key ${key} has empty value, skipping.`);
      continue;
    }
    await deployKey(key, envs[key]);
  }
  console.log("\n✨ All environment variables deployed successfully with no trailing newlines!");
}

main().catch(console.error);
