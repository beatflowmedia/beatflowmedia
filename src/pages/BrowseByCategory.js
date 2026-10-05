// src/pages/BrowseByCategory.js
// Browse music by different categories (mood, genre, platform, use case)
//
// THE FILTER STATE LIVES HERE, not in the sidebar.
//
// BrowseFilters used to be rendered as <BrowseFilters /> with no props at all, while
// its own signature took onFilterChange and onClearFilters. Every chip and slider
// updated local state and called an optional callback that had never been passed, so
// the entire panel was decorative -- six facets, none of them connected to anything.
//
// The sidebar and the grid are SIBLINGS and must agree about the selection, so the
// state belongs to their parent. Holding it in either would mean the other reaching
// sideways for it, which is how two components end up with two answers to one question.
//
// The facets are DERIVED from the tracks the grid actually loaded, not declared. The
// sidebar previously hardcoded ten genres -- Hip-Hop, Electronic, Pop, Rock, R&B,
// Jazz, Classical, Country, Latin, Reggae -- while the vocabulary Percy chose and the
// station emits is R&B/Soul, Rock, Indie, Dance/Electronic. Two lists for one fact,
// with nothing reconciling them. Deriving removes the second list rather than trying
// to keep it in step, and a facet appears the moment its data does.
import { useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Button, Chip, Drawer, IconButton } from '@mui/material';
import FilterList from '@mui/icons-material/FilterList';
import Close from '@mui/icons-material/Close';
import BrowseFilters from '../components/BrowseFilters';
import CollectionGrid from '../components/CollectionGrid';
import HomeStorefront from './HomeStorefront';
import { getBrowseCategory } from '../config/browseCategories';
import { ASSET_POOLS } from '../utils/assetPools';
import { facetsOf, EMPTY_FILTERS, countActiveFilters, applyFilters } from '../utils/catalogFacets';

