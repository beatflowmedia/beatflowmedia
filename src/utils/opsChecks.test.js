// src/utils/opsChecks.test.js
//
// THE RECONCILER FOR A DELIBERATE COPY.
//
// package.json's `scripts` block is what actually runs; opsChecks.js describes those
// same checks for a reader, because a browser cannot read package.json and because
// package.json cannot hold "what breaks if this is wrong".
//
// A local copy is allowed by the Single Source caveat ONLY while something reconciles
// it. This is that something. Without it, adding `verify:isrc` tomorrow leaves the ops
// desk quietly showing twenty checks while twenty-one exist — and the missing one is
// invisible precisely because nothing lists it.
//
// It fails in BOTH directions on purpose: a script with no description, and a
// description for a script that no longer exists. The second is the one people forget,
// and it is how a dashboard ends up offering a command that errors.

const fs = require('fs');
const path = require('path');

const { CHECKS, commandFor, checkItems } = require('./opsChecks');
const { AREAS } = require('./ops');

const pkg = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8')
);

// `verify:all` is a RUNNER, not a check: it chains the others. Describing it would put
// a row on the desk whose failure is always a duplicate of a row already there.
const AGGREGATE = new Set(['all']);

const scriptKeys = Object.keys(pkg.scripts)
  .filter((s) => s.startsWith('verify:'))
  .map((s) => s.slice('verify:'.length))
  .filter((k) => !AGGREGATE.has(k));

describe('the described checks and the real scripts agree', () => {
  test('every verify:* script is described for the ops desk', () => {
    const undescribed = scriptKeys.filter((k) => !CHECKS[k]);
    // Named in the failure rather than counted, so the fix is obvious.
    expect(undescribed).toEqual([]);
  });

  test('every description points at a script that still exists', () => {
    const orphaned = Object.keys(CHECKS).filter((k) => !scriptKeys.includes(k));
    expect(orphaned).toEqual([]);
  });

  test('the command shown is the command that runs', () => {
    // The desk shows a string Percy can copy. If it drifts from the real script name he
    // pastes something that errors, and the check looks broken rather than absent.
    Object.keys(CHECKS).forEach((key) => {
      expect(pkg.scripts[`verify:${key}`]).toBeDefined();
      expect(commandFor(key)).toBe(`npm run verify:${key}`);
    });
  });
});

describe('each description earns its place', () => {
  test('every check names an area from the ops vocabulary', () => {
    // So a failing check can be filed as an incident without re-deciding where it
    // belongs.
    Object.entries(CHECKS).forEach(([key, meta]) => {
      expect(Object.keys(AREAS)).toContain(meta.area);
    });
  });

  test('every check says what BREAKS, not what it checks', () => {
    // "verify:csp — checks the CSP" tells a reader nothing they could not guess. A
    // check nobody can explain the value of gets skipped the first time it is slow.
    Object.entries(CHECKS).forEach(([key, meta]) => {
      expect(typeof meta.protects).toBe('string');
      expect(meta.protects.length).toBeGreaterThan(40);
      // A description that just restates the title is the failure this guards against.
      expect(meta.protects.toLowerCase()).not.toBe(meta.title.toLowerCase());
    });
  });

  test('every check has a human title that is not the script name', () => {
    Object.entries(CHECKS).forEach(([key, meta]) => {
      expect(typeof meta.title).toBe('string');
      expect(meta.title.length).toBeGreaterThan(10);
      expect(meta.title).not.toContain('verify:');
    });
  });
});

describe('checkItems() — what the desk renders', () => {
  test('a check nobody has run is UNKNOWN, never pass', () => {
    // Colouring an unrun check green is the dashboard lying in the most comfortable
    // direction. "Not checked" and "checked and fine" are different facts.
    const items = checkItems();
    expect(items.length).toBe(scriptKeys.length);
    items.forEach((i) => {
      expect(i.state).toBe('unknown');
      expect(i.lastRun).toBeNull();
    });
  });

  test('recorded state and run time are carried through', () => {
    const items = checkItems({
      csp: { state: 'pass', lastRun: '2026-10-18T09:00:00Z' },
      collections: { state: 'fail', lastRun: '2026-10-18T09:00:00Z', detail: 'trackCount 27 vs 30 songs' }
    });
    const byId = Object.fromEntries(items.map((i) => [i.id, i]));
    expect(byId['verify-csp'].state).toBe('pass');
    expect(byId['verify-collections'].state).toBe('fail');
    expect(byId['verify-collections'].detail).toBe('trackCount 27 vs 30 songs');
    // Everything not reported stays unknown rather than inheriting a neighbour's state.
    expect(byId['verify-terms'].state).toBe('unknown');
  });

  test('every produced item is a valid ops check record', () => {
    // The desk and any agent read the same shape. If these stop validating, the page
    // renders rows that nothing else in the system accepts.
    const { problems } = require('./ops');
    checkItems().forEach((item) => {
      expect(problems(item)).toEqual([]);
    });
  });
});
