/**
 * PageComponentAgent
 * Scaffolds page-level React components, tests, and stories.
 * Usage: node PageComponentAgent.js <spec>
 */

const fs = require('fs');
const path = require('path');

const pages = [
  {
    name: 'Home',
    description: 'Landing page for listeners and artists.'
  },
  {
    name: 'Search',
    description: 'Search page for tracks, artists, playlists.'
  },
  {
    name: 'Playlist',
    description: 'Playlist view and controls.'
  },
  {
    name: 'Album',
    description: 'Album details and tracklist.'
  },
  {
    name: 'Artist',
    description: 'Artist profile and catalog.'
  },
  {
    name: 'CuratorInbox',
    description: 'Curator inbox for reviewing submissions.'
  },
  {
    name: 'CampaignWizard',
    description: 'Wizard for launching artist campaigns.'
  },
  {
    name: 'InvestorPortal',
    description: 'Investor dashboard and IR materials.'
  }
];

function scaffoldPage(page) {
  const dir = path.join(__dirname, '../pages', page.name);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  // Component
  const componentCode = `import React from 'react';
/**
 * ${page.name} - ${page.description}
 */
export default function ${page.name}() {
  return (
    <div>{/* TODO: Implement ${page.name} page */}</div>
  );
}
`;
  fs.writeFileSync(path.join(dir, `${page.name}.js`), componentCode);

  // Test
  const testCode = `import React from 'react';
import { render } from '@testing-library/react';
import ${page.name} from './${page.name}';
describe('${page.name} Page', () => {
  it('renders without crashing', () => {
    render(<${page.name} />);
  });
});
`;
  fs.writeFileSync(path.join(dir, `${page.name}.test.js`), testCode);

  // Story
  const storyCode = `import React from 'react';
import ${page.name} from './${page.name}';
export default {
  title: 'Pages/${page.name}',
  component: ${page.name},
};
export const Default = () => <${page.name} />;
`;
  fs.writeFileSync(path.join(dir, `${page.name}.stories.js`), storyCode);
}

function main() {
  pages.forEach(scaffoldPage);
  console.log('Page-level components scaffolded.');
}

if (require.main === module) {
  main();
}
