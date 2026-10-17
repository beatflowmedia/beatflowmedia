// src/utils/licenseTerms.test.js
//
// The product vocabulary, and the mapping that decides which contract a sale is made
// under. These assertions exist because the failures are silent and expensive:
//
//   - a commercial sale recorded under the DOWNLOAD licence produces evidence that the
//     buyer agreed NOT to do the thing they paid to do
//   - a commercial sale recorded under the SUBSCRIPTION licence describes a grant that
//     ends, when what was sold does not
//   - a collection offered at a personal price sells a production library for $1.99
//
// None of those throw. Each one just writes a wrong field and moves on.

const {
  LICENSE_SCOPE,
  LICENSE_TERM,
  LICENSE_GRANT,
  ONE_OFF_DOWNLOAD,
  ONE_OFF_COMMERCIAL,
  SUBSCRIPTION_SYNC,
  COMMERCIAL_LICENSE_SUMMARY,
  SUBSCRIPTION_SYNC_SUMMARY,
  PRODUCT_AGREEMENTS,
  agreementForProduct,
  summaryForProduct,
  productForSale,
  productFromMetadata,
  licenseFields
} = require('./licenseTerms');

const {
  DOWNLOAD_LICENSE,
  SYNC_LICENSE,
  COMMERCIAL_LICENSE,
  currentAgreementVersion
} = require('./agreements');

describe('ONE_OFF_COMMERCIAL — the production-library product', () => {
  test('is commercial, perpetual and a sync grant', () => {
    expect(ONE_OFF_COMMERCIAL).toEqual({
      scope: LICENSE_SCOPE.COMMERCIAL,
      term: LICENSE_TERM.PERPETUAL,
      grant: LICENSE_GRANT.SYNC
    });
  });

  test('is the ONLY product that is both commercial and perpetual', () => {
    // That combination is what a buyer is paying for: a client film outlives any
    // subscription, and the client owns it. If a second product ever claims the same
    // pair, the grant+term key in PRODUCT_AGREEMENTS stops identifying a product.
    const both = [ONE_OFF_DOWNLOAD, ONE_OFF_COMMERCIAL, SUBSCRIPTION_SYNC]
      .filter((p) => p.scope === 'commercial' && p.term === 'perpetual');
    expect(both).toEqual([ONE_OFF_COMMERCIAL]);
  });

  test('differs from the subscription licence only in its term', () => {
    expect(ONE_OFF_COMMERCIAL.scope).toBe(SUBSCRIPTION_SYNC.scope);
    expect(ONE_OFF_COMMERCIAL.grant).toBe(SUBSCRIPTION_SYNC.grant);
    expect(ONE_OFF_COMMERCIAL.term).not.toBe(SUBSCRIPTION_SYNC.term);
  });

  test('grants the sync that a download licence forbids', () => {
    // The two products are sold off the same files. If they ever shared a grant there
    // would be no product difference left to price.
    expect(ONE_OFF_DOWNLOAD.grant).toBe('download');
    expect(ONE_OFF_COMMERCIAL.grant).toBe('sync');
  });
});

