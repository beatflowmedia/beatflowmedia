// src/utils/fixCatalogPrices.js
//
// Bring Firestore prices back in line with src/utils/pricing.js, from the browser.
//
// WHY THIS IS NEEDED AT ALL
// netlify/functions/create-checkout.js resolves the charge from `item.price` on the
// Firestore document and only falls back to the constant when that field is absent:
//
//     const basePrice = Number.isFinite(item.price) ? item.price : DEFAULT_SONG_PRICE;
//
// So the stored value is what a buyer is actually charged, and changing pricing.js
// changes nothing for records that already exist. That is not a one-off: it has now
// bitten twice, once when the catalogue was seeded at $29.00 and again when the
// album rule gained a floor and a cap while every stored album kept its old
// uncapped price.
//
// THE RULE LIVES IN catalogPricePlan.js, NOT HERE.
// This file is the browser adapter: it reads with the client SDK, shows the plan,
// and writes. scripts/fix-catalog-prices.js is the same thing over firebase-admin.
// Both call planCatalogPrices(), so there is exactly one answer to "what should this
// record cost" regardless of which one you run. Album pricing has already existed in
// four independent copies in this codebase and every one of them mispriced
// something; a fifth living inside the tool that repairs the other four would be
// especially hard to notice.
//
// DRY RUN BY DEFAULT. Nothing writes without { apply: true }, matching the
// convention the station repo uses for anything that touches the catalogue.
//
// Requires a signed-in platform admin: firestore.rules allows update on songs and
// albums for isPlatformAdmin().
//
//   fixCatalogPrices()                  // report what would change
//   fixCatalogPrices({ apply: true })   // write it
//
// Prefer the script when you have a service account -- it verifies its writes by
// reading them back, which the browser version cannot do as cheaply.

import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { SONG_PRICE, ALBUM_PRICE_FLOOR, ALBUM_PRICE_CAP, formatPrice } from './pricing';
import { planCatalogPrices, describePlan } from './catalogPricePlan';

async function readAll(name) {
  const snap = await getDocs(collection(db, name));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fixCatalogPrices(options = {}) {
  const { apply = false } = options;

  console.log(apply ? '✍️  APPLYING price corrections' : '🔍 DRY RUN — nothing will be written');
  console.log(`   single     : ${formatPrice(SONG_PRICE)}`);
  console.log(
    `   album rule : clamp(trackCount × single, ${formatPrice(ALBUM_PRICE_FLOOR)}, ${formatPrice(ALBUM_PRICE_CAP)})`
  );

  const [songs, albums] = await Promise.all([readAll('songs'), readAll('albums')]);

  const plan = planCatalogPrices({ songs, albums });
  describePlan(plan).forEach((line) => console.log(line));

  const report = {
    songs: { checked: plan.summary.songsChecked, wrong: plan.summary.songsWrong, updated: 0 },
    albums: { checked: plan.summary.albumsChecked, wrong: plan.summary.albumsWrong, updated: 0 },
    errors: plan.problems.map((p) => `${p.kind} ${p.label}: ${p.reason}`)
  };

  if (apply) {
    for (const change of plan.songs) {
      try {
        await updateDoc(doc(db, 'songs', change.id), { price: change.to });
        report.songs.updated += 1;
      } catch (err) {
        report.errors.push(`song ${change.id}: ${err.message}`);
      }
    }

    for (const change of plan.albums) {
      try {
        await updateDoc(doc(db, 'albums', change.id), { price: change.to });
        report.albums.updated += 1;
      } catch (err) {
        report.errors.push(`album ${change.id}: ${err.message}`);
      }
    }
  }

  console.log('');
  console.log(
    `   songs  : ${report.songs.checked} checked, ${report.songs.wrong} wrong` +
      (apply ? `, ${report.songs.updated} updated` : '')
  );
  console.log(
    `   albums : ${report.albums.checked} checked, ${report.albums.wrong} wrong` +
      (apply ? `, ${report.albums.updated} updated` : '')
  );

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
