#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Map of commonly needed imports and their sources
const IMPORT_FIXES = {
  'PropTypes': 'prop-types',
  'useCallback': 'react',
  'useMemo': 'react',
  'onSnapshot': 'firebase/firestore',
  'addDoc': 'firebase/firestore',
  'arrayUnion': 'firebase/firestore',
  'arrayRemove': 'firebase/firestore',
  'Avatar': '@mui/material/Avatar',
  'CircularProgress': '@mui/material/CircularProgress',
  'Shuffle': '@mui/icons-material/Shuffle',
  'SkipNext': '@mui/icons-material/SkipNext',
  'SkipPrevious': '@mui/icons-material/SkipPrevious',
  'VolumeUp': '@mui/icons-material/VolumeUp',
  'Pause': '@mui/icons-material/Pause',
  'PlayArrow': '@mui/icons-material/PlayArrow',
  'Repeat': '@mui/icons-material/Repeat',
  'Fade': '@mui/material/Fade',
  'Tooltip': '@mui/material/Tooltip',
  'Fab': '@mui/material/Fab'
};

// Group imports by source
const GROUPED_IMPORTS = {
  'react': ['useCallback', 'useMemo'],
  'firebase/firestore': ['onSnapshot', 'addDoc', 'arrayUnion', 'arrayRemove'],
  '@mui/material/Avatar': ['Avatar'],
  '@mui/material/CircularProgress': ['CircularProgress'],
  '@mui/material/Fade': ['Fade'],
  '@mui/material/Tooltip': ['Tooltip'],
  '@mui/material/Fab': ['Fab'],
  '@mui/icons-material/Shuffle': ['Shuffle'],
  '@mui/icons-material/SkipNext': ['SkipNext'],
  '@mui/icons-material/SkipPrevious': ['SkipPrevious'],
  '@mui/icons-material/VolumeUp': ['VolumeUp'],
  '@mui/icons-material/Pause': ['Pause'],
  '@mui/icons-material/PlayArrow': ['PlayArrow'],
  '@mui/icons-material/Repeat': ['Repeat'],
  'prop-types': ['PropTypes']
};

function findUsedImports(content) {
  const usedImports = [];

  // Check for each import in the content
  Object.keys(IMPORT_FIXES).forEach(importName => {
    // Check if the import is actually used in the code
    const usagePatterns = [
      new RegExp(`\\b${importName}\\s*\\(`, 'g'), // Function call
      new RegExp(`\\b${importName}\\.`, 'g'), // Property access
      new RegExp(`<${importName}\\b`, 'g'), // JSX component
      new RegExp(`\\b${importName}\\s*=`, 'g'), // Assignment
      new RegExp(`${importName}\\s*:`, 'g'), // Object property
      new RegExp(`\\.propTypes\\s*=.*${importName}`, 'g') // PropTypes usage
    ];

    const isUsed = usagePatterns.some(pattern => pattern.test(content));
    if (isUsed) {
      usedImports.push(importName);
    }
  });

  return usedImports;
}

function hasImport(content, importName, source) {
  // Check if import already exists
  const patterns = [
    new RegExp(`import\\s+${importName}\\s+from\\s+['"]${source}['"]`, 'g'),
    new RegExp(`import\\s*{[^}]*\\b${importName}\\b[^}]*}\\s*from\\s+['"]${source}['"]`, 'g'),
    new RegExp(`import\\s*{\\s*${importName}\\s*}\\s*from\\s+['"]${source}['"]`, 'g')
  ];

  return patterns.some(pattern => pattern.test(content));
}

function addMissingImports(content, usedImports) {
  let newContent = content;
  const importsBySource = {};

  // Group used imports by their source
  usedImports.forEach(importName => {
    const source = IMPORT_FIXES[importName];
    if (!hasImport(content, importName, source)) {
      if (!importsBySource[source]) {
        importsBySource[source] = [];
      }
      importsBySource[source].push(importName);
    }
  });

  // Add missing imports at the top of the file
  Object.entries(importsBySource).forEach(([source, imports]) => {
    if (imports.length > 0) {
      let importStatement;

      if (source === 'prop-types') {
        importStatement = `import PropTypes from 'prop-types';\n`;
      } else if (source === 'react') {
        // Check if there's already a React import
        const reactImportMatch = newContent.match(/import\s+React[^;]*from\s+['"]react['"];?/);
        if (reactImportMatch) {
          // Add to existing React import
          const existingImport = reactImportMatch[0];
          if (existingImport.includes('{')) {
            // Already has destructured imports
            const updatedImport = existingImport.replace(/}\s*from/, `, ${imports.join(', ')} } from`);
            newContent = newContent.replace(existingImport, updatedImport);
          } else {
            // Add destructured imports
            const updatedImport = existingImport.replace(/from\s+['"]react['"]/, `, { ${imports.join(', ')} } from 'react'`);
            newContent = newContent.replace(existingImport, updatedImport);
          }
          return;
        } else {
          importStatement = `import { ${imports.join(', ')} } from 'react';\n`;
        }
      } else {
        importStatement = `import { ${imports.join(', ')} } from '${source}';\n`;
      }

      // Find the best place to insert the import
      const lines = newContent.split('\n');
      let insertIndex = 0;

      // Find last import statement
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ')) {
          insertIndex = i + 1;
        }
      }

      lines.splice(insertIndex, 0, importStatement.trim());
      newContent = lines.join('\n');
    }
  });

  return newContent;
}

function fixFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const usedImports = findUsedImports(content);

    if (usedImports.length === 0) {
      return false;
    }

    const newContent = addMissingImports(content, usedImports);

    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent);
      console.log(`✅ Fixed imports in: ${filePath}`);
      console.log(`   Added: ${usedImports.join(', ')}`);
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

function main() {
  const srcDir = path.join(process.cwd(), 'src');

  if (!fs.existsSync(srcDir)) {
    console.error('❌ src directory not found');
    process.exit(1);
  }

  console.log('🔧 Starting import restoration...');

  const jsFiles = findJSFiles(srcDir);
  let fixedCount = 0;

  jsFiles.forEach(file => {
    if (fixFile(file)) {
      fixedCount++;
    }
  });

  console.log(`\n✨ Import restoration complete! Processed ${jsFiles.length} files, fixed ${fixedCount} files.`);
}

if (require.main === module) {
  main();
}

module.exports = { fixFile, findJSFiles };