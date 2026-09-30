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
import { Box, Typography } from '@mui/material';
import BrowseFilters from '../components/BrowseFilters';
import CollectionGrid from '../components/CollectionGrid';
import HomeStorefront from './HomeStorefront';
import { getBrowseCategory } from '../config/browseCategories';
import { ASSET_POOLS } from '../utils/assetPools';
import { facetsOf, EMPTY_FILTERS } from '../utils/catalogFacets';

const BrowseByCategory = () => {
  const { category } = useParams();
  const activeCategory = getBrowseCategory(category);
  const title = activeCategory?.title || 'Browse Music';
  const description = activeCategory?.description || 'Discover music for your content';

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [loadedTracks, setLoadedTracks] = useState([]);

  // useCallback because HomeStorefront lists this in its effect dependencies. An
  // unstable function would resubscribe on every render and re-read the collection
  // each time, and reads are billed on Blaze.
  const handleTracksLoaded = useCallback((tracks) => setLoadedTracks(tracks), []);

  const facets = useMemo(() => facetsOf(loadedTracks), [loadedTracks]);

  // `library` and `functional` are the pool LANDING pages -- the top of a catalogue.
  // The facet routes (mood, genre, usecase) are already a narrowing.
  const isPoolLanding = category === 'library' || category === 'functional';

  return (
    <Box sx={{ display: 'flex', gap: 3, p: 3, height: '100%', overflow: 'hidden' }}>
      {/* Filters Sidebar */}
      <Box sx={{ flexShrink: 0, display: { xs: 'none', md: 'block' } }}>
        <BrowseFilters
          facets={facets}
          filters={filters}
          onFilterChange={setFilters}
          onClearFilters={() => setFilters(EMPTY_FILTERS)}
        />
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}>
            {title}
          </Typography>
          <Typography variant="body1" sx={{ color: 'grey.400' }}>
            {description}
          </Typography>
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
