const fs = require('fs');
const path = require('path');

function removeUnusedImport(content, importName, packageName) {
  // Match import statements with the unused import
  const importRegex = new RegExp(`import\\s+{([^}]+)}\\s+from\\s+['"]${packageName}['"];?`, 'g');

  return content.replace(importRegex, (match, imports) => {
    // Split imports and filter out the unused one
    const importList = imports.split(',')
      .map(i => i.trim())
      .filter(i => i !== importName && i !== '');

    if (importList.length === 0) {
      return ''; // Remove the entire import statement
    }

    return `import { ${importList.join(', ')} } from '${packageName}';`;
  });
}

function removeUnusedVariable(content, varName) {
  // Remove const declarations like: const [showAlert, setShowAlert] = useState(...);
  const varRegex = new RegExp(`\\s*const\\s+\\[.*?${varName}.*?\\]\\s*=\\s*useState\\([^)]*\\);?\\s*`, 'g');
  return content.replace(varRegex, '\n');
}

function removeDefaultImport(content, importName) {
  const importRegex = new RegExp(`import\\s+${importName}\\s+from\\s+['"

][^'"]+['"];?\\s*`, 'g');
  return content.replace(importRegex, '');
}

const fixes = [
  {
    file: 'src/components/admin/BlogManager.js',
    fn: (content) => removeUnusedVariable(content, 'showAlert')
  },
  {
    file: 'src/components/admin/LandingPageManager.js',
    fn: (content) => removeUnusedVariable(content, 'showAlert')
  },
  {
    file: 'src/components/admin/MarketingDashboard.js',
    fn: (content) => removeUnusedImport(content, 'Refresh', '@mui/icons-material')
  },
  {
    file: 'src/components/admin/SmartLinkManager.js',
    fn: (content) => removeUnusedImport(content, 'TrendingUp', '@mui/icons-material')
  },
  {
    file: 'src/components/admin/VideoToolsStudio.js',
    fn: (content) => removeDefaultImport(content, 'VideoClipGenerator')
  },
  {
    file: 'src/pages/Blog.js',
    fn: (content) => removeDefaultImport(content, 'marketingService')
  },
  {
    file: 'src/pages/BlogPost.js',
    fn: (content) => removeDefaultImport(content, 'marketingService')
  },
  {
    file: 'src/pages/Advertisements.js',
    fn: (content) => removeUnusedVariable(content, 'showAlert')
  },
  {
    file: 'src/pages/ArtistDashboardNew.js',
    fn: (content) => removeUnusedVariable(content, 'showAlert')
  },
  {
    file: 'src/pages/CuratorPricing.js',
    fn: (content) => {
      content = removeUnusedImport(content, 'MusicNote', '@mui/icons-material');
      // Also remove setLoading if unused
      content = content.replace(/,\s*setLoading/g, '');
      return content;
    }
  },
  {
    file: 'src/pages/Favorites.js',
    fn: (content) => removeUnusedImport(content, 'Chip', '@mui/material')
  },
  {
    file: 'src/pages/Playlists.js',
    fn: (content) => {
      content = removeUnusedImport(content, 'MoreVert', '@mui/icons-material');
      content = removeUnusedImport(content, 'query', 'firebase/firestore');
      content = removeUnusedImport(content, 'where', 'firebase/firestore');
      return content;
    }
  },
  {
    file: 'src/pages/PayoutDashboard.js',
    fn: (content) => removeUnusedImport(content, 'Button', '@mui/material')
  },
  {
    file: 'src/hooks/usePlaylistManager.js',
    fn: (content) => {
      content = removeUnusedImport(content, 'query', 'firebase/firestore');
      content = removeUnusedImport(content, 'where', 'firebase/firestore');
      content = removeUnusedImport(content, 'getDocs', 'firebase/firestore');
      return content;
    }
  },
  {
    file: 'src/services/engagementMetrics.js',
    fn: (content) => removeUnusedImport(content, 'updateDoc', 'firebase/firestore')
  },
  {
    file: 'src/utils/migrateArtistImages.js',
    fn: (content) => removeUnusedImport(content, 'getDoc', 'firebase/firestore')
  },
  {
    file: 'src/pages/CuratorEarnings.js',
    fn: (content) => removeUnusedImport(content, 'TrendingUp', '@mui/icons-material')
  },
];

let count = 0;
fixes.forEach(({ file, fn }) => {
  try {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      console.log(`Skip ${file} (not found)`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    content = fn(content);

    // Clean up multiple newlines
    content = content.replace(/\n\n\n+/g, '\n\n');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      count++;
      console.log(`✓ ${file}`);
    } else {
      console.log(`- ${file} (no changes)`);
    }
  } catch (e) {
    console.log(`✗ ${file}: ${e.message}`);
  }
});

console.log(`\n✅ Fixed ${count} files`);
