// src/data/radioStation.js
//
// Facts about BeatFlow Radio that the sponsor forms need: its programmes, the spot
// lengths it sells, and the labels a sponsor card button may carry.
//
// Named radioPrograms.js until three of its four exports stopped being programmes.
// A file name is a claim about what is inside it, and one that has drifted sends the
// next reader looking for CTA options somewhere that does not exist.
//
// BeatFlow Radio's programmes, for sponsors choosing where their spot runs.
//
// NOT THE CANONICAL SOURCE. The station's playlist.json in the RadioStation repo is,
// and this is a display copy in a different repository that cannot import it. Two
// consequences, both deliberate:
//
//   1. Only STABLE facts live here -- the programme's name, its hours and what it
//      sounds like. Those change when Percy restructures the station, which is rare
//      and deliberate.
//
//   2. VOLATILE facts are deliberately absent. Remaining capacity changes every time
//      a sponsor is added, and a stale "2 slots left" on a sales page is a scarcity
//      claim that is false the moment it drifts -- worse than showing nothing,
//      because someone buys on it. Capacity is confirmed during approval, against the
//      live station, by a human who can see it.
//
// WHY TIME SLOTS ARE NOT SOLD
// ---------------------------
// A spot is a position in a repeating sequence, not a clock time. No programme's loop
// divides evenly into 24 hours -- Night Flow's is 6507.4s, giving 13.2773 loops a day
// -- so where a spot lands drifts daily. cue() runs from a fixed epoch, which makes
// every airing exactly computable for any past or future moment, but it means there
// is no recurring "8:15 slot" to sell. Offering one would require re-architecting
// every rotation to divide the day evenly: an engineering change, not a reporting
// one. Programmes, by contrast, are real, named and enforced today.
//
// Hours are America/New_York and are NOT localised: cue() is a pure function of wall
// clock, so localising would mean different listeners hearing different audio.
// Overlaps resolve narrowest-wins -- The Rock Block takes 18:00-19:00 out of Evening
// Flow.
//
// Ad load figures are the station's own editorial policy (a 12% ceiling the desk
// enforces on the way in), NOT a technical limit. They are described to sponsors as
// house policy, because presenting an editorial choice as a physical constraint would
// be a scarcity claim dressed up as engineering.

// HOURS ARE THE REAL ONES, not the nominal ones.
//
// Programmes overlap and resolve narrowest-wins, so a wide programme does not own all
// the time its start and end suggest. Measured minute by minute across the day:
//
//   Midday Flow     nominal 5h  -> ACTUAL 4h      (The Lunch Mix takes 12:00-13:00)
//   Afternoon Flow  nominal 4h  -> ACTUAL 2h26m   (The Spotlight and The Rock Block)
//
// Afternoon Flow was overstated by 39%, and it is the one a sponsor is most likely to
// notice, because "the afternoon" sounds like it includes drive time and does not. A
// buyer who finds the gap after paying has a fair complaint; one told up front may
// simply buy The Rock Block as well.
//
// Every minute of the day is owned by something; nothing falls through.
export const RADIO_PROGRAMS = [
  {
    id: 'night-flow',
    name: 'Night Flow',
    hours: '00:00 – 06:00',
    actualHours: '6 hours',
    blurb: 'Long, quiet stretches for overnight listening.'
  },
  {
    id: 'morning-flow',
    name: 'Morning Flow',
    hours: '06:00 – 10:00',
    actualHours: '4 hours',
    blurb: 'Brighter and more upbeat as the day starts.'
  },
  {
    id: 'midday-flow',
    name: 'Midday Flow',
    hours: '10:00 – 15:00, except 12:00 – 13:00',
    actualHours: '4 hours',
    blurb: 'The main daytime rotation. The Lunch Mix takes the middle hour.'
  },
  {
    id: 'the-lunch-mix',
    name: 'The Lunch Mix',
    hours: '12:00 – 13:00',
    actualHours: '1 hour',
    blurb: 'A shorter, livelier hour inside the middle of the day.'
  },
  {
    id: 'afternoon-flow',
    name: 'Afternoon Flow',
    hours: '15:00 – 19:00, except 16:00 – 16:34 and 18:00 – 19:00',
    actualHours: '2 hours 26 minutes',
    blurb: 'Faster turnover through the afternoon. The Spotlight and The Rock Block take their slots out of it.'
  },
  {
    id: 'the-spotlight',
    name: 'The Spotlight',
    hours: '16:00 – 16:34',
    actualHours: '34 minutes',
    blurb: 'A short focused feature. One of the busiest for sponsors.'
  },
  {
    id: 'the-rock-block',
    name: 'The Rock Block',
    hours: '18:00 – 19:00',
    actualHours: '1 hour',
    blurb: 'Heavier hour. The most heavily sponsored on the station.'
  },
  {
    id: 'evening-flow',
    name: 'Evening Flow',
    hours: '19:00 – 00:00',
    actualHours: '5 hours',
    blurb: 'Winding down into the night.'
  }
];

