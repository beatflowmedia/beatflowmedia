// netlify/functions/verify-license.js
//
// /verify/<LIC-id> — the source of truth a certificate points at.
//
// WHY THIS IS A FUNCTION AND NOT AN APP ROUTE
// Three reasons, and the third is the one that cost us five hours this week.
//
//   1. The HMAC secret must never reach a browser, so the check runs here.
//   2. An unknown id has to return a real "no such licence" page. An SPA route cannot:
//      the catch-all serves the app shell with a 200, so a mistyped id would look like
//      a working page that simply never finishes loading.
//   3. It needs a rule in BOTH public/_redirects and netlify.toml. _redirects is the one
//      that wins, and a rule in the toml alone is dead -- which is exactly how /r/
//      shipped and did nothing while every signal said it had deployed.
//
// WHY IT IS PUBLIC
// A venue, a client or a platform has to be able to check a certificate without an
// account. That is the entire purpose. So the buyer appears masked -- "P. R." or
// "s•••@example.com" -- which is enough to match the person presenting the document and
// is not personal data.
//
// WHAT IT PROVES
// That BFMG's live record agrees with the document. Status is read at request time, so a
// revoked licence reads REVOKED here even though the PDF in someone's hand still looks
// valid -- which is precisely why the certificate says status is live only at this link.

const admin = require('firebase-admin');
const { resolveLicense, codeMatches } = require('./lib/license-certificate');

/** Same PEM hazard as download-master.js: `\n` -> `\n` is a no-op and leaves the escapes
 *  in the key, throwing at module load before any logic runs. */
function unescapePem(value) {
  return value ? value.split('\\n').join('\n') : value;
}

function db() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: unescapePem(process.env.FIREBASE_PRIVATE_KEY)
      })
    });
  }
  return admin.firestore();
}

const SITE = process.env.URL || 'https://beatflowmediagroup.com';

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(value) {
  if (!value) return null;
  let d = null;
  if (typeof value.toDate === 'function') { try { d = value.toDate(); } catch (e) { d = null; } }
  else if (value instanceof Date) d = value;
  else if (typeof value === 'string') { const p = new Date(value); if (!Number.isNaN(p.getTime())) d = p; }
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}

function page(title, bodyHtml, status) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // A verification result must never be read from cache: a licence revoked a minute
      // ago has to read REVOKED now, not whatever it said before.
      'Cache-Control': 'no-store',
      // Not content. Also Disallowed in robots.txt; this covers a crawler that arrives
      // without reading it.
      'X-Robots-Tag': 'noindex, nofollow'
    },
    body: `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${esc(title)} · BeatFlow Media Group</title>
<style>
  :root { color-scheme: dark; --bg:#111827; --panel:#1f2937; --ink:#f9fafb; --muted:#9ca3af;
          --ok:#1DB954; --bad:#f87171; --line:rgba(255,255,255,.1); }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font:16px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif; }
  /* Mobile-first: this is read on a phone in a venue doorway more often than at a desk. */
  main { max-width:44rem; margin:0 auto; padding:2rem 1rem 4rem; }
  .brand { font-weight:700; letter-spacing:.02em; margin-bottom:2rem; }
  .brand span { color:var(--ok); }
  h1 { font-size:1.75rem; margin:0 0 .5rem; }
  .status { display:inline-flex; align-items:center; min-height:44px; padding:0 1rem; border-radius:999px;
            font-weight:700; margin:.5rem 0 1.5rem; }
  .valid { background:rgba(29,185,84,.15); color:var(--ok); }
  .revoked { background:rgba(248,113,113,.15); color:var(--bad); }
  .panel { background:var(--panel); border-radius:.75rem; padding:1.25rem; margin-bottom:1.5rem; }
  dl { display:grid; grid-template-columns:1fr; gap:.75rem 1rem; margin:0; }
  @media (min-width:38rem) { dl { grid-template-columns:11rem 1fr; } }
  dt { color:var(--muted); font-size:.875rem; }
  dd { margin:0; word-break:break-word; }
  code { background:rgba(0,0,0,.35); padding:.15rem .4rem; border-radius:.25rem; font-size:.9em; }
  .note { color:var(--muted); font-size:.875rem; }
  a { color:var(--ok); }
  a.tap { display:inline-flex; align-items:center; min-height:44px; }
  hr { border:0; border-top:1px solid var(--line); margin:1.5rem 0; }
</style>
</head><body><main>
<div class="brand">BEAT<span>FLOW</span> MEDIA GROUP</div>
${bodyHtml}
</main></body></html>`
  };
}

