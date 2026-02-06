const fs = require('fs');
const path = require('path');

// Files to fix based on ESLint output
const filesToFix = [
  'src/components/admin/AppealsReview.js',
  'src/components/admin/BlogManager.js',
  'src/components/admin/LandingPageManager.js',
  'src/components/admin/MarketingDashboard.js',
  'src/components/admin/SmartLinkManager.js',
  'src/components/admin/VideoToolsStudio.js',
  'src/hooks/usePersonalizedSections.js',
  'src/hooks/usePlaylistManager.js',
  'src/pages/Advertisements.js',
  'src/pages/AgentsDashboard.js',
  'src/pages/Album.js',
  'src/pages/AppealTakedown.js',
  'src/pages/ArtistDashboardNew.js',
  'src/pages/Blog.js',
  'src/pages/BlogPost.js',
  'src/pages/CampaignWizard.js',
  'src/pages/CuratorEarnings.js',
  'src/pages/CuratorInbox.js',
  'src/pages/CuratorPricing.js',
  'src/pages/Favorites.js',
  'src/pages/ForArtists.js',
  'src/pages/ForTheRecord.js',
  'src/pages/GenreManagement.js',
  'src/pages/GenrePage.js',
  'src/pages/InvestorDeck.js',
  'src/pages/InvestorPortal.js',
  'src/pages/PayoutDashboard.js',
  'src/pages/Playlist.js',
  'src/pages/Playlists.js',
  'src/pages/Support.js',
  'src/pages/SupportCategory.js',
  'src/services/analytics/EventValidator.js',
  'src/services/analytics/PrivacyManager.js',
  'src/services/engagementMetrics.js',
  'src/services/recommendationService.js',
  'src/utils/migrateArtistImages.js',
];

// Patterns to remove
const removePatterns = [
  // Unused import patterns
  { pattern: /import\s+{\s*InfoOutlined\s*}\s+from\s+['"]@mui\/icons-material\/InfoOutlined['"]\s*;?\s*/g, name: 'InfoOutlined import' },
  { pattern: /import\s+{\s*where\s*}\s+from\s+['"]firebase\/firestore['"]\s*;?\s*/g, name: 'where import' },
  { pattern: /import\s+{\s*Refresh\s*}\s+from\s+['"]@mui\/icons-material['"]\s*;?\s*/g, name: 'Refresh import' },
  { pattern: /import\s+{\s*TrendingUp\s*}\s+from\s+['"]@mui\/icons-material['"]\s*;?\s*/g, name: 'TrendingUp import' },
  { pattern: /import\s+VideoClipGenerator\s+from\s+['"].*VideoClipGenerator['"]\s*;?\s*/g, name: 'VideoClipGenerator import' },
  { pattern: /import\s+marketingService\s+from\s+['"].*marketingService['"]\s*;?\s*/g, name: 'marketingService import' },
  { pattern: /import\s+{\s*Chip\s*}\s+from\s+['"]@mui\/material['"]\s*;?\s*/g, name: 'Chip import (where unused)' },
  { pattern: /import\s+{\s*MusicNote\s*}\s+from\s+['"]@mui\/icons-material['"]\s*;?\s*/g, name: 'MusicNote import (where unused)' },
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Apply removal patterns
    for (const { pattern, name } of removePatterns) {
      if (pattern.test(content)) {
        content = content.replace(pattern, '');
        console.log(`  ✓ Removed ${name} from ${path.basename(filePath)}`);
        modified = true;
      }
    }

    // Fix specific patterns in imports
    // Remove unused variables from import statements
    const unusedImportVars = [
      'InfoOutlined', 'where', 'Refresh', 'TrendingUp', 'MusicNote', 'Chip',
      'query', 'getDocs', 'getDoc', 'Link', 'MoreVert', 'Button', 'updateDoc', 'doc'
    ];

    // Clean up Firebase imports
    content = content.replace(
      /import\s+{\s*([^}]+)\s*}\s+from\s+['"]firebase\/firestore['"]/g,
      (match, imports) => {
        const importList = imports.split(',').map(i => i.trim()).filter(i => {
          // Keep if not in unused list
          return !unusedImportVars.includes(i);
        });
        if (importList.length === 0) return '';
        return `import { ${importList.join(', ')} } from 'firebase/firestore'`;
      }
    );

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed ${filePath}`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
  return false;
}

console.log('Starting ESLint fixes...\n');

let fixedCount = 0;
for (const file of filesToFix) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    if (fixFile(filePath)) {
      fixedCount++;
    }
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
}

console.log(`\n🎉 Fixed ${fixedCount} files`);
