/**
 * MolecularComponentAgent
 * Scaffolds molecular React components, tests, and stories.
 * Usage: node MolecularComponentAgent.js <spec>
 */

const fs = require('fs');
const path = require('path');

const molecules = [
  {
    name: 'TrackRow',
    props: ['track', 'onPlay', 'onAddToPlaylist'],
    description: 'Displays a track with controls.'
  },
  {
    name: 'PlaylistHeader',
    props: ['playlist', 'onEdit'],
    description: 'Header for playlist view.'
  },
  {
    name: 'NowPlayingBar',
    props: ['currentTrack', 'onPause', 'onNext', 'onPrev'],
    description: 'Shows now playing info and controls.'
  },
  {
    name: 'PlayerProgress',
    props: ['progress', 'duration', 'onSeek'],
    description: 'Progress bar for player.'
  },
  {
    name: 'QueuePanel',
    props: ['queue', 'onRemove', 'onReorder'],
    description: 'Displays playback queue.'
  }
];

function scaffoldMolecule(molecule) {
  const dir = path.join(__dirname, '../components', molecule.name);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  // Component
  const componentCode = `import React from 'react';
/**
 * ${molecule.name} - ${molecule.description}
 */
export default function ${molecule.name}({ ${molecule.props.join(', ')} }) {
  return (
    <div>{/* TODO: Implement ${molecule.name} */}</div>
  );
}
`;
  fs.writeFileSync(path.join(dir, `${molecule.name}.js`), componentCode);

  // Test
  const testCode = `import React from 'react';
import { render } from '@testing-library/react';
import ${molecule.name} from './${molecule.name}';
describe('${molecule.name}', () => {
  it('renders without crashing', () => {
    render(<${molecule.name} ${molecule.props.map(p => `${p}={}` ).join(' ')} />);
  });
});
`;
  fs.writeFileSync(path.join(dir, `${molecule.name}.test.js`), testCode);

  // Story
  const storyCode = `import React from 'react';
import ${molecule.name} from './${molecule.name}';
export default {
  title: 'Molecules/${molecule.name}',
  component: ${molecule.name},
};
export const Default = () => <${molecule.name} ${molecule.props.map(p => `${p}={}` ).join(' ')} />;
`;
  fs.writeFileSync(path.join(dir, `${molecule.name}.stories.js`), storyCode);
}

function main() {
  molecules.forEach(scaffoldMolecule);
  console.log('Molecular components scaffolded.');
}

if (require.main === module) {
  main();
}
