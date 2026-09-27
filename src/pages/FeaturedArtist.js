// src/pages/FeaturedArtist.js
//
// A page for a featured artist -- Lyle Carpenter, SYNNE, Adam Cetera, Dawn Calvin.
//
// These are featured credits on Percy Rice releases, carried in the track title the
// way the distributor registered them. They are a real public identity: a buyer meets
// them on the radio or a DSP, then arrives at the store with a name and nothing to do
// with it. Search found them, because search matches on title, but there was no page,
// no filter and nothing to click -- 52 tracks, 38% of the catalogue, with an artist
// identity the storefront could not be navigated by.
//
// USES TrackRowCard, WHICH THE FIRST VERSION DID NOT.
// That version hand-rolled its own row with a Play button and nothing else, on a site
// that exists to LICENSE music. Twelve tracks a buyer could hear and not buy, which is
// the same defect as a page that looks like it does something and does not. The shared
// row brings the licence button, like, favourite and options, and it means this page
// cannot drift from how every other track list behaves.
//
// WHY IT READS THE WHOLE COLLECTION
// Firestore cannot query a substring and the credit lives inside the title, so there
// is no server-side filter for "features SYNNE" short of denormalising a field --
// which would be a second copy of a fact the title already holds, free to drift. At
// 138 songs one read is cheap and correct. If the catalogue reaches thousands this
// becomes the wrong shape and wants a real search index, which is a different problem
// with a different answer; this is not that yet.
import { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Box, Typography } from '@mui/material';
import { db } from '../firebaseConfig';
import Footer from '../components/Footer';
import TrackRowCard from '../components/TrackRowCard';
import { artworkUrl } from '../utils/artwork';
import { usePlaySong } from '../hooks/usePlaySong';
import {
  titleFeatures,
  parseFeaturedArtists,
  featuredArtistSlug
} from '../utils/featuredArtists';

export default function FeaturedArtist() {
  const { slug } = useParams();
  const { playSong, isCurrentSong, isPlaying } = usePlaySong();

  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const snapshot = await getDocs(
          query(collection(db, 'songs'), where('isVisible', '!=', false))
        );
        const matches = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((song) => titleFeatures(song.title, slug));
        if (!cancelled) setSongs(matches);
      } catch (err) {
        console.error('Could not load featured artist tracks:', err);
        if (!cancelled) setError('Could not load these tracks. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // The display name comes from the tracks themselves rather than from the slug, so
  // "SYNNE" renders as SYNNE rather than a title-cased guess from the URL.
  const displayName =
    songs
      .flatMap((song) => parseFeaturedArtists(song.title))
      .find((name) => featuredArtistSlug(name) === slug) || slug;

  // Which albums these tracks come from. Every persona's credits currently sit on a
  // single album, so this is usually one link -- but deriving it means a persona
  // appearing across two releases later does not silently lose the second.
  const albums = [
    ...new Map(
      songs
        .filter((song) => song.albumId || song.albumTitle || song.album)
        .map((song) => [
          song.albumId || song.albumTitle || song.album,
          { id: song.albumId, title: song.albumTitle || song.album }
        ])
    ).values()
  ];

  const hero = songs[0];

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <main className="flex-1 pt-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto py-10 sm:py-14">
          {/* Header with artwork. The first version was a bare text heading, which
              read as thinner than the rest of the site -- and an artist page with no
              image is the one page where that is most obviously missing. */}
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end mb-10">
            {hero && (
              <img
                src={artworkUrl(hero)}
                alt=""
                className="w-40 h-40 sm:w-48 sm:h-48 rounded-lg object-cover shadow-lg flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <p className="text-sm text-gray-400 uppercase tracking-wide mb-1">
                Featured artist
              </p>
              <h1 className="text-4xl sm:text-6xl font-bold mb-3 break-words">
                {displayName}
              </h1>
              {!loading && songs.length > 0 && (
                <p className="text-gray-400">
                  {songs.length} {songs.length === 1 ? 'track' : 'tracks'} ·{' '}
                  {/* Stated plainly, because a buyer told the recordings are
                      AI-assisted may reasonably wonder who this is. */}
                  produced by Percy Rice for BeatFlow Media Group
                </p>
              )}
              {albums.length > 0 && (
                <p className="text-gray-400 mt-2">
                  From{' '}
                  {albums.map((album, index) => (
                    <span key={album.title}>
                      {index > 0 && ', '}
                      {album.id ? (
                        <RouterLink
                          to={`/album/${album.id}`}
                          className="text-green-500 hover:underline"
                        >
                          {album.title}
                        </RouterLink>
                      ) : (
                        album.title
                      )}
                    </span>
                  ))}
                </p>
              )}
            </div>
          </div>

          {loading ? (
            <p className="text-gray-400">Loading…</p>
          ) : error ? (
            <div role="alert" className="bg-red-900/30 border border-red-700 rounded-lg p-4">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          ) : songs.length === 0 ? (
            <p className="text-gray-400">
              No tracks found for this artist.{' '}
              <RouterLink to="/browse" className="text-green-500 hover:underline">
                Browse the catalogue
              </RouterLink>
              .
            </p>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {songs.map((song, index) => (
                <TrackRowCard
                  key={song.id}
                  track={song}
                  index={index}
                  isCurrentTrack={isCurrentSong ? isCurrentSong(song) : false}
                  isPlaying={isPlaying}
                  onPlay={playSong}
                  showArtist={false}
                  showPurchase
                />
              ))}
            </Box>
          )}

          {!loading && songs.length > 0 && (
            <Typography variant="body2" sx={{ color: 'grey.500', mt: 4 }}>
              {displayName} is a featured artist on releases produced by Percy Rice.
              Licences are issued by BeatFlow Media Group, which holds both the
              recording and the composition — see our{' '}
              <RouterLink to="/terms" style={{ color: '#9ca3af' }}>
                terms
              </RouterLink>
              .
            </Typography>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
