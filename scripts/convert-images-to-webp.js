#!/usr/bin/env node
/**
 * Script to convert JPG and PNG images to WebP format
 * Reduces file sizes significantly for better performance
 *
 * Usage: node scripts/convert-images-to-webp.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const IMAGE_DIRS = ['images', 'artistImages'];

async function convertImageToWebP(imagePath) {
  const parsedPath = path.parse(imagePath);
  const webpPath = path.join(parsedPath.dir, `${parsedPath.name}.webp`);

  // Skip if WebP already exists
  if (fs.existsSync(webpPath)) {
    console.log(`⏭️  Skipping ${path.basename(imagePath)} - WebP already exists`);
    return;
  }

  try {
    const info = await sharp(imagePath)
      .webp({ quality: 85 })
      .toFile(webpPath);

    const originalSize = fs.statSync(imagePath).size;
    const newSize = info.size;
    const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);

    console.log(`✅ Converted ${path.basename(imagePath)}`);
    console.log(`   Original: ${(originalSize / 1024).toFixed(1)}KB → WebP: ${(newSize / 1024).toFixed(1)}KB (${savings}% smaller)`);
  } catch (error) {
    console.error(`❌ Failed to convert ${imagePath}:`, error.message);
  }
}

async function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Directory not found: ${dirPath}`);
    return;
  }

  const files = fs.readdirSync(dirPath);
  const imageFiles = files.filter(file =>
    /\.(jpg|jpeg|png)$/i.test(file) &&
    !file.startsWith('.') // Skip hidden files
  );

  console.log(`\n📁 Processing ${dirPath}...`);
  console.log(`Found ${imageFiles.length} images to convert\n`);

  for (const file of imageFiles) {
    const fullPath = path.join(dirPath, file);
    await convertImageToWebP(fullPath);
  }
}

async function main() {
  console.log('🖼️  BeatFlow Media - Image to WebP Converter\n');
  console.log('This will convert all JPG and PNG images to WebP format');
  console.log('Original files will be kept as fallbacks\n');

  let totalConverted = 0;

  for (const dir of IMAGE_DIRS) {
    const fullPath = path.join(PUBLIC_DIR, dir);
    await processDirectory(fullPath);
  }

  console.log('\n✨ Conversion complete!');
  console.log('\nNext steps:');
  console.log('1. Use OptimizedImage component in your React components');
  console.log('2. Deploy to see performance improvements');
  console.log('3. Run Lighthouse to verify improvements\n');
}

main().catch(console.error);
