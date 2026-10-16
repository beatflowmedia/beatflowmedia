// netlify/functions/license-certificate.js
//
// The licence certificate PDF, and the "My licences" statement.
//
//   GET /.netlify/functions/license-certificate?licenseId=LIC-...   one certificate
//   GET /.netlify/functions/license-certificate?statement=1         all of mine
//
// AUTHENTICATED, unlike the verify page it points at. The verify page must be public --
// a venue has to be able to check a certificate without an account, and that is the whole
// point of it. Issuing the document is different: it is the buyer's own record, carries
// their licence numbers, and nobody else has a reason to generate it. So the asymmetry is
// deliberate rather than an oversight: public to CHECK, private to ISSUE.
//
// A certificate holder may of course pass the PDF to anyone. That is expected, and is why
// the page it points at shows only a masked buyer.
//
// WHAT THE DOCUMENT CLAIMS
// Only that BFMG issued it, and only to someone who checks the verify link. It is not a
// PKI signature and no reader will show a green tick for it; the layout leaves room for a
// paid AATL signature later without moving anything. Every page says, in those words,
// that status is live only at the verify link -- because a PDF is a frozen copy and a
// revoked licence's certificate looks exactly like a valid one.

const admin = require('firebase-admin');
const { PDFDocument, StandardFonts, rgb, degrees } = require('pdf-lib');
const QRCode = require('qrcode');
const { requireUser } = require('./lib/require-auth');
const {
  resolveLicense,
  resolveLicensesForUser,
  CODE_VERSION
} = require('./lib/license-certificate');
const { AGREEMENT_HISTORY } = require('../../src/utils/agreements');

function unescapePem(value) {
  return value ? value.split('\\n').join('\n') : value;
}

