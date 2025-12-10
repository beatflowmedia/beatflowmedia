/**
 * PageComponentAgent
 * Scaffolds page-level React components, tests, and stories.
 * Usage: node PageComponentAgent.js <spec>
 */



var fs = require("fs");
var path = require("path");

var pages = [{
  name: "Home",
  description: "Landing page for listeners and artists."
}, {
  name: "Search",
  description: "Search page for tracks, artists, playlists."
}, {
  name: "Playlist",
  description: "Playlist view and controls."
}, {
  name: "Album",
  description: "Album details and tracklist."
}, {
  name: "Artist",
  description: "Artist profile and catalog."
}, {
  name: "CuratorInbox",
  description: "Curator inbox for reviewing submissions."
}, {
  name: "CampaignWizard",
  description: "Wizard for launching artist campaigns."
}, {
  name: "InvestorPortal",
  description: "Investor dashboard and IR materials."
}];

function scaffoldPage(page) {
  var dir = path.join(__dirname, "../pages", page.name);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  // Component
  var componentCode = "import React from 'react';\n/**\n * " + page.name + " - " + page.description + "\n */\nexport default function " + page.name + "() {\n  return (\n    <div>{/* TODO: Implement " + page.name + " page */}</div>\n  );\n}\n";
  fs.writeFileSync(path.join(dir, page.name + ".js"), componentCode);

  // Test
  var testCode = "import React from 'react';\nimport { render } from '@testing-library/react';\nimport " + page.name + " from './" + page.name + "';\ndescribe('" + page.name + " Page', () => {\n  it('renders without crashing', () => {\n    render(<" + page.name + " />);\n  });\n});\n";
  fs.writeFileSync(path.join(dir, page.name + ".test.js"), testCode);

  // Story
  var storyCode = "import React from 'react';\nimport " + page.name + " from './" + page.name + "';\nexport default {\n  title: 'Pages/" + page.name + "',\n  component: " + page.name + "\n};\nexport const Default = () => <" + page.name + " />;\n";
  fs.writeFileSync(path.join(dir, page.name + ".stories.js"), storyCode);
}

function main() {
  pages.forEach(scaffoldPage);
  console.log("Page-level components scaffolded.");
}

if (require.main === module) {
  main();
}