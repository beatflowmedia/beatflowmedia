// netlify/functions/lib/license-certificate.js
//
// ONE place that knows how a verification code is made and how a licence resolves to
// the facts printed on a certificate.
//
// Both the certificate generator and the verify page import this. If they each built the
// code their own way they would drift, and the failure would be a buyer holding a
// genuine certificate that our own verify page calls invalid -- the worst possible
// direction for a feature whose entire job is proving authenticity.
//
// WHAT THE CODE PROVES, AND WHAT IT DOES NOT
// An HMAC keyed with a server-only secret proves the certificate was issued by us. It
// proves nothing to anyone who does not check it against our domain, because a forged
// PDF can print any code it likes. The anchor is beatflowmediagroup.com/verify/<id>
// agreeing with the document, not the document itself -- which is why every certificate
// says so in those words. A buyer showing a PDF to a venue is relying on the venue
// following the link.
//
// It is also NOT a signature in the PKI sense. There is no certificate authority and
// nothing a PDF reader will show a green tick for; adding an AATL signature later is a
// separate, paid step that this layout leaves room for.

const crypto = require('crypto');

/**
 * Version prefix on the HMAC input.
 *
 * Codes are printed on documents that leave our control and may be checked years later.
 * Without this, any change to the input fields -- adding one, or changing what an absent
 * field hashes as -- would silently invalidate every code already in circulation, and
 * the symptom would be genuine certificates failing verification with no explanation.
 *
 * With it, a future v2 can coexist: a certificate carries its version, and the verifier
 * computes the shape that certificate was issued under. Bump this ONLY alongside code
 * that can still verify v1.
 */
const CODE_VERSION = 'v1';

/** Stand-ins for fields that do not exist on older licences. Part of the hashed input,
 *  so they must never change under a given CODE_VERSION. */
const ABSENT = {
  isrc: 'no-isrc',
  agreement: 'no-agreement',
  purchasedAt: 'no-date'
};

/**
 * A Firestore Timestamp, Date or string reduced to one canonical form.
 *
 * Seconds precision, UTC, ISO 8601. This matters more than it looks: a Firestore
 * Timestamp does not stringify stably, and millisecond drift between the issuing path
 * and the verifying path would produce a different hash for the same licence. The code
 * would then fail for reasons invisible to everyone involved.
 */
function canonicalTimestamp(value) {
  if (!value) return ABSENT.purchasedAt;
  let date = null;
  if (typeof value.toDate === 'function') {
    try { date = value.toDate(); } catch (err) { date = null; }
  } else if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) date = parsed;
  }
  if (!date || Number.isNaN(date.getTime())) return ABSENT.purchasedAt;
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/** Crockford-ish base32 over the digest. Excludes I, L, O and U so a code read off paper
 *  cannot be mistyped into a different valid-looking one. */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function toBase32(buffer, length) {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
      if (out.length === length) return out;
    }
  }
  while (out.length < length) out += '0';
  return out;
}

/** 10 characters of base32 is 50 bits. Short enough to read off paper and type; far
 *  beyond guessing when every attempt is an HTTP request to us. */
const CODE_LENGTH = 10;

function secret() {
  const value = process.env.LICENSE_CERT_SECRET;
  if (!value) {
    // Refuse rather than fall back to a default. A predictable key would make every code
    // forgeable while everything still appeared to work, which is worse than an outage.
    throw new Error(
      'LICENSE_CERT_SECRET is not set. Certificates cannot be issued or verified without ' +
      'it, and there is deliberately no fallback: a default key would make every ' +
      'verification code forgeable while appearing to work.'
    );
  }
  return value;
}

/**
 * The verification code for a licence.
 *
 * Input is fixed, ordered, and pipe-delimited, with explicit literals for absent fields
 * so that an older licence still produces a stable code rather than hashing `undefined`.
 */
function verificationCode(facts) {
  const input = [
    CODE_VERSION,
    facts.licenseId || '',
    facts.isrc || ABSENT.isrc,
    facts.acceptedAgreement || ABSENT.agreement,
    canonicalTimestamp(facts.purchasedAt)
  ].join('|');

  const digest = crypto.createHmac('sha256', secret()).update(input).digest();
  return toBase32(digest, CODE_LENGTH);
}

/** Constant-time compare, so a verifier cannot be used as an oracle to discover a code
 *  character by character through response timing. */
