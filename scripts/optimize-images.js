// scripts/optimize-images.js
// Optimize images by converting to WebP and compressing
// Run with: node scripts/optimize-images.js

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '../public');
const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png'];
const MAX_WIDTH = 800; // Max width for album/song art
const QUALITY = 80; // WebP quality (0-100)

async function optimizeImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (!SUPPORTED_FORMATS.includes(ext)) {
    return;
  }

  try {
    const outputPath = filePath.replace(ext, '.webp');

    // Skip if WebP already exists and is newer
    if (fs.existsSync(outputPath)) {
      const originalStat = fs.statSync(filePath);
      const webpStat = fs.statSync(outputPath);
      if (webpStat.mtime > originalStat.mtime) {
        console.log(`✓ Skipping ${path.basename(filePath)} (WebP exists)`);
        return;
      }
    }

    await sharp(filePath)
      .resize(MAX_WIDTH, MAX_WIDTH, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: QUALITY })
      .toFile(outputPath);

    const originalSize = fs.statSync(filePath).size;
    const webpSize = fs.statSync(outputPath).size;
    const savings = ((originalSize - webpSize) / originalSize * 100).toFixed(1);

    console.log(`✅ ${path.basename(filePath)} → ${path.basename(outputPath)}`);
    console.log(`   ${(originalSize / 1024).toFixed(1)} KB → ${(webpSize / 1024).toFixed(1)} KB (${savings}% smaller)`);
  } catch (error) {
    console.error(`❌ Error optimizing ${filePath}:`, error.message);
  }
}

async function optimizeDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      await optimizeDirectory(filePath);
    } else {
      await optimizeImage(filePath);
    }
  }
}

async function main() {
  console.log('🖼️  Optimizing images in public directory...\n');

  if (!fs.existsSync(PUBLIC_DIR)) {
    console.error('❌ Public directory not found');
    process.exit(1);
  }

  await optimizeDirectory(PUBLIC_DIR);

  console.log('\n✅ Image optimization complete!');
  console.log('💡 Tip: Update your code to use .webp files with fallbacks to original formats');
}

main();
