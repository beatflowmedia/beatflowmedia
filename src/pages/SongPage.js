// src/pages/SongPage.js
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import PlayButton from "../components/PlayButton";
import LikeButton from "../components/LikeButton";
import PurchaseButton from "../components/PurchaseButton";
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

  // 2) Track song view for conversion tracking (2026 Hybrid Strategy)
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

      <div className="p-6 text-white">
        <h1 className="text-3xl font-bold mb-4">{song.title}</h1>
        <p className="text-gray-400 mb-4">by {song.artist}</p>

      <div className="flex items-center space-x-4 mb-6">
        <PlayButton
          isPlaying={isThisPlaying}
          onClick={handlePlay}
          size={32}
        />
        <LikeButton
          item={song}
          isLiked={isLiked}
          onToggleFavorite={handleToggle}
          size={24}
        />
        <PurchaseButton
          itemId={id}
          itemType="song"
          price={song.price || SONG_PRICE}
          artistId={song.artistId}
          uploadedBy={song.uploadedBy}
        />

      </div>

      <div className="mt-6">
        <img
          src={artworkUrl(song)}
          alt={song.title}
          className="rounded-lg w-full max-w-[280px] aspect-square object-cover"
          onError={(e) => { e.target.onerror = null; e.target.src = getPlaceholderImage(300, 300); }}
        />
      </div>

      <div className="mt-6">
        <h2 className="text-2xl font-semibold">Lyrics / Details</h2>
        <p className="text-gray-300 mt-2">
          {/* TODO: Populate with actual lyrics or additional metadata */}
          No lyrics available.
        </p>
      </div>
    </div>

    </>
  );
}

export default SongPage;
