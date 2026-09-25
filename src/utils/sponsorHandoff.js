import JSZip from 'jszip';
import { programNameFor } from '../data/radioPrograms';

/**
 * Package an approved sponsor into the exact folder BeatFlow Radio's desk expects.
 *
 * THE HANDOFF IS MANUAL BY DESIGN
 * -------------------------------
 * The station's write endpoint is loopback-only: /api/upload refuses anything not
 * from 127.0.0.1, because the desk (rotation.html) is an operator's console rather
 * than a public intake. BFMG cannot push to it over the network and deliberately does
 * not try. Building around that gap would be inventing an unreviewed path into a live
 * broadcast, which is an architecture decision with a moderation and auth surface
 * behind it -- Percy's to make, not one to arrive at by accident.
 *
 * So this produces files at rest. Percy unzips one folder and drags it into the desk,
 * which is the supported path and the one that runs the ad-load check.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO
 * ----------------------------------
 * No transcoding, no normalising, no resizing, no renaming, no id generation, no
 * duration measurement, no playlist.json fragment, no R2 upload. The station does
 * every one of those on arrival, and doing them first is worse than not doing them:
 *
 *   - It transcodes to MP3 at 192kbps itself. Pre-encoding means two generations of
 *     loss, so the sponsor's WAV is passed through untouched.
 *   - It normalises to -14 LUFS with a -1.0 dBTP ceiling automatically.
 *   - It resizes logos to fit 800x800 and re-encodes to JPEG, so a pre-shrunk file
 *     only loses detail that cannot come back.
 *   - It slugifies and numbers filenames (<advertiser>-<n>.mp3) and guarantees
 *     uniqueness. A name chosen here would simply be overwritten.
 *   - It measures duration with ffprobe. We could not supply one honestly anyway:
 *     the value changes when the file is transcoded, and cue() sums declared
 *     durations, so a wrong one permanently shifts every record after it.
 *
 * There is also no JSON fragment, even though one is easy to generate. The station
 * has no import path on purpose: every advertising fault it has had came from
 * hand-edited playlist.json, so a fragment would either be retyped into the form
 * anyway or bypass the checks that exist because of those faults.
 */

/** Matches the desk's own slug shape so the folder name reads the way the spot will. */
export function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'sponsor';
}

/**
 * The plain-text field sheet the operator types from. Plain text, one field per line,
 * deliberately not JSON: it is read by a person while filling in a form, and the
 * station rejected a machine-readable fragment for good reasons.
 */
export function buildSponsorTxt(app) {
  const lines = [
    'BeatFlow Radio sponsorship',
    '',
    'name:       ' + (app.company || ''),
    'url:        ' + (app.landingUrl || ''),
    'blurb:      ' + (app.blurb || ''),
    'cta:        ' + (app.cta || ''),
    '',
    'target block:  :' + (app.spotBlock || '30'),
    'programme:     ' + programNameFor(app.programId),
    'package:       ' + (app.tierId || ''),
    'preferred start: ' + (app.preferredStart || 'not specified'),
    '',
    'contact:    ' + (app.contactName || '') + ' <' + (app.email || '') + '>',
    '',
    'what they are advertising:',
    (app.describe || '').split('\n').map((l) => '  ' + l).join('\n'),
    ''
  ];

  if (app.wantsProduction) {
    lines.push('NOTE: sponsor asked US to produce the spot.');
    if (!app.audio) lines.push('      No audio supplied - it has to be written and recorded.');
    lines.push('');
  }

  lines.push('Do not transcode, normalise, resize or rename anything in this folder.');
  lines.push('The station does all of that on upload. Audio is the sponsor original.');
  lines.push('');
  return lines.join('\n');
}

/** Extension from a stored path, so the logo keeps its real format. */
function extensionOf(pathOrName, fallback) {
  const match = String(pathOrName || '').match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toLowerCase() : fallback;
}

/** Original filename as the sponsor supplied it, recovered from the stored path. */
function originalNameFrom(storedPath, fallback) {
  const base = String(storedPath || '').split('/').pop() || '';
  // Stored as <timestamp>-<kind>-<original>. Strip the two prefixes we added.
  const stripped = base.replace(/^\d+-(spot|logo)-/, '');
  return stripped || fallback;
}

/**
 * Build the ZIP. Runs in the browser as the signed-in admin, which is why it works
 * at all: Storage reads on sponsor-creative/ are admin-only, and the Firebase Admin
 * service account is currently rejected, so a Node script could not fetch these.
 */
export async function buildHandoffZip(app) {
  const slug = slugify(app.company);
  const zip = new JSZip();
  const folder = zip.folder(slug);

  folder.file('sponsor.txt', buildSponsorTxt(app));

  if (app.audio && app.audio.url) {
    const res = await fetch(app.audio.url);
    if (!res.ok) throw new Error('Could not download the audio spot.');
    folder
      .folder('audio')
      .file(originalNameFrom(app.audio.path, 'spot.' + extensionOf(app.audio.path, 'wav')), await res.blob());
  }

  if (app.logo && app.logo.url) {
    const res = await fetch(app.logo.url);
    if (!res.ok) throw new Error('Could not download the logo.');
    folder.file('logo.' + extensionOf(app.logo.path, 'jpg'), await res.blob());
  }

  return { blob: await zip.generateAsync({ type: 'blob' }), filename: slug + '.zip' };
}
