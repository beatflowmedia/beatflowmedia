// src/utils/revenueSplit.js
//
// What "net" means, and who gets what. SINGLE SOURCE.
//
// THE PROBLEM THIS EXISTS TO CLOSE
// src/pages/Terms.js already promises artists "70% of net sales revenue, with
// BeatFlow Media retaining 30%". That sentence is published and binding, and the
// word NET IS UNDEFINED -- which makes it a 4x swing in BFMG's own margin:
//
//   $1.99 single      net = after costs      net = gross
//   gross                      $1.99            $1.99
//   Stripe (2.9% + 30c)       -$0.36           -$0.36
//   mechanical (13.1c)        -$0.13           -$0.13
//   pool that is split         $1.50            $1.99
//   artist 70%                 $1.05            $1.39
//   BFMG keeps                 $0.45            $0.11
//
// Same words, same 70/30, and the platform either clears forty-five cents or eleven.
// "Net" is the most litigated word in music contracts and BFMG has already shipped
// it without a definition, so the definition belongs in code where the arithmetic
// that depends on it lives -- not only in prose that the code cannot read.
//
// THE DEFINITION ADOPTED HERE is net of: payment processing, the statutory
// mechanical, and refunds or chargebacks. It is the conventional and defensible
// reading -- the splittable pool is what actually arrived and stayed -- but it IS a
// business decision, and Terms.js must be amended to state it explicitly. Until
// that happens the code and the contract agree only by luck.
//
// NOT A ROYALTY SYSTEM. This computes the split for one sale. Recoupment, advances,
// minimum payout thresholds and accounting periods are separate concerns; Terms.js
// already promises monthly payouts via Stripe Connect above a $50 minimum, and
// nothing here implements that.

const { mechanicalRoyaltyForTracks, subcentsToCents } = require('./mechanicalRoyalty');

/** Artist share of net, per Terms.js section 5. */
const ARTIST_SHARE = 0.70;

/** Platform share of net. Kept as its own constant rather than derived as
 *  1 - ARTIST_SHARE so that a future third participant (a producer split, a
 *  distributor) cannot silently come out of the platform's side by arithmetic. */
const PLATFORM_SHARE = 0.30;

/**
 * Stripe's US card pricing. A percentage AND a fixed fee, and the fixed fee is the
 * part that bites: 30c is 15% of a $1.99 single but only 2.5% of an $11.99 album.
 * That asymmetry is the whole argument for selling bundles.
 */
const STRIPE_PERCENT = 0.029;
const STRIPE_FIXED_CENTS = 30;

function stripeFeeCents(grossCents) {
  return Math.round(Number(grossCents) * STRIPE_PERCENT) + STRIPE_FIXED_CENTS;
}

/**
 * Break one sale into the pool that is split and the shares taken from it.
 *
 * @param {object} sale
 * @param {number} sale.grossCents        - what the buyer was charged
 * @param {Array}  [sale.tracks]          - durations or track objects; the mechanical
 *                                          is per track, so an album owes one per song
 * @param {boolean} [sale.ownsComposition] - true when BFMG holds the composition, in
 *                                           which case the mechanical is an internal
 *                                           transfer rather than cash leaving
 * @param {number|Date} [sale.on]          - date of sale, for the rate in force
 * @returns {object} every line, so a royalty statement can show its working
 */
function splitSale(sale = {}) {
  const grossCents = Math.max(0, Math.round(Number(sale.grossCents) || 0));
  const tracks = Array.isArray(sale.tracks) ? sale.tracks : [];

  const processing = stripeFeeCents(grossCents);

  const mech = mechanicalRoyaltyForTracks(tracks, { on: sale.on });
  const mechanicalCents = subcentsToCents(mech.subcents);

  // Deducted from the pool either way. Whether it is CASH OUT depends on who wrote
  // the song -- and that distinction is reported rather than hidden, because it is
  // the difference between a bookkeeping entry today and a real liability the moment
  // an uploaded track sells.
  const netCents = Math.max(0, grossCents - processing - mechanicalCents);

  const artistCents = Math.round(netCents * ARTIST_SHARE);
  const platformCents = netCents - artistCents; // remainder, so the pennies balance

  return {
    grossCents,
    deductions: {
      processingCents: processing,
      mechanicalCents,
      mechanicalSubcents: mech.subcents,
      mechanicalIsInternalTransfer: sale.ownsComposition === true,
      mechanicalRateYear: mech.rateYear,
      mechanicalRateStale: mech.stale
    },
    netCents,
    artistCents,
    platformCents,
    /** Cash actually retained by BFMG: the platform share, plus the mechanical when
     *  BFMG is also the songwriter and is therefore paying itself. */
    platformCashCents: sale.ownsComposition === true
      ? platformCents + mechanicalCents
      : platformCents,
    trackCount: tracks.length
  };
}

/**
 * The prose definition, kept beside the arithmetic so the two cannot drift.
 * Terms.js should say this; until it does, this is the record of what the code does.
 */
function netDefinition() {
  return (
    'Net sales revenue means the amount charged to the buyer, less payment ' +
    'processing fees, less the statutory mechanical royalty payable on the ' +
    'composition, less any refund or chargeback on that sale.'
  );
}

module.exports = {
  ARTIST_SHARE,
  PLATFORM_SHARE,
  STRIPE_PERCENT,
  STRIPE_FIXED_CENTS,
  stripeFeeCents,
  splitSale,
  netDefinition
};
