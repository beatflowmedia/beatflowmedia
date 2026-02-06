const fs = require('fs');
const path = require('path');

// Files with massive unused imports to clean
const cleanups = {
  'src/pages/AppealTakedown.js': {
    remove: [
      'List', 'ListItem', 'ListItemIcon', 'ListItemText', 'Collapse',
      'Dialog', 'DialogTitle', 'DialogContent', 'DialogActions',
      'CheckCircle', 'InfoOutlined', 'ExpandMore', 'ExpandLess'
    ]
  },
  'src/pages/CampaignWizard.js': {
    remove: [
      'StepContent', 'FormControl', 'InputLabel', 'Select', 'MenuItem', 'Switch',
      'Radio', 'RadioGroup', 'FormLabel', 'Divider', 'DatePicker', 'TimePicker',
      'Collapse', 'Badge', 'LocationOn', 'Visibility', 'Star', 'Warning', 'Info',
      'Help', 'Add', 'Remove', 'Edit', 'Delete', 'Preview', 'Send',
      'ExpandMore', 'ExpandLess', 'updateDoc', 'doc'
    ]
  },
  'src/pages/CuratorInbox.js': {
    remove: [
      'getDocs', 'CardMedia', 'Menu', 'ListItemIcon', 'ListItemText', 'Badge',
      'Fade', 'Slide', 'Alert', 'LinearProgress', 'MusicNote', 'Person',
      'CalendarToday', 'AccessTime', 'Send', 'Dashboard', 'Notifications', 'getDoc'
    ]
  },
  'src/pages/GenreManagement.js': {
    remove: ['Grid', 'Check', 'Close']
  },
  'src/pages/GenrePage.js': {
    remove: ['Chip']
  },
  'src/pages/InvestorPortal.js': {
    remove: ['RechartsPieChart', 'Pie', 'Cell']
  },
  'src/pages/Playlist.js': {
    remove: ['Add', 'People', 'arrayUnion']
  },
  'src/pages/Support.js': {
    // These are variables, not imports
    variables: ['resources', 'toolsAndPlans', 'legalAndPrivacy']
  },
  'src/pages/ForArtists.js': {
    variables: ['customGenres', 'submissionRef']
  },
  'src/pages/ForTheRecord.js': {
    variables: ['formatDate']
  },
  'src/pages/SupportCategory.js': {
    variables: ['region']
  },
  'src/pages/AgentsDashboard.js': {
    variables: ['result']
  }
};

function removeFromImport(content, itemsToRemove, packageName) {
  // Handle both named and default imports
  const patterns = [
    // Pattern for: import { A, B, C } from 'package';
    new RegExp(`import\\s*{([^}]+)}\\s*from\\s*['"]${packageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"];?`, 'g'),
    // Pattern for: import Icon from '@mui/icons-material/Icon';
    ...itemsToRemove.map(item =>
      new RegExp(`import\\s+${item}\\s+from\\s+['"]@mui/icons-material/${item}['"];?\\s*`, 'g')
    )
  ];

  patterns.forEach(pattern => {
    content = content.replace(pattern, (match, imports) => {
      if (!imports) return ''; // It's a default import, remove it entirely

      const importList = imports
        .split(',')
        .map(i => i.trim())
        .filter(i => i && !itemsToRemove.includes(i));

      if (importList.length === 0) return '';
      return `import { ${importList.join(', ')} } from '${packageName}';`;
    });
  });

  return content;
}

function removeUnusedVariables(content, variables) {
  variables.forEach(varName => {
    // Remove const declarations
    const patterns = [
      new RegExp(`\\s*const\\s+${varName}\\s*=\\s*[^;]+;\\s*`, 'g'),
      new RegExp(`\\s*const\\s+{[^}]*${varName}[^}]*}\\s*=\\s*[^;]+;\\s*`, 'g'),
      new RegExp(`\\s*const\\s+\\[${varName}[^\\]]*\\]\\s*=\\s*[^;]+;\\s*`, 'g')
    ];

    patterns.forEach(pattern => {
      content = content.replace(pattern, '\n');
    });
  });

  return content;
}

let fixedCount = 0;

Object.entries(cleanups).forEach(([file, config]) => {
  try {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  ${file} (not found)`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    if (config.remove) {
      // Remove from MUI Material
      content = removeFromImport(content, config.remove, '@mui/material');
      // Remove from MUI Icons
      content = removeFromImport(content, config.remove, '@mui/icons-material');
      // Remove from Firebase
      content = removeFromImport(content, config.remove, 'firebase/firestore');
      // Remove from other packages
      content = removeFromImport(content, config.remove, '@mui/x-date-pickers');
    }

    if (config.variables) {
      content = removeUnusedVariables(content, config.variables);
    }

    // Clean up multiple newlines and empty imports
    content = content.replace(/\n\n\n+/g, '\n\n');
    content = content.replace(/import\s*{\s*}\s*from\s*['"[^'"]+['"];?\s*/g, '');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      fixedCount++;
      console.log(`✓ ${file}`);
    } else {
      console.log(`- ${file} (no changes)`);
    }
  } catch (e) {
    console.log(`✗ ${file}: ${e.message}`);
  }
});

console.log(`\n🎉 Fixed ${fixedCount} files with massive unused imports`);
