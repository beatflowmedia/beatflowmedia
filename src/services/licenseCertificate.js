// src/services/licenseCertificate.js
//
// Fetch a licence certificate PDF and hand it to the browser as a download.
//
// The endpoint is authenticated, so this cannot be a plain anchor the way the master
// download is -- an <a href> carries no Authorization header. So the bytes are fetched
// with the token attached and turned into a blob.
//
// That makes this subject to CSP `connect-src` and, for a cross-origin target, to CORS.
// Neither bites here because the function is same-origin: `/.netlify/functions/...` in
// production, and proxied through setupProxy.js to the functions server in dev. Worth
// stating, because the R2 master download was broken in production for exactly this
// reason -- a blob fetch is connect-src, and the policy had never listed the host.

import { authedHeaders } from '../utils/authedHeaders';

/** Turn a fetched blob into a save dialog, then release the object URL. */
function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoked on a tick rather than immediately: some browsers abandon the download if the
  // object URL disappears in the same frame as the click.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function fetchPdf(query, filename) {
  const headers = await authedHeaders();
  const res = await fetch('/.netlify/functions/license-certificate?' + query, { headers });

  if (!res.ok) {
    // The function answers errors as JSON, so the message is usable rather than a status
    // code the buyer has to interpret.
    let message = 'Could not produce the certificate.';
    try {
      const data = await res.json();
      if (data && data.error) message = data.error;
    } catch (err) { /* non-JSON body; keep the default */ }
    throw new Error(message);
  }

  const blob = await res.blob();
  if (!blob.size) throw new Error('The certificate came back empty. Please try again.');
  saveBlob(blob, filename);
  return blob.size;
}

/** One certificate, for one licence. */
export function downloadCertificate(licenseId) {
  return fetchPdf(
    'licenseId=' + encodeURIComponent(licenseId),
    'BeatFlow-licence-' + licenseId + '.pdf'
  );
}

/** Every licence the signed-in buyer holds, one page each behind a cover. */
export function downloadStatement() {
  return fetchPdf('statement=1', 'BeatFlow-my-licences.pdf');
}