function initAdmin() {
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
const GREEN = rgb(0.114, 0.725, 0.329);
const INK = rgb(0.1, 0.1, 0.12);
const MUTED = rgb(0.45, 0.45, 0.5);
const RULE = rgb(0.85, 0.85, 0.88);

function fmtDate(value) {
  if (!value) return null;
  let d = null;
  if (typeof value.toDate === 'function') { try { d = value.toDate(); } catch (e) { d = null; } }
  else if (value instanceof Date) d = value;
  else if (typeof value === 'string') { const p = new Date(value); if (!Number.isNaN(p.getTime())) d = p; }
  return d ? d.toISOString().slice(0, 10) : null;
}

function money(cents) {
  return typeof cents === 'number' ? '$' + (cents / 100).toFixed(2) : null;
}

/** The summary text of the version this licence actually accepted -- not today's.
 *  A certificate for a 2026-09-19 licence must quote the 2026-09-19 wording, which is
 *  why AGREEMENT_HISTORY keeps every version rather than only the current one. */
function wordingFor(acceptedAgreement) {
  if (!acceptedAgreement) return null;
  const [agreement, version] = String(acceptedAgreement).split('@');
  const history = AGREEMENT_HISTORY[agreement] || [];
  const entry = history.find((h) => h.version === version);
  return entry ? entry.summary : null;
}

/** Wrap text to a width, since pdf-lib draws lines, not paragraphs. */
function wrap(text, font, size, maxWidth) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? line + ' ' + word : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Embed the licence id and code invisibly.
 *
 * TRACING ONLY, NOT PROOF, and the distinction matters enough to state here as well as in
 * the ledger. An invisible text layer and XMP metadata are both trivially readable AND
 * trivially strippable -- any PDF tool removes them and some viewers drop them on "save
 * as". So this catches casual redistribution and nothing else. Authenticity rests on the
 * verify page and the HMAC, never on this.
 *
 * Nearly free, so worth doing; worth no design compromise at all.
 */
function embedTrace(pdfDoc, page, font, facts, allTraces) {
  const trace = `BFMG|${facts.licenseId}|${facts.code}|${CODE_VERSION}`;

  // Document metadata is document-level, so on a multi-licence statement each call used
  // to overwrite the last and only the final licence survived in the keywords. The
  // per-page invisible layer below was unaffected, but the metadata -- the part a tool
  // reads first -- named one licence out of several. Accumulate instead.
  if (allTraces) {
    allTraces.push(trace);
    pdfDoc.setKeywords(allTraces);
    pdfDoc.setSubject('BeatFlow Media Group licences: ' + allTraces.length);
  } else {
    pdfDoc.setKeywords([trace]);
    pdfDoc.setSubject(`BeatFlow Media Group licence ${facts.licenseId}`);
  }
  // Opacity 0 rather than white-on-white: white text is visible the moment someone
  // selects all, and on a dark background it is visible immediately.
  page.drawText(trace, {
    x: 24, y: 10, size: 4, font, color: rgb(0, 0, 0), opacity: 0
  });
}

function header(page, font, bold, width, top) {
  page.drawText('BEATFLOW', { x: 48, y: top, size: 16, font: bold, color: INK });
  page.drawText('MEDIA GROUP', { x: 48 + bold.widthOfTextAtSize('BEATFLOW ', 16), y: top, size: 16, font: bold, color: GREEN });
  page.drawLine({
    start: { x: 48, y: top - 12 }, end: { x: width - 48, y: top - 12 },
    thickness: 1, color: RULE
  });
}

/** One certificate page. Returns the page so the caller can keep drawing. */
async function drawCertificate(pdfDoc, font, bold, facts, allTraces) {
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const left = 48;
  const right = width - 48;
  let y = height - 56;

  header(page, font, bold, width, y);
  y -= 48;

  page.drawText('Licence Certificate', { x: left, y, size: 24, font: bold, color: INK });
  y -= 22;

  const statusText = facts.revoked ? 'REVOKED' : 'VALID at time of issue';
  page.drawText(statusText, {
    x: left, y, size: 11, font: bold,
    color: facts.revoked ? rgb(0.85, 0.2, 0.2) : GREEN
  });
  y -= 30;

  // --- the record ------------------------------------------------------------------
  const title = facts.recordTitle || 'Not recorded';
  wrap(title, bold, 15, right - left).forEach((line) => {
    page.drawText(line, { x: left, y, size: 15, font: bold, color: INK });
    y -= 19;
  });
  if (facts.artistName) {
    page.drawText(facts.artistName, { x: left, y, size: 11, font, color: MUTED });
    y -= 16;
  }
  if (facts.withdrawn) {
    page.drawText('This recording is no longer in our catalogue. The licence stands.', {
      x: left, y, size: 9, font, color: MUTED
    });
    y -= 14;
  }
  y -= 10;

  // --- the facts --------------------------------------------------------------------
  const rows = [
    ['Licence number', facts.licenseId],
    ['Licence holder', facts.buyerMasked],
    ['ISRC', facts.isrc || 'Not recorded for this purchase'],
    ['Purchased', fmtDate(facts.purchasedAt) || 'Not recorded'],
    ['Price paid', money(facts.pricePaid) || 'Not recorded'],
    ['Grant', [facts.scope, facts.term, facts.grant].filter(Boolean).join(' · ') || 'Not recorded for this purchase'],
    ['Terms accepted', facts.acceptedAgreement || 'Predates recorded acceptance'],
    ['Verification code', facts.code]
  ];
  if (facts.revoked) {
    rows.push(['Revoked', (facts.revokedReason || 'Not recorded') +
      (fmtDate(facts.revokedAt) ? ' · ' + fmtDate(facts.revokedAt) : '')]);
  }

  rows.forEach(([label, value]) => {
    page.drawText(label, { x: left, y, size: 9, font, color: MUTED });
    wrap(String(value), font, 11, right - left - 150).forEach((line, i) => {
      page.drawText(line, { x: left + 150, y: y - (i * 14), size: 11, font: bold, color: INK });
    });
    const lines = wrap(String(value), font, 11, right - left - 150).length;
    y -= Math.max(18, lines * 14 + 4);
  });

  y -= 8;
  page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 0.5, color: RULE });
  y -= 22;

  // --- what the licence permits, in the words of the version accepted ---------------
  const wording = wordingFor(facts.acceptedAgreement);
  page.drawText('What this licence covers', { x: left, y, size: 10, font: bold, color: INK });
  y -= 15;
  const coverage = wording ||
    'This purchase predates our recorded licence terms. It is a personal download licence: ' +
    'private listening only. Anything beyond that needs a separate licence.';
  wrap(coverage, font, 9, right - left).forEach((line) => {
    page.drawText(line, { x: left, y, size: 9, font, color: INK });
    y -= 12;
  });
  y -= 14;

  // --- the verify block, which is the only thing that proves anything ----------------
  const verifyUrl = `${SITE}/verify/${facts.licenseId}`;
  const qrPng = await QRCode.toBuffer(verifyUrl + '?code=' + facts.code, {
    margin: 0, width: 220, errorCorrectionLevel: 'M'
  });
  const qrImage = await pdfDoc.embedPng(qrPng);
  const qrSize = 92;

  page.drawImage(qrImage, { x: left, y: y - qrSize, width: qrSize, height: qrSize });

  const tx = left + qrSize + 16;
  let ty = y - 10;
  page.drawText('Check this certificate', { x: tx, y: ty, size: 10, font: bold, color: INK });
  ty -= 15;
  wrap(verifyUrl, font, 9, right - tx).forEach((line) => {
    page.drawText(line, { x: tx, y: ty, size: 9, font: bold, color: GREEN });
    ty -= 12;
  });
  ty -= 4;
  wrap('Authentic only if ' + SITE.replace(/^https?:\/\//, '') + '/verify/' + facts.licenseId +
       ' shows the same details. Status is live only at that link — this document is a copy ' +
       'taken at the moment it was generated, and a licence withdrawn later will still look ' +
       'valid here.', font, 8, right - tx).forEach((line) => {
    page.drawText(line, { x: tx, y: ty, size: 8, font, color: MUTED });
    ty -= 10;
  });

  y = Math.min(y - qrSize, ty) - 24;

  // --- footer -----------------------------------------------------------------------
  page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 0.5, color: RULE });
  y -= 14;
  page.drawText('Issued ' + new Date().toISOString().slice(0, 10) +
    ' · BeatFlow Media Group · ' + SITE.replace(/^https?:\/\//, ''), {
    x: left, y, size: 8, font, color: MUTED
  });

  embedTrace(pdfDoc, page, font, facts, allTraces);
  return page;
}

