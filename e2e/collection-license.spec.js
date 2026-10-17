// e2e: licensing a collection, in a real browser.
//
// WHAT THIS IS ACTUALLY GUARDING
// The collection page previously answered "how do I license this?" with the words
// "licensable individually" and no control that licensed anything. The only route to 56
// tracks was 56 purchases. So the assertions are about the ROUTE existing and quoting a
// price the server will honour, not about markup.
//
// It deliberately stops at the Stripe redirect. Signing in with Google and paying is not
// something a headless assertion can do, and faking it would test the fake. What is
// checked here is everything up to the point where the buyer's identity is needed --
// which is where the two bugs would live: a missing control, and a wrong price.
//
// NO SIGN-IN, DELIBERATELY. Signed out, requestCheckout refuses before opening the
// dialog and offers the sign-in instead. That IS the behaviour under test: the
// acceptance record has to name a person, so collecting a tick from nobody is worse
// than refusing.

const { test, expect } = require('@playwright/test');

const {
  calculateCollectionPrice,
  calculateCommercialPrice,
  commercialRateForPool,
  formatPrice
} = require('../src/utils/pricing');

const BASE = process.env.TERMS_BASE_URL || 'http://localhost:5057';
test.use({ baseURL: BASE });
// SERVICE WORKERS BLOCKED, and this is a real finding rather than a convenience.
//
// Running against PRODUCTION minutes after a deploy, these specs failed with
// "div[role=dialog] intercepts pointer events" -- which reads like a layout bug and is
// not one. AppUpdatePrompt raises a `fixed inset-0` modal when the service worker reports
// a new build, so it does not merely sit near a control, it swallows every click on the
// page. Blocking the worker removes the condition rather than racing it; dismissing the
// modal still loses to a worker that reports a few seconds later, which is exactly how
// these two specs passed one run and failed the next.
//
// Nothing here tests the update prompt, so nothing is lost. If that prompt ever needs
// coverage it belongs in a spec of its own that OPTS IN to the worker.
test.use({ serviceWorkers: 'block' });



// A production-library collection that exists in the catalogue. 24 tracks, which is the
// most common size -- fourteen collections share it.
const SLUG = 'deep-sleep';
const POOL = 'production-music';

/**
 * Dismiss the "Update available" prompt if it is showing.
 *
 * FOUND AGAINST PRODUCTION, NOT LOCALHOST, which is the whole reason it is worth a
 * helper. A fresh browser hitting a site that deployed minutes ago gets the
 * service-worker update modal, and it is `fixed inset-0` -- so it does not merely sit
 * near the licence button, it intercepts every click on the page. The run that found this
 * failed with "div[role=dialog] intercepts pointer events", which reads like a layout bug
 * and is not one.
 *
 * It is CORRECT behaviour and it got louder on purpose: publishing
 * commercial-license@2026-10-17 made hasUnseenChanges() true, so the prompt now carries
 * the "See what changed" link as well. A test that breaks every time a deploy lands is
 * the one people learn to skip, which is the failure mode this suite exists to avoid.
 *
 * Tolerates absence: on localhost, and on any second visit, there is nothing to dismiss.
 */
async function dismissUpdatePrompt(page) {
  const notNow = page.getByRole('button', { name: /^Not now$/i });
  if (await notNow.count()) {
    await notNow.first().click().catch(() => {});
    await expect(page.locator('div[role="dialog"]')).toHaveCount(0, { timeout: 5000 });
  }
}

