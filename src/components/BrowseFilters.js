// src/components/BrowseFilters.js
//
// The browse sidebar. CONTROLLED by its parent, and it offers only the facets the
// catalogue can actually answer.
//
// WHAT WAS WRONG
// It was rendered as <BrowseFilters /> with no props while its own signature took
// onFilterChange and onClearFilters. Every chip and slider updated local state and
// called an optional callback that had never been passed. Six facets, none connected
// to anything -- a panel that looked like a feature and was furniture.
//
// Wiring it up as it stood would have been worse than leaving it dead. Measured across
// 923 songs: duration 919, explicit 919, bpm 4, mood 4, loopable 4, genre 0. Clicking
// "Jazz" would have emptied the grid -- a confident wrong answer that a catalogue with
// 49 cocktail-piano tracks has none. A filter that can only return nothing is worse
// than no filter.
//
// So the facets come from the records the grid loaded, via facetsOf(). A section
// renders only when there is something to choose BETWEEN, and appears by itself the
// day its data lands -- no second edit, no list to keep in step.
//
// THE GENRE LIST IS GONE, NOT UPDATED. It was hardcoded as Hip-Hop, Electronic, Pop,
// Rock, R&B, Jazz, Classical, Country, Latin, Reggae. The vocabulary Percy chose, and
// that the station emits, is R&B/Soul, Rock, Indie, Dance/Electronic. Replacing one
// hardcoded list with another would have kept the fault: one fact with two owners and
// nothing reconciling them. Deriving removes the second owner.
import { Box, Typography, Chip, Slider, Checkbox, FormControlLabel, Button, Divider } from '@mui/material';
import FilterList from '@mui/icons-material/FilterList';
import { EMPTY_FILTERS, countActiveFilters } from '../utils/catalogFacets';

const CHIP_SX = (selected) => ({
  bgcolor: selected ? '#1DB954' : 'rgba(255,255,255,0.08)',
  color: selected ? 'white' : 'grey.300',
  fontWeight: selected ? 600 : 400,
  minHeight: 36,
  '&:hover': { bgcolor: selected ? '#1ed760' : 'rgba(255,255,255,0.16)' }
});

const Section = ({ title, children }) => (
  <Box sx={{ mb: 3 }}>
    <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 'bold', mb: 1.5 }}>
      {title}
    </Typography>
    {children}
  </Box>
);

const BrowseFilters = ({
  facets = {},
  filters = EMPTY_FILTERS,
  onFilterChange,
  onClearFilters
}) => {
  const set = (patch) => onFilterChange?.({ ...filters, ...patch });

  const toggleIn = (key, value) => {
    const current = filters[key] || [];
    set({
      [key]: current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
    });
  };

  // Shared with the mobile filter button, so the badge on the button and the badge in
  // here cannot disagree about how many filters are on.
  const activeCount = countActiveFilters(filters);

  const buckets = facets.durationBuckets || [];
  const hasAnything =
    buckets.length > 1 ||
    (facets.genres?.length || 0) > 1 ||
    (facets.moods?.length || 0) > 1 ||
    facets.bpm ||
    facets.explicit ||
    facets.loopable;

  // Nothing to offer is stated rather than shown as an empty panel, so it reads as a
  // catalogue that is not tagged yet rather than a control that is broken.
  if (!hasAnything) {
    return (
      <Box sx={{ width: { xs: '100%', md: 280 }, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <FilterList sx={{ color: 'grey.500' }} />
          <Typography variant="h6" sx={{ color: 'grey.500', fontWeight: 'bold' }}>
            Filters
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: 'grey.500' }}>
          These tracks are not tagged with anything to filter by yet.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: { xs: '100%', md: 280 },
        bgcolor: 'rgba(255,255,255,0.03)',
        borderRadius: 2,
        p: 2,
        maxHeight: 'calc(100vh - 200px)',
        overflowY: 'auto'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterList sx={{ color: 'white' }} />
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
            Filters
          </Typography>
          {activeCount > 0 && (
            <Chip
              label={activeCount}
              size="small"
              sx={{ bgcolor: '#1DB954', color: 'white', fontWeight: 'bold' }}
            />
          )}
        </Box>
        {activeCount > 0 && (
          <Button
            size="small"
            onClick={() => onClearFilters?.()}
            sx={{ color: 'grey.400', minHeight: 44 }}
          >
            Clear
          </Button>
        )}
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 2 }} />

      {buckets.length > 1 && (
        <Section title="Duration">
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {buckets.map((bucket) => {
              const selected =
                filters.duration &&
                filters.duration[0] === bucket.min &&
                filters.duration[1] === bucket.max;
              return (
                <Chip
                  key={bucket.label}
                  label={bucket.label}
                  onClick={() =>
                    set({ duration: selected ? null : [bucket.min, bucket.max] })
                  }
                  sx={CHIP_SX(selected)}
                />
              );
            })}
          </Box>
        </Section>
      )}

      {facets.bpm && (
        <Section title="BPM">
          <Slider
            value={filters.bpm || facets.bpm}
            min={facets.bpm[0]}
            max={facets.bpm[1]}
            onChange={(event, value) => set({ bpm: value })}
            valueLabelDisplay="auto"
            sx={{ color: '#1DB954' }}
          />
          <Typography variant="caption" sx={{ color: 'grey.500' }}>
            {(filters.bpm || facets.bpm)[0]} – {(filters.bpm || facets.bpm)[1]} BPM
          </Typography>
        </Section>
      )}

      {(facets.genres?.length || 0) > 1 && (
        <Section title="Genre">
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {facets.genres.map((genre) => (
              <Chip
                key={genre}
                label={genre}
                onClick={() => toggleIn('genres', genre)}
                sx={CHIP_SX(filters.genres?.includes(genre))}
              />
            ))}
          </Box>
        </Section>
      )}

      {(facets.moods?.length || 0) > 1 && (
        <Section title="Mood">
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {facets.moods.map((mood) => (
              <Chip
                key={mood}
                label={mood}
                onClick={() => toggleIn('moods', mood)}
                sx={CHIP_SX(filters.moods?.includes(mood))}
              />
            ))}
          </Box>
        </Section>
      )}

      {(facets.explicit || facets.loopable) && (
        <Section title="Content Type">
          {facets.explicit && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.explicit === false}
                  onChange={() => set({ explicit: filters.explicit === false ? null : false })}
                  sx={{ color: 'grey.500', '&.Mui-checked': { color: '#1DB954' } }}
                />
              }
              label={<Typography sx={{ color: 'grey.300' }}>Clean only</Typography>}
            />
          )}
          {facets.loopable && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.loopable === true}
                  onChange={() => set({ loopable: filters.loopable === true ? null : true })}
                  sx={{ color: 'grey.500', '&.Mui-checked': { color: '#1DB954' } }}
                />
              }
              label={<Typography sx={{ color: 'grey.300' }}>Loopable</Typography>}
            />
          )}
        </Section>
      )}
    </Box>
  );
};

export default BrowseFilters;
