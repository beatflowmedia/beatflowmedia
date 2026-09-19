// src/utils/mechanicalRoyalty.js
//
// The statutory mechanical royalty owed on a download. SINGLE SOURCE.
//
// 17 U.S.C. § 115 creates a COMPULSORY licence: anyone may reproduce and
// distribute a nondramatic musical work without asking, provided they pay a rate
// the Copyright Royalty Board sets. It is not negotiable and not optional, and it
// attaches to the COMPOSITION -- the song as written -- not to the recording.
//
// SELLING A DOWNLOAD TRIGGERS IT. A permanent download is a "digital phonorecord
// delivery", so every single and every album track BFMG sells owes this. The
// platform had no representation of that obligation at all, which meant the true
// cost of a sale was not knowable from the code.
//
// WHY THIS IS NOT "JUST A COST" HERE, YET
// While BFMG owns both the composition and the master, the payment is from BFMG to
// BFMG -- an internal transfer, not cash out. It becomes real money the moment a
// third party wrote the song, which is exactly what artist uploads introduce. It is
// modelled now so that the number exists before it starts mattering, rather than
// being discovered in the first royalty statement.
//
// DOWNLOADS AND PHYSICAL ONLY. The penny rates below do NOT apply to interactive
// streaming, which the CRB prices with an entirely different percentage-of-revenue
// formula (Phonorecords proceedings, headline rate on revenue and TCC with a
// per-subscriber floor). Applying a per-copy penny rate to a stream would be wrong
// by an order of magnitude in either direction depending on the month, so this
// module refuses to answer for streams rather than guessing. See streamingNote().
//
// ARITHMETIC IN HUNDREDTHS OF A CENT, AS INTEGERS.
// The rates are 13.1 and 2.52 cents -- fractional cents. Representing them as
// floating-point cents invites the classic 0.1 + 0.2 problem on a value that is
// ultimately money owed to a songwriter. In hundredths of a cent both rates are
// whole numbers (1310 and 252), so every computation here is integer arithmetic and
// rounding happens once, explicitly, at the point of display or payment.

/** One cent, expressed in this module's internal unit. */
const SUBCENTS_PER_CENT = 100;

/**
 * Statutory rates by the year they took effect, in hundredths of a cent.
 *
 * The CRB adjusts these annually for inflation within a rate period; Phonorecords IV
 * runs 2023-2027. A table rather than a constant because a sale is governed by the
 * rate in force ON THE DATE OF THE SALE -- recomputing an old sale at today's rate
 * would misstate what was owed, and royalty statements are exactly where that gets
 * noticed.
 *
 * NEVER EDIT A PAST YEAR. Add the new year when the CRB publishes it.
 */
const STATUTORY_RATES = {
  2023: { perWork: 1220, perMinute: 234 }, // 12.20c / 2.34c
  2024: { perWork: 1240, perMinute: 238 }, // 12.40c / 2.38c
  2025: { perWork: 1270, perMinute: 244 }, // 12.70c / 2.44c
  2026: { perWork: 1310, perMinute: 252 }  // 13.10c / 2.52c
};

/** The most recent year in the table. Sales dated after it use this rate and are
 *  flagged, because an unpublished year means the table is stale, not that the rate
 *  stopped changing. */
const LATEST_RATE_YEAR = Math.max(...Object.keys(STATUTORY_RATES).map(Number));

/** Above this length the per-minute rate can exceed the flat per-work rate. */
const LONG_FORM_THRESHOLD_SECONDS = 5 * 60;

/**
 * The rate schedule in force for a given year.
 * Years before the table fall back to the earliest known; years after fall back to
 * the latest, with `stale: true` so a caller can surface that rather than silently
 * bill an out-of-date number.
 */
function rateForYear(year) {
  const y = Number(year);
  if (STATUTORY_RATES[y]) return { ...STATUTORY_RATES[y], year: y, stale: false };

  const years = Object.keys(STATUTORY_RATES).map(Number);
  const earliest = Math.min(...years);
  if (y < earliest) return { ...STATUTORY_RATES[earliest], year: earliest, stale: true };
  return { ...STATUTORY_RATES[LATEST_RATE_YEAR], year: LATEST_RATE_YEAR, stale: true };
}

