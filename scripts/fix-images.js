#!/usr/bin/env node
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const MAX_SIZE = 512;

// Files with wrong extensions
const MISNAMED = [
  'artistImages/Avery Meadows.jpg',
  'artistImages/Beat Flow.jpg',
  'artistImages/Dera Songs.jpg',
  'artistImages/Markey Mauley.jpg',
  'artistImages/Tristan Milo.jpg',
  'artistImages/Unknown Artist.jpg'
];

async function fixAndOptimize() {
  console.log('🔧 Fixing image issues...\n');
  
  // Fix extensions
  for (const file of MISNAMED) {
    const fullPath = path.join(PUBLIC_DIR, file);
    const newPath = fullPath.replace(/\.jpg$/, '.png');
    
    if (fs.existsSync(fullPath) && !fs.existsSync(newPath)) {
      fs.renameSync(fullPath, newPath);
      console.log(`✅ Renamed: ${path.basename(fullPath)} → ${path.basename(newPath)}`);
    }
  }

  // Optimize all artist images
  const dir = path.join(PUBLIC_DIR, 'artistImages');
  const files = fs.readdirSync(dir).filter(f => /\.(png|jpg)$/i.test(f));

  let totalSaved = 0;

  for (const file of files) {
    const filePath = path.join(dir, file);
    const webpPath = filePath.replace(/\.(png|jpg)$/i, '.webp');
    const metadata = await sharp(filePath).metadata();
    const originalSize = fs.statSync(filePath).size;

    if (fs.existsSync(webpPath)) {
      console.log(`⏭️  Skipping ${file} - WebP exists`);
      continue;
    }

    const needsResize = metadata.width > MAX_SIZE || metadata.height > MAX_SIZE;

    const info = await sharp(filePath)
      .resize(MAX_SIZE, MAX_SIZE, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(webpPath);

    totalSaved += (originalSize - info.size);

    console.log(`✅ ${file}: ${metadata.width}x${metadata.height} → ${info.width}x${info.height} (saved ${((originalSize - info.size) / 1024).toFixed(1)}KB)`);
  }

  console.log(`\n💾 Total saved: ${(totalSaved / 1024).toFixed(1)}KB`);
}

fixAndOptimize().catch(console.error);
