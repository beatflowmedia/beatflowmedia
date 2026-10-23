// src/utils/schemaMarkup.test.js
//
// THE GUARD FOR A FAILURE THAT LEFT NO TRACE.
//
// For an unknown length of time every JSON-LD tag on this site was emitted EMPTY. The
// helper returned props to spread onto a script element:
//
//     { type: 'application/ld+json', innerHTML: JSON.stringify(schema) }
//     <script {...schemaToScriptTag(schema)} />
//
// `innerHTML` is not a React DOM attribute. React drops an unrecognised prop of that
// shape without warning, so five pages rendered `<script type="application/ld+json">`
// with nothing in it. Valid markup, no error, no console warning, and the only symptom
// is rich results that never appear -- indistinguishable from never having added schema.
//
// Then the repaired version was put INSIDE <Helmet>, where react-helmet-async 2.0.5
// drops script children while passing <meta> and <title> through on the same render.
// Still zero tags. Two different silent failures, same visible result.
//
// So there are two things to hold, and prose in a comment holds neither:
//
//   1. the payload is CHILDREN, never an innerHTML prop
//   2. the call site is OUTSIDE <Helmet>, never inside it
//
// Rule 2 is the one that will be "fixed" by the next person, because putting meta in the
// head with the other meta is obviously right and happens to be wrong here.

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..');

/** Every .js/.jsx under src/, excluding tests. */
function sourceFiles(dir = SRC, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') sourceFiles(full, out);
    } else if (/\.jsx?$/.test(entry.name) && !/\.test\.jsx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const FILES = sourceFiles();
const rel = (f) => path.relative(SRC, f).split(path.sep).join('/');

/**
 * A file's CODE, with every comment blanked out and the line numbering preserved.
 *
 * ALL FOUR CHECKS BELOW NEED THIS, and three of them got it wrong independently before
 * it was extracted. The explanations in this file and in schemaMarkup.js necessarily
 * QUOTE the broken patterns they forbid -- `innerHTML:`, `<Helmet>`, the old helper
 * name, a `schemaScript()` call in an @example -- so a check that reads comments as
 * code reports a violation in the very prose warning against it. Every one of those was
 * a false positive, and a guard that cries wolf gets muted.
 *
 * Newlines are kept rather than stripped so a reported line number still points at the
 * right line. Replacing comments with '' shifted every offender's number by however
 * many comment lines preceded it, which is worse than no line number: it looks precise.
 */
function codeOnly(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/^([ \t]*)\/\/.*$/gm, (_m, indent) => indent);
}

const code = (f) => codeOnly(fs.readFileSync(f, 'utf8'));

describe('JSON-LD is emitted, not merely present', () => {
  test('the helper puts the payload in children, not an innerHTML prop', () => {
    const live = code(path.join(SRC, 'utils', 'schemaMarkup.js'));
    expect(live).not.toMatch(/innerHTML\s*:/);
    expect(live).toMatch(/<script type="application\/ld\+json">/);
  });

  test('no call site sits inside a <Helmet> block', () => {
    const offenders = [];
    for (const file of FILES) {
      const src = code(file);
      if (!src.includes('schemaScript(')) continue;

      // Walk the file tracking whether we are between <Helmet> and </Helmet>. Crude on
      // purpose: a real JSX parse would be a dependency, and the only thing being asked
      // is "is this line between those two markers", which text answers correctly.
      let depth = 0;
      src.split('\n').forEach((line, i) => {
        if (/<\/Helmet>/.test(line)) depth -= 1;
        if (depth > 0 && /schemaScript\(/.test(line)) {
          offenders.push(`${rel(file)}:${i + 1}`);
        }
        if (/<Helmet[\s>]/.test(line)) depth += 1;
      });
    }
    expect(offenders).toEqual([]);
  });

  test('nothing still imports the removed helper', () => {
    const offenders = FILES.filter((f) => /\bschemaToScriptTag\b/.test(code(f))).map(rel);
    expect(offenders).toEqual([]);
  });

  test('every page that builds a schema also renders it', () => {
    // A schema computed and never emitted is the same amount of nothing as an empty
    // script tag, and is easier to introduce than it sounds: the variable keeps its
    // name, the page keeps rendering, and the structured data quietly stops existing.
    const unrendered = [];
    for (const file of FILES) {
      const src = code(file);
      const built = [...src.matchAll(/const\s+(\w*[Ss]chema)\s*=\s*generate\w+Schema\(/g)]
        .map((m) => m[1]);
      for (const name of built) {
        if (!src.includes(`schemaScript(${name})`)) {
          unrendered.push(`${rel(file)}  ${name}`);
        }
      }
    }
    expect(unrendered).toEqual([]);
  });
});
