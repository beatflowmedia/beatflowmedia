// Playwright config — headed e2e against the running Netlify Dev server (:8888).
// Uses the already-installed system Chrome (channel: 'chrome') so no browser download.
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:8888',
    headless: false,          // headed, as requested
    channel: 'chrome',        // use installed Google Chrome (no PW browser download)
    viewport: { width: 1366, height: 900 },
    actionTimeout: 10_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chrome' }],
});