/**
 * Look up a programme's display name.
 *
 * NO_PREFERENCE and PROGRAM_CHOICES used to live here, wrapping this list for a
 * picker in the sponsor application. That picker was removed: it asked a buyer to
 * choose with nothing to choose on, since there is no audience data and cannot be.
 * Placement is agreed during approval instead, where real capacity is visible.
 *
 * The vocabulary of CHOOSING went with it, because a "no preference" option only
 * means something where a preference was offered. The programme list itself stays --
 * it is true reference data, and once a programme IS agreed the handoff sheet and the
 * admin screen need its name.
 */
export function programNameFor(id) {
  const found = RADIO_PROGRAMS.find((p) => p.id === id);
  return found ? found.name : id;
}

/**
 * Sellable spot lengths.
 *
 * The station measures every spot against a block and reports one that fits none as
 * unsellable. A file must use MORE than 75% of its block and leave at least 0.5s of
 * headroom under it -- so a 17.6s spot is not a short :30, it is a spot that fits
 * nothing, which is a real content fault that went unnoticed until there was a
 * checker for it.
 *
 * The word counts are a WRITING GUIDE, not a guarantee. Read-aloud pace varies, and
 * synthesised speech varies a great deal -- the station measured 1.99 to 4.29 words
 * per second from identical settings. Only measuring the finished file gives the
 * duration, which is why BFMG collects the sponsor's INTENDED block and never a
 * duration: we cannot know the duration, and it changes again when the station
 * transcodes.
 */
export const SPOT_BLOCKS = [
  { id: '15', label: ':15 — fifteen seconds', words: 'roughly 30–35 words' },
  { id: '30', label: ':30 — thirty seconds', words: 'roughly 65–75 words' },
  { id: '60', label: ':60 — sixty seconds', words: 'roughly 130–150 words' }
];

/**
 * Allowed sponsor-card button labels.
 *
 * This was a free-text field, which is a liability rather than a flexibility. A
 * sponsor could write anything: a label too long for a square card, a claim we would
 * have to reject at review, or an urgency line ("Claim your prize") that makes the
 * station look like an ad network. Preventing it at the input costs nothing;
 * rejecting it at approval costs a round trip with someone who has already paid
 * attention.
 *
 * A fixed list also keeps the card visually consistent, which is the whole reason it
 * looks like a station feature rather than a banner.
 *
 * DELIBERATELY NO "OTHER" OPTION. An escape hatch to free text would restore exactly
 * the problem this removes. A sponsor who genuinely needs something else says so in
 * "what are you advertising", and it is handled at approval by a human -- which is
 * the same gate that already decides whether the ad runs at all.
 *
 * Kept short on purpose: a long list is its own failure, because a sponsor scrolling
 * twenty near-identical options picks badly.
 */
export const CTA_OPTIONS = [
  'Visit the website',
  'Learn more',
  'Shop now',
  'Book now',
  'Get a quote',
  'See the menu',
  'Get the app',
  'Explore the platform'
];

export function isAllowedCta(value) {
  return CTA_OPTIONS.includes(value);
}

