// src/components/CollectionGrid.js
//
// The production library's collections, as shelves.
//
// WHY THIS EXISTS
// /browse/library showed 562 undifferentiated tracks. The catalogue was imported BY
// FOLDER and the folders were already Percy's curation -- 24 named sets, each 16 to 56
// tracks, and they are not genres but SITUATIONS: "Piano Trio Cocktail Music For
// Relaxation" is a restaurant, "Ambient Sitar for Calm & Sleep" is a spa, "Deep Focus
// Mind Lab" is an office.
//
// That structure survived the import as a string on each track and had nothing to join
// on, so the storefront could not show it. backfill-collections.js made it an entity;
// this is the surface that finally renders it.
//
// It is also the honest answer to what the platform tabs were faking. TikTok, Instagram
// and YouTube existed to narrow the library and each returned all of it. The narrowing
// the catalogue can actually support was sitting in the folder names the whole time.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, Skeleton } from '@mui/material';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import OptimizedImage from './OptimizedImage';

/**
 * @param {string|null} pool  show only collections in this asset pool. Null shows all.
 * @param {string} title      heading above the grid.
 */
const CollectionGrid = ({ pool = null, title = 'Collections' }) => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        // getDocs, not onSnapshot. Collections change when a backfill runs -- roughly
        // never during a session -- so a live listener would hold a socket open for an
        // update that is not coming, and reads are billed on Blaze.
        //
        // assetPool + trackCount would need a composite index; 24 documents sort in
        // memory for free. The index is not worth deploying for this.
        const base = pool
          ? query(collection(db, 'collections'), where('assetPool', '==', pool))
          : query(collection(db, 'collections'), orderBy('trackCount', 'desc'));

        const snap = await getDocs(base);
        if (!isMounted) return;

        const rows = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.trackCount || 0) - (a.trackCount || 0));

        setCollections(rows);
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        // An error handler, because the failure this guards against is invisible
        // without one: firestore.rules carries a default-deny catch-all, so a missing
        // rule for collections/ returns permission-denied and an unhandled rejection
        // renders as an empty grid -- indistinguishable from a library with no
        // collections at all.
        console.error('CollectionGrid: load failed —', err.code, err.message);
        setError(err.code === 'permission-denied'
          ? 'Collections are not readable — the Firestore rule for collections/ has not been deployed.'
          : 'Collections could not be loaded.');
        setLoading(false);
      }
    };

    load();
    return () => { isMounted = false; };
  }, [pool]);

  if (loading) {
    return (
      <Box sx={{ mb: 5 }}>
        <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
          {title}
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 2 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={190} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
          ))}
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mb: 5 }}>
        <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: 'error.light' }}>{error}</Typography>
      </Box>
    );
  }

  if (collections.length === 0) return null;

  return (
    <Box sx={{ mb: 5 }}>
      <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 0.5 }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: 'grey.400', mb: 2 }}>
        {collections.length} curated sets
      </Typography>

      <Box
        sx={{
          display: 'grid',
          // Base is the phone: two across at 150px minimum, growing to more columns on
          // wider screens without a breakpoint.
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 2
        }}
      >
        {collections.map((c) => (
          <Box
            key={c.id}
            component={Link}
            to={`/collection/${c.slug || c.id}`}
            sx={{
              textDecoration: 'none',
              display: 'block',
              bgcolor: 'rgba(255,255,255,0.05)',
              borderRadius: 2,
              overflow: 'hidden',
              // A whole card is the target, so it clears 44px many times over. The
              // minHeight is the floor for a collection whose title wraps to one line.
              minHeight: 190,
              transition: 'background-color 0.2s',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.09)' },
              '&:focus-visible': { outline: '3px solid #1DB954', outlineOffset: '2px' }
            }}
          >
            <Box sx={{ position: 'relative', paddingTop: '100%' }}>
              <OptimizedImage
                src={c.coverUrl}
                alt={c.title}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </Box>
            <Box sx={{ p: 1.5 }}>
              <Typography
                sx={{
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  lineHeight: 1.3,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {c.title}
              </Typography>
              <Typography sx={{ color: 'grey.500', fontSize: '0.75rem', mt: 0.5 }}>
                {c.trackCount} track{c.trackCount === 1 ? '' : 's'}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default CollectionGrid;
