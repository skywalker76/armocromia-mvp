const fs = require('fs');
const path = require('path');

function searchDir(dir, query) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.next') {
        searchDir(filePath, query);
      }
    } else {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.toLowerCase().includes(query.toLowerCase())) {
          console.log(`Found in: ${filePath}`);
          const lines = content.split('\n');
          lines.forEach((line, idx) => {
            if (line.toLowerCase().includes(query.toLowerCase())) {
              console.log(`  L${idx + 1}: ${line.trim()}`);
            }
          });
        }
      } catch (e) {
        // ignore errors
      }
    }
  }
}

console.log("Searching in armocromia-mvp...");
searchDir('c:\\Antigravity\\armocromia-mvp', 'LEMON_SQUEEZY');

console.log("\nSearching in Vault...");
searchDir('c:\\Antigravity\\vault', 'lemonsqueezy');
searchDir('c:\\Antigravity\\vault', '383875');