/**
 * What the station accepts as creative, in ONE place.
 *
 * These were three places that disagreed, which is the failure mode this file exists
 * to prevent:
 *
 *   - the dropzone accepted FLAC, M4A, AAC, OGG, GIF and AVIF
 *   - the validator rejected all six as "not a supported format"
 *   - the dropzone capped logos at 40MB while the validator allowed 50MB
 *
 * So a sponsor could drop a FLAC, watch the UI accept it, fill in the rest, and be
 * told at submit that their file was unsupported. The UI invited a file the rules
 * refused.
 *
 * The format lists come from the STATION's own accepted set, because it is the thing
 * that ultimately has to ingest the file -- anything we accept that it cannot is a
 * promise we break later, by hand.
 *
 * `accept` is in react-dropzone's shape so the component can use it directly, and
 * mimeTypesOf() derives the validator's list from the same object. One edit changes
 * both, and they cannot drift.
 *
 * NOT the last word on size: storage.rules independently caps a sponsor-creative
 * write at 50MB. That rule is the real gate and is enforced by Firebase; this is the
 * friendly check that happens first. If you raise a ceiling here, raise it there too
 * or uploads will fail after the sponsor has waited for them.
 */
export const AUDIO_SPEC = {
  maxBytes: 50 * 1024 * 1024,
  accept: {
    'audio/wav': ['.wav'],
    'audio/x-wav': ['.wav'],
    'audio/aiff': ['.aiff', '.aif'],
    'audio/x-aiff': ['.aiff', '.aif'],
    'audio/flac': ['.flac'],
    'audio/x-flac': ['.flac'],
    'audio/mpeg': ['.mp3'],
    'audio/mp4': ['.m4a'],
    'audio/aac': ['.aac'],
    'audio/ogg': ['.ogg']
  }
};

export const LOGO_SPEC = {
  maxBytes: 40 * 1024 * 1024,
  // No SVG: the station re-encodes every logo to JPEG and its pipeline is raster
  // only. Offering SVG would accept a file that cannot be processed.
  accept: {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'image/gif': ['.gif'],
    'image/avif': ['.avif']
  }
};

export function mimeTypesOf(spec) {
  return Object.keys(spec.accept);
}

/** For messages, so a limit and the number quoted at the sponsor cannot disagree. */
export function megabytesOf(spec) {
  return Math.round(spec.maxBytes / (1024 * 1024));
}

/** The spot length assumed when a sponsor has not chosen one. */
export const DEFAULT_SPOT_BLOCK = '30';

/**
 * Logo guidance, stated as numbers a designer can work to.
 *
 * This read "a square mark works best", which is an opinion rather than a spec. A
 * sponsor cannot act on it, so they send a wide wordmark at whatever size their
 * website uses, and it lands in a square slot mostly empty.
 *
 * The numbers are derived from what the station actually does, not invented:
 *   - it resizes to FIT WITHIN 800x800 preserving aspect, so 800x800 is the largest
 *     size ever displayed and anything smaller is upscaled and soft. That makes
 *     1000x1000 the honest minimum to ask for, with headroom.
 *   - the slot is square, so a 1:1 image is the only one that fills it. A 3:1
 *     wordmark shrinks to fit the width and leaves two-thirds of the slot empty.
 *   - output is JPEG, so alpha is flattened. A logo designed for a white page arrives
 *     with a white box around it on a dark player.
 *
 * Asking for larger than 800 is deliberate: re-encoding from a bigger original is
 * always better than upscaling, and it costs the sponsor nothing to send what they
 * already have.
 */
export const LOGO_MIN_PIXELS = 1000;
export const LOGO_DISPLAY_PIXELS = 800;

export const LOGO_GUIDANCE =
  `Square (1:1), at least ${LOGO_MIN_PIXELS} x ${LOGO_MIN_PIXELS} pixels — ` +
  `${LOGO_DISPLAY_PIXELS} x ${LOGO_DISPLAY_PIXELS} is the size it appears at, so send more than that, not less. ` +
  'JPG, PNG, WEBP, GIF or AVIF. Send the icon or symbol rather than a wide wordmark, ' +
  'which leaves most of a square slot empty. It is shown as a JPEG, so transparency ' +
  'becomes a solid background — avoid a logo that relies on it.';