test.describe('licensing a whole collection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/collection/${SLUG}`, { waitUntil: 'domcontentloaded' });
    // The panel waits for the track grid to report its count, so this waits for the
    // priced state rather than for the page shell.
    await expect(page.getByRole('button', { name: /License collection/i }))
      .toBeVisible({ timeout: 30000 });
    await dismissUpdatePrompt(page);
  });

  test('offers a route to license the whole collection', async ({ page }) => {
    const button = page.getByRole('button', { name: /License collection/i });
    await expect(button).toBeEnabled();
  });

  test('QUOTES THE PRICE THE SERVER WILL CHARGE, not the stored trackCount price',
    async ({ page }) => {
      // The one that matters. create-checkout prices from its own query of the
      // deliverable songs; the page prices from the tracks the grid loaded, filtered the
      // same way. If these diverge the storefront advertises one figure and Stripe bills
      // another -- and `npm run verify:collections` has already found a collection whose
      // stored trackCount is three short of reality.
      const label = await page.getByRole('button', { name: /License collection/i })
        .textContent();

      // Read the count the page itself states, then price it the way the server does.
      const heading = await page.getByText(/License all \d+ tracks for commercial use/i)
        .textContent();
      const stated = Number(heading.match(/License all (\d+) tracks/i)[1]);
      expect(stated).toBeGreaterThan(0);

      const expected = formatPrice(calculateCollectionPrice(stated, POOL));
      expect(label).toContain(expected);
    });

  test('shows the single-track price beside it, so the discount is visible', async ({ page }) => {
    // A buyer who only sees the collection price cannot tell whether that is the only
    // way in; one who only sees the track price buys four and never learns the curve
    // exists. Both figures belong where the decision is made.
    const perTrack = formatPrice(calculateCommercialPrice(1, commercialRateForPool(POOL)));
    await expect(page.locator('body')).toContainText(perTrack);
    await expect(page.locator('body')).toContainText(/% off as a collection/i);
  });

  test('says the collection is licensable BOTH ways, not only whole', async ({ page }) => {
    await expect(page.locator('body')).toContainText(/license any single track below/i);
  });

  test('the licence control meets the 44px tap target', async ({ page }) => {
    // A relabel is exactly what shrank the storefront button to 41px on 2026-10-16, and
    // nobody re-measures after a copy change. This is the most expensive control on the
    // site; it gets measured.
    const box = await page.getByRole('button', { name: /License collection/i })
      .boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
  });

  test('works on a phone without sideways scroll', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole('button', { name: /License collection/i })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('the tap target survives the phone viewport', async ({ page }) => {
    // The button goes full-width at xs, which changes its box. A target that is correct
    // on desktop and 36px on a phone is broken on the device most buyers hold.
    await page.setViewportSize({ width: 390, height: 844 });

    // MEASURED AFTER THE REFLOW SETTLES, not immediately. This failed once in a full
    // production run and passed alone, which is the signature of reading a box mid-layout
    // rather than of a wrong box: changing the viewport re-flows the panel from row to
    // column, and boundingBox() will happily return the intermediate geometry.
    // `toBeInViewport` waits for a settled, painted element, so the measurement below is
    // of the final layout. A flaky assertion about tap targets is worse than none -- it
    // is the one that gets deleted the third time it goes red.
    const button = page.getByRole('button', { name: /License collection/i });
    await expect(button).toBeInViewport();

    const box = await button.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
  });

  test('SIGNED OUT, it refuses rather than collecting a tick from nobody', async ({ page }) => {
    await page.getByRole('button', { name: /License collection/i }).click();

    // The acceptance dialog must NOT open: a recorded acceptance has to name a person,
    // and attaching one to whoever signs in afterwards records an agreement that never
    // happened. What appears instead is the sign-in offer.
    await expect(page.getByText(/Accept the license terms to continue/i))
      .toHaveCount(0);
    await expect(page.locator('body')).toContainText(/Sign in to license this collection/i, {
      timeout: 15000
    });
  });
});

test.describe('licensing a single track commercially', () => {
  test('a track page offers the commercial licence beside the download', async ({ page }) => {
    // The hand-picking route. Reached from the collection page, which is how a buyer
    // who wants four cues rather than twenty-four gets there.
    await page.goto(`/collection/${SLUG}`, { waitUntil: 'domcontentloaded' });

    const firstTrack = page.getByRole('button', { name: /Preview & license/i }).first();
    await expect(firstTrack).toBeVisible({ timeout: 30000 });
    await dismissUpdatePrompt(page);
    await firstTrack.click();

    await expect(page).toHaveURL(/\/song\//, { timeout: 20000 });

    const expected = formatPrice(calculateCommercialPrice(1, commercialRateForPool(POOL)));
    const commercial = page.getByRole('button', { name: /Commercial license/i });
    await expect(commercial).toBeVisible({ timeout: 20000 });
    await expect(commercial).toContainText(expected);

    // And the download licence is still there, unchanged. Two controls, two licences;
    // folding them into one chooser would put two incomparable decisions in one control.
    //
    // MATCHED AS AN ALTERNATION because PurchaseButton has two labels and which one it
    // shows is not this test's business: "Personal license · $1.99" when the track
    // stands alone, "License options" when it belongs to an album and there is a
    // single-vs-album choice to make. Asserting the price string instead failed here --
    // these library tracks DO carry an album, so the chooser label is the correct one.
    await expect(page.getByRole('button', { name: /Personal license|License options/i }))
      .toBeVisible();
  });

  test('the commercial control meets the 44px tap target', async ({ page }) => {
    await page.goto(`/collection/${SLUG}`, { waitUntil: 'domcontentloaded' });
    const firstTrack = page.getByRole('button', { name: /Preview & license/i }).first();
    await expect(firstTrack).toBeVisible({ timeout: 30000 });
    await dismissUpdatePrompt(page);
    await firstTrack.click();
    await expect(page).toHaveURL(/\/song\//, { timeout: 20000 });

    const box = await page.getByRole('button', { name: /Commercial license/i }).boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
  });
});
