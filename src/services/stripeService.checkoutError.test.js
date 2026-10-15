/**
 * @jest-environment jsdom
 */
// src/services/stripeService.checkoutError.test.js
//
// The 409 recovery path, which exists because bumping the license agreement version on
// 2026-10-15 would otherwise have broken checkout for every returning visitor.
//
// create-checkout refuses a stale `acceptedAgreement` with a 409. A buyer holding a
// cached bundle sends the old version, is refused, re-ticks the SAME stale checkbox, and
// is refused again -- a loop on the payment path with no exit they could ever guess at,
// and no error in any log that looks like a bug.
//
// This is tested here rather than in a browser for a practical reason: reaching the
// checkout UI requires a signed-in Firebase session, and the logic worth proving is the
// branch, not the button. The branch decides whether a paying customer can pay.

jest.mock('../firebaseConfig', () => ({ db: {}, auth: {} }));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(), addDoc: jest.fn(), doc: jest.fn(), getDoc: jest.fn(),
  query: jest.fn(), where: jest.fn(), getDocs: jest.fn(),
  Timestamp: { now: () => ({}) }
}));
jest.mock('@stripe/stripe-js', () => ({ loadStripe: jest.fn(() => Promise.resolve(null)) }));
jest.mock('./licenseService', () => ({ calculateTrackPricing: jest.fn() }));
jest.mock('../utils/authedHeaders', () => ({ authedHeaders: jest.fn(async () => ({})) }));

const { handleCheckoutError } = require('./stripeService');

/** A fetch Response, as far as this code cares. */
function response(status, body) {
  return { status, ok: status >= 200 && status < 300, json: async () => body };
}

const STALE = { error: 'Please review and accept the current license terms to continue.',
                currentAgreement: 'download-license@2026-10-15' };

describe('handleCheckoutError — stale license version recovery', () => {
  let reload;

  beforeEach(() => {
    sessionStorage.clear();
    reload = jest.fn();
    // jsdom refuses a real navigation, so location is replaced wholesale.
    delete window.location;
    window.location = { reload, href: 'http://localhost/song/abc' };

    window.caches = {
      keys: jest.fn(async () => ['beatflow-media-v7']),
      delete: jest.fn(async () => true)
    };
    Object.defineProperty(window.navigator, 'serviceWorker', {
      value: { getRegistration: jest.fn(async () => ({ update: jest.fn(async () => {}) })) },
      configurable: true
    });
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  test('a 409 with currentAgreement reloads the page once', async () => {
    await expect(handleCheckoutError(response(409, STALE))).rejects.toThrow(/Updating/i);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  test('it clears the service worker caches, or the reload has nothing new to load', async () => {
    await expect(handleCheckoutError(response(409, STALE))).rejects.toThrow();
    // A byte-identical service worker is never reinstalled and serves index.html from
    // cache, so without this the reload returns the SAME stale bundle, forever.
    expect(window.caches.keys).toHaveBeenCalled();
    expect(window.caches.delete).toHaveBeenCalledWith('beatflow-media-v7');
    expect(window.navigator.serviceWorker.getRegistration).toHaveBeenCalled();
  });

  test('it does NOT reload a second time — a reload loop is worse than the bug', async () => {
    await expect(handleCheckoutError(response(409, STALE))).rejects.toThrow(/Updating/i);
    expect(reload).toHaveBeenCalledTimes(1);

    reload.mockClear();
    // Same session, flag already set: the buyer gets a message they can act on instead
    // of an endless refresh.
    await expect(handleCheckoutError(response(409, STALE)))
      .rejects.toThrow(/out-of-date version of the license terms/i);
    expect(reload).not.toHaveBeenCalled();
  });

  test('the second message tells the buyer what to actually do', async () => {
    await handleCheckoutError(response(409, STALE)).catch(() => {});
    await expect(handleCheckoutError(response(409, STALE)))
      .rejects.toThrow(/refresh the page/i);
  });

  test('a 409 WITHOUT currentAgreement is an ordinary error, not a reload', async () => {
    await expect(handleCheckoutError(response(409, { error: 'Something else entirely' })))
      .rejects.toThrow('Something else entirely');
    expect(reload).not.toHaveBeenCalled();
  });

  test('other failures pass the server message through untouched', async () => {
    await expect(handleCheckoutError(response(400, { error: 'Track not found.' })))
      .rejects.toThrow('Track not found.');
    await expect(handleCheckoutError(response(401, { error: 'Sign in to complete a purchase.' })))
      .rejects.toThrow('Sign in to complete a purchase.');
    expect(reload).not.toHaveBeenCalled();
  });

  test('a body that is not JSON still produces a usable error', async () => {
    const broken = { status: 502, ok: false, json: async () => { throw new Error('not json'); } };
    await expect(handleCheckoutError(broken)).rejects.toThrow(/Failed to create checkout session/i);
  });

  test('blocked sessionStorage degrades to the message instead of throwing', async () => {
    // Private browsing, or storage disabled. The recovery cannot track its one-shot flag,
    // so it must not attempt a reload it cannot bound.
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    await expect(handleCheckoutError(response(409, STALE)))
      .rejects.toThrow(/out-of-date version of the license terms/i);
    expect(reload).not.toHaveBeenCalled();
  });
});
