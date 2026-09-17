// e2e: prove the "By Platform" browse filtering pipeline end-to-end — all three
// platforms, a multi-platform track (Drift), soft-fallback, and negative controls.
// Fixtures are set deterministically via the Admin SDK (see _admin.js).
//
// Robustness: each track card renders one "License Track" button (unauthenticated),
// so asserting the exact button COUNT lets the storefront's realtime filter settle
// before we check titles — avoids racing an in-flight onSnapshot update.
const { test, expect } = require('@playwright/test');
const { setAll } = require('./_admin');

const ALL_TRACKS = ['Honey Sky', 'Golden Drift', 'Amber Skies', 'Drift'];

async function gotoAndSettle(page, path, expectedCardCount) {
  await page.goto(path);
  await expect(page.getByRole('button', { name: 'License Track' })).toHaveCount(expectedCardCount);
}

async function assertTitles(page, present, absent) {
  for (const t of present) await expect(page.getByText(t, { exact: true }).first()).toBeVisible();
  for (const t of absent) await expect(page.getByText(t, { exact: true })).toHaveCount(0);
}

test.describe.serial('By Platform browse filtering', () => {
  test.beforeAll(async () => {
    // Drift is deliberately multi-platform (tiktok + youtube).
    await setAll({
      'Honey Sky': ['tiktok'],
      'Golden Drift': ['instagram'],
      'Amber Skies': ['youtube'],
      'Drift': ['tiktok', 'youtube'],
    });
  });

  test('/browse/tiktok → 2 tracks (Honey Sky + multi-platform Drift)', async ({ page }) => {
    await gotoAndSettle(page, '/browse/tiktok', 2);
    await expect(page.getByText('Music for TikTok')).toBeVisible();
    await assertTitles(page, ['Honey Sky', 'Drift'], ['Golden Drift', 'Amber Skies']);
  });

  test('/browse/instagram → 1 track (Golden Drift only)', async ({ page }) => {
    await gotoAndSettle(page, '/browse/instagram', 1);
    await expect(page.getByText('Music for Instagram')).toBeVisible();
    await assertTitles(page, ['Golden Drift'], ['Honey Sky', 'Amber Skies']);
  });

  test('/browse/youtube → 2 tracks (Amber Skies + multi-platform Drift)', async ({ page }) => {
    await gotoAndSettle(page, '/browse/youtube', 2);
    await expect(page.getByText('Music for YouTube')).toBeVisible();
    await assertTitles(page, ['Amber Skies', 'Drift'], ['Honey Sky', 'Golden Drift']);
  });

  test('soft-fallback → all 4 tracks when nothing matches the platform', async ({ page }) => {
    await setAll({ 'Honey Sky': [], 'Golden Drift': [], 'Amber Skies': [], 'Drift': [] });
    await gotoAndSettle(page, '/browse/tiktok', 4);
    await assertTitles(page, ALL_TRACKS, []);
  });

  test.afterAll(async () => {
    // Restore the simple demo state (Honey Sky = tiktok, rest untagged).
    await setAll({ 'Honey Sky': ['tiktok'], 'Golden Drift': [], 'Amber Skies': [], 'Drift': [] });
  });
});
