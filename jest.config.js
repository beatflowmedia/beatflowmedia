// jest.config.js
//
// This file was EMPTY, which is why no component in src/ had ever been unit-tested:
// jest had no JSX transform, so importing any .js containing JSX failed to parse. The
// tests that did exist (agreements, require-auth, payment-reversal) are all plain
// CommonJS with no JSX, so nothing ever surfaced the gap.
//
// Configured HERE rather than by filling in the equally-empty babel.config.js, which is
// deliberate: Create React App supplies its own Babel configuration for the production
// build, and a root babel.config.js can be picked up by that pipeline too. Changing how
// the shipped bundle is compiled in order to run a test is a trade nobody should make.
// This keeps the transform scoped to jest.
//
// The default testEnvironment stays `node` so the existing non-DOM suites are unaffected;
// component tests opt in per file with an `@jest-environment jsdom` docblock.

module.exports = {
  testEnvironment: 'node',

  transform: {
    '^.+\\.[jt]sx?$': [
      'babel-jest',
      {
        // No .babelrc lookup -- this config is self-contained, so the transform cannot
        // drift with whatever else lands in the project root.
        babelrc: false,
        configFile: false,
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          // `automatic` so test files need no React import to use JSX, matching how the
          // app itself is compiled.
          ['@babel/preset-react', { runtime: 'automatic' }]
        ]
      }
    ]
  },

  // CSS and media imports are not what a component test is asserting about.
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/test/styleMock.js',
    '\\.(png|jpe?g|gif|svg|webp|mp3|wav|woff2?)$': '<rootDir>/test/fileMock.js'
  },

  setupFilesAfterEnv: ['<rootDir>/test/setupTests.js'],

  // jest's jsdom environment resolves package `exports` using the BROWSER condition,
  // which for react-router-dom v7 selects an ESM build. node_modules is not transformed,
  // so that build imports as undefined -- and a component using <Link> then fails with
  // "Element type is invalid ... got: undefined", which points at your own component and
  // not at the resolver. The same require() works in plain node, which is the tell.
  //
  // Asking for the `node` condition selects the CJS build jest can actually load.
  testEnvironmentOptions: {
    customExportConditions: ['node']
  },

  // The e2e directory is Playwright's, and Playwright's `test` is not jest's. Running
  // them here produces confusing failures about a missing test runner.
  testPathIgnorePatterns: ['/node_modules/', '/e2e/', '/build/', '/build.stale-']
};
