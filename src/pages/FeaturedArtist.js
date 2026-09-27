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
// WHY IT READS THE WHOLE COLLECTION
// Firestore cannot query a substring, and the credit lives inside the title, so there
// is no server-side filter for "features SYNNE" short of denormalising a field --
// which would be a second copy of a fact the title already holds, free to drift. At
// 138 songs one read is cheap and correct. If the catalogue reaches thousands this
// becomes the wrong shape and wants a real search index, which is a different problem
// with a different answer; this is not that yet.
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import Footer from '../components/Footer';
import { artworkUrl } from '../utils/artwork';
import { usePlaySong } from '../hooks/usePlaySong';
import {
  titleFeatures,
  titleWithoutFeature,
  parseFeaturedArtists,
  featuredArtistSlug
} from '../utils/featuredArtists';

export default function FeaturedArtist() {
  const { slug } = useParams();
  const { playSong, isSongPlaying } = usePlaySong();

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

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <main className="flex-1 pt-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto py-10 sm:py-14">
          <p className="text-sm text-gray-500 mb-2">Featured artist</p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-3">{displayName}</h1>

          {loading ? (
            <p className="text-gray-400">Loading…</p>
          ) : error ? (
            <div role="alert" className="bg-red-900/30 border border-red-700 rounded-lg p-4">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          ) : songs.length === 0 ? (
            <p className="text-gray-400">
              No tracks found for this artist.{' '}
              <Link to="/browse" className="text-green-500 hover:underline">
                Browse the catalogue
              </Link>
              .
            </p>
          ) : (
            <>
              {/* Says plainly what a featured credit means here, because a buyer who
                  has been told the recordings are AI-assisted may reasonably wonder
                  who this is. */}
              <p className="text-gray-400 mb-8">
                {songs.length} {songs.length === 1 ? 'track' : 'tracks'} featuring{' '}
                {displayName}, produced by Percy Rice for BeatFlow Media Group.
              </p>

              <ul className="space-y-2">
                {songs.map((song) => (
                  <li
                    key={song.id}
                    className="flex items-center gap-4 bg-gray-800 rounded-lg p-3 hover:bg-gray-750"
                  >
                    <img
                      src={artworkUrl(song)}
                      alt=""
                      className="w-14 h-14 rounded object-cover flex-shrink-0"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/song/${song.id}`}
                        className="block font-semibold truncate hover:underline"
                      >
                        {titleWithoutFeature(song.title)}
                      </Link>
                      <p className="text-sm text-gray-400 truncate">
                        {song.album || song.albumName || 'Single'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => playSong(song)}
                      className="min-h-[44px] min-w-[44px] px-4 rounded-full bg-green-600 hover:bg-green-500 text-sm font-semibold flex-shrink-0"
                      aria-label={`Play ${titleWithoutFeature(song.title)}`}
                    >
                      {isSongPlaying && isSongPlaying(song) ? 'Playing' : 'Play'}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
