// src/pages/SongPage.js
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import PlayButton from "../components/PlayButton";
import LikeButton from "../components/LikeButton";
import PurchaseButton from "../components/PurchaseButton";
import DownloadLicenseTerms from "../components/DownloadLicenseTerms";
import { useAuth } from "../context/AuthContext";
import { useLikes } from '../context/LikesContext';
import { usePlayer } from "../context/PlayerContext";
import { usePlayerActions } from "../hooks/usePlayerActions";
import { db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { generateSongMetaTags } from "../utils/metaTagsHelper";
import { generateSongSchema, schemaToScriptTag } from "../utils/schemaMarkup";
import { trackSongView } from "../services/conversionTracking";
import { SONG_PRICE } from "../utils/pricing";
import { artworkUrl } from '../utils/artwork';
import { getPlaceholderImage } from '../utils/placeholders';

function SongPage() {
  const { id } = useParams();
  const { user, signInWithGoogle } = useAuth();
  const { addLike, removeLike, isLiked: checkIsLiked } = useLikes();
  const { dispatch, actions } = usePlayer();
  const { currentSong, isPlaying } = usePlayerActions();
  const [song, setSong] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1) Fetch song from Firebase
  useEffect(() => {
    const fetchSong = async () => {
      try {
        setLoading(true);
        const songDoc = await getDoc(doc(db, "songs", id));
        if (songDoc.exists()) {
          const songData = { id: songDoc.id, ...songDoc.data() };
          setSong(songData);
          // Note: playback starts only when the user clicks play (no forced autoplay).
        } else {
          setSong(null);
        }
      } catch (error) {
        console.error("Error fetching song:", error);
        setSong(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSong();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // 2) Warm the browser cache with this track's audio, so pressing play is instant.
  //
  // DELIBERATELY ONLY ON THIS PAGE, and written inline rather than as a hook for that
  // reason. Somebody at /song/:id came to hear this one recording -- intent is about as
  // certain as it gets. The same behaviour on /browse/library would fetch 500 previews
  // at 481KB each, roughly 240MB on page load. Extracting it to src/hooks/ would invite
  // exactly that import. The constraint is the point, so it lives where it applies.
  //
  // It does NOT touch PlayerContext. That would mean a new action in the reducer and a
  // change to the engine load path -- the code that plays everything, whose test suites
  // (GaplessEngine, CrossfadeEngine, ProductionMseEngine) are currently failing. A
  // detached Audio element needs none of that: the player later requests the SAME url
  // and the browser serves it from cache.
  //
  // Measured, which is what makes this worth doing at all:
  //   preview         481,115 bytes, audio/mpeg
  //   Cache-Control   public, max-age=31536000   + ETag, Accept-Ranges
  //   fetch           0.31s to first byte, 0.52s total on a fast connection
  //
  // The long max-age is what makes the warm-up land in cache rather than being
  // re-fetched on play. Without it this would double the bytes instead of hiding them.
  useEffect(() => {
    const url = song?.audioUrl;
    if (!url) return;

    // Someone else's mobile data, spent before they asked for anything. Data Saver is
    // an explicit instruction not to, and on a slow connection 481KB of speculation
    // competes with the page they are actually reading.
    const conn = navigator.connection;
    if (conn?.saveData) return;
    if (conn?.effectiveType && /(^|-)2g$/.test(conn.effectiveType)) return;

    const warmer = new Audio();
    warmer.preload = 'auto';
    warmer.crossOrigin = 'anonymous'; // match PlayerContext, or it caches under a different key
    warmer.muted = true;
    warmer.src = url;

    return () => {
      // Cancel an in-flight fetch when the visitor leaves. Clearing src and calling
      // load() is what actually aborts it -- dropping the reference alone leaves the
      // request running until it completes.
      warmer.src = '';
      warmer.load();
    };
  }, [song?.audioUrl]);

  // 3) Track song view for conversion tracking (2026 Hybrid Strategy)
  useEffect(() => {
    if (song) {
      trackSongView(song);
    }
  }, [song]);

  if (loading) {
    return (
      <div className="p-6 text-white">
        <h2 className="text-2xl">Loading...</h2>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="p-6 text-white">
        <h2 className="text-2xl">Song not found</h2>
      </div>
    );
  }

  const handleToggle = async () => {
    if (!user) {
      // redirect into Google sign-in flow if unauthenticated
      await signInWithGoogle();
      return;
    }
    // Toggle like in Firebase
    try {
      const liked = checkIsLiked(song.id);
      if (liked) {
        await removeLike(song.id);
      } else {
        await addLike(song.id);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const isLiked = checkIsLiked(song?.id);
  const isThisPlaying = isPlaying && currentSong?.id === song.id;

  const handlePlay = () => {
    if (isThisPlaying) {
      dispatch({ type: actions.TOGGLE_PLAY });
    } else {
      dispatch({ type: actions.PLAY_SONG, payload: song });
    }
  };

  // Facts this record actually carries, in a fixed order.
  //
  // A filtered list rather than a column of JSX with `&&` on every row: the emptiness
  // check and the rendering then cannot disagree, and adding a field is one line here
  // instead of one in two places.
  const formatDuration = (seconds) => {
    const total = Math.floor(Number(seconds));
    if (!Number.isFinite(total) || total <= 0) return null;
    return Math.floor(total / 60) + ':' + String(total % 60).padStart(2, '0');
  };

  const details = [
    { label: 'Duration', value: formatDuration(song.duration) },
    { label: 'BPM', value: song.bpm || null },
    { label: 'Genre', value: song.mainGenre || song.genre || null },
    { label: 'Mood', value: Array.isArray(song.mood) ? song.mood.join(', ') : song.mood || null },
    { label: 'Released', value: song.releaseDate || null },
    { label: 'ISRC', value: song.isrc || null },
    { label: 'Label', value: song.recordLabel || null },
    // Stated because the Copyright Office guidance requires it, not as a selling point.
    // The ingest writes aiDisclosure on every production-library record.
    { label: 'Production', value: song.aiDisclosure === 'ai-assisted' ? 'AI-assisted' : song.aiDisclosure || null },
    { label: 'Explicit', value: song.explicit === true ? 'Yes' : song.explicit === false ? 'No' : null }
  ].filter((row) => row.value !== null && row.value !== undefined && row.value !== '');

  // Generate SEO meta tags and Schema.org markup
  const metaTags = generateSongMetaTags(song);
  const songSchema = generateSongSchema(song);

  return (
    <>
      {/* SEO Meta Tags & Schema.org Structured Data */}
      {metaTags && (
        <Helmet>
          <title>{metaTags.title}</title>
          {metaTags.meta.map((tag, index) => (
            <meta key={index} {...tag} />
          ))}
          {metaTags.link && metaTags.link.map((linkTag, index) => (
            <link key={index} {...linkTag} />
          ))}
          {songSchema && (
            <script {...schemaToScriptTag(songSchema)} />
          )}
        </Helmet>
      )}

      {/* TWO COLUMNS ON DESKTOP, STACKED ON A PHONE.
        *
        * This was a single narrow stack: title, artist, three buttons, a 280px cover,
        * then "Lyrics / Details" reading "No lyrics available." On a 1280px screen the
        * bottom 40% was empty while the one decision a buyer came to make -- which
        * licence to take -- sat behind a modal.
        *
        * The base rule is the phone, one column, and the grid widens at md. Scaling up
        * with min-width, never walking a desktop layout back with max-width.
        */}
      <div className="p-4 sm:p-6 text-white max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] gap-6 lg:gap-10">

          <div>
            <img
              src={artworkUrl(song)}
              alt={song.title}
              className="rounded-lg w-full max-w-[320px] aspect-square object-cover"
              onError={(e) => { e.target.onerror = null; e.target.src = getPlaceholderImage(300, 300); }}
            />

            <div className="flex items-center gap-4 mt-4">
              <PlayButton isPlaying={isThisPlaying} onClick={handlePlay} size={32} />
              <LikeButton
                item={song}
                isLiked={isLiked}
                onToggleFavorite={handleToggle}
                size={24}
              />
            </div>
          </div>

          <div className="min-w-0">
            <h1 className="text-3xl sm:text-4xl font-bold">{song.title}</h1>
            <p className="text-gray-400 mt-1">by {song.artist || song.artistName}</p>

            {/* The collection is a LINK, not a label -- the one element on this page
                that leads somewhere a buyer wants to go: the rest of the set this cue
                was cut from. */}
            {song.collectionId && (
              <p className="mt-2 text-sm">
                <span className="text-gray-500">From </span>
                <Link to={`/collection/${song.collectionId}`} className="text-green-500 hover:underline">
                  {song.collectionTitle || song.album}
                </Link>
              </p>
            )}

            <div className="mt-6">
              <PurchaseButton
                itemId={id}
                itemType="song"
                price={song.price || SONG_PRICE}
                track={song}
                artistId={song.artistId}
                uploadedBy={song.uploadedBy}
              />
            </div>

            {/* FACTS ONLY, AND ONLY THOSE PRESENT.
              *
              * Replaces a section headed "Lyrics / Details" whose entire body was the
              * string "No lyrics available." above a TODO. No record in the catalogue
              * holds lyrics, so the heading promised something nothing could keep.
              *
              * Rows render only where a value exists, for the same reason the browse
              * facets are derived rather than declared: a blank row states a fact we do
              * not have. A library cue has a duration and a collection; a commercial
              * release has an ISRC and a release date. Neither should show the other's
              * empty cells. */}
            {details.length > 0 && (
              <dl className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                {details.map(({ label, value }) => (
                  <div key={label}>
                    <dt className="text-xs uppercase tracking-wide text-gray-500">{label}</dt>
                    <dd className="text-sm text-gray-200 mt-1 break-words">{value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {/* The licence on the page, not only inside the modal.
                DownloadLicenseTerms already owns this text and already has a compact
                mode. Restating it here would be a second copy, free to drift from the
                one the buyer actually accepts at checkout. */}
            <div className="mt-8 border-t border-gray-800 pt-6">
              <h2 className="text-lg font-semibold mb-3">What a licence covers</h2>
              <DownloadLicenseTerms compact />
            </div>
          </div>
        </div>
      </div>

    </>
  );
}

export default SongPage;