async function buildPdf(list, isStatement, who) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  pdfDoc.setTitle(isStatement ? 'BeatFlow Media Group — My licences' : 'BeatFlow Media Group — Licence Certificate');
  pdfDoc.setProducer('BeatFlow Media Group');
  pdfDoc.setCreator('BeatFlow Media Group');
  pdfDoc.setCreationDate(new Date());

  if (isStatement) {
    // Cover page: what this document is, and how many licences it covers.
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();
    let y = height - 56;
    header(page, font, bold, width, y);
    y -= 48;
    page.drawText('My licences', { x: 48, y, size: 24, font: bold, color: INK });
    y -= 26;
    page.drawText(`${list.length} licence${list.length === 1 ? '' : 's'} held by ${who}`, {
      x: 48, y, size: 11, font, color: MUTED
    });
    y -= 30;
    wrap('Each licence below has its own certificate page, its own verification code, and its ' +
      'own link. Status shown here is correct at the moment this document was generated; the ' +
      'live record for any licence is at the link on its page.', font, 10, width - 96)
      .forEach((line) => { page.drawText(line, { x: 48, y, size: 10, font, color: INK }); y -= 13; });
    y -= 10;
    list.forEach((f) => {
      const label = `${f.licenseId}  ·  ${(f.recordTitle || 'Not recorded').slice(0, 52)}`;
      page.drawText(label, { x: 48, y, size: 9, font, color: INK });
      page.drawText(f.revoked ? 'REVOKED' : 'VALID', {
        x: width - 48 - bold.widthOfTextAtSize(f.revoked ? 'REVOKED' : 'VALID', 9),
        y, size: 9, font: bold, color: f.revoked ? rgb(0.85, 0.2, 0.2) : GREEN
      });
      y -= 14;
    });
    page.drawText('Generated ' + new Date().toISOString().slice(0, 10), {
      x: 48, y: 40, size: 8, font, color: MUTED
    });
  }

  // One accumulator for a statement so every licence lands in the metadata; undefined
  // for a single certificate, where the simple form is correct.
  const allTraces = isStatement ? [] : undefined;
  for (const facts of list) {
    await drawCertificate(pdfDoc, font, bold, facts, allTraces);
  }

  return Buffer.from(await pdfDoc.save());
}

exports.handler = async (event) => {
  const auth = await (async () => {
    initAdmin();
    return requireUser(event);
  })();
  // refuse() nests the HTTP response under `.response`; returning the wrapper itself
  // produces a 500 with no body, which is what the first run of the probe caught --
  // an unauthenticated caller got "server error" instead of "sign in".
  if (!auth.ok) return auth.response;

  const params = event.queryStringParameters || {};
  const db = initAdmin();

  try {
    if (params.statement) {
      const list = await resolveLicensesForUser(db, auth.uid);
      if (!list.length) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'You do not hold any licences yet.' })
        };
      }
      const pdf = await buildPdf(list, true, auth.email || 'you');
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="BeatFlow-my-licences.pdf"',
          'Cache-Control': 'no-store'
        },
        body: pdf.toString('base64'),
        isBase64Encoded: true
      };
    }

    const licenseId = (params.licenseId || '').trim().toUpperCase();
    if (!/^LIC-[A-Z0-9]+$/.test(licenseId)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'A licence number is required.' })
      };
    }

    const facts = await resolveLicense(db, licenseId);
    if (!facts) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No such licence.' })
      };
    }

    // The licence holder, or nobody. An authenticated caller is not automatically
    // entitled to someone else's certificate -- that is the IDOR this would otherwise be.
    if (facts.userId && facts.userId !== auth.uid) {
      console.warn('[license-certificate] refused: user', auth.uid, 'asked for', licenseId);
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'This licence belongs to a different account.' })
      };
    }

    const pdf = await buildPdf([facts], false, auth.email || 'you');
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="BeatFlow-licence-${facts.licenseId}.pdf"`,
        'Cache-Control': 'no-store'
      },
      body: pdf.toString('base64'),
      isBase64Encoded: true
    };
  } catch (err) {
    console.error('[license-certificate] failed:', err.message, err.stack);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Could not produce the certificate.' })
    };
  }
};
