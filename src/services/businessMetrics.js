// src/services/businessMetrics.js
//
// WHAT THE PLATFORM HAS ACTUALLY DONE. Read from Firestore, never declared.
//
// WHY THIS EXISTS
// components/analytics/AdminDashboard.js rendered a "Business Metrics" panel showing
// $2,567,890.45 total revenue, $234,567.89 monthly recurring, 1,200,000 free users and
// a top-five revenue breakdown by country. Every figure was a literal declared inside
// the component, which took a `data` prop and ignored it. The file contained zero
// Firestore calls.
//
// Percy has four purchases and six users.
//
// A number on an admin screen is the basis for a decision. $2.5m of revenue is not a
// cosmetic error -- it is the sort of figure someone plans a year around, or repeats to
// an investor. That is why this is read rather than written, and why the things that
// CANNOT be read are reported as unknown instead of estimated.
//
// COUNTED WITH AGGREGATION QUERIES wherever a count is all that is needed.
// getCountFromServer bills one read per query regardless of how many documents match;
// fetching documents to count them bills one per document. The revenue sum has to read
// the purchase documents -- there is no server-side SUM in this SDK -- so it reads only
// `purchases`, which is the smallest collection here and the only one whose contents are
// actually needed.
//
// PRICE UNITS ARE A LANDMINE AND THIS IS WHERE THEY BITE. `purchases.price` is DOLLARS;
// `songs.price` and `licenses.pricePaid` are CENTS. Summing the wrong one, or dividing
// by 100 twice, is a 100x error in a revenue figure -- see verify:price-units and the
// note in CLAUDE.md. This reads purchases.price and does NOT divide.

import {
  collection, query, where, getDocs, getCountFromServer
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

/** A metric that could not be read, so it is reported rather than guessed. */
const unknown = (reason) => ({ known: false, reason });
const known = (value) => ({ known: true, value });

async function countOf(name, ...constraints) {
  const base = collection(db, name);
  const q = constraints.length ? query(base, ...constraints) : base;
  const snap = await getCountFromServer(q);
  return snap.data().count;
}

/**
 * Every figure the business panel shows, each either a real value or an explained gap.
 *
 * EACH READ FAILS ALONE. One collection the rules do not permit must not blank the whole
 * panel: a rejected query becomes an unknown on that row and the rest still report. An
 * admin screen that says "I could not read purchases" is useful; one that says
 * "something went wrong" is not.
 */
export async function loadBusinessMetrics() {
  const safe = async (fn, reason) => {
    try { return known(await fn()); } catch (err) {
      console.error('businessMetrics:', reason, '—', err.code, err.message);
      return unknown(`Could not read: ${err.code || 'unavailable'}`);
    }
  };

  const [users, songs, albums, collections, completedPurchases] = await Promise.all([
    safe(() => countOf('users'), 'users'),
    safe(() => countOf('songs'), 'songs'),
    safe(() => countOf('albums'), 'albums'),
    safe(() => countOf('collections'), 'collections'),
    safe(() => countOf('purchases', where('status', '==', 'completed')), 'purchases')
  ]);

  // Revenue has to read the documents: there is no server-side SUM here.
  const revenue = await safe(async () => {
    const snap = await getDocs(query(
      collection(db, 'purchases'),
      where('status', '==', 'completed')
    ));
    // DOLLARS, already. Dividing by 100 here is the 100x error this comment exists to
    // prevent -- purchases.price is the odd one out among the money fields.
    return snap.docs.reduce((sum, d) => sum + (Number(d.data().price) || 0), 0);
  }, 'revenue');

  const activeSubscriptions = await safe(
    () => countOf('users', where('subscription.status', '==', 'active')),
    'active subscriptions'
  );

  return {
    users,
    songs,
    albums,
    collections,
    purchases: completedPurchases,
    revenue,
    activeSubscriptions,

    // --- what is NOT measured, named rather than estimated -----------------------
    //
    // Each of these was a confident number on the old panel. None of them has a source,
    // and inventing a plausible one is how $2.5m got on a screen in the first place.
    monthlyRecurring: unknown(
      'No subscription has ever been sold, so there is no recurring revenue to total.'
    ),
    churnRate: unknown(
      'Churn needs subscription start and end dates over a period. Nothing records them.'
    ),
    conversionRate: unknown(
      'Needs visits as the denominator. No analytics event is recorded for a page view.'
    ),
    revenueByCountry: unknown(
      'Stripe holds the billing country; nothing copies it onto the purchase record.'
    ),
    subscriptionTiers: unknown(
      'Tier counts need subscriptions. There are none; the plans are published but unsold.'
    )
  };
}

/** $1,234.56 — formatted once so two panels cannot disagree about how money looks. */
export function formatMoney(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD'
  }).format(Number(value) || 0);
}
