#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files with duplicate PlayArrow imports that need to be removed
const DUPLICATE_FIXES = [
  {
    file: 'src/pages/CampaignWizard.js',
    remove: 'import { PlayArrow } from \'@mui/icons-material/PlayArrow\';'
  },
  {
    file: 'src/pages/CuratorInbox.js',
    remove: 'import { PlayArrow } from \'@mui/icons-material/PlayArrow\';'
  },
  {
    file: 'src/pages/InvestorPortal.js',
    remove: 'import { PlayArrow } from \'@mui/icons-material/PlayArrow\';'
  },
  {
    file: 'src/pages/Playlist.js',
    remove: 'import { PlayArrow } from \'@mui/icons-material/PlayArrow\';'
  },
  {
    file: 'src/pages/Search.js',
    remove: 'import { PlayArrow } from \'@mui/icons-material/PlayArrow\';'
  }
];

function fixFile(filePath, removeStatement) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    const content = fs.readFileSync(fullPath, 'utf8');

    // Remove the duplicate import line
    const lines = content.split('\n');
    const filteredLines = lines.filter(line =>
      line.trim() !== removeStatement.trim()
    );

    if (filteredLines.length < lines.length) {
      const newContent = filteredLines.join('\n');
      fs.writeFileSync(fullPath, newContent);
      console.log(`✅ Fixed duplicate import in: ${filePath}`);
      return true;
    }

    return false;
  } catch (err) {
    console.error(`❌ Error processing ${filePath}:`, err.message);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing duplicate imports...');

  let fixedCount = 0;

  DUPLICATE_FIXES.forEach(({ file, remove }) => {
    if (fixFile(file, remove)) {
      fixedCount++;
    }
  });

  console.log(`\n✨ Fixed ${fixedCount} duplicate imports!`);
}

if (require.main === module) {
  main();
}

module.exports = { fixFile };