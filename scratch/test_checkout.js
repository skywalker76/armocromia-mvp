const fs = require('fs');

// Simple helper to load .env file
function loadEnv(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.\-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

loadEnv('c:\\Antigravity\\armocromia-mvp\\.env.local');

const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
const variantId = "1690779";

console.log("Loaded credentials:");
console.log(`API KEY: ${apiKey ? apiKey.substring(0, 20) + "..." : "undefined"}`);
console.log(`STORE ID: ${storeId}`);
console.log(`VARIANT ID: ${variantId}`);

async function testCheckout() {
  const siteUrl = "http://localhost:3000";
  const redirectUrl = `${siteUrl}/it/dashboard?payment_success=true&dossier_id=123`;

  console.log("Calling Lemon Squeezy API...");
  const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      "Accept": "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: "test@example.com",
            custom: {
              user_id: "user_123",
              dossier_id: "123",
              analysis_mode: "full",
              locale: "it",
            },
          },
          checkout_options: {
            embed: false,
            dark: true,
            media: true,
            logo: true,
          },
          product_options: {
            enabled_variants: [variantId], // try passing it raw
            redirect_url: redirectUrl,
          },
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: String(storeId),
            },
          },
          variant: {
            data: {
              type: "variants",
              id: String(variantId),
            },
          },
        },
      },
    }),
  });

  console.log(`Status: ${response.status}`);
  const text = await response.text();
  try {
    const json = JSON.parse(text);
    console.log("Response JSON:", JSON.stringify(json, null, 2));
  } catch (e) {
    console.log("Response text:", text);
  }
}

testCheckout();