describe('PRODUCT_AGREEMENTS — which contract governs which product', () => {
  test('each product maps to its own agreement, and none share one', () => {
    expect(agreementForProduct(ONE_OFF_DOWNLOAD)).toBe(DOWNLOAD_LICENSE);
    expect(agreementForProduct(ONE_OFF_COMMERCIAL)).toBe(COMMERCIAL_LICENSE);
    expect(agreementForProduct(SUBSCRIPTION_SYNC)).toBe(SYNC_LICENSE);

    const keys = PRODUCT_AGREEMENTS.map((e) => e.agreement);
    expect(new Set(keys).size).toBe(keys.length);
  });

  test('every mapped agreement has published text, so every product is sellable', () => {
    // A product mapped to an agreement with no text is a price with no contract behind
    // it. create-checkout returns 503 rather than selling, and this is the earlier
    // warning: if a product is added here before its text is written, this fails.
    PRODUCT_AGREEMENTS.forEach(({ agreement }) => {
      expect(currentAgreementVersion(agreement)).toMatch(/^[a-z-]+@\d{4}-\d{2}-\d{2}$/);
    });
  });

  test('an unknown or missing product maps to nothing, never to a default', () => {
    // A default here would be the whole bug: it would pick an agreement for a sale
    // nobody classified, and a wrong contract reads as diligence.
    expect(agreementForProduct(null)).toBeNull();
    expect(agreementForProduct(undefined)).toBeNull();
    expect(agreementForProduct({})).toBeNull();
    expect(agreementForProduct({ grant: 'broadcast', term: 'perpetual' })).toBeNull();
  });

  test('each product resolves to its own summary', () => {
    expect(summaryForProduct(ONE_OFF_COMMERCIAL)).toBe(COMMERCIAL_LICENSE_SUMMARY);
    expect(summaryForProduct(SUBSCRIPTION_SYNC)).toBe(SUBSCRIPTION_SYNC_SUMMARY);
    expect(summaryForProduct(null)).toBeNull();
  });

  test('the commercial summary does not promise the subscription wording', () => {
    // It is perpetual, so "for as long as you subscribe" would be false. The specific
    // word that must not appear is the one a copy-paste would carry over.
    expect(COMMERCIAL_LICENSE_SUMMARY.summary).not.toMatch(/subscrib/i);
    expect(COMMERCIAL_LICENSE_SUMMARY.summary).toMatch(/does not expire/i);
  });

  test('the claim-support promise is shared, not paraphrased', () => {
    // Both rest on one fact -- nothing is enrolled in Content ID or Rights Manager.
    // Two paraphrases would let one be updated and the other left false.
    expect(COMMERCIAL_LICENSE_SUMMARY.claimSupport)
      .toBe(SUBSCRIPTION_SYNC_SUMMARY.claimSupport);
  });
});

describe('productForSale — what is being sold', () => {
  test('a personal sale of a track or album is the download licence', () => {
    expect(productForSale('song', 'personal')).toBe(ONE_OFF_DOWNLOAD);
    expect(productForSale('album', 'personal')).toBe(ONE_OFF_DOWNLOAD);
  });

  test('an omitted licenseType means personal, so existing callers are unchanged', () => {
    // Five call sites send no licenseType. The safe default is the NARROWER grant.
    expect(productForSale('song', undefined)).toBe(ONE_OFF_DOWNLOAD);
    expect(productForSale('album', null)).toBe(ONE_OFF_DOWNLOAD);
  });

  test('a commercial sale of a track, album or collection is the commercial licence', () => {
    expect(productForSale('song', 'commercial')).toBe(ONE_OFF_COMMERCIAL);
    expect(productForSale('album', 'commercial')).toBe(ONE_OFF_COMMERCIAL);
    expect(productForSale('collection', 'commercial')).toBe(ONE_OFF_COMMERCIAL);
  });

  test('A COLLECTION HAS NO PERSONAL PRODUCT', () => {
    // The one that protects the money. A collection is priced by a volume curve from
    // $29/track; falling back to a personal download would sell 56 tracks for $1.99,
    // because every song document in the catalogue carries price: 199.
    expect(productForSale('collection', 'personal')).toBeNull();
    expect(productForSale('collection', undefined)).toBeNull();
  });

  test('the item types that are not licensed sales map to nothing', () => {
    // Subscriptions, submission credits, studio samples and memberships are governed by
    // other agreements or none. create-checkout must NOT demand a download acceptance
    // for them: recording the wrong contract is worse than recording none.
    ['submission_credits', 'studio_sample', 'artist_membership', 'playlist_submission',
      'bundle', 'subscription', '', null, undefined].forEach((itemType) => {
      expect(productForSale(itemType, 'personal')).toBeNull();
      expect(productForSale(itemType, 'commercial')).toBeNull();
    });
  });

  test('an unrecognised licenseType is refused, never guessed', () => {
    ['COMMERCIAL', 'Personal', 'sync', 'perpetual', 'free', true, 1]
      .forEach((licenseType) => {
        expect(productForSale('song', licenseType)).toBeNull();
      });
  });
});

