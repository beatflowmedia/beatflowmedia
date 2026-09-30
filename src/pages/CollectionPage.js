// src/pages/CollectionPage.js
//
// One collection from the production library, at /collection/:slug.
//
// The tracks come from HomeStorefront with a collectionId, rather than from a second
// query written here. That component already knows how to skip records with no audio,
// refuse previewOnly ones, apply the sidebar filter and render the licence buttons --
// a copy of it would drift from the original the first time either changed, which is
// the fault the PRD calls out as "shared backend, independent surfaces" (S84).
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import HomeStorefront from './HomeStorefront';
import OptimizedImage from '../components/OptimizedImage';

const CollectionPage = () => {
  const { slug } = useParams();
  const [meta, setMeta] = useState(null);
  const [state, setState] = useState('loading'); // loading | ready | missing | error

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

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
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
            {meta.trackCount} track{meta.trackCount === 1 ? '' : 's'} · licensable individually
          </Typography>
        </Box>
      </Box>

      <HomeStorefront hideHeader collectionId={meta.slug || meta.id} />
    </Box>
  );
};

export default CollectionPage;
