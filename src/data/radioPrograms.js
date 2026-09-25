// src/data/radioPrograms.js
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

export const RADIO_PROGRAMS = [
  {
    id: 'night-flow',
    name: 'Night Flow',
    hours: '00:00 – 06:00',
    blurb: 'Long, quiet stretches for overnight listening.'
  },
  {
    id: 'morning-flow',
    name: 'Morning Flow',
    hours: '06:00 – 10:00',
    blurb: 'Brighter and more upbeat as the day starts.'
  },
  {
    id: 'midday-flow',
    name: 'Midday Flow',
    hours: '10:00 – 15:00',
    blurb: 'The main daytime rotation.'
  },
  {
    id: 'the-lunch-mix',
    name: 'The Lunch Mix',
    hours: '12:00 – 13:00',
    blurb: 'A shorter, livelier hour inside the middle of the day.'
  },
  {
    id: 'afternoon-flow',
    name: 'Afternoon Flow',
    hours: '15:00 – 19:00',
    blurb: 'Faster turnover through the afternoon.'
  },
  {
    id: 'the-spotlight',
    name: 'The Spotlight',
    hours: '16:00 – 16:34',
    blurb: 'A short focused feature. One of the busiest for sponsors.'
  },
  {
    id: 'the-rock-block',
    name: 'The Rock Block',
    hours: '18:00 – 19:00',
    blurb: 'Heavier hour. The most heavily sponsored on the station.'
  },
  {
    id: 'evening-flow',
    name: 'Evening Flow',
    hours: '19:00 – 00:00',
    blurb: 'Winding down into the night.'
  }
];

// The honest default. A sponsor with no preference gets spread across the rotation,
// which is also where the real headroom is.
export const NO_PREFERENCE = {
  id: 'no-preference',
  name: 'No preference — run it across the station',
  hours: 'All programmes',
  blurb: 'We place it where there is room. This is usually the best value.'
};

export const PROGRAM_CHOICES = [NO_PREFERENCE, ...RADIO_PROGRAMS];

export function programNameFor(id) {
  const found = PROGRAM_CHOICES.find((p) => p.id === id);
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
