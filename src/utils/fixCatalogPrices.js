// src/utils/fixCatalogPrices.js
//
// Bring Firestore prices back in line with src/utils/pricing.js.
//
// WHY THIS IS NEEDED AT ALL
// netlify/functions/create-checkout.js resolves the charge from `item.price` on the
// Firestore document and only falls back to the constant when that field is absent:
//
//     const basePrice = Number.isFinite(item.price) ? item.price : DEFAULT_SONG_PRICE;
//
// So the stored value is what a buyer is actually charged, and changing pricing.js
// changes nothing for records that already exist. All 138 songs and 12 albums were
// seeded while pricing.js said $29.00, so they hold 2900 and 26100 while the code,
// the business-model document and production all say $1.99.
//
// EVERY NUMBER HERE IS DERIVED, none typed. The existing root-level
// fix-song-prices.js hardcodes 2900, which is how it became wrong; it also wants a
// serviceAccountKey.json on disk, which is the file that leaked a key before.
// This reads the canonical module, so it stays correct when the rule changes again.
//
// It supersedes fixSongPricesClient.js, which only handled songs. Albums were never
// covered -- src/scripts/fix-album-prices.js was deleted in the cleanup -- which is
// why an album still shows $261.00 while its tracks show $29.00.
//
// DRY RUN BY DEFAULT. Nothing writes without { apply: true }, matching the
// convention the station repo uses for anything that touches the catalogue.
//
// Requires a signed-in platform admin: firestore.rules allows update on songs and
// albums for isPlatformAdmin().
//
//   fixCatalogPrices()                  // report what would change
//   fixCatalogPrices({ apply: true })   // write it

import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { SONG_PRICE, calculateAlbumPrice, formatPrice } from './pricing';

export async function fixCatalogPrices(options = {}) {
  const { apply = false } = options;

  console.log(apply ? '✍️  APPLYING price corrections' : '🔍 DRY RUN — nothing will be written');
  console.log(`   canonical single price: ${formatPrice(SONG_PRICE)} (${SONG_PRICE} cents)`);
  console.log('   album rule: trackCount x single');

  const report = { songs: { checked: 0, wrong: 0, updated: 0 }, albums: { checked: 0, wrong: 0, updated: 0 }, errors: [] };

  // ---- songs -------------------------------------------------------------
  const songs = await getDocs(collection(db, 'songs'));
  report.songs.checked = songs.size;

  for (const snap of songs.docs) {
    const song = snap.data();
    if (song.price === SONG_PRICE) continue;

    report.songs.wrong += 1;
    const from = typeof song.price === 'number' ? formatPrice(song.price) : '(unset)';
    console.log(`   song  ${song.title || snap.id}: ${from} -> ${formatPrice(SONG_PRICE)}`);

    if (!apply) continue;
    try {
      await updateDoc(doc(db, 'songs', snap.id), { price: SONG_PRICE });
      report.songs.updated += 1;
    } catch (err) {
      report.errors.push(`song ${snap.id}: ${err.message}`);
    }
  }

  // ---- albums ------------------------------------------------------------
  // Derived from the album's OWN trackCount, not a fixed number: a 9-track album
  // and a 19-track album are not the same price under this rule.
  const albums = await getDocs(collection(db, 'albums'));
  report.albums.checked = albums.size;

  for (const snap of albums.docs) {
    const album = snap.data();
    const trackCount = Number(album.trackCount) || 0;

    if (!trackCount) {
      report.errors.push(`album ${album.title || snap.id}: no trackCount, cannot price it`);
      continue;
    }

    const expected = calculateAlbumPrice(trackCount);
    if (album.price === expected) continue;

    report.albums.wrong += 1;
    const from = typeof album.price === 'number' ? formatPrice(album.price) : '(unset)';
    console.log(`   album ${album.title || snap.id} (${trackCount} tracks): ${from} -> ${formatPrice(expected)}`);

    if (!apply) continue;
    try {
      await updateDoc(doc(db, 'albums', snap.id), { price: expected });
      report.albums.updated += 1;
    } catch (err) {
      report.errors.push(`album ${snap.id}: ${err.message}`);
    }
  }

  // ---- summary -----------------------------------------------------------
  console.log('');
  console.log(`   songs  : ${report.songs.checked} checked, ${report.songs.wrong} wrong` + (apply ? `, ${report.songs.updated} updated` : ''));
  console.log(`   albums : ${report.albums.checked} checked, ${report.albums.wrong} wrong` + (apply ? `, ${report.albums.updated} updated` : ''));

  if (report.errors.length) {
    console.warn(`   ${report.errors.length} problem(s):`);
    report.errors.forEach((e) => console.warn('     ' + e));
  }

  if (!apply && (report.songs.wrong || report.albums.wrong)) {
    console.log('');
    console.log('   Re-run as fixCatalogPrices({ apply: true }) to write these.');
  }

  return report;
}

export default fixCatalogPrices;
