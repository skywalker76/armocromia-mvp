const { execSync } = require('child_process');

const envs = {
  LEMON_SQUEEZY_API_KEY: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5NGQ1OWNlZi1kYmI4LTRlYTUtYjE3OC1kMjU0MGZjZDY5MTkiLCJqdGkiOiJmYmE2MjIzMDcxYmExN2E5ZGUyZTBkZmY2YTQ4OWVlZTM0NTJiNDJjMGE5NzVkYzI1ZDQ3MjcxMGRjOGM4MTkxOGJlMDBkNWU1OGU4OGE2NyIsImlhdCI6MTc3OTQ1NjM1NS40ODU5MzQsIm5iZiI6MTc3OTQ1NjM1NS40ODU5MzYsImV4cCI6MTc5NTMwNTYwMC4wMzIyMDYsInN1YiI6IjY1MjI4NDMiLCJzY29wZXMiOltdfQ.Fhxtjq-uFy5EHBxYEPHI8HhYXIXIJbjU4AXCQTK4uENEHFNSqpgP3WmNa3j6AjYyvCix0x1hLwVVLFceTatVrDYH4BFpp3LGf74lV_dZzepYjX66RDLHDa_xxbAKAYshTT32aM-qSjqjZAmkTmqL9SCAIV_GNgEAIzqa7sXF4up4T6ofAjmYIZwOLrx8TTyRCrrCcEzaUDtirplFUDXinqyOZXQ0mZO4munXpKTlGb1H8NhLPceM6raVa0EZ6lPenhlskMntQQTq5uOb9J6DtKrNpr8N1akQV9ZPBAZLauWGieW8V8Q3icCubX-lhBk0jktroubuA5zIV2fXaPJPtPMcOBAsM042pP7nyGpgC4SyhWvTUtnxHY27GKLxkKEEYlrJwzW_xsEc9VKu-Yo8f5EkxeC5nA-p5t4nKwy1ePxAsUf-iuv2BTJ1Mec_YNnzr7I8CxSFAmN1XJQlYtrW6llhRqtJFMPPewRQQlWV0Uddt0gvbZpbSsbuD0wDFJf7FnMBhsgLSmdwBNnN0VO9r3o-GBbm5qSshBLFPxKO8FvdBNu1hU5Hs5M3zgQLbqlFwdB6MLkUveHrhCkJcvv_31LlwiCpYWKsI1RKYc1BzdrX9Bursxkl2oNLCr1HZond_lEQiRZhKO9wEyxj2RX1WQfmk4HqDpji_VzUsoi04As",
  LEMON_SQUEEZY_STORE_ID: "383875",
  LEMON_SQUEEZY_VARIANT_ID: "1690779", // correct numeric variant ID!
  LEMON_SQUEEZY_WEBHOOK_SECRET: "ArmoSecretWebhook2026!",
  NEXT_PUBLIC_SITE_URL: "https://armocromia-mvp-nine.vercel.app", // correct production site URL!
  SUPABASE_SECRET_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqbWh6ZHdtbmd6cm9zdXhxZmZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzg0MDQwMCwiZXhwIjoyMDkzNDE2NDAwfQ.RPIuNepQukpzohDKENK-GD4y3eiSjNUm9KFtDC8eH-U",
  ADMIN_EMAILS: "gamatig@gmail.com"
};

console.log("Starting environment variable sync on Vercel (using npx -y vercel, production and development only)...");

for (const [key, val] of Object.entries(envs)) {
  console.log(`\n--- Syncing ${key} ---`);
  
  // 1. Remove existing environment variable for production and development (best effort)
  for (const env of ['production', 'development']) {
    try {
      console.log(`Removing ${key} from ${env}...`);
      execSync(`npx -y vercel env rm ${key} ${env} -y`, { stdio: 'ignore' });
    } catch (e) {
      // ignore
    }
  }

  // 2. Add environment variable for production and development
  for (const env of ['production', 'development']) {
    try {
      console.log(`Adding ${key} to ${env}...`);
      
      // Escape value quotes for shell execution
      const escapedVal = val.replace(/"/g, '\\"');
      
      execSync(`npx -y vercel env add ${key} ${env} --value "${escapedVal}" --yes`, { stdio: 'inherit' });
      console.log(`Successfully added ${key} to ${env}`);
    } catch (err) {
      console.error(`Failed to add ${key} to ${env}:`, err.message);
    }
  }
}

console.log("\nEnvironment variables synced successfully!");
