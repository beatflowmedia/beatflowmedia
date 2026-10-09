// src/services/masterDownload.js
//
// ONE way to obtain the file a buyer paid for.
//
// This replaces stripeService.getDownloadLink(), which resolved a download as
//   songData.downloadUrl || songData.fullTrackUrl || songData.audioUrl || songData.fileUrl
// and therefore handed buyers the PREVIEW. Measured on 2026-10-09 across all 164
// sellable commercial-release songs: downloadUrl 0, fullTrackUrl 0, audioUrl 164. So the
// chain always fell through to audioUrl, which points at songs/previews/<id>.
//
// The sizes make it unambiguous -- every preview is exactly 470 KB regardless of track
// length, while the masters vary with it:
//
//   Shelter in the Storm         246s   preview 470 KB   master 5.0 MB
//   Helping You Get On Your Feet 202s   preview 470 KB   master 7.7 MB
//   What We Don't Say            190s   preview 470 KB   master 7.2 MB
//
// netlify/functions/download-master.js has been deployed and correct the whole time --
// it verifies the ID token, checks entitlement against the purchase record, and presigns
// the private R2 object. Nothing in the UI ever called it. This is that call.
//
// Entitlement is decided SERVER-SIDE, deliberately. The old path asked the client
// "canDownloadSong?" and then read a URL off a public document, so the answer and the
// file were independent of each other. Here the function will not presign at all unless
// the purchase exists.
import { authedHeaders } from '../utils/authedHeaders';

const ENDPOINT = '/.netlify/functions/download-master';

/**
 * Resolve a time-limited URL for a song's master.
 *
 * @param {string} songId
 * @returns {Promise<{url: string, filename: string, expiresAt: string, grantedVia: string}>}
 * @throws {Error} with a message fit to show the buyer
 */
export async function getMasterDownload(songId) {
  if (!songId) throw new Error('songId is required.');

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: await authedHeaders(),
    body: JSON.stringify({ songId })
  });

  let data = {};
  try { data = await res.json(); } catch (_) { /* fall through to status handling */ }

  if (!res.ok) {
    // The function distinguishes "never licensed" (403) from "signed out" (401) and from
    // "the master is missing" (503). Those need different things from the buyer, so the
    // distinction is preserved rather than collapsed into one failure message.
    throw new Error(data.error || `Download failed (${res.status}).`);
  }
  if (!data.url) throw new Error('Download link was not returned.');

  return data;
}

export default getMasterDownload;
