const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const DEMO_DIR = path.join(__dirname, 'public', 'demo');

// The 4 main dossier images to optimize (the ones with full looks, ~8MB each)
const IMAGES = [
  'dossier-real-autunno-profondo.png',
  'dossier-real-autunno-tenue.png',
  'dossier-real-inverno-freddo.png',
  'dossier-real-primavera-calda.png',
];

// Target: max 800px wide (portrait dossiers), high quality WebP
// Original images are tall portrait format, so we resize by width
const MAX_WIDTH = 800;
const QUALITY = 82; // Good balance between size and quality

async function optimize() {
  console.log('🖼️  Optimizing dossier images...\n');
  
  for (const filename of IMAGES) {
    const inputPath = path.join(DEMO_DIR, filename);
    const outputName = filename.replace('.png', '.webp');
    const outputPath = path.join(DEMO_DIR, outputName);
    
    if (!fs.existsSync(inputPath)) {
      console.log(`⚠️  Skipping ${filename} — not found`);
      continue;
    }
    
    const inputStats = fs.statSync(inputPath);
    const inputSizeMB = (inputStats.size / 1024 / 1024).toFixed(1);
    
    // Get input dimensions
    const metadata = await sharp(inputPath).metadata();
    
    await sharp(inputPath)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: 6 })
      .toFile(outputPath);
    
    const outputStats = fs.statSync(outputPath);
    const outputSizeKB = (outputStats.size / 1024).toFixed(0);
    const reduction = ((1 - outputStats.size / inputStats.size) * 100).toFixed(0);
    
    console.log(`✅ ${filename}`);
    console.log(`   ${metadata.width}x${metadata.height} → ${MAX_WIDTH}px wide`);
    console.log(`   ${inputSizeMB}MB → ${outputSizeKB}KB (−${reduction}%)\n`);
  }
  
  // Also optimize the two Inverno Brillante bonus images
  const BONUS = [
    'dossier-real-inverno-brillante-1.png',
    'dossier-real-inverno-brillante-2.png',
  ];
  
  for (const filename of BONUS) {
    const inputPath = path.join(DEMO_DIR, filename);
    const outputName = filename.replace('.png', '.webp');
    const outputPath = path.join(DEMO_DIR, outputName);
    
    if (!fs.existsSync(inputPath)) continue;
    
    const inputStats = fs.statSync(inputPath);
    const inputSizeMB = (inputStats.size / 1024 / 1024).toFixed(1);
    
    await sharp(inputPath)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: 6 })
      .toFile(outputPath);
    
    const outputStats = fs.statSync(outputPath);
    const outputSizeKB = (outputStats.size / 1024).toFixed(0);
    const reduction = ((1 - outputStats.size / inputStats.size) * 100).toFixed(0);
    
    console.log(`✅ ${filename} (bonus)`);
    console.log(`   ${inputSizeMB}MB → ${outputSizeKB}KB (−${reduction}%)\n`);
  }
  
  console.log('🎉 Done! All images optimized.');
  console.log('   Original PNGs kept as backup — safe to delete later.');
}

optimize().catch(console.error);