/**
 * The mechanical royalty owed on ONE download of one track, in hundredths of a cent.
 *
 * § 115 sets it as the GREATER of a flat per-work rate and a per-minute rate, where
 * playing time counts "or fraction thereof" -- so 5:01 is charged as six minutes,
 * not as 5.017. Rounding up a partial minute is the statute's rule, not a
 * convenience.
 *
 * @param {number} durationSeconds - track length; 0 or unknown uses the flat rate
 * @param {object} [options]
 * @param {number|Date} [options.on] - year, or date, of the sale. Defaults to now.
 * @returns {{subcents:number, rateYear:number, basis:'per-work'|'per-minute', stale:boolean}}
 */
function mechanicalRoyaltySubcents(durationSeconds, options = {}) {
  const on = options.on instanceof Date ? options.on.getUTCFullYear() : options.on;
  const rate = rateForYear(on == null ? new Date().getUTCFullYear() : on);

  const seconds = Number(durationSeconds);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    // An unknown duration cannot be charged at the per-minute rate, and the flat
    // rate is the statutory minimum, so it is the only defensible answer.
    return { subcents: rate.perWork, rateYear: rate.year, basis: 'per-work', stale: rate.stale };
  }

  const minutes = Math.ceil(seconds / 60); // "or fraction thereof"
  const perMinuteTotal = minutes * rate.perMinute;

  return perMinuteTotal > rate.perWork
    ? { subcents: perMinuteTotal, rateYear: rate.year, basis: 'per-minute', stale: rate.stale }
    : { subcents: rate.perWork, rateYear: rate.year, basis: 'per-work', stale: rate.stale };
}

/**
 * Total mechanical owed on a sale covering several tracks -- i.e. an album.
 *
 * Summed per track BEFORE any rounding to whole cents, because rounding each track
 * and then adding overstates or understates the total by up to half a cent per
 * track. On a 19-track album that is real money and it is the kind of discrepancy a
 * royalty audit exists to find.
 *
 * @param {Array<number|{duration?:number,durationSeconds?:number}>} tracks
 * @param {object} [options] - same as mechanicalRoyaltySubcents
 */
function mechanicalRoyaltyForTracks(tracks, options = {}) {
  const list = Array.isArray(tracks) ? tracks : [];
  let subcents = 0;
  let stale = false;
  let rateYear = null;

  list.forEach((t) => {
    const seconds = typeof t === 'number' ? t : (t && (t.durationSeconds ?? t.duration)) || 0;
    const r = mechanicalRoyaltySubcents(seconds, options);
    subcents += r.subcents;
    stale = stale || r.stale;
    rateYear = r.rateYear;
  });

  return { subcents, trackCount: list.length, rateYear, stale };
}

/** Hundredths of a cent -> whole cents, rounded once, at the end. */
function subcentsToCents(subcents) {
  return Math.round(Number(subcents) / SUBCENTS_PER_CENT);
}

/** Hundredths of a cent as dollars for display, e.g. 1310 -> "$0.131". Three
 *  decimals because truncating to two hides the entire per-track rate. */
function formatSubcents(subcents) {
  return '$' + (Number(subcents) / SUBCENTS_PER_CENT / 100).toFixed(3);
}

/**
 * Why this module will not price an interactive stream.
 *
 * Returned as text rather than thrown, so a caller that asks can show the reason to
 * whoever asked rather than crashing. If BFMG ever runs the streaming service its
 * PRD describes, this is the gap that has to be filled by someone who has read the
 * relevant CRB determination -- not by extending the penny rates above.
 */
function streamingNote() {
  return (
    'Interactive streaming mechanicals are not per-copy penny rates. The CRB prices ' +
    'them as a percentage of service revenue and of total content cost, subject to a ' +
    'per-subscriber floor, and they are administered through the MLC blanket licence. ' +
    'Do not extend the download rates in this module to streams.'
  );
}

module.exports = {
  STATUTORY_RATES,
  LATEST_RATE_YEAR,
  LONG_FORM_THRESHOLD_SECONDS,
  SUBCENTS_PER_CENT,
  rateForYear,
  mechanicalRoyaltySubcents,
  mechanicalRoyaltyForTracks,
  subcentsToCents,
  formatSubcents,
  streamingNote
};
