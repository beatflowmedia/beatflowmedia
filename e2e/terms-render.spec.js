// e2e: the Terms page, in a real browser, against the real built bundle.
//
// Everything else about the 2026-10-15 legal changes is verified in node or jsdom. This
// exists because of a specific failure in this project's history: the R2 download was
// proven working by tests that ran in node, which has no Content Security Policy, and the
// browser refused the request in production after a buyer had paid. Node proved the URL
// returned the file and never that the PAGE could use it.
//
// So the clauses a buyer is told to rely on get looked at by something with a layout
// engine. Served from build/ rather than a dev server: that is the artefact that deploys.
//
// No auth needed, which is the point -- /terms is the page a buyer reads BEFORE deciding.

const { test, expect } = require('@playwright/test');

const BASE = process.env.TERMS_BASE_URL || 'http://localhost:5057';

test.use({ baseURL: BASE });

test.describe('Terms page renders the 2026-10-15 changes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/terms', { waitUntil: 'domcontentloaded' });
    // SPA: wait for React to paint the section headings.
    await expect(page.getByRole('heading', { name: /Terms of Service|Terms/i }).first())
      .toBeVisible({ timeout: 20000 });
  });

  test('states that a reversed payment terminates the license', async ({ page }) => {
    const body = page.locator('body');
    await expect(body).toContainText(/Termination when payment is reversed/i);
    await expect(body).toContainText(/chargeback or payment dispute/i);
    await expect(body).toContainText(/terminates automatically and immediately on the reversal/i);
  });

  test('does NOT claim the buyer gives up the right to dispute a charge', async ({ page }) => {
    // A no-chargeback clause is unenforceable -- the Fair Credit Billing Act keeps the
    // cardholder's dispute right -- so the page must say the opposite, clearly.
    await expect(page.locator('body')).toContainText(
      /right to dispute a charge with your card issuer or bank.*we do not ask you to give it up/is
    );
  });

  test('admits a downloaded file cannot be recovered', async ({ page }) => {
    // Overstating what revocation does is the fastest way to lose a dispute.
    await expect(page.locator('body')).toContainText(/cannot recover a file you have already downloaded/i);
  });

  test('discloses the cancellation-right waiver before purchase', async ({ page }) => {
    const body = page.locator('body');
    await expect(body).toContainText(/Cancellation Rights and Immediate Delivery/i);
    await expect(body).toContainText(/14 days to cancel/i);
    await expect(body).toContainText(/lose the right to cancel/i);
    // Subscriptions are digital SERVICES (CJEU C-234/25) and keep the right.
    await expect(body).toContainText(/subscription is treated differently/i);
  });

  test('a partial refund is stated NOT to terminate', async ({ page }) => {
    await expect(page.locator('body')).toContainText(/partial refund does not terminate a license/i);
  });

  test('tells a buyer on an older version how to read it', async ({ page }) => {
    await expect(page.locator('body')).toContainText(/superseded versions stay in force/i);
    const link = page.getByRole('link', { name: /contact form/i });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', /\/contact/);
  });

  test('publishes no postal address', async ({ page }) => {
    const text = await page.locator('body').innerText();
    expect(text).not.toMatch(/Cubhouse|Clubhouse|07748/i);
    expect(text).not.toMatch(/BeatFlow Media Inc/i);
  });

  test('routes contact through the platform, and that link works', async ({ page }) => {
    await expect(page.locator('body')).toContainText(/Contact us through the platform/i);
    const link = page.getByRole('link', { name: /Contact us through the platform/i });
    await expect(link).toBeVisible();

    // Thumb-first: the project floor is 44px for anything in a tap context.
    const box = await link.boundingBox();
    expect(box, 'contact link should have a layout box').toBeTruthy();
    expect(box.height).toBeGreaterThanOrEqual(44);
  });

  test('survives a phone viewport without sideways scroll', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    // The base rule is the small screen; a terms page that scrolls sideways on a phone
    // is unreadable exactly where most people will read it.
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