const BrowseByCategory = () => {
  const { category } = useParams();
  const activeCategory = getBrowseCategory(category);
  const title = activeCategory?.title || 'Browse Music';
  const description = activeCategory?.description || 'Discover music for your content';

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [loadedTracks, setLoadedTracks] = useState([]);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // useCallback because HomeStorefront lists this in its effect dependencies. An
  // unstable function would resubscribe on every render and re-read the collection
  // each time, and reads are billed on Blaze.
  const handleTracksLoaded = useCallback((tracks) => setLoadedTracks(tracks), []);

  const facets = useMemo(() => facetsOf(loadedTracks), [loadedTracks]);

  // `library` and `functional` are the pool LANDING pages -- the top of a catalogue.
  const isPoolLanding = category === 'library' || category === 'functional';

  // Shared with the sidebar's own badge via countActiveFilters, so the two cannot
  // disagree about how many filters are on.
  const activeCount = countActiveFilters(filters);

  // What the sheet's confirm button promises. Computed from the SAME applyFilters the
  // grid uses -- a count derived any other way would eventually quote a number the
  // grid does not produce, which is worse than no count.
  const matchCount = useMemo(
    () => applyFilters(loadedTracks, filters).length,
    [loadedTracks, filters]
  );

  // Rendered twice, at two breakpoints, from one component and one piece of state.
  // A separate mobile filter UI would be a second answer to "what is selected", and
  // the two would drift the first time a facet is added to one of them.
  const filterPanel = (
    <BrowseFilters
      facets={facets}
      filters={filters}
      onFilterChange={setFilters}
      onClearFilters={() => setFilters(EMPTY_FILTERS)}
    />
  );

  return (
    <Box sx={{ display: 'flex', gap: 3, p: 3, height: '100%', overflow: 'hidden' }}>
      {/* Desktop: the sidebar, always present. */}
      <Box sx={{ flexShrink: 0, display: { xs: 'none', md: 'block' } }}>
        {filterPanel}
      </Box>

      {/* Phone: the same panel in a bottom sheet.
        *
        * Below md the sidebar is display:none, so until now a phone had NO filtering
        * at all -- and phones are the default target. A sheet rather than a restored
        * nav row because the nav row is where this went wrong: it took permanent
        * vertical space from a screen that has least of it, and covered the content.
        *
        * Bottom-anchored because it opens under the thumb. Full width, 85dvh tall --
        * dvh, not vh, since vh on mobile excludes the browser chrome and clips the
        * last control. */}
      <Drawer
        anchor="bottom"
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: '#121212',
            backgroundImage: 'none',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '85dvh',
            display: { xs: 'flex', md: 'none' },
            flexDirection: 'column'
          }
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            pt: 2,
            pb: 1,
            flexShrink: 0
          }}
        >
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
            Filters
          </Typography>
          {/* 44px, because a close control that misses is the one that annoys most. */}
          <IconButton
            onClick={() => setFilterSheetOpen(false)}
            aria-label="Close filters"
            sx={{ color: 'grey.400', minWidth: 44, minHeight: 44 }}
          >
            <Close />
          </IconButton>
        </Box>

        <Box sx={{ overflowY: 'auto', px: 2, flex: 1 }}>{filterPanel}</Box>

        {/* The confirm button states the RESULT, not just "Done". Filters apply live,
          * so this only dismisses -- and a button that says how many tracks are waiting
          * is the difference between dismissing hopefully and dismissing knowingly. */}
        <Box
          sx={{
            p: 2,
            pt: 1.5,
            flexShrink: 0,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            // Clear of the iOS home indicator, which otherwise sits on the button.
            pb: 'calc(1rem + env(safe-area-inset-bottom))'
          }}
        >
          <Button
            fullWidth
            variant="contained"
            onClick={() => setFilterSheetOpen(false)}
            sx={{
              minHeight: 48,
              bgcolor: '#1DB954',
              color: 'white',
              fontWeight: 'bold',
              '&:hover': { bgcolor: '#1ed760' }
            }}
          >
            Show {matchCount} track{matchCount === 1 ? '' : 's'}
          </Button>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}>
            {title}
          </Typography>
          <Typography variant="body1" sx={{ color: 'grey.400' }}>
            {description}
          </Typography>

          {/* The only way into the filters below md, so it is rendered only there --
            * on desktop the sidebar is already on screen and a second entry point
            * would be two controls for one job.
            *
            * Hidden entirely when there is nothing to filter by, rather than opening a
            * sheet that says "not tagged yet". An empty control is indistinguishable
            * from a broken one. */}
          {(facets.durationBuckets?.length > 1 ||
            facets.genres?.length > 1 ||
            facets.moods?.length > 1 ||
            facets.bpm || facets.explicit || facets.loopable) && (
            <Button
              onClick={() => setFilterSheetOpen(true)}
              startIcon={<FilterList />}
              aria-haspopup="dialog"
              sx={{
                display: { xs: 'inline-flex', md: 'none' },
                mt: 2,
                minHeight: 44,
                px: 2,
                color: 'white',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: 999,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Filters
              {activeCount > 0 && (
                <Chip
                  label={activeCount}
                  size="small"
                  sx={{ ml: 1, bgcolor: '#1DB954', color: 'white', fontWeight: 'bold', height: 22 }}
                />
              )}
            </Button>
          )}
        </Box>

        {/* Browse defaults to the LIBRARY, not the albums. Every /browse route is
            someone licensing music for their own work; the platform pages (TikTok,
            Instagram, YouTube) carry no pool of their own and would otherwise fall
            through to the storefront's commercial-release default, showing a creator
            Percy's artist albums. */}
        {/* The collections come FIRST, because they are the structure the catalogue
            actually has. /browse/library used to open on 562 undifferentiated tracks;
            the library was imported by folder and those folders were already Percy's
            curation -- 24 named sets, each a situation rather than a genre.

            Shown only on the two pool landing pages. On a facet page (mood, genre, use
            case) the visitor has already chosen how to narrow, and offering a second,
            different narrowing above their results answers a question they did not
            ask. */}
        {isPoolLanding && (
          <CollectionGrid pool={activeCategory?.pool} title="Browse by collection" />
        )}

        <HomeStorefront
          hideHeader
          filter={activeCategory}
          pool={activeCategory?.pool || ASSET_POOLS.PRODUCTION_MUSIC}
          activeFilters={filters}
          onTracksLoaded={handleTracksLoaded}
        />
      </Box>
    </Box>
  );
};

export default BrowseByCategory;