exports.handler = async (event) => {
  const segments = (event.path || '').split('/').filter(Boolean);
  const raw = segments[segments.length - 1] || '';
  const licenseId = decodeURIComponent(raw).trim().toUpperCase();
  const supplied = (event.queryStringParameters && event.queryStringParameters.code) || null;

  // Nothing to look up. Say so plainly rather than 404ing to the home page.
  if (!licenseId || !/^LIC-[A-Z0-9]+$/.test(licenseId)) {
    return page('Licence not found', `
      <h1>No licence to check</h1>
      <p>This page verifies a BeatFlow Media Group licence certificate. The address should
         end with a licence number, like <code>/verify/LIC-XXXXXXXXXXXXXXXX</code>.</p>
      <p class="note">The number is printed on the certificate, next to the QR code.</p>
    `, 404);
  }

  let facts = null;
  try {
    facts = await resolveLicense(db(), licenseId);
  } catch (err) {
    console.error('[verify-license] lookup failed for', licenseId, err.message);
    return page('Unable to check', `
      <h1>Unable to check this licence right now</h1>
      <p>Something went wrong on our side. This is not a statement about the certificate —
         please try again shortly.</p>
      <p class="note">Licence number: <code>${esc(licenseId)}</code></p>
    `, 503);
  }

  if (!facts) {
    // Deliberately identical whether the id is well-formed-but-unknown or a guess. There
    // is nothing to learn from the difference, and saying "that is nearly right" would be
    // an oracle.
    return page('Licence not found', `
      <h1>No such licence</h1>
      <p>We hold no licence with the number <code>${esc(licenseId)}</code>.</p>
      <p>If this number came from a certificate, the certificate is not one we issued, or
         the number has been mistyped. Letters and digits are easy to confuse — check for
         <code>0</code> against <code>O</code>, and <code>1</code> against <code>I</code>.</p>
      <p class="note">Certificates we issue always verify at
         <code>${esc(SITE)}/verify/&lt;licence number&gt;</code>.</p>
    `, 404);
  }

  const codeState = supplied
    ? (codeMatches(facts.code, supplied) ? 'match' : 'mismatch')
    : 'absent';

  const purchased = formatDate(facts.purchasedAt);
  const revokedOn = formatDate(facts.revokedAt);
  const grant = [facts.scope, facts.term, facts.grant].filter(Boolean).join(' · ');

  const rows = [
    [facts.recordKind === 'album' ? 'Album' : 'Recording',
      esc(facts.recordTitle || 'Not recorded') +
      (facts.withdrawn ? ' <span class="note">(no longer in our catalogue — the licence stands)</span>' : '')],
    facts.artistName ? ['Artist', esc(facts.artistName)] : null,
    ['ISRC', facts.isrc ? `<code>${esc(facts.isrc)}</code>` : '<span class="note">Not recorded for this purchase</span>'],
    ['Licence number', `<code>${esc(facts.licenseId)}</code>`],
    ['Licence holder', esc(facts.buyerMasked)],
    ['Purchased', purchased ? esc(purchased) : '<span class="note">Not recorded</span>'],
    ['Grant', grant ? esc(grant) : '<span class="note">Not recorded for this purchase</span>'],
    ['Terms accepted', facts.acceptedAgreement
      ? `<code>${esc(facts.acceptedAgreement)}</code> — <a href="${esc(SITE)}/changes">read this version</a>`
      : '<span class="note">Predates recorded acceptance</span>'],
    ['Verification code', `<code>${esc(facts.code)}</code>` + (
      codeState === 'match' ? ' <span style="color:var(--ok)">✓ matches the code supplied</span>'
        : codeState === 'mismatch' ? ' <span style="color:var(--bad)">✗ does not match the code supplied</span>'
          : '')]
  ].filter(Boolean);

  const statusBadge = facts.revoked
    ? `<div class="status revoked">✗ REVOKED</div>`
    : `<div class="status valid">✓ VALID</div>`;

  const revokedNote = facts.revoked ? `
    <div class="panel">
      <strong>This licence has been withdrawn.</strong>
      <p>Reason: ${esc(facts.revokedReason || 'not recorded')}${revokedOn ? ' · ' + esc(revokedOn) : ''}</p>
      <p class="note">A certificate issued before this date will still look valid on paper.
         This page is the current record.</p>
    </div>` : '';

  const mismatchNote = codeState === 'mismatch' ? `
    <div class="panel">
      <strong>The verification code does not match.</strong>
      <p>The licence above is real, but the code printed on the document you are holding is
         not the one we issued for it. Either the code was mistyped, or the document was
         not produced by us.</p>
    </div>` : '';

  return page(`Licence ${facts.licenseId}`, `
    <h1>Licence ${esc(facts.licenseId)}</h1>
    ${statusBadge}
    ${revokedNote}
    ${mismatchNote}
    <div class="panel"><dl>
      ${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join('\n      ')}
    </dl></div>
    <hr>
    <p class="note">This page is BeatFlow Media Group's live record. A certificate is a copy
       taken at a moment in time; if the two disagree, this page is correct.</p>
    <p class="note">A personal download licence covers private listening only. It does not
       cover public performance, DJ use, broadcast, synchronisation, remixing, compilation,
       redistribution or AI training — those need a separate licence.
       <a class="tap" href="${esc(SITE)}/terms">Read the full terms</a></p>
  `, 200);
};