describe('productFromMetadata — what the webhook records', () => {
  const warn = () => {};

  test('a session with no licence axes is a personal download', () => {
    // Every session created before these fields existed. Defaulting any other way would
    // relabel real purchase history.
    expect(productFromMetadata({}, warn)).toBe(ONE_OFF_DOWNLOAD);
    expect(productFromMetadata(null, warn)).toBe(ONE_OFF_DOWNLOAD);
    expect(productFromMetadata({ userId: 'u1', itemId: 'i1' }, warn)).toBe(ONE_OFF_DOWNLOAD);
  });

  test('round-trips what create-checkout writes', () => {
    // The actual contract between the two functions: licenseFields writes the session
    // metadata, productFromMetadata reads it back. If these drift, a $319 commercial
    // licence is recorded as a $1.99 personal download.
    [ONE_OFF_DOWNLOAD, ONE_OFF_COMMERCIAL, SUBSCRIPTION_SYNC].forEach((product) => {
      const metadata = licenseFields(product);
      expect(productFromMetadata(metadata, warn)).toEqual(product);
    });
  });

  test('a commercial session is NOT recorded as a personal download', () => {
    const metadata = licenseFields(ONE_OFF_COMMERCIAL);
    const recorded = licenseFields(productFromMetadata(metadata, warn));
    expect(recorded.licenseScope).toBe('commercial');
    expect(recorded.licenseGrant).toBe('sync');
    expect(recorded.licenseTerm).toBe('perpetual');
  });

  test('a partial or invalid axis set falls back rather than throwing', () => {
    // A webhook that throws on bad metadata 500s forever and leaves a paying buyer with
    // no licence at all. The fallback is the narrower grant, and it logs.
    const calls = [];
    const log = (...args) => calls.push(args);

    expect(productFromMetadata({ licenseScope: 'commercial' }, log)).toBe(ONE_OFF_DOWNLOAD);
    expect(productFromMetadata(
      { licenseScope: 'commercial', licenseTerm: 'forever', licenseGrant: 'sync' }, log
    )).toBe(ONE_OFF_DOWNLOAD);
    expect(productFromMetadata(
      { licenseScope: 'enterprise', licenseTerm: 'perpetual', licenseGrant: 'sync' }, log
    )).toBe(ONE_OFF_DOWNLOAD);

    expect(calls.length).toBe(3);
  });

  test('a session cannot be widened by inventing an axis', () => {
    // The client cannot reach these fields -- create-checkout spreads client metadata
    // BEFORE its own licenseFields -- but if it ever could, a nonsense value must not
    // resolve to something broader than a download.
    const forged = {
      licenseScope: 'commercial', licenseGrant: 'broadcast', licenseTerm: 'perpetual'
    };
    expect(productFromMetadata(forged, warn)).toBe(ONE_OFF_DOWNLOAD);
  });
});

describe('licenseFields writes all three axes plus the legacy field', () => {
  test('the commercial product stores a perpetual term', () => {
    // `licenseType` carries the TERM. stripe-webhook queries
    // where('licenseType','==','time-bound') to expire subscription licences, so a
    // perpetual commercial licence must never match that query.
    const fields = licenseFields(ONE_OFF_COMMERCIAL);
    expect(fields.licenseType).toBe('perpetual');
    expect(fields.licenseType).not.toBe('time-bound');
  });

  test('refuses a product with an invalid axis rather than storing a typo', () => {
    expect(() => licenseFields({ scope: 'commercial', term: 'perpetual', grant: 'snyc' }))
      .toThrow(/unknown grant/);
  });
});
