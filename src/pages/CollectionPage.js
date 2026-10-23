// src/pages/CollectionPage.js
//
// One collection from the production library, at /collection/:slug.
//
// The tracks come from HomeStorefront with a collectionId, rather than from a second
// query written here. That component already knows how to skip records with no audio,
// refuse previewOnly ones, apply the sidebar filter and render the license buttons --
// a copy of it would drift from the original the first time either changed, which is
// the fault the PRD calls out as "shared backend, independent surfaces" (S84).
import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import HomeStorefront from './HomeStorefront';
import OptimizedImage from '../components/OptimizedImage';
import CollectionLicensePanel from '../components/CollectionLicensePanel';
import { Helmet } from 'react-helmet-async';
import { generateCollectionSchema, generateBreadcrumbSchema, schemaScript } from '../utils/schemaMarkup';
import { calculateCollectionPrice } from '../utils/pricing';

const CollectionPage = () => {
  const { slug } = useParams();
  const [meta, setMeta] = useState(null);
  const [state, setState] = useState('loading'); // loading | ready | missing | error

  // HOW MANY TRACKS ARE ACTUALLY LICENSABLE, counted from the records on screen rather
  // than read from the collection's stored `trackCount`.
  //
  // Those two disagree today: `npm run verify:collections` reports game-show-walk-on
  // holding trackCount 27 while 30 songs carry its id, and the stored field is a derived
  // copy an importer writes. create-checkout prices from its own query of the same
  // songs, so quoting trackCount here would advertise $209 and bill $219 -- a storefront
  // showing one price and charging another, on the most expensive thing we sell.
  //
  // HomeStorefront has already filtered the set to what can be delivered (audio present,
  // not previewOnly), which is the same test the server applies. One source, both sides.
  const [licensableCount, setLicensableCount] = useState(null);

  // Memoized because HomeStorefront lists it as an effect dependency -- a fresh function
  // on every render would re-subscribe the snapshot listener each time.
  const handleTracksLoaded = useCallback((tracks) => {
    setLicensableCount(Array.isArray(tracks) ? tracks.length : null);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'collections', slug));
        if (!isMounted) return;
        if (!snap.exists()) {
          // A slug that does not exist is stated, not rendered as an empty grid. The
          // difference matters: one says "this collection is gone", the other says
          // "this collection is empty", and only the first is true.
          setState('missing');
          return;
        }
        setMeta({ id: snap.id, ...snap.data() });
        setState('ready');
      } catch (err) {
        if (!isMounted) return;
        console.error('CollectionPage: load failed —', err.code, err.message);
        setState('error');
      }
    };

    load();
    return () => { isMounted = false; };
  }, [slug]);

  if (state === 'loading') {
    return <Box sx={{ p: 4, color: 'white' }}>Loading collection…</Box>;
  }

  if (state === 'missing' || state === 'error') {
    return (
      <Box sx={{ p: 4, color: 'white' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
          {state === 'missing' ? 'Collection not found' : 'Collection unavailable'}
        </Typography>
        <Typography sx={{ color: 'grey.400', mb: 3 }}>
          {state === 'missing'
            ? 'That collection does not exist, or has been renamed.'
            : 'Something went wrong loading this collection.'}
        </Typography>
        <Button component={Link} to="/browse/library" variant="contained" sx={{ minHeight: 44 }}>
          Back to the library
        </Button>
      </Box>
    );
  }

  // STRUCTURED DATA, emitted only once the licensable count is known.
  //
  // The price in `offers` has to be the price checkout will charge, and checkout prices
  // from the DELIVERABLE tracks rather than the stored trackCount -- the two disagree on
  // at least one collection today. Quoting the stored figure here would put a number in
  // a search result that the buyer is not charged, which is the same fault as the panel
  // advertising one price and Stripe billing another, except a search engine repeats it.
  //
  // So when the count has not arrived, there is no `offers` block rather than a guess.
  const schemaPrice = Number.isFinite(licensableCount) && licensableCount > 0
    ? calculateCollectionPrice(licensableCount, meta.assetPool || null)
    : null;

  const collectionSchema = generateCollectionSchema(meta, {
    priceCents: schemaPrice,
    trackCount: licensableCount
  });

  // Breadcrumbs are emitted on every collection, not only where a price is known: they
  // describe where the page sits in the silo, which is true regardless of the grid.
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Production Library', url: '/browse/library' },
    { name: meta.title || slug, url: `/collection/${meta.slug || meta.id}` }
  ]);

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <Helmet>
        {/* intentionally empty of JSON-LD -- see below */}
      </Helmet>
      {schemaScript(collectionSchema)}
      {schemaScript(breadcrumbSchema)}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'flex-end' },
          gap: 3,
          p: { xs: 2, md: 4 }
        }}
      >
        <Box sx={{ width: { xs: 140, sm: 180 }, flexShrink: 0 }}>
          <Box sx={{ position: 'relative', paddingTop: '100%', borderRadius: 2, overflow: 'hidden' }}>
            <OptimizedImage
              src={meta.coverUrl}
              alt={meta.title}
              sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Box>
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Button
            component={Link}
            to="/browse/library"
            startIcon={<ArrowBack />}
            sx={{ color: 'grey.400', minHeight: 44, mb: 1, pl: 0 }}
          >
            Production Library
          </Button>
          <Typography
            variant="h3"
            sx={{
              color: 'white',
              fontWeight: 'bold',
              // clamp rather than a fixed size: these titles run to "After Hours at the
              // Library — Vol. II The Exam Hall", which overflows a phone at h3.
              fontSize: 'clamp(1.5rem, calc(1rem + 3vw), 3rem)',
              lineHeight: 1.15
            }}
          >
            {meta.title}
          </Typography>
          <Typography sx={{ color: 'grey.400', mt: 1 }}>
            {meta.trackCount} track{meta.trackCount === 1 ? '' : 's'} · license the
            collection or any single track
          </Typography>
        </Box>
      </Box>

      {/* "licensable individually" was the whole answer this page gave, and it was a
        * dead end: nothing on the page licensed a collection, and the only way to
        * license 56 tracks was to buy 56 times. The panel is where the collection
        * becomes purchasable, and it states the single-track price next to it so the
        * two routes are visible at once rather than one being discovered. */}
      <CollectionLicensePanel collection={meta} licensableCount={licensableCount} />

      <HomeStorefront
        hideHeader
        collectionId={meta.slug || meta.id}
        onTracksLoaded={handleTracksLoaded}
      />
    </Box>
  );
};

export default CollectionPage;
