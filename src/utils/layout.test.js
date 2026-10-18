// src/utils/layout.test.js
//
// Guards the bug class that made three card grids render with ZERO row spacing.
//
// MUI's `Grid container spacing` is a theme multiplier -- 2 means 2 × 8px. Handed a CSS
// length string it emits no spacing at all, so the rows touch. Nothing warns: not the
// compiler, not eslint, not the browser console. The code reads as deliberate fluid
// spacing and renders as nothing.
//
// So this scans the source. A unit test is the wrong instrument for "does it look right"
// and the RIGHT one for "is this prop a type MUI can use" -- the failure is categorical,
// not visual, and it is cheaper to catch here than in a screenshot.

const fs = require('fs');
const path = require('path');

const { CARD_GRID_SPACING } = require('./layout');

const SRC = path.join(__dirname, '..');

function sourceFiles(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '__snapshots__') continue;
      sourceFiles(full, acc);
    } else if (/\.(jsx?|tsx?)$/.test(entry.name) && !/\.test\.[jt]sx?$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

/** Remove block and line comments so documentation of a bug is not read as the bug. */
function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

describe('CARD_GRID_SPACING', () => {
  test('is a responsive object MUI can actually use', () => {
    expect(typeof CARD_GRID_SPACING).toBe('object');
    Object.values(CARD_GRID_SPACING).forEach((v) => {
      expect(typeof v).toBe('number');
      expect(Number.isFinite(v)).toBe(true);
    });
  });

  test('is MOBILE-FIRST: the base is the smallest screen, scaled up', () => {
    // Not decoration. A base rule written for desktop and walked back with a larger
    // breakpoint is desktop-first wearing a disguise, and it is the shape that puts
    // 32px gutters on a phone.
    expect(CARD_GRID_SPACING.xs).toBeLessThanOrEqual(CARD_GRID_SPACING.sm);
  });

  test('keeps rows apart by at least 8px on the smallest screen', () => {
    // MUI spacing unit is 8px. Two adjacent cards with no daylight between them read as
    // one block, which is the complaint this constant was created to answer.
    expect(CARD_GRID_SPACING.xs * 8).toBeGreaterThanOrEqual(8);
  });
});

describe('no Grid is handed a CSS string as spacing', () => {
  // THE REGRESSION GUARD. `spacing={'clamp(2rem, calc(1.5rem + 3vw), 4rem)'}` appeared in
  // three files and produced zero spacing in all three. Measured on production before the
  // fix: "Recently Released Albums" had a 0px gap between card rows, while the grid below
  // it -- an ordinary spacing={2} -- had 16px.
  test('spacing is never a clamp(), calc(), rem, px or % string', () => {
    const offenders = [];

    sourceFiles(SRC).forEach((file) => {
      // COMMENTS STRIPPED FIRST, which this test learned the hard way: its first run
      // failed on the example written inside layout.js's own explanation of the bug.
      // A guard that cannot tell code from the documentation of the thing it guards
      // makes documenting the problem impossible, which is the opposite of useful.
      const text = stripComments(fs.readFileSync(file, 'utf8'));
      // Only JSX props, and only string literals: spacing={2}, spacing={CONST} and
      // spacing={{ xs: 2 }} are all fine.
      const re = /spacing=\{\s*(['"`])([^'"`]*)\1\s*\}/g;
      let m;
      while ((m = re.exec(text)) !== null) {
        offenders.push(path.relative(SRC, file) + '  spacing={' + m[1] + m[2] + m[1] + '}');
      }
    });

    expect(offenders).toEqual([]);
  });

  test('the three grids that were broken now use the shared constant', () => {
    // Named explicitly rather than counted, so deleting one and leaving another is not
    // silently "still passing".
    const files = [
      'pages/Home.js',
      'components/DiscoverWeeklyPreview.js'
    ];
    files.forEach((rel) => {
      const text = fs.readFileSync(path.join(SRC, rel), 'utf8');
      expect(text).toContain('CARD_GRID_SPACING');
    });
  });
});
