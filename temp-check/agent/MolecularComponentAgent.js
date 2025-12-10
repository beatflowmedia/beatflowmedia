/**
 * MolecularComponentAgent
 * Scaffolds molecular React components, tests, and stories.
 * Usage: node MolecularComponentAgent.js <spec>
 */



var fs = require("fs");
var path = require("path");

var molecules = [{
  name: "TrackRow",
  props: ["track", "onPlay", "onAddToPlaylist"],
  description: "Displays a track with controls."
}, {
  name: "PlaylistHeader",
  props: ["playlist", "onEdit"],
  description: "Header for playlist view."
}, {
  name: "NowPlayingBar",
  props: ["currentTrack", "onPause", "onNext", "onPrev"],
  description: "Shows now playing info and controls."
}, {
  name: "PlayerProgress",
  props: ["progress", "duration", "onSeek"],
  description: "Progress bar for player."
}, {
  name: "QueuePanel",
  props: ["queue", "onRemove", "onReorder"],
  description: "Displays playback queue."
}];

function scaffoldMolecule(molecule) {
  var dir = path.join(__dirname, "../components", molecule.name);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  // Component
  var componentCode = "import React from 'react';\n/**\n * " + molecule.name + " - " + molecule.description + "\n */\nexport default function " + molecule.name + "({ " + molecule.props.join(", ") + " }) {\n  return (\n    <div>{/* TODO: Implement " + molecule.name + " */}</div>\n  );\n}\n";
  fs.writeFileSync(path.join(dir, molecule.name + ".js"), componentCode);

  // Test
  var testCode = "import React from 'react';\nimport { render } from '@testing-library/react';\nimport " + molecule.name + " from './" + molecule.name + "';\ndescribe('" + molecule.name + "', () => {\n  it('renders without crashing', () => {\n    render(<" + molecule.name + " " + molecule.props.map(function (p) {
    return p + "={}";
  }).join(" ") + " />);\n  });\n});\n";
  fs.writeFileSync(path.join(dir, molecule.name + ".test.js"), testCode);

  // Story
  var storyCode = "import React from 'react';\nimport " + molecule.name + " from './" + molecule.name + "';\nexport default {\n  title: 'Molecules/" + molecule.name + "',\n  component: " + molecule.name + "\n};\nexport const Default = () => <" + molecule.name + " " + molecule.props.map(function (p) {
    return p + "={}";
  }).join(" ") + " />;\n";
  fs.writeFileSync(path.join(dir, molecule.name + ".stories.js"), storyCode);
}

function main() {
  molecules.forEach(scaffoldMolecule);
  console.log("Molecular components scaffolded.");
}

if (require.main === module) {
  main();
}