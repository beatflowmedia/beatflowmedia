// e2e: /changes in a real browser, against the built artefact.
//
// This page is the mechanism behind a promise /terms makes: the version recorded against
// your purchase governs it, and a later revision does not change your deal. That is only
// keepable if the superseded text is readable somewhere, which it was not until now.
//
// So the assertions are about the promise, not the markup: can a buyer on the OLD version
// find and read what they agreed to, and is it labelled in a way that tells them it still
// binds them rather than that it is obsolete.

const { test, expect } = require('@playwright/test');

const BASE = process.env.TERMS_BASE_URL || 'http://localhost:5057';

test.use({ baseURL: BASE });

test.describe('/changes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/changes', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /What's changed/i }))
      .toBeVisible({ timeout: 20000 });
  });

  test('shows BOTH license versions, not only the current one', async ({ page }) => {
    const body = page.locator('body');
    await expect(body).toContainText('download-license@2026-10-15');
    // The superseded one is the whole point: two purchases are still governed by it.
    await expect(body).toContainText('download-license@2026-09-19');
  });

  test('labels the old version as still binding, not as obsolete', async ({ page }) => {
    // "Old" or "expired" would tell exactly the wrong story to the person it governs.
    await expect(page.locator('body')).toContainText(/Still applies to earlier purchases/i);
    await expect(page.locator('body')).toContainText(/In force now/i);
  });

  test('exactly one version is marked in force', async ({ page }) => {
    await expect(page.getByText('In force now')).toHaveCount(1);
  });

  test('the superseded text is readable, not just referenced', async ({ page }) => {
    const details = page.locator('details', { hasText: /license summary/i });
    await expect(details.first()).toBeVisible();

    // Open the one belonging to the superseded version and read it.
    const olderArticle = page.locator('article', { hasText: 'download-license@2026-09-19' });
    await olderArticle.locator('summary').click();
    await expect(olderArticle).toContainText(/keep the recording permanently/i);
  });

  test('the current version says a license can END — matching what checkout enforces', async ({ page }) => {
    const currentArticle = page.locator('article', { hasText: 'download-license@2026-10-15' });
    await currentArticle.locator('summary').click();
    await expect(currentArticle).toContainText(/can end/i);
    await expect(currentArticle).toContainText(/reversed|chargeback/i);
  });

  test('explains which version applies to the reader', async ({ page }) => {
    await expect(page.locator('body')).toContainText(/version you accepted at the time of purchase governs/i);
  });

  test('says plainly that routine fixes are not listed', async ({ page }) => {
    // Sets the expectation that makes the link worth clicking when it does appear.
    await expect(page.locator('body')).toContainText(/Routine fixes and improvements are not/i);
  });

  test('links onward to the current terms and to contact', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Read the current Terms/i })).toBeVisible();
    const contact = page.getByRole('link', { name: /get in touch/i });
    await expect(contact).toBeVisible();
    const box = await contact.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
  });

  test('works on a phone without sideways scroll', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('visiting marks the changes seen, so the update prompt stops offering the link', async ({ page }) => {
    const seen = await page.evaluate(() => {
      try { return window.localStorage.getItem('bfmg:changes-seen'); } catch (e) { return 'THREW'; }
    });
    expect(seen).toBe('2026-10-15');
  });
});
