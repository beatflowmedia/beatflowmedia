#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Common unused imports to remove
const COMMON_UNUSED_IMPORTS = [
  'useMemo',
  'useCallback',
  'PropTypes',
  'CircularProgress',
  'Avatar',
  'Rating',
  'Shuffle',
  'SkipNext',
  'SkipPrevious',
  'VolumeUp',
  'Search',
  'FilterList',
  'Tooltip',
  'Fab',
  'Fade',
  'Slide',
  'Pause',
  'Public',
  'Lock',
  'PersonRemove',
  'Download',
  'Repeat',
  'CalendarToday',
  'PlaylistPlay',
  'PlaylistAdd',
  'Sort',
  'Close',
  'Save',
  'addDoc',
  'arrayRemove',
  'arrayUnion',
  'onSnapshot'
];

// Process a single file
function cleanupFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;

    // Remove unused import statements
    COMMON_UNUSED_IMPORTS.forEach(importName => {
      // Remove from import lists
      const importRegex = new RegExp(`,\\s*${importName}\\b`, 'g');
      newContent = newContent.replace(importRegex, '');

      const startImportRegex = new RegExp(`\\b${importName},\\s*`, 'g');
      newContent = newContent.replace(startImportRegex, '');

      // Remove standalone imports
      const standaloneRegex = new RegExp(`import\\s+${importName}\\s+from.*?;\\n`, 'g');
      newContent = newContent.replace(standaloneRegex, '');
    });

    // Clean up empty import lines
    newContent = newContent.replace(/import\s*{\s*}\s*from.*?;\n/g, '');

    // Clean up trailing commas in imports
    newContent = newContent.replace(/,(\s*})/g, '$1');

    // Write back if changed
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent);
      console.log(`✅ Cleaned up: ${filePath}`);
      return true;
    }

    return false;
  } catch (err) {
    console.error(`❌ Error processing ${filePath}:`, err.message);
    return false;
  }
}

// Find all JS/JSX files
function findJSFiles(dir) {
  const files = [];

  function traverse(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        traverse(fullPath);
      } else if (entry.isFile() && /\.(js|jsx)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

// Main execution
function main() {
  const srcDir = path.join(process.cwd(), 'src');

  if (!fs.existsSync(srcDir)) {
    console.error('❌ src directory not found');
    process.exit(1);
  }

  console.log('🧹 Starting cleanup of unused imports...');

  const jsFiles = findJSFiles(srcDir);
  let cleanedCount = 0;

  jsFiles.forEach(file => {
    if (cleanupFile(file)) {
      cleanedCount++;
    }
  });

  console.log(`\n✨ Cleanup complete! Processed ${jsFiles.length} files, cleaned ${cleanedCount} files.`);
  console.log('🔧 Running ESLint auto-fix...');

  // Run ESLint auto-fix
  const { execSync } = require('child_process');
  try {
    execSync('npm run lint', { stdio: 'inherit' });
    console.log('✅ ESLint auto-fix completed!');
  } catch (err) {
    console.log('⚠️ ESLint completed with some remaining issues');
  }
}

if (require.main === module) {
  main();
}

module.exports = { cleanupFile, findJSFiles };