function codeMatches(expected, supplied) {
  if (!expected || !supplied) return false;
  const a = Buffer.from(String(expected).toUpperCase());
  const b = Buffer.from(String(supplied).toUpperCase().replace(/[\s-]/g, ''));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** "Percy Rice" -> "P. R."  /  "someone@example.com" -> "s•••@example.com"
 *
 *  Enough for a venue to match a certificate against the person presenting it, and not
 *  personal data on a public page. The verify page is public by design -- it has to be,
 *  or a venue cannot check anything -- so nothing here may be more than a buyer would
 *  accept being seen. */
function maskBuyer(name, email) {
  if (name && String(name).trim()) {
    return String(name).trim().split(/\s+/).map((p) => p[0].toUpperCase() + '.').join(' ');
  }
  if (email && String(email).includes('@')) {
    const [local, domain] = String(email).split('@');
    return local.slice(0, 1) + '•••@' + domain;
  }
  return 'Licence holder';
}

/**
 * Resolve a LIC- id to everything a certificate or the verify page needs.
 *
 * Reads the PURCHASE as the spine, because that is where revocation lives: `isRevoked()`
 * tests the purchase, and lib/entitlement.js refuses downloads on that basis. The licence
 * row carries its own `status`, which the reversal path keeps in step -- but if the two
 * ever disagree, the purchase is the one that decides whether a file is served, so it is
 * the one a certificate must report.
 *
 * @returns {Promise<object|null>} null when no such licence exists
 */
async function resolveLicense(db, licenseId) {
  if (!licenseId || !/^LIC-[A-Z0-9]+$/i.test(licenseId)) return null;

  const purchases = await db.collection('purchases')
    .where('licenseId', '==', licenseId.toUpperCase())
    .limit(1)
    .get();
  if (purchases.empty) return null;

  const purchaseDoc = purchases.docs[0];
  const purchase = purchaseDoc.data();

  // The licence row, by either link. Older rows predate `purchaseLicenseId` and are
  // reachable only through `purchaseId`.
  let licenseRow = null;
  let byLink = await db.collection('licenses')
    .where('purchaseLicenseId', '==', licenseId.toUpperCase()).limit(1).get();
  if (!byLink.empty) {
    licenseRow = byLink.docs[0].data();
  } else {
    byLink = await db.collection('licenses')
      .where('purchaseId', '==', purchaseDoc.id).limit(1).get();
    if (!byLink.empty) licenseRow = byLink.docs[0].data();
  }

  // What was actually licensed. An album purchase stores the ALBUM id in `itemId`, and
  // the licence row puts it in a field called `trackId`, so resolving against `songs`
  // alone reports a real album as a missing track.
  const itemId = purchase.itemId || (licenseRow && licenseRow.trackId) || null;
  let recordTitle = null;
  let recordKind = purchase.itemType === 'album' ? 'album' : 'track';
  let isrc = (licenseRow && licenseRow.isrc) || null;

  if (itemId) {
    const songDoc = await db.collection('songs').doc(itemId).get();
    if (songDoc.exists) {
      recordTitle = songDoc.data().title || null;
      recordKind = 'track';
      if (!isrc) isrc = songDoc.data().isrc || null;
    } else {
      const albumDoc = await db.collection('albums').doc(itemId).get();
      if (albumDoc.exists) {
        recordTitle = albumDoc.data().title || null;
        recordKind = 'album';
      }
    }
  }
  // Fall back to the name recorded at purchase: a record removed from the catalogue
  // still has a name, and the buyer still holds a licence to it.
  const withdrawn = !recordTitle;
  if (!recordTitle) recordTitle = purchase.itemName || null;

  const { isRevoked, REASON_LABELS } = require('../../../src/utils/licenseRevocation');
  const revoked = isRevoked(purchase);

  const facts = {
    licenseId: licenseId.toUpperCase(),
    recordTitle,
    recordKind,
    artistName: purchase.artistName || null,
    isrc,
    acceptedAgreement: purchase.acceptedAgreement || (licenseRow && licenseRow.acceptedAgreement) || null,
    purchasedAt: purchase.purchasedAt || null,
    scope: (licenseRow && licenseRow.licenseScope) || null,
    term: (licenseRow && licenseRow.licenseTerm) || null,
    grant: (licenseRow && licenseRow.licenseGrant) || null,
    pricePaid: (licenseRow && licenseRow.pricePaid) != null
      ? licenseRow.pricePaid
      : (typeof purchase.price === 'number' ? Math.round(purchase.price * 100) : null),
    buyerMasked: maskBuyer(purchase.customerName, purchase.customerEmail),
    userId: purchase.userId || null,
    withdrawn,
    revoked,
    revokedReason: revoked
      ? (REASON_LABELS[purchase.licenseRevokedReason] || purchase.licenseRevokedReason || null)
      : null,
    revokedAt: revoked ? (purchase.licenseRevokedAt || null) : null
  };

  facts.code = verificationCode(facts);
  facts.codeVersion = CODE_VERSION;
  return facts;
}

/** Every licence a user holds, newest first. Backs the "My licences" statement. */
async function resolveLicensesForUser(db, userId) {
  if (!userId) return [];
  const purchases = await db.collection('purchases')
    .where('userId', '==', userId)
    .limit(200)
    .get();

  const out = [];
  for (const doc of purchases.docs) {
    const licenseId = doc.data().licenseId;
    if (!licenseId) continue;
    const facts = await resolveLicense(db, licenseId);
    if (facts) out.push(facts);
  }
  out.sort((a, b) => {
    const at = canonicalTimestamp(a.purchasedAt);
    const bt = canonicalTimestamp(b.purchasedAt);
    return at < bt ? 1 : at > bt ? -1 : 0;
  });
  return out;
}

module.exports = {
  CODE_VERSION,
  CODE_LENGTH,
  ABSENT,
  canonicalTimestamp,
  verificationCode,
  codeMatches,
  maskBuyer,
  resolveLicense,
  resolveLicensesForUser
};
