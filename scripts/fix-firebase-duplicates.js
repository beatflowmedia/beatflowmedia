#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files with duplicate Firebase imports that need consolidation
const FIREBASE_DUPLICATE_FIXES = [
  {
    file: 'src/pages/ForArtists.js',
    // Has: import { collection, Timestamp } from "firebase/firestore" (line 9)
    // Has: import { addDoc } from 'firebase/firestore' (line 12)
    // Should consolidate into line 9
    action: 'consolidate',
    keep: 'import { collection, Timestamp } from "firebase/firestore";',
    remove: 'import { addDoc } from \'firebase/firestore\';',
    replace: 'import { collection, Timestamp, addDoc } from "firebase/firestore";'
  },
  {
    file: 'src/pages/Jobs.js',
    action: 'consolidate',
    keep: 'import { collection, Timestamp } from "firebase/firestore";',
    remove: 'import { addDoc } from \'firebase/firestore\';',
    replace: 'import { collection, Timestamp, addDoc } from "firebase/firestore";'
  },
  {
    file: 'src/pages/Investors.js',
    action: 'consolidate',
    keep: 'import { collection, serverTimestamp } from "firebase/firestore";',
    remove: 'import { addDoc } from \'firebase/firestore\';',
    replace: 'import { collection, serverTimestamp, addDoc } from "firebase/firestore";'
  },
  {
    file: 'src/pages/CuratorInbox.js',
    action: 'consolidate',
    keep: 'import { getDocs } from "firebase/firestore";',
    remove: 'import { onSnapshot, addDoc } from \'firebase/firestore\';',
    replace: 'import { getDocs, onSnapshot, addDoc } from "firebase/firestore";'
  },
  {
    file: 'src/pages/Artist.js',
    action: 'consolidate',
    keep: 'import { getDocs } from "firebase/firestore";',
    remove: 'import { onSnapshot } from \'firebase/firestore\';',
    replace: 'import { getDocs, onSnapshot } from "firebase/firestore";'
  },
  {
    file: 'src/pages/Playlist.js',
    action: 'consolidate',
    keep: 'import { getDocs } from "firebase/firestore";',
    remove: 'import { onSnapshot, arrayUnion } from \'firebase/firestore\';',
    replace: 'import { getDocs, onSnapshot, arrayUnion } from "firebase/firestore";'
  },
  {
    file: 'src/services/ingestionService.js',
    action: 'consolidate',
    keep: 'import { collection } from "firebase/firestore";',
    remove: 'import { addDoc } from \'firebase/firestore\';',
    replace: 'import { collection, addDoc } from "firebase/firestore";'
  },
  {
    file: 'src/utils/PlaylistHelper.js',
    action: 'remove_duplicate',
    remove: 'import { onSnapshot, addDoc, arrayUnion } from \'firebase/firestore\';'
  }
];

function fixFile(filePath, fix) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    const content = fs.readFileSync(fullPath, 'utf8');

    if (fix.action === 'consolidate') {
      let newContent = content;

      // Replace the keep line with the consolidated import
      newContent = newContent.replace(fix.keep, fix.replace);

      // Remove the duplicate line
      const lines = newContent.split('\n');
      const filteredLines = lines.filter(line =>
        line.trim() !== fix.remove.trim()
      );

      if (filteredLines.length < lines.length) {
        newContent = filteredLines.join('\n');
        fs.writeFileSync(fullPath, newContent);
        console.log(`✅ Consolidated Firebase imports in: ${filePath}`);
        return true;
      }
    } else if (fix.action === 'remove_duplicate') {
      const lines = content.split('\n');
      const filteredLines = lines.filter(line =>
        line.trim() !== fix.remove.trim()
      );

      if (filteredLines.length < lines.length) {
        const newContent = filteredLines.join('\n');
        fs.writeFileSync(fullPath, newContent);
        console.log(`✅ Removed duplicate Firebase import in: ${filePath}`);
        return true;
      }
    }

    return false;
  } catch (err) {
    console.error(`❌ Error processing ${filePath}:`, err.message);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing duplicate Firebase imports...');

  let fixedCount = 0;

  FIREBASE_DUPLICATE_FIXES.forEach(fix => {
    if (fixFile(fix.file, fix)) {
      fixedCount++;
    }
  });

  console.log(`\n✨ Fixed ${fixedCount} files with duplicate Firebase imports!`);
}

if (require.main === module) {
  main();
}

module.exports = { fixFile };