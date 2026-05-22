const fs = require('fs');

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

async function listVariants() {
  console.log("Fetching variants from Lemon Squeezy...");
  const response = await fetch("https://api.lemonsqueezy.com/v1/variants?include=product", {
    headers: {
      "Accept": "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      "Authorization": `Bearer ${apiKey}`,
    }
  });

  const text = await response.text();
  console.log(`Status: ${response.status}`);
  try {
    const json = JSON.parse(text);
    if (json.data && Array.isArray(json.data)) {
      console.log(`Found ${json.data.length} variants:`);
      json.data.forEach(v => {
        console.log(`- ID: ${v.id} (Type: ${typeof v.id})`);
        console.log(`  Name: ${v.attributes.name}`);
        console.log(`  Status: ${v.attributes.status}`);
        console.log(`  Price: ${v.attributes.price}`);
      });
    } else {
      console.log("JSON response:", JSON.stringify(json, null, 2));
    }
  } catch (e) {
    console.log("Text response:", text);
  }
}

listVariants();
