// src/utils/catalogFacets.js
//
// What the catalogue can actually be filtered BY, and how to apply a filter.
//
// WHY THIS EXISTS
// The browse sidebar offered six facets over a hardcoded vocabulary and was wired to
// nothing -- <BrowseFilters /> was rendered with no props, so every chip and slider
// updated local state and called an optional callback that had never been passed.
//
// Wiring it up alone would have made things worse. Measured across 923 songs:
//
//   duration   919/923      answerable
//   explicit   919/923      answerable
//   bpm          4/923      not answerable
//   mood         4/923      not answerable
//   loopable     4/923      not answerable
//   genre          0/923    the field does not exist
//
// A wired sidebar would have let a buyer click "Jazz" and see an empty grid -- a
// confident wrong answer that a catalogue of 49 cocktail-piano tracks has none. A
// filter that can only return nothing is worse than no filter.
//
// So the facets are DERIVED from the records on screen rather than declared. The
// sidebar can then offer exactly what the catalogue can answer, and a facet appears
// the moment its data does -- no second edit, no list to keep in step.
//
// THE GENRE VOCABULARY IS THE POINT
// The hardcoded chips were Hip-Hop, Electronic, Pop, Rock, R&B, Jazz, Classical,
// Country, Latin, Reggae. The vocabulary Percy actually chose, and that the station
// emits, is R&B/Soul, Rock, Indie, Dance/Electronic. Two lists for one fact, in one
// repo, with nothing reconciling them -- the same fault the station raised about
// genreSlug across the boundary. Deriving from the data removes the second list
// rather than trying to keep it in step.

/** Seconds -> the coarse buckets the sidebar offers. Kept here so the grid and the
 *  chips agree about what "1-3 min" means. */
export const DURATION_BUCKETS = [
  { label: '< 15s (TikTok)', min: 0, max: 15 },
  { label: '15-30s (Reels)', min: 15, max: 30 },
  { label: '30-60s', min: 30, max: 60 },
  { label: '1-3 min', min: 60, max: 180 },
  { label: '3-5 min', min: 180, max: 300 },
  { label: '5+ min', min: 300, max: Infinity }
];

export const EMPTY_FILTERS = {
  duration: null,     // [min, max] in seconds, or null for any
  bpm: null,
  genres: [],
  moods: [],
  explicit: null,     // null = either, false = clean only
  loopable: null
};

const distinct = (values) =>
  [...new Set(values.filter((v) => typeof v === 'string' && v.trim()))].sort((a, b) =>
    a.localeCompare(b)
  );

/**
 * What this set of tracks can be filtered by.
 *
 * A facet is offered only when MORE THAN ONE value exists for it. A single value
 * filters nothing -- every result already has it -- so the control would be a switch
 * between "everything" and "everything".
 */
export function facetsOf(tracks) {
  // Non-objects are dropped before anything reads a property off them. One null in
  // the array would otherwise throw inside .map and take the whole browse page down
  // -- a crash, not an empty grid. Records arrive from Firestore and from callers,
  // so this cannot assume they are all shaped.
  const list = (Array.isArray(tracks) ? tracks : []).filter(
    (t) => t && typeof t === 'object'
  );

  const genres = distinct(list.map((t) => t.genre));
  const moods = distinct(list.flatMap((t) => (Array.isArray(t.mood) ? t.mood : [t.mood])));

  const bpms = list.map((t) => Number(t.bpm)).filter((n) => Number.isFinite(n) && n > 0);
  const durations = list.map((t) => Number(t.duration)).filter((n) => Number.isFinite(n) && n > 0);

  const explicitValues = new Set(
    list.map((t) => t.explicit).filter((v) => typeof v === 'boolean')
  );
  const loopableValues = new Set(
    list.map((t) => t.loopable).filter((v) => typeof v === 'boolean')
  );

  return {
    genres,
    moods,
    bpm: bpms.length > 1 ? [Math.min(...bpms), Math.max(...bpms)] : null,
    duration: durations.length > 1 ? [Math.min(...durations), Math.max(...durations)] : null,
    // Only worth offering when the catalogue contains BOTH answers.
    explicit: explicitValues.size > 1,
    loopable: loopableValues.size > 1,
    durationBuckets: DURATION_BUCKETS.filter((bucket) =>
      durations.some((d) => d >= bucket.min && d < bucket.max)
    )
  };
}

/** True when nothing is being narrowed. */
export function isEmptyFilter(filters) {
  if (!filters) return true;
  return (
    !filters.duration &&
    !filters.bpm &&
    !(filters.genres || []).length &&
    !(filters.moods || []).length &&
    filters.explicit === null &&
    filters.loopable === null
  );
}

/**
 * Apply the filter to a list of tracks.
 *
 * A track MISSING the field a filter names is excluded, not kept. That is the
 * deliberate choice: if someone asks for 120 BPM, a track with no BPM recorded is not
 * an answer to the question, and including it would quietly widen every filter to
 * "matches, or we do not know".
 */
export function applyFilters(tracks, filters) {
  const list = (Array.isArray(tracks) ? tracks : []).filter(
    (t) => t && typeof t === 'object'
  );
  if (isEmptyFilter(filters)) return list;

  return list.filter((track) => {
    if (filters.duration) {
      const seconds = Number(track.duration);
      if (!Number.isFinite(seconds)) return false;
      if (seconds < filters.duration[0] || seconds > filters.duration[1]) return false;
    }

    if (filters.bpm) {
      const bpm = Number(track.bpm);
      if (!Number.isFinite(bpm)) return false;
      if (bpm < filters.bpm[0] || bpm > filters.bpm[1]) return false;
    }

    if (filters.genres && filters.genres.length) {
      if (!filters.genres.includes(track.genre)) return false;
    }

    if (filters.moods && filters.moods.length) {
      const moods = Array.isArray(track.mood) ? track.mood : [track.mood];
      if (!filters.moods.some((m) => moods.includes(m))) return false;
    }

    if (filters.explicit !== null && filters.explicit !== undefined) {
      if (track.explicit !== filters.explicit) return false;
    }

    if (filters.loopable !== null && filters.loopable !== undefined) {
      if (track.loopable !== filters.loopable) return false;
    }

    return true;
  });
}